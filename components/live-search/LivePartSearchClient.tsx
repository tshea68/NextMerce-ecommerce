"use client";

import { FormEvent, useMemo, useState } from "react";
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

type LivePartResponse = {
  searched_mpn: string;
  searched_mpn_norm: string;
  saved_run_id?: number;
  result_count: number;
  source_count?: number;
  results: LivePartResult[];
  sources?: SourceHealth[];
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

type SourceHealthResponse = {
  searched_mpn: string;
  searched_mpn_norm: string;
  source_count: number;
  sources: SourceHealth[];
};

function sellerLabel(sellerKey: string) {
  const labels: Record<string, string> = {
    apg_internal: "APG Inventory",
    genuinereplacementparts: "Genuine Replacement Parts",
    samsungparts: "SamsungParts",
    lgparts: "LG Parts",
    ebay: "eBay",
  };

  return labels[sellerKey] || sellerKey;
}

function money(value: number | null | undefined, currency = "USD") {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(value);
}

function bucketStyle(bucket: string | null, relationship: string) {
  const text = `${bucket || ""} ${relationship || ""}`.toLowerCase();

  if (text.includes("apg")) {
    return "border-emerald-200 bg-emerald-50 text-emerald-950";
  }

  if (relationship === "exact_match") {
    return "border-blue-200 bg-blue-50 text-blue-950";
  }

  if (relationship.includes("conflict")) {
    return "border-amber-200 bg-amber-50 text-amber-950";
  }

  if (relationship.includes("variant")) {
    return "border-purple-200 bg-purple-50 text-purple-950";
  }

  return "border-slate-200 bg-slate-50 text-slate-900";
}

function relationshipLabel(value: string | null) {
  const labels: Record<string, string> = {
    exact_match: "Exact match",
    exact_sku_but_catalog_conflict: "Exact SKU, catalog conflict",
    title_match_sku_conflict: "Title match, SKU conflict",
    variant_suffix_match: "Suffix variant",
    partial_match: "Partial match",
    related_match: "Related match",
  };

  return labels[value || ""] || value || "Unknown";
}

export default function LivePartSearchClient() {
  const [mpn, setMpn] = useState("DA92-00486A");
  const [searched, setSearched] = useState("");
  const [data, setData] = useState<LivePartResponse | null>(null);
  const [sources, setSources] = useState<SourceHealthResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [showSources, setShowSources] = useState(true);
  const [error, setError] = useState("");

  const bestApg = useMemo(() => {
    return data?.results?.find((r) => r.seller_key === "apg_internal") || null;
  }, [data]);

  async function runSearch(e?: FormEvent) {
    e?.preventDefault();

    const clean = mpn.trim();
    if (!clean) return;

    setLoading(true);
    setError("");
    setData(null);
    setSources(null);
    setSearched(clean);

    try {
      const refreshRes = await fetch(
        `${API_BASE}/api/live-part-search/${encodeURIComponent(clean)}/refresh`,
        {
          method: "POST",
          cache: "no-store",
        }
      );

      if (!refreshRes.ok) {
        let detail = "";
        try {
          const errJson = await refreshRes.json();
          detail = errJson?.detail ? `: ${errJson.detail}` : "";
        } catch {
          // ignore JSON parse errors for error response
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

      setSources({
        searched_mpn: refreshJson.searched_mpn,
        searched_mpn_norm: refreshJson.searched_mpn_norm,
        source_count: refreshJson.source_count || refreshJson.sources?.length || 0,
        sources: refreshJson.sources || [],
      });
    } catch (err: any) {
      setError(err?.message || "Live part search failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex w-[94%] max-w-7xl flex-col gap-6 py-10">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-orange-600">
              Live Part Intelligence
            </p>
            <h1 className="mt-2 text-4xl font-black tracking-tight md:text-5xl">
              Part Search Comparison
            </h1>
            <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
              Search an MPN and compare APG inventory against OEM and distributor sources. This page is
              the working display lab before we wire the experience into the main site.
            </p>
          </div>

          <form
            onSubmit={runSearch}
            className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm md:flex-row"
          >
            <input
              value={mpn}
              onChange={(e) => setMpn(e.target.value)}
              placeholder="Enter MPN, e.g. DA92-00486A"
              className="min-h-12 flex-1 rounded-xl border border-slate-300 bg-white px-4 text-lg font-semibold outline-none ring-orange-500/20 focus:border-orange-500 focus:ring-4"
            />
            <button
              type="submit"
              disabled={loading}
              className="min-h-12 rounded-xl bg-slate-950 px-6 font-bold text-white shadow-sm hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Searching..." : "Search Live Sources"}
            </button>
          </form>

          <div className="flex flex-wrap gap-2 text-sm">
            {["DA92-00486A", "EBR81182789", "DC92-01607J", "WPW10348269", "W11224256"].map(
              (sample) => (
                <button
                  key={sample}
                  type="button"
                  onClick={() => {
                    setMpn(sample);
                    setTimeout(() => {
                      const form = document.querySelector("form");
                      form?.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
                    }, 0);
                  }}
                  className="rounded-full border border-slate-300 bg-white px-3 py-1.5 font-semibold text-slate-700 hover:border-orange-500 hover:text-orange-600"
                >
                  {sample}
                </button>
              )
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto w-[94%] max-w-7xl py-8">
        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-800">
            <p className="font-bold">Search failed</p>
            <p className="mt-1 text-sm">{error}</p>
            <p className="mt-3 text-xs text-red-700">
              API base: <code>{API_BASE}</code>
            </p>
          </div>
        ) : null}

        {!data && !loading && !error ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-600">
            Enter a part number above to view APG inventory, external exact matches, and catalog warnings.
          </div>
        ) : null}

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-600 shadow-sm">
            Checking live sources and saving the latest result…
          </div>
        ) : null}

        {data ? (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                  Searched MPN
                </p>
                <p className="mt-2 text-2xl font-black">{data.searched_mpn}</p>
                <p className="mt-1 text-sm text-slate-500">{data.searched_mpn_norm}</p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                  Display Results
                </p>
                <p className="mt-2 text-2xl font-black">{data.result_count}</p>
                <p className="mt-1 text-sm text-slate-500">Best latest candidates</p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                  Best APG Price
                </p>
                <p className="mt-2 text-2xl font-black">
                  {bestApg ? money(bestApg.price, bestApg.currency || "USD") : "—"}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  {bestApg?.quantity ? `${bestApg.quantity} available` : "No APG row found"}
                </p>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 px-5 py-4">
                <h2 className="text-xl font-black">Best Candidates</h2>
                <p className="mt-1 text-sm text-slate-500">
                  User-facing comparison rows from the latest live refresh.
                </p>
              </div>

              <div className="divide-y divide-slate-200">
                {data.results.length === 0 ? (
                  <div className="p-6 text-slate-600">
                    No latest saved live-source results found for {searched || data.searched_mpn}.
                  </div>
                ) : (
                  data.results.map((row, index) => (
                    <article key={`${row.seller_key}-${row.matched_mpn}-${index}`} className="p-5">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`rounded-full border px-3 py-1 text-xs font-black ${bucketStyle(
                                row.display_bucket,
                                row.relationship
                              )}`}
                            >
                              {row.display_bucket || relationshipLabel(row.relationship)}
                            </span>

                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                              {sellerLabel(row.seller_key)}
                            </span>

                            {row.condition ? (
                              <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-orange-800">
                                {row.condition}
                              </span>
                            ) : null}

                            {row.stock_status ? (
                              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                                {row.stock_status}
                              </span>
                            ) : null}
                          </div>

                          <h3 className="mt-3 text-lg font-black leading-tight">
                            {row.title || row.matched_mpn || "Untitled result"}
                          </h3>

                          <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-600">
                            <span>
                              <strong>Matched:</strong> {row.matched_mpn || "—"}
                            </span>
                            <span>
                              <strong>Brand:</strong> {row.brand || "—"}
                            </span>
                            <span>
                              <strong>Type:</strong> {row.part_type || "—"}
                            </span>
                            <span>
                              <strong>Confidence:</strong> {row.confidence_score ?? "—"}
                            </span>
                          </div>

                          {row.evidence?.length ? (
                            <ul className="mt-3 space-y-1 text-sm text-slate-500">
                              {row.evidence.map((item) => (
                                <li key={item}>• {item}</li>
                              ))}
                            </ul>
                          ) : null}
                        </div>

                        <div className="w-full rounded-xl border border-slate-200 bg-slate-50 p-4 lg:w-64">
                          <p className="text-3xl font-black">
                            {money(row.price, row.currency || "USD")}
                          </p>
                          <p className="mt-1 text-sm text-slate-500">
                            Qty: {row.quantity ?? "—"}
                          </p>

                          <div className="mt-4 flex flex-col gap-2">
                            {row.product_url ? (
                              <a
                                href={row.product_url}
                                target="_blank"
                                rel="noreferrer"
                                className="rounded-lg bg-slate-950 px-4 py-2 text-center text-sm font-bold text-white hover:bg-orange-600"
                              >
                                Open Result
                              </a>
                            ) : null}

                            {row.seller_key === "apg_internal" && row.product_url ? (
                              <Link
                                href={row.product_url.replace("https://appliancepartgeeks.com", "")}
                                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-center text-sm font-bold text-slate-800 hover:border-orange-500 hover:text-orange-600"
                              >
                                View APG Page
                              </Link>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <button
                type="button"
                onClick={() => setShowSources((v) => !v)}
                className="flex w-full items-center justify-between px-5 py-4 text-left"
              >
                <span>
                  <span className="block text-xl font-black">Source Health</span>
                  <span className="text-sm text-slate-500">
                    Fetch status, candidate counts, and skipped sources.
                  </span>
                </span>
                <span className="text-sm font-bold text-orange-600">
                  {showSources ? "Hide" : "Show"}
                </span>
              </button>

              {showSources ? (
                <div className="overflow-x-auto border-t border-slate-200">
                  <table className="min-w-full text-left text-sm">
                    <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-4 py-3">Source</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Candidates</th>
                        <th className="px-4 py-3">Parts</th>
                        <th className="px-4 py-3">Offers</th>
                        <th className="px-4 py-3">HTTP</th>
                        <th className="px-4 py-3">Reason</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {(sources?.sources || []).map((source) => (
                        <tr key={source.seller_key}>
                          <td className="px-4 py-3 font-bold">
                            {sellerLabel(source.seller_key)}
                          </td>
                          <td className="px-4 py-3">{source.status || "—"}</td>
                          <td className="px-4 py-3">{source.candidate_count ?? "—"}</td>
                          <td className="px-4 py-3">{source.parts_count ?? "—"}</td>
                          <td className="px-4 py-3">{source.offers_count ?? "—"}</td>
                          <td className="px-4 py-3">{source.http_status || "—"}</td>
                          <td className="px-4 py-3 text-slate-500">
                            {source.reason || "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}

        <p className="mt-8 text-xs text-slate-400">
          API base: <code>{API_BASE}</code>
        </p>
      </section>
    </main>
  );
}
