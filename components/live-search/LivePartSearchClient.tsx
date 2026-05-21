"use client";

import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";
import Link from "next/link";

const API_BASE =
  (process.env.NEXT_PUBLIC_API_BASE || "https://api.appliancepartgeeks.com").replace(/\/+$/, "");

type LivePartResult = {
  run_id: number;
  run_created_at: string;
  searched_mpn: string;
  searched_mpn_norm: string;
  display_bucket: string | null;
  seller_key: string;
  relationship: string;
  relationship_rank: number | null;
  seller_rank: number | null;
  confidence_score: number | null;
  condition: string | null;
  stock_status: string | null;
  quantity: number | null;
  price: number | null;
  currency: string | null;
  matched_mpn: string | null;
  matched_mpn_norm: string | null;
  title: string | null;
  brand: string | null;
  part_type: string | null;
  image_url: string | null;
  product_url: string | null;
  source_url: string | null;
  evidence: string[] | null;
};

type SourceHealth = {
  run_id: number;
  searched_mpn: string;
  searched_mpn_norm: string;
  run_created_at: string;
  seller_key: string;
  seller_name: string | null;
  status: string | null;
  candidate_count: number | null;
  parts_count: number | null;
  offers_count: number | null;
  http_status: string | null;
  fetch_ok: boolean | null;
  fetch_size: number | null;
  reason: string | null;
  url: string | null;
};

type LivePartResponse = {
  searched_mpn: string;
  searched_mpn_norm: string;
  saved_run_id?: number;
  result_count: number;
  source_count?: number;
  results: LivePartResult[];
  sources?: SourceHealth[];
};

type SourceHealthResponse = {
  searched_mpn: string;
  searched_mpn_norm: string;
  source_count: number;
  sources: SourceHealth[];
};

function sellerLabel(sellerKey: string) {
  const labels: Record<string, string> = {
    apg_internal: "APG",
    genuinereplacementparts: "GRP",
    samsungparts: "SamsungParts",
    lgparts: "LG Parts",
    ebay: "eBay",
  };
  return labels[sellerKey] || sellerKey;
}

const MONITORED_OEM_SOURCES = [
  "samsungparts",
  "genuinereplacementparts",
  "lgparts",
];

function oemSourceLabel(sellerKey: string) {
  const labels: Record<string, string> = {
    samsungparts: "SamsungParts",
    genuinereplacementparts: "Genuine Replacement Parts",
    lgparts: "LG Parts",
  };

  return labels[sellerKey] || sellerLabel(sellerKey);
}

