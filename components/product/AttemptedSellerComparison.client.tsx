"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import styles from "./ProductOfferLayout.module.css";
import { delivered, sellerHref } from "./seller-comparison";
import { buildAttemptedSellers, hasReportedSellerResult, isCheckRunning, type AttemptedPayloads } from "./attempted-sellers";
import { sellerPolicies } from "./seller-policies";
import { useMarketCheckAnalytics } from "./useMarketCheckAnalytics";

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE || "https://api.appliancepartgeeks.com").replace(/\/+$/, "");
const MAX_CHECK_MS = 90_000;
const SOURCE_KEYS = ["newMarket", "refurbMarket", "catalog"] as const;
type SourceStates = Record<keyof AttemptedPayloads, "checking" | "complete" | "failed">;
const CHECKING: SourceStates = { newMarket: "checking", refurbMarket: "checking", catalog: "checking" };
const EMPTY: AttemptedPayloads = { newMarket: null, refurbMarket: null, catalog: null };
function money(value: number | null, currency: string | null) {
  if (value === null) return "—";
  try { return new Intl.NumberFormat("en-US", { style: "currency", currency: currency || "USD" }).format(value); }
  catch { return `${value.toFixed(2)} ${currency || "USD"}`; }
}

export default function AttemptedSellerComparison({ mpn }: { mpn: string }) {
  const [payloads, setPayloads] = useState<AttemptedPayloads>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<string[]>([]);
  const [refresh, setRefresh] = useState(0);
  const [metadata, setMetadata] = useState<Record<string, unknown>>({});
  const [elapsed, setElapsed] = useState(0);
  const [currentPayloads, setCurrentPayloads] = useState<AttemptedPayloads>(EMPTY);
  const [sourceStates, setSourceStates] = useState<SourceStates>(CHECKING);
  const previousMpn = useRef(mpn);
  const [retainedRows, setRetainedRows] = useState<ReturnType<typeof buildAttemptedSellers>>([]);
  useEffect(() => {
    const controller = new AbortController();
    let active = true, finished = false, metadataDone = false;
    if (previousMpn.current !== mpn) {
      setPayloads(EMPTY); setMetadata({}); setRetainedRows([]);
      previousMpn.current = mpn;
    }
    setCurrentPayloads(EMPTY); setSourceStates(CHECKING);
    setLoading(true); setErrors([]); setElapsed(0);
    const started = performance.now();
    const timer = setInterval(() => {
      if (active && !finished) setElapsed((performance.now() - started) / 1000);
    }, 500);
    function finish() {
      if (!active || finished) return;
      finished = true;
      clearInterval(timer);
      if (metadataDone) clearTimeout(deadline);
      setLoading(false);
    }
    // A stalled fetch or still-running backend check must eventually become
    // inconclusive. This also bounds metadata and catalog-agent requests.
    const deadline = setTimeout(() => {
      if (!active) return;
      if (finished) { controller.abort(); return; }
      setErrors(previous => [...previous, "Some seller checks timed out; unresolved attempts are inconclusive."]);
      setSourceStates(previous => Object.fromEntries(SOURCE_KEYS.map(key => [key, previous[key] === "checking" ? "failed" : previous[key]])) as SourceStates);
      finish(); controller.abort();
    }, MAX_CHECK_MS);
    const path = encodeURIComponent(mpn);
    async function get(path: string, init?: RequestInit) {
      const response = await fetch(`${API_BASE}${path}`, { ...init, cache: "no-store", signal: controller.signal });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    }
    function save(key: keyof AttemptedPayloads, value: Record<string, unknown>) {
      if (!active || finished || controller.signal.aborted) return;
      setCurrentPayloads(previous => ({ ...previous, [key]: value }));
      // Preserve previous results through an empty searching response.
      const hasRows = buildAttemptedSellers({ ...EMPTY, [key]: value }, mpn).length > 0;
      if (hasRows || !running(key, value)) setPayloads(previous => ({ ...previous, [key]: value }));
    }
    function pause() {
      return new Promise<void>((resolve, reject) => {
        const abort = () => { clearTimeout(wait); controller.signal.removeEventListener("abort", abort); reject(new DOMException("Aborted", "AbortError")); };
        const wait = setTimeout(() => { controller.signal.removeEventListener("abort", abort); resolve(); }, 1500);
        controller.signal.addEventListener("abort", abort, { once: true });
        if (controller.signal.aborted) abort();
      });
    }
    function running(key: keyof AttemptedPayloads, data: Record<string, unknown>) {
      return isCheckRunning(data.status) || (key === "refurbMarket" && isCheckRunning((data.used_seller_comparison as { status?: unknown } | null)?.status)) || buildAttemptedSellers({ ...EMPTY, [key]: data }, mpn).some(row => row.pending);
    }
    async function poll(key: keyof AttemptedPayloads, request: (attempt: number) => Promise<Record<string, unknown>>) {
      for (let attempt = 0; attempt < 40; attempt++) {
        const data = await request(attempt);
        save(key, data);
        if (!running(key, data)) return;
        await pause();
      }
      throw new Error("Seller checks exceeded the polling limit");
    }
    async function catalog() {
      let live = await get(`/api/live-part-search/${path}`);
      save("catalog", live);
      if (!live.results?.length || refresh > 0) {
        const agent = await get("/api/parts-agent/query", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query: mpn }) });
        if (!agent.allowed_to_answer || !agent.result?.live) throw new Error("Catalog check unavailable");
        live = agent.result.live;
        save("catalog", live);
      }
      if (running("catalog", live)) await poll("catalog", () => get(`/api/live-part-search/${path}`));
    }
    async function check(key: keyof AttemptedPayloads, request: () => Promise<void>) {
      try {
        await request();
        if (active && !finished) setSourceStates(previous => ({ ...previous, [key]: "complete" }));
      } catch (error) {
        if (active && !finished) setSourceStates(previous => ({ ...previous, [key]: "failed" }));
        throw error;
      }
    }
    async function load() {
      const checks = await Promise.allSettled([
        check("newMarket", () => poll("newMarket", attempt => get(`/api/compare/new-market/${path}?refresh=${refresh > 0 && attempt === 0}&background=false`))),
        check("refurbMarket", () => poll("refurbMarket", () => get(`/api/refurb/${path}?limit=40`))),
        check("catalog", catalog),
      ]);
      if (!active || finished) return;
      const labels = ["New OEM", "Refurbished / Used", "APG catalog"];
      setErrors(previous => [...previous, ...checks.flatMap((result, i) => result.status === "rejected" ? [`${labels[i]} checks could not be completed; unresolved attempts are inconclusive.`] : [])]);
      finish();
    }
    // Policy enrichment can arrive after the seller checks finish. It must
    // neither hold the elapsed timer open nor be dropped on late arrival.
    void get("/api/market-sellers/metadata").then(data => {
      if (active && !controller.signal.aborted) setMetadata(data);
    }).catch(() => {
      if (active) setErrors(previous => [...previous, "Seller policies could not be loaded; unknown terms remain —."]);
    }).finally(() => {
      metadataDone = true;
      if (finished) clearTimeout(deadline);
    });
    void load();
    return () => {
      active = false; clearInterval(timer); clearTimeout(deadline); controller.abort();
    };
  }, [mpn, refresh]);
  const received = useMemo(() => buildAttemptedSellers(currentPayloads, mpn), [currentPayloads, mpn]);
  const all = useMemo(() => {
    const current = new Map(received.map(row => [row.key, row]));
    const retained = new Map(retainedRows.map(row => [row.key, row]));
    return buildAttemptedSellers(payloads, mpn).map(row => {
      const fresh = current.get(row.key);
      const reported = fresh && hasReportedSellerResult(fresh);
      const sources = fresh?.sources || row.sources;
      const pending = loading && sources.some(key => sourceStates[key] === "checking") && (fresh?.pending || !reported);
      const unverified = !pending && (fresh?.pending || (!reported && sources.some(key => sourceStates[key] === "failed")));
      const displayed = fresh || row;
      return { ...displayed, offer: loading && !displayed.offer ? retained.get(row.key)?.offer || row.offer : displayed.offer,
        pending: !!pending,
        ...(pending ? { state: "inconclusive" as const, label: "Checking…" } : unverified ? { state: "inconclusive" as const, label: "Could not verify" } : {}),
      };
    });
  }, [payloads, received, retainedRows, sourceStates, mpn, loading]);
  const checked = received.filter(hasReportedSellerResult).length;
  const analytics = useMarketCheckAnalytics(mpn, all, loading, metadata);
  const count = (state: string) => all.filter(row => row.state === state).length;
  return (
    <aside ref={analytics.blockRef} className={styles.comparison} aria-label="Compare Seller Options" data-sellers-attempted={all.length}>
      <div className={styles.comparisonHeader}>
        <div className="sherpa-market-banner">
          <a href="https://part-sherpa.com/" aria-label="Visit Part Sherpa" onClick={() => analytics.brandClick("logo")} onAuxClick={event => { if (event.button === 1) analytics.brandClick("logo"); }} style={{ display: "block", width: 28, height: 28 }}><Image src="/part-sherpa-logo.png" width={28} height={28} alt="Part Sherpa" className="sherpa-market-logo" /></a>
          <div className="sherpa-market-copy">
            <div className={styles.headerLine}><h2>Part Sherpa Market Check</h2><button type="button" className={styles.refresh} disabled={loading} onClick={() => { analytics.refreshClick(); setRetainedRows(all); setLoading(true); setElapsed(0); setCurrentPayloads(EMPTY); setSourceStates(CHECKING); setRefresh(value => value + 1); }}>{loading ? "Checking…" : "Refresh"}</button></div>
            <div className="sherpa-market-value">Who has it. What it costs. What the terms are.</div>
            <div className="sherpa-market-support">We checked multiple sellers for availability, shipping, returns, and delivered cost.</div>
            <div className="sherpa-market-link"><a href="https://part-sherpa.com/" onClick={() => analytics.brandClick("text")} onAuxClick={event => { if (event.button === 1) analytics.brandClick("text"); }}>Visit Part Sherpa →</a></div>
          </div>
        </div>
        <div className="market-check-status" role="status" aria-live="polite" aria-atomic="true">
          <div className="market-check-status-line">{loading ? <>
            <span className="market-check-pulse" aria-hidden="true" />
            <span>Checking sellers…</span>
            <span className="market-check-elapsed" aria-hidden="true">{elapsed.toFixed(1)}s</span>
          </> : <span>{count("stock")} in stock · {count("backorder")} backorder · {count("unavailable")} not available · {count("inconclusive")} inconclusive</span>}</div>
          <div className="market-check-progress" title={errors.join(" ")}>
            {loading && received.length ? `${checked} of ${received.length} reported sellers checked` : !loading && errors.length ? <span aria-label={errors.join(" ")}>Some checks could not be completed.</span> : "\u00a0"}
          </div>
        </div>
        <div className="attempted-scroll-cue">Scroll each column to see all sellers ↓</div>
      </div>
      <div className="attempted-groups">
      {([["new", "New OEM"], ["refurb", "Refurbished / Used"]] as const).map(([group, label]) => {
        const rows = all.filter(row => row.group === group);
        return <section className="attempted-group" key={group} aria-labelledby={`seller-group-${group}`}>
        <h3 className="attempted-heading" id={`seller-group-${group}`}>{label} Sellers<span>({rows.length}) <span aria-hidden="true">↓</span></span></h3>
        <div className={styles.results} onScroll={event => analytics.onScroll(event.currentTarget, group)} tabIndex={0} aria-label={`${label} seller results`} aria-busy={loading}>
        {!rows.length ? <p className={styles.empty}>{loading ? "Checking selected sellers…" : "No reported seller checks in this condition."}</p> : null}
        {rows.map(row => {
          const offer = row.offer, href = offer ? sellerHref(offer) : null, total = offer ? delivered(offer) : null, policies = sellerPolicies(row, metadata);
          return <article onClick={() => analytics.engage(group)} key={row.key} data-seller-key={row.key} data-availability={row.pending ? "checking" : row.state} className={styles.sellerRow}>
            <h4 className="attempted-seller-name">{row.name}</h4>
            <div className="attempted-price-line"><strong className="attempted-price" data-known={offer?.price != null}>{money(offer?.price ?? null, offer?.currency ?? null)}</strong><span className="seller-availability" data-state={row.pending ? "checking" : row.state}>{row.label === "—" ? "Could not verify" : row.label}</span></div>
            <div className="attempted-terms"><span title={policies.shippingTitle}>{policies.shipping}</span> · {policies.returnUrl ? <a className="attempted-return-policy" href={policies.returnUrl} title={policies.returnTitle} target="_blank" rel="noopener noreferrer">{policies.returns}</a> : <span title={policies.returnTitle}>{policies.returns}</span>}{total !== null ? ` · ${money(total, offer?.currency ?? null)} delivered` : ""}</div>
            <div className="attempted-footer"><span>{offer?.condition || "—"}{offer?.relationship && offer.relationship !== "exact" ? ` · ${offer.relationship.replace(/_/g, " ")} (${offer.matched_mpn || "—"})` : ""}</span>{href ? <a href={href} onClick={() => analytics.outbound(row)} onAuxClick={event => { if (event.button === 1) analytics.outbound(row); }} target="_blank" rel="noopener noreferrer">View seller ↗</a> : null}</div>
          </article>;
        })}
        </div>
        </section>;
      })}
      </div>
    </aside>
  );
}
