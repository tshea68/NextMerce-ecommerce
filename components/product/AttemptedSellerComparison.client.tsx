"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./ProductOfferLayout.module.css";
import { amount, delivered, sellerHref } from "./seller-comparison";
import { buildAttemptedSellers, type AttemptedPayloads } from "./attempted-sellers";

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE || "https://api.appliancepartgeeks.com").replace(/\/+$/, "");
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
  useEffect(() => {
    const controller = new AbortController();
    setPayloads(EMPTY); setLoading(true); setErrors([]);
    const path = encodeURIComponent(mpn);
    async function get(path: string, init?: RequestInit) {
      const response = await fetch(`${API_BASE}${path}`, { ...init, cache: "no-store", signal: controller.signal });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    }
    function save(key: keyof AttemptedPayloads, value: Record<string, unknown>) {
      if (!controller.signal.aborted) setPayloads(previous => ({ ...previous, [key]: value }));
    }
    async function newMarket() {
      // Same selected sellers/dispositions endpoint used by Part Sherpa.
      for (let poll = 0; poll < 40 && !controller.signal.aborted; poll++) {
        const data = await get(`/api/compare/new-market/${path}?refresh=${refresh > 0 && poll === 0}&background=false`);
        save("newMarket", data);
        if (data.status !== "searching") return;
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
      if (!controller.signal.aborted) setErrors(previous => [...previous, "Some seller checks are still pending."]);
    }
    async function refurbMarket() {
      const data = await get(`/api/refurb/${path}?limit=40`);
      save("refurbMarket", data);
    }
    async function catalog() {
      let live = await get(`/api/live-part-search/${path}`);
      save("catalog", live);
      if (!live.results?.length || refresh > 0) {
        const agent = await get("/api/parts-agent/query", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query: mpn }) });
        if (!agent.allowed_to_answer || !agent.result?.live) throw new Error("Catalog check unavailable");
        live = agent.result.live;
      }
      save("catalog", live);
    }
    async function load() {
      const checks = await Promise.allSettled([newMarket(), refurbMarket(), catalog()]);
      if (controller.signal.aborted) return;
      const labels = ["New OEM", "Refurbished / Used", "APG catalog"];
      setErrors(previous => [...previous, ...checks.flatMap((result, i) => result.status === "rejected" ? [`${labels[i]} checks could not be loaded; their attempted-seller universe may be incomplete.`] : [])]);
      setLoading(false);
    }
    void load();
    return () => controller.abort();
  }, [mpn, refresh]);
  const all = useMemo(() => buildAttemptedSellers(payloads, mpn), [payloads, mpn]);
  const count = (state: string) => all.filter(row => row.state === state).length;
  return (
    <aside className={styles.comparison} aria-label="Compare Sellers" data-sellers-attempted={all.length}>
      <div className={styles.comparisonHeader}>
        <div className={styles.headerLine}><h2>Compare Sellers</h2><button type="button" className={styles.refresh} disabled={loading} onClick={() => setRefresh(value => value + 1)}>{loading ? "Checking…" : "Refresh"}</button></div>
        <p aria-live="polite">{count("stock")} in stock · {count("backorder")} backorder · {count("unavailable")} not available · {count("inconclusive")} inconclusive</p>
        {errors.map(error => <p key={error} role="status">{error}</p>)}
      </div>
      <div className="attempted-groups">
      {([["new", "New OEM"], ["refurb", "Refurbished / Used"]] as const).map(([group, label]) => {
        const rows = all.filter(row => row.group === group);
        return <section className="attempted-group" key={group} aria-labelledby={`seller-group-${group}`}>
        <h3 className="attempted-heading" id={`seller-group-${group}`}>{label}<span>{rows.length}</span></h3>
        <div className={styles.results} tabIndex={0} aria-label={`${label} seller results`} aria-busy={loading}>
        {!rows.length ? <p className={styles.empty}>{loading ? "Checking selected sellers…" : "No reported seller checks in this condition."}</p> : null}
        {rows.map(row => {
          const offer = row.offer, href = offer ? sellerHref(offer) : null, total = offer ? delivered(offer) : null, shipping = offer ? amount(offer.shipping_cost) : null;
          return <article key={row.key} data-seller-key={row.key} data-availability={row.state} className={styles.sellerRow}>
            <h4 className="attempted-seller-name">{row.name}</h4>
            <div className="attempted-price-line"><strong className="attempted-price" data-known={offer?.price != null}>{money(offer?.price ?? null, offer?.currency ?? null)}</strong><span className="seller-availability" data-state={row.state}>{row.label === "—" ? "Could not verify" : row.label}</span></div>
            <div className="attempted-terms">Ship {shipping === null ? offer?.shipping_text || "—" : shipping === 0 ? "free" : money(shipping, offer?.currency ?? null)} · Returns {offer?.returns_text || "—"}{total !== null ? ` · ${money(total, offer?.currency ?? null)} delivered` : ""}</div>
            <div className="attempted-footer"><span>{offer?.condition || "—"}{offer?.relationship && offer.relationship !== "exact" ? ` · ${offer.relationship.replace(/_/g, " ")} (${offer.matched_mpn || "—"})` : ""}</span>{href ? <a href={href} target="_blank" rel="noopener noreferrer">View seller ↗</a> : null}</div>
          </article>;
        })}
        </div>
        </section>;
      })}
      </div>
    </aside>
  );
}