function money(value: number | null | undefined, currency = "USD") {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(value);
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function highlightedTitle(title: string | null, matchedMpn: string | null): ReactNode {
  if (!title || !matchedMpn) return title || "Untitled result";

  const pattern = new RegExp(`(${escapeRegExp(matchedMpn)})`, "ig");
  const parts = title.split(pattern);

  return parts.map((part, index) => {
    if (part.toLowerCase() === matchedMpn.toLowerCase()) {
      return (
        <mark key={`${part}-${index}`} className="rounded bg-yellow-200 px-1 font-black text-slate-950">
          {part}
        </mark>
      );
    }

    return <span key={`${part}-${index}`}>{part}</span>;
  });
}

function badgeClass(row: LivePartResult) {
  const text = `${row.display_bucket || ""} ${row.relationship || ""}`.toLowerCase();

  if (text.includes("replacement")) return "bg-purple-50 text-purple-800 border-purple-200";
  if (text.includes("ebay")) return "bg-orange-50 text-orange-800 border-orange-200";
  if (text.includes("apg")) return "bg-emerald-50 text-emerald-800 border-emerald-200";
  if (row.relationship === "exact_match") return "bg-blue-50 text-blue-800 border-blue-200";
  return "bg-slate-50 text-slate-700 border-slate-200";
}

function matchLabel(row: LivePartResult) {
  if (row.display_bucket) return row.display_bucket;
  if (row.relationship === "exact_match") return "Exact MPN";
  if (row.relationship === "replacement_match") return "Known replacement";
  return row.relationship || "Unknown";
}

function isUsedLike(row: LivePartResult) {
  const text = `${row.condition || ""} ${row.display_bucket || ""} ${row.seller_key || ""}`.toLowerCase();

  return (
    text.includes("refurb") ||
    text.includes("used") ||
    text.includes("pre-owned") ||
    text.includes("marketplace")
  );
}

function isOemDistributor(row: LivePartResult) {
  if (row.seller_key === "ebay") return false;
  if (row.seller_key === "apg_internal") return false;
  return !isUsedLike(row);
}

function customOrderPrice(sourcePrice: number | null | undefined) {
  if (sourcePrice === null || sourcePrice === undefined || Number.isNaN(sourcePrice)) return null;
  return sourcePrice + 10;
}

function sourceCount(sources: SourceHealthResponse | null, sellerKey: string) {
  return sources?.sources?.find((source) => source.seller_key === sellerKey)?.candidate_count || 0;
}

function normalizeResponseToSources(json: LivePartResponse): SourceHealthResponse {
  return {
    searched_mpn: json.searched_mpn,
    searched_mpn_norm: json.searched_mpn_norm,
    source_count: json.source_count || json.sources?.length || 0,
    sources: json.sources || [],
  };
}

function ResultTable({
  title,
  rows,
  emptyText,
}: {
  title: string;
  rows: LivePartResult[];
  emptyText: string;
}) {
  return (
    <section className="min-w-0 overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div className="border-b border-slate-200 bg-slate-100 px-3 py-2">
        <h2 className="text-sm font-black uppercase tracking-wide text-slate-800">{title}</h2>
      </div>

      {rows.length === 0 ? (
        <div className="px-3 py-4 text-sm text-slate-500">{emptyText}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
              <tr>
                <th className="w-[90px] px-3 py-2">Source</th>
                <th className="w-[145px] px-3 py-2">Match</th>
                <th className="px-3 py-2">Title / Evidence</th>
                <th className="w-[95px] px-3 py-2 text-right">Price</th>
                <th className="w-[70px] px-3 py-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row, index) => (
                <tr key={`${row.seller_key}-${row.matched_mpn}-${index}`} className="align-top hover:bg-slate-50">
                  <td className="px-3 py-2 font-black text-slate-800">
                    {sellerLabel(row.seller_key)}
                    {row.condition ? (
                      <div className="mt-1 text-[11px] font-semibold text-slate-500">{row.condition}</div>
                    ) : null}
                  </td>

                  <td className="px-3 py-2">
                    <span className={`inline-block rounded-full border px-2 py-0.5 text-[11px] font-black ${badgeClass(row)}`}>
                      {matchLabel(row)}
                    </span>
                    <div className="mt-1 text-[11px] text-slate-500">
                      MPN: <span className="font-black text-slate-700">{row.matched_mpn || "—"}</span>
                    </div>
                  </td>

                  <td className="px-3 py-2">
                    <div className="font-semibold leading-snug text-slate-900">
                      {highlightedTitle(row.title, row.matched_mpn)}
                    </div>
                    {row.evidence?.[0] ? (
                      <div className="mt-1 line-clamp-1 text-[11px] text-slate-500">{row.evidence[0]}</div>
                    ) : null}
                  </td>

                  <td className="px-3 py-2 text-right">
                    <div className="text-sm font-black text-slate-950">
                      {money(row.price, row.currency || "USD")}
                    </div>
                    <div className="text-[11px] text-slate-500">Qty: {row.quantity ?? "—"}</div>
                  </td>

                  <td className="px-3 py-2 text-right">
                    {row.product_url ? (
                      <a
                        href={row.product_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-block rounded-md bg-slate-950 px-2.5 py-1.5 text-[11px] font-black text-white hover:bg-orange-600"
                      >
                        Open
                      </a>
                    ) : row.seller_key === "apg_internal" && row.product_url ? (
                      <Link href={row.product_url.replace("https://appliancepartgeeks.com", "")}>APG</Link>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}


function OemSourcesTable({
  rows,
  sources,
}: {
  rows: LivePartResult[];
  sources: SourceHealthResponse | null;
}) {
  const resultBySource = new Map(rows.map((row) => [row.seller_key, row]));
  const healthBySource = new Map((sources?.sources || []).map((source) => [source.seller_key, source]));

  return (
    <section className="min-w-0 overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div className="border-b border-slate-200 bg-slate-100 px-3 py-2">
        <h2 className="text-sm font-black uppercase tracking-wide text-slate-800">
          New/OEM Sources Checked
        </h2>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-xs">
          <thead className="border-b border-slate-200 bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
            <tr>
              <th className="w-[170px] px-3 py-2">Source</th>
              <th className="w-[130px] px-3 py-2">Status</th>
              <th className="px-3 py-2">Result / Note</th>
              <th className="w-[95px] px-3 py-2 text-right">Price</th>
              <th className="w-[70px] px-3 py-2 text-right">Action</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {MONITORED_OEM_SOURCES.map((sellerKey) => {
              const row = resultBySource.get(sellerKey);
              const health = healthBySource.get(sellerKey);

              const status = row
                ? "Found"
                : health?.status && health.status !== "ok"
                  ? "Source issue"
                  : health
                    ? "No exact match"
                    : "Not checked";

              const statusClass = row
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : status === "Source issue"
                  ? "border-amber-200 bg-amber-50 text-amber-800"
                  : "border-slate-200 bg-slate-50 text-slate-600";

              return (
                <tr key={sellerKey} className="align-top hover:bg-slate-50">
                  <td className="px-3 py-2 font-black text-slate-800">
                    {oemSourceLabel(sellerKey)}
                    {health?.candidate_count !== null && health?.candidate_count !== undefined ? (
                      <div className="mt-1 text-[11px] font-semibold text-slate-500">
                        {health.candidate_count} candidates reviewed
                      </div>
                    ) : null}
                  </td>

                  <td className="px-3 py-2">
                    <span className={`inline-block rounded-full border px-2 py-0.5 text-[11px] font-black ${statusClass}`}>
                      {status}
                    </span>
                  </td>

                  <td className="px-3 py-2">
                    {row ? (
                      <>
                        <div className="font-semibold leading-snug text-slate-900">
                          {highlightedTitle(row.title, row.matched_mpn)}
                        </div>
                        <div className="mt-1 text-[11px] text-slate-500">
                          Exact MPN: <strong>{row.matched_mpn || "—"}</strong>
                          {row.evidence?.[0] ? ` — ${row.evidence[0]}` : ""}
                        </div>
                      </>
                    ) : (
                      <div className="text-slate-500">
                        {status === "Source issue"
                          ? health?.reason || "Source returned an issue during fetch."
                          : status === "Not checked"
                            ? "This source was not included in the latest live run."
                            : "Checked source, but no exact-MPN display match was found."}
                      </div>
                    )}
                  </td>

                  <td className="px-3 py-2 text-right">
                    {row ? (
                      <div className="text-sm font-black text-slate-950">
                        {money(row.price, row.currency || "USD")}
                      </div>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>

                  <td className="px-3 py-2 text-right">
                    {row?.product_url ? (
                      <a
                        href={row.product_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-block rounded-md bg-slate-950 px-2.5 py-1.5 text-[11px] font-black text-white hover:bg-orange-600"
                      >
                        Open
                      </a>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default function LivePartSearchClient() {
  const [mpn, setMpn] = useState("DC92-01607J");
  const [searched, setSearched] = useState("");
  const [data, setData] = useState<LivePartResponse | null>(null);
  const [sources, setSources] = useState<SourceHealthResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMode, setLoadingMode] = useState<"refresh" | "saved" | "">("");
  const [showSources, setShowSources] = useState(false);
  const [error, setError] = useState("");
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!loading) {
      setElapsed(0);
      return;
    }

    const startedAt = Date.now();
    const timer = window.setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt) / 1000));
    }, 250);

    return () => window.clearInterval(timer);
  }, [loading]);

  const apgRows = useMemo(() => {
    return (data?.results || []).filter((row) => row.seller_key === "apg_internal");
  }, [data]);

  const oemRows = useMemo(() => {
    return (data?.results || []).filter((row) => isOemDistributor(row));
  }, [data]);

  const marketplaceRefurbRows = useMemo(() => {
    return (data?.results || [])
      .filter((row) => row.seller_key === "ebay" && isUsedLike(row))
      .sort((a, b) => (a.price ?? 999999) - (b.price ?? 999999));
  }, [data]);

  const bestMarketplaceRefurb = marketplaceRefurbRows[0] || null;
  const ebayCandidateCount = sourceCount(sources, "ebay");

  async function loadSaved(clean: string) {
    const [resultRes, sourceRes] = await Promise.all([
      fetch(`${API_BASE}/api/live-part-search/${encodeURIComponent(clean)}`, { cache: "no-store" }),
      fetch(`${API_BASE}/api/live-part-search/${encodeURIComponent(clean)}/sources`, { cache: "no-store" }),
    ]);

    if (!resultRes.ok) throw new Error(`Result request failed: ${resultRes.status}`);
    if (!sourceRes.ok) throw new Error(`Source request failed: ${sourceRes.status}`);

    setData((await resultRes.json()) as LivePartResponse);
    setSources((await sourceRes.json()) as SourceHealthResponse);
  }

  async function refreshLive(clean: string) {
    const refreshRes = await fetch(
      `${API_BASE}/api/live-part-search/${encodeURIComponent(clean)}/refresh`,
      { method: "POST", cache: "no-store" }
    );

    if (!refreshRes.ok) {
      let detail = "";
      try {
        const errJson = await refreshRes.json();
        detail = errJson?.detail ? `: ${errJson.detail}` : "";
      } catch {
        // ignore
      }
      throw new Error(`Refresh request failed: ${refreshRes.status}${detail}`);
    }

    const refreshJson = (await refreshRes.json()) as LivePartResponse;

    setData({
      searched_mpn: refreshJson.searched_mpn,
      searched_mpn_norm: refreshJson.searched_mpn_norm,
      saved_run_id: refreshJson.saved_run_id,
      result_count: refreshJson.result_count,
      source_count: refreshJson.source_count,
      results: refreshJson.results || [],
      sources: refreshJson.sources || [],
    });

    setSources(normalizeResponseToSources(refreshJson));
  }

  async function runSearch(e?: FormEvent, mode: "refresh" | "saved" = "refresh") {
    e?.preventDefault();

    const clean = mpn.trim();
    if (!clean) return;

    setLoading(true);
    setLoadingMode(mode);
    setError("");
    setData(null);
    setSources(null);
    setSearched(clean);

    try {
      if (mode === "saved") {
        await loadSaved(clean);
      } else {
        await refreshLive(clean);
      }
    } catch (err: any) {
      setError(err?.message || "Live part search failed.");
    } finally {
      setLoading(false);
      setLoadingMode("");
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto w-[96%] max-w-7xl py-3">
          <form onSubmit={(e) => runSearch(e, "refresh")} className="flex flex-col gap-2 md:flex-row md:items-center">
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex items-center gap-2">
                <h1 className="text-lg font-black">Live Part Search</h1>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-black uppercase tracking-wide text-slate-600">
                  exact MPN + known replacements only
                </span>
              </div>
              <input
                value={mpn}
                onChange={(e) => setMpn(e.target.value)}
                placeholder="Enter exact MPN, e.g. DC92-01607J"
                className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-black tracking-wide outline-none ring-orange-500/20 focus:border-orange-500 focus:ring-4"
              />
            </div>

            <div className="flex gap-2 md:pt-6">
              <button
                type="submit"
                disabled={loading}
                className="h-10 rounded-lg bg-slate-950 px-4 text-xs font-black uppercase tracking-wide text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading && loadingMode === "refresh" ? "Checking..." : "Check Live"}
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => runSearch(undefined, "saved")}
                className="h-10 rounded-lg border border-slate-300 bg-white px-4 text-xs font-black uppercase tracking-wide text-slate-800 hover:border-orange-500 hover:text-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading && loadingMode === "saved" ? "Loading..." : "Load Saved"}
              </button>
            </div>
          </form>
        </div>
      </section>

      <section className="mx-auto w-[96%] max-w-7xl py-3">
        {loading ? (
          <div className="mb-3 flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm">
            <div className="flex items-center gap-2 font-semibold text-slate-700">
              <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-slate-300 border-t-orange-600" />
              {loadingMode === "saved" ? "Loading saved result" : `Checking live sources for ${searched}`}
            </div>
            <div className="font-mono text-xs font-black text-slate-500">{elapsed}s</div>
          </div>
        ) : null}

        {error ? (
          <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            <strong>Search failed:</strong> {error}
          </div>
        ) : null}

        {!data && !loading && !error ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white px-3 py-8 text-center text-sm text-slate-600">
            Enter an exact part number and run a live availability check.
          </div>
        ) : null}

        {data ? (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">
              <span>
                <strong className="text-slate-900">Searched:</strong> {data.searched_mpn}
              </span>
              <span>
                <strong className="text-slate-900">Norm:</strong> {data.searched_mpn_norm}
              </span>
              <span>
                <strong className="text-slate-900">Rows:</strong> {data.result_count}
              </span>
              <span>
                <strong className="text-slate-900">Run:</strong> {data.saved_run_id || "saved"}
              </span>
              <button
                type="button"
                onClick={() => setShowSources((v) => !v)}
                className="ml-auto font-black uppercase tracking-wide text-orange-600"
              >
                {showSources ? "Hide diagnostics" : "Diagnostics"}
              </button>
            </div>

            <div className="grid gap-3 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
              <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                <div className="border-b border-slate-200 bg-slate-100 px-3 py-2">
                  <h2 className="text-sm font-black uppercase tracking-wide text-slate-800">
                    APG Options
                  </h2>
                </div>

                {apgRows.length ? (
                  <div className="divide-y divide-slate-100">
                    {apgRows.map((row, index) => (
                      <div key={`${row.seller_key}-${row.matched_mpn}-${index}`} className="px-3 py-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-sm font-black text-emerald-800">APG In Stock</div>
                            <div className="mt-1 text-xs text-slate-600">
                              Exact MPN match: <strong>{row.matched_mpn || data.searched_mpn}</strong>
                            </div>
                            <div className="mt-1 text-xs text-slate-500">
                              {row.title || "APG inventory row"}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-black">
                              {money(row.price, row.currency || "USD")}
                            </div>
                            {row.product_url ? (
                              <a
                                href={row.product_url}
                                className="mt-2 inline-block rounded-md bg-slate-950 px-3 py-1.5 text-[11px] font-black text-white hover:bg-orange-600"
                              >
                                Buy
                              </a>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : bestMarketplaceRefurb ? (
                  <div className="px-3 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-black text-orange-800">APG Custom Order</div>
                        <div className="mt-1 text-xs text-slate-600">
                          Exact MPN supply detected. Ships in approximately{" "}
                          <strong>2 additional business days</strong>.
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          {ebayCandidateCount >= 25
                            ? "25+ marketplace candidates detected."
                            : ebayCandidateCount > 5
                              ? "Over 5 marketplace candidates detected."
                              : `${ebayCandidateCount || marketplaceRefurbRows.length} marketplace candidates detected.`}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-black">
                          {money(customOrderPrice(bestMarketplaceRefurb.price), bestMarketplaceRefurb.currency || "USD")}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          source + $10
                        </div>
                        <button
                          type="button"
                          className="mt-2 rounded-md bg-slate-950 px-3 py-1.5 text-[11px] font-black text-white hover:bg-orange-600"
                        >
                          Request
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="px-3 py-4 text-sm text-slate-500">
                    No APG inventory or custom-order source found.
                  </div>
                )}
              </section>

              <OemSourcesTable rows={oemRows} sources={sources} />
            </div>

            {marketplaceRefurbRows.length ? (
              <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                <div className="border-b border-slate-200 bg-slate-100 px-3 py-2">
                  <h2 className="text-sm font-black uppercase tracking-wide text-slate-800">
                    Market Signal / Refurb Supply
                  </h2>
                </div>
                <div className="grid gap-2 px-3 py-3 text-xs text-slate-700 md:grid-cols-4">
                  <div>
                    <strong>Exact-MPN candidates:</strong>{" "}
                    {ebayCandidateCount >= 25 ? "25+" : ebayCandidateCount || marketplaceRefurbRows.length}
                  </div>
                  <div>
                    <strong>Best observed refurb:</strong>{" "}
                    {money(bestMarketplaceRefurb?.price, bestMarketplaceRefurb?.currency || "USD")}
                  </div>
                  <div>
                    <strong>APG custom price:</strong>{" "}
                    {money(customOrderPrice(bestMarketplaceRefurb?.price), bestMarketplaceRefurb?.currency || "USD")}
                  </div>
                  <div>
                    <strong>Customer display:</strong> APG Custom Order
                  </div>
                </div>
              </section>
            ) : null}

            {showSources ? (
              <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                <div className="border-b border-slate-200 bg-slate-100 px-3 py-2 text-sm font-black">
                  Source Health
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-xs">
                    <thead className="border-b border-slate-200 bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-3 py-2">Source</th>
                        <th className="px-3 py-2">Status</th>
                        <th className="px-3 py-2">Candidates</th>
                        <th className="px-3 py-2">HTTP</th>
                        <th className="px-3 py-2">Reason / URL</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(sources?.sources || []).map((source) => (
                        <tr key={source.seller_key}>
                          <td className="px-3 py-2 font-black">{sellerLabel(source.seller_key)}</td>
                          <td className="px-3 py-2">{source.status || "—"}</td>
                          <td className="px-3 py-2">{source.candidate_count ?? "—"}</td>
                          <td className="px-3 py-2">{source.http_status || "—"}</td>
                          <td className="max-w-[560px] truncate px-3 py-2 text-slate-500">
                            {source.reason || source.url || "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            ) : null}

            <p className="text-[11px] text-slate-400">
              API base: <code>{API_BASE}</code>
            </p>
          </div>
        ) : null}
      </section>
    </main>
  );
}
