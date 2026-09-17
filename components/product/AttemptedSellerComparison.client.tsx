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
  const [tab, setTab] = useState("new");
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
  const rows = all.filter(row => row.group === tab);
  const count = (state: string) => all.filter(row => row.state === state).length;
  return (
    <aside className={styles.comparison} aria-label="Compare Sellers" data-sellers-attempted={all.length}>
      <div className={styles.comparisonHeader}>
        <div className={styles.headerLine}><h2>Compare Sellers</h2><button type="button" className={styles.refresh} disabled={loading} onClick={() => setRefresh(value => value + 1)}>{loading ? "Checking…" : "Refresh"}</button></div>
        <p aria-live="polite">{count("stock")} in stock · {count("backorder")} backorder / orderable · {count("unavailable")} not available · {count("inconclusive")} inconclusive</p>
        <div className={styles.tabs} role="group" aria-label="Seller condition">
          {[["new", "New OEM"], ["refurb", "Refurbished / Used"]].map(([value, label]) => <button type="button" key={value} aria-pressed={tab === value} onClick={() => setTab(value)}>{label} ({all.filter(row => row.group === value).length})</button>)}
        </div>
        <p className={styles.sortNote}>Every reported seller check is shown. Exact matches first; known delivered totals before unknown shipping.</p>
        {errors.map(error => <p key={error} role="status">{error}</p>)}
      </div>
      <div className={styles.results} tabIndex={0} aria-label="Seller results" aria-busy={loading}>
        {!rows.length ? <p className={styles.empty}>{loading ? "Checking selected sellers…" : "No reported seller checks in this condition."}</p> : null}
        {rows.map(row => {
          const offer = row.offer, href = offer ? sellerHref(offer) : null, total = offer ? delivered(offer) : null, shipping = offer ? amount(offer.shipping_cost) : null;
          return <article key={row.key} data-seller-key={row.key} data-availability={row.state} className={styles.sellerRow}>
            <div className={styles.sellerTop}><h3>{row.name}</h3>{href ? <a href={href} target="_blank" rel="noopener noreferrer">View seller ↗</a> : <span aria-label="Seller product link unknown">—</span>}</div>
            <div className={styles.priceLine}><strong>{money(offer?.price ?? null, offer?.currency ?? null)}</strong><span> · </span><span className="seller-availability" data-state={row.state}>{row.label}</span></div>
            <div className={styles.terms}>Shipping {shipping === null ? offer?.shipping_text || "—" : shipping === 0 ? "free" : money(shipping, offer?.currency ?? null)} · Returns {offer?.returns_text || "—"}{total !== null ? ` · ${money(total, offer?.currency ?? null)} delivered` : ""}</div>
            <div className={styles.match}>{offer?.condition || "—"}{offer?.relationship && offer.relationship !== "exact" ? ` · ${offer.relationship.replace(/_/g, " ")} (${offer.matched_mpn || "—"})` : ""}</div>
          </article>;
        })}
      </div>
    </aside>
  );
}
