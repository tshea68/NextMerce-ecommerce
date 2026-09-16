"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./ProductOfferLayout.module.css";
import { amount, compareSellers, delivered, normalizeRelationship, sellerHref } from "./seller-comparison";

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE || "https://api.appliancepartgeeks.com").replace(/\/+$/, "");

type SellerResult = {
  seller_key: string;
  condition: string | null;
  display_bucket: string | null;
  stock_status: string | null;
  relationship: string;
  matched_mpn: string | null;
  price: number | null;
  currency: string | null;
  product_url?: string | null;
  url?: string | null;
  destination_url?: string | null;
  source_url?: string | null;
  shipping_cost?: number | null;
  shipping_text?: string | null;
  returns_text?: string | null;
};
type LiveResponse = { results: SellerResult[] };

function group(row: SellerResult) {
  const text = `${row.condition || ""} ${row.display_bucket || ""} ${row.seller_key}`.toLowerCase();
  return /refurb|used|pre-owned|marketplace/.test(text) || row.seller_key === "ebay" ? "refurb" : "new";
}
function availability(row: SellerResult) {
  const status = (row.stock_status || "").toLowerCase().replace(/[_-]/g, " ");
  if (/out of stock|not in stock|sold out|unavailable|discontinued|no longer|not available/.test(status)) return "other";
  if (/backorder|back order|special order|preorder|pre order/.test(status)) return "backorder";
  if (/in stock|instock|^available$/.test(status)) return "stock";
  return "other";
}
function sellerName(key: string) {
  return ({ apg_internal: "Appliance Part Geeks", genuinereplacementparts: "Genuine Replacement Parts", samsungparts: "SamsungParts", lgparts: "LG Parts", appliancepartspros: "AppliancePartsPros", repairclinic: "RepairClinic", ebay: "eBay" } as Record<string, string>)[key] || key;
}
function money(price: number, currency: string | null) {
  try { return new Intl.NumberFormat("en-US", { style: "currency", currency: currency || "USD" }).format(price); }
  catch { return `${price.toFixed(2)} ${currency || "USD"}`; }
}
export default function SellerComparison({ mpn }: { mpn: string }) {
  const [data, setData] = useState<LiveResponse | null>(null);
  const [tab, setTab] = useState("new");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError(""); setData(null);
    async function load() {
      try {
        const response = await fetch(`${API_BASE}/api/live-part-search/${encodeURIComponent(mpn)}`, { cache: "no-store", signal: controller.signal });
        if (!response.ok) throw new Error("Seller comparison is temporarily unavailable.");
        let live = await response.json() as LiveResponse;
        // Same live refresh path as Part Sherpa; a saved run avoids another market search.
        if (!live.results?.length || refresh > 0) {
          const response = await fetch(`${API_BASE}/api/parts-agent/query`, { method: "POST", cache: "no-store", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query: mpn }), signal: controller.signal });
          if (!response.ok) throw new Error("Live seller search is temporarily unavailable.");
          const agent = await response.json();
          if (!agent.allowed_to_answer || !agent.result?.live) throw new Error(agent.message || "No seller results found.");
          live = agent.result.live;
        }
        if (!controller.signal.aborted) {
          setData(live);
          setTab(live.results?.some(row => group(row) === "new") ? "new" : "refurb");
        }
      } catch (err) {
        if (!controller.signal.aborted) setError(err instanceof Error ? err.message : "Seller comparison is temporarily unavailable.");
      } finally { if (!controller.signal.aborted) setLoading(false); }
    }
    void load();
    return () => controller.abort();
  }, [mpn, refresh]);
  const rows = useMemo(() => {
    const selected = (data?.results || []).filter(row => group(row) === tab);
    // Separate unknown shipping from known totals rather than treating it as free.
    return selected.sort(compareSellers);
  }, [data, tab]);
  const all = data?.results || [];
  return (
    <aside className={styles.comparison} aria-label="Compare Sellers">
      <div className={styles.comparisonHeader}>
        <div className={styles.headerLine}><h2>Compare Sellers</h2><button type="button" onClick={() => setRefresh(value => value + 1)} disabled={loading} className={styles.refresh}>{loading ? "Searching…" : "Refresh"}</button></div>
        <p aria-live="polite">{loading ? "Checking Part Sherpa live market results…" : error ? "Market check unavailable" : `${all.filter(row => availability(row) === "stock").length} in stock · ${all.filter(row => availability(row) === "backorder").length} backorder · ${all.filter(row => group(row) === "refurb").length} refurbished / used`}</p>
        <div className={styles.tabs} role="group" aria-label="Seller condition">
          {[['new', 'New OEM'], ['refurb', 'Refurbished / Used']].map(([value, label]) => <button key={value} type="button" aria-pressed={tab === value} onClick={() => setTab(value)}>{label} ({all.filter(row => group(row) === value).length})</button>)}
        </div>
        <p className={styles.sortNote}>Exact matches first. Known totals sorted by delivered cost; unknown shipping separately by price.</p>
      </div>
      <div className={styles.results} tabIndex={0} aria-label="Seller results" aria-busy={loading}>
        {error ? <p className={styles.empty} role="status">{error}</p> : !loading && !rows.length ? <p className={styles.empty}>No sellers found in this condition.</p> : null}
        {rows.map((row, index) => {
          const href = sellerHref(row), total = delivered(row), shipping = amount(row.shipping_cost);
          return <article key={`${row.seller_key}-${row.matched_mpn}-${index}`} className={styles.sellerRow}>
            <div className={styles.sellerTop}><h3>{sellerName(row.seller_key)}</h3>{href ? <a href={href} target="_blank" rel="noopener noreferrer">View seller ↗</a> : <span>Link unavailable</span>}</div>
            <div className={styles.priceLine}><strong>{amount(row.price) === null ? "Price unavailable" : money(row.price!, row.currency)}</strong><span> · {(row.stock_status || "Availability unknown").replace(/_/g, " ")}</span></div>
            <div className={styles.terms}>Shipping {shipping === null ? row.shipping_text || "calculated / unknown" : shipping === 0 ? "free" : money(shipping, row.currency)} · Returns {row.returns_text || "see seller"}{total !== null ? ` · ${money(total, row.currency)} delivered` : ""}</div>
            {(normalizeRelationship(row.relationship) !== "exact" || group(row) === "refurb") && <div className={styles.match}>{row.condition || "Condition unspecified"}{normalizeRelationship(row.relationship) !== "exact" ? ` · ${row.relationship.replace(/_/g, " ")} (${row.matched_mpn || "MPN unspecified"})` : ""}</div>}
          </article>;
        })}
      </div>
    </aside>
  );
}
