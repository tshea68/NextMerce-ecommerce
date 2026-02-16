"use client";

/**
 * PartsExplorer.client.tsx
 * - Real grid UI that fetches /api/grid
 * - No expensive frontend counting by default
 * - Supports dataset=parts|offers (offers are refurb/netted)
 */

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

import { makePartTitle } from "@/lib/PartsTitle";
import { useCart } from "@/context/CartContext";
import PartImage from "@/components/PartImage";

/* ================================
   CONFIG
   ================================ */
const API_BASE = ""; // use relative
const DEFAULT_PER_PAGE = 30;

/* ================================
   UTILS
   ================================ */
const normalize = (s: any) => (s || "").toLowerCase().trim();

const priceFmt = (n: any) => {
  if (n == null || Number.isNaN(Number(n))) return "";
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: "USD",
    }).format(Number(n));
  } catch {
    return `$${Number(n).toFixed(2)}`;
  }
};

const fmtCount = (num: any) => {
  const n = Number(num);
  return Number.isFinite(n)
    ? n.toLocaleString(undefined, { maximumFractionDigits: 0 })
    : String(num || "");
};

function uniq(arr: string[]) {
  return Array.from(new Set(arr.filter(Boolean)));
}

function parseCsvMulti(sp: URLSearchParams, key: string) {
  // supports repeated params OR comma-separated
  const all = sp.getAll(key).flatMap((v) => v.split(","));
  return uniq(all.map((x) => x.trim()).filter(Boolean));
}

function asBool(v: string | null) {
  if (!v) return false;
  const s = v.toLowerCase();
  return s === "1" || s === "true" || s === "yes";
}

/* ================================
   PART ROW
   ================================ */
function PartRow({ p, addToCart }: any) {
  const router = useRouter();

  const mpn =
    (p?.mpn && String(p.mpn).trim()) ||
    (p?.mpn_display && String(p.mpn_display).trim()) ||
    (p?.mpn_normalized && String(p.mpn_normalized).trim()) ||
    "";

  const isRefurb =
    p?.is_refurb === true ||
    String(p?.condition || "").toLowerCase().includes("used") ||
    String(p?.source || "").toLowerCase().includes("refurb") ||
    String(p?.offer_type || "").toLowerCase().includes("refurb");

  const baseTitle =
    makePartTitle(p) ||
    p?.title ||
    `${p?.brand || ""} ${p?.part_type || ""} ${p?.appliance_type || ""}`.trim() ||
    mpn;

  const displayTitle = isRefurb ? `Refurbished: ${baseTitle}` : baseTitle;

  const priceNum =
    typeof p?.price === "number"
      ? p.price
      : Number(String(p?.price ?? "").replace(/[^0-9.]/g, ""));

  const img = p?.image_url || null;

  const detailHref = (() => {
    if (!mpn) return "#";
    if (isRefurb) {
      const listingId = p?.listing_id || p?.offer_id || "";
      return `/refurb/${encodeURIComponent(mpn)}${
        listingId ? `?offer=${encodeURIComponent(listingId)}` : ""
      }`;
    }
    return `/parts/${encodeURIComponent(mpn)}`;
  })();

  const [qty, setQty] = useState(1);

  function handleAddToCart() {
    if (!mpn) return;
    const payload = {
      mpn,
      qty: isRefurb ? 1 : qty,
      quantity: isRefurb ? 1 : qty,
      is_refurb: !!isRefurb,
      name: displayTitle,
      title: displayTitle,
      price: priceNum,
      image_url: img,
      image: img,
    };
    try {
      addToCart?.(payload);
    } catch {
      /* no-op */
    }
  }

  function goToDetail(e: any) {
    e?.preventDefault?.();
    if (detailHref && detailHref !== "#") router.push(detailHref);
  }

  const cardBg = isRefurb
    ? "bg-blue-50 border-blue-300"
    : "bg-white border-gray-200";

  return (
    <div className={`border rounded-md shadow-sm px-4 py-3 flex flex-col lg:flex-row gap-4 ${cardBg}`}>
      {/* image */}
      <div className="relative flex-shrink-0 flex flex-col items-center" style={{ width: "110px" }}>
        <div className="relative flex items-center justify-center overflow-visible">
          <PartImage
            imageUrl={img}
            alt={mpn || "Part"}
            disableHoverPreview
            className="w-[100px] h-[100px] border border-gray-200 rounded bg-white flex items-center justify-center"
          />
        </div>
      </div>

      {/* middle */}
      <div className="flex-1 min-w-0 flex flex-col gap-2 text-black">
        <div className="flex flex-wrap items-start gap-x-2 gap-y-1">
          <a
            href={detailHref}
            onClick={goToDetail}
            className="text-[15px] font-semibold text-blue-700 leading-snug hover:text-blue-900 hover:underline focus:underline focus:outline-none cursor-pointer"
            aria-label={`View ${displayTitle}`}
          >
            {displayTitle}
          </a>

          {!isRefurb && p?.stock_status_canon && (
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-green-600 text-white leading-none">
              {p.stock_status_canon}
            </span>
          )}

          {isRefurb && Number.isFinite(Number(p?.inventory_total)) && (
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-blue-700 text-white leading-none">
              Qty: {fmtCount(p.inventory_total)}
            </span>
          )}

          {mpn && (
            <span className="text-[11px] font-mono text-gray-600 leading-none">
              Part #: {mpn}
            </span>
          )}
        </div>

        <div className="text-[12px] text-gray-700 leading-snug break-words">
          {p?.brand ? `${p.brand} ` : ""}
          {p?.part_type ? `${p?.part_type} ` : ""}
          {p?.appliance_type ? `for ${p.appliance_type}` : ""}
        </div>
      </div>

      {/* right */}
      <div className="w-full max-w-[200px] flex-shrink-0 flex flex-col items-end text-right gap-2">
        <div className="text-lg font-bold text-green-700 leading-none">
          {priceFmt(priceNum)}
        </div>

        <div className="flex items-center w-full justify-end gap-2">
          {!isRefurb && (
            <select
              className="border border-gray-300 rounded px-2 py-1 text-[12px] text-black"
              value={qty}
              onChange={(e) => {
                const parsed = parseInt(e.target.value, 10);
                setQty(Number.isFinite(parsed) ? parsed : 1);
              }}
            >
              {Array.from({ length: 10 }).map((_, i) => (
                <option key={i} value={i + 1}>
                  {i + 1}
                </option>
              ))}
            </select>
          )}

          <button
            className={`${isRefurb ? "bg-blue-600 hover:bg-blue-700" : "bg-blue-700 hover:bg-blue-800"} text-white text-[12px] font-semibold rounded px-3 py-2`}
            onClick={handleAddToCart}
          >
            Add to Cart
          </button>
        </div>

        <a
          href={detailHref}
          onClick={goToDetail}
          className="underline text-blue-700 text-[11px] font-medium hover:text-blue-900"
        >
          View part
        </a>
      </div>
    </div>
  );
}

/* ================================
   MAIN EXPLORER
   ================================ */
type Dataset = "parts" | "offers";

type GridResp = {
  ok: boolean;
  error?: string;
  dataset?: Dataset;
  items?: any[];
  has_more?: boolean;
  page?: number;
  per_page?: number;
  count_mode?: string;
  total_count?: number | null;
  facets?: {
    brands?: { value: string; count: number }[];
    parts?: { value: string; count: number }[];
    appliances?: { value: string; count: number }[];
  };
  page_inventory_total?: number | null;
};

export default function PartsExplorer() {
  const { addToCart } = useCart();
  const router = useRouter();

  const pathname = usePathname();
  const searchParams = useSearchParams();

  // initialize from URL once
  const init = useMemo(() => {
    const sp = new URLSearchParams(searchParams?.toString() ?? "");
    const dataset = ((sp.get("dataset") || "parts").toLowerCase() as Dataset) || "parts";
    const q = (sp.get("q") || "").trim();
    const sort = (sp.get("sort") || "price_desc").trim();
    const inStockOnly = asBool(sp.get("in_stock_only"));
    const applianceType = (sp.get("appliance_type") || "").trim();
    const brands = parseCsvMulti(sp, "brands");
    const partTypes = parseCsvMulti(sp, "part_types");
    const page = Math.max(parseInt(sp.get("page") || "1", 10) || 1, 1);
    const perPage = Math.min(Math.max(parseInt(sp.get("per_page") || String(DEFAULT_PER_PAGE), 10) || DEFAULT_PER_PAGE, 1), 100);

    return { dataset, q, sort, inStockOnly, applianceType, brands, partTypes, page, perPage };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // only once

  const [dataset, setDataset] = useState<Dataset>(init.dataset);
  const [q, setQ] = useState(init.q);
  const [sort, setSort] = useState(init.sort);
  const [inStockOnly, setInStockOnly] = useState(init.inStockOnly);
  const [applianceType, setApplianceType] = useState(init.applianceType);
  const [selectedBrands, setSelectedBrands] = useState<string[]>(init.brands);
  const [selectedPartTypes, setSelectedPartTypes] = useState<string[]>(init.partTypes);
  const [page, setPage] = useState(init.page);
  const [perPage, setPerPage] = useState(init.perPage);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [items, setItems] = useState<any[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [facets, setFacets] = useState<GridResp["facets"]>({});
  const [pageInventoryTotal, setPageInventoryTotal] = useState<number | null>(null);

  // debounce q
  const [qDebounced, setQDebounced] = useState(q);
  useEffect(() => {
    const t = setTimeout(() => setQDebounced(q), 250);
    return () => clearTimeout(t);
  }, [q]);

  // keep URL in sync (no infinite loop)
  const didInitUrl = useRef(false);
  useEffect(() => {
    if (!pathname) return;

    // reset to page 1 when filters/search change
    // (page state changes separately below)
    // handled by callers setting page(1)

    const sp = new URLSearchParams();
    sp.set("dataset", dataset);
    if (qDebounced) sp.set("q", qDebounced);
    if (sort) sp.set("sort", sort);
    if (inStockOnly) sp.set("in_stock_only", "1");
    if (applianceType) sp.set("appliance_type", applianceType);
    for (const b of selectedBrands) sp.append("brands", b);
    for (const pt of selectedPartTypes) sp.append("part_types", pt);
    sp.set("page", String(page));
    sp.set("per_page", String(perPage));

    const nextUrl = `${pathname}?${sp.toString()}`;

    // first run: avoid replacing if already matches
    if (!didInitUrl.current) {
      didInitUrl.current = true;
      return;
    }

    router.replace(nextUrl, { scroll: false });
  }, [
    pathname,
    router,
    dataset,
    qDebounced,
    sort,
    inStockOnly,
    applianceType,
    selectedBrands,
    selectedPartTypes,
    page,
    perPage,
  ]);

  // fetch grid data
  useEffect(() => {
    const ctrl = new AbortController();

    async function run() {
      setLoading(true);
      setErr(null);

      const sp = new URLSearchParams();
      sp.set("dataset", dataset);
      if (qDebounced) sp.set("q", qDebounced);
      if (sort) sp.set("sort", sort);
      if (inStockOnly) sp.set("in_stock_only", "1");
      if (applianceType) sp.set("appliance_type", applianceType);
      for (const b of selectedBrands) sp.append("brands", b);
      for (const pt of selectedPartTypes) sp.append("part_types", pt);
      sp.set("page", String(page));
      sp.set("per_page", String(perPage));

      const url = `${API_BASE}/api/grid?${sp.toString()}`;

      try {
        const res = await fetch(url, {
          method: "GET",
          signal: ctrl.signal,
          headers: { "accept": "application/json" },
          cache: "no-store",
        });

        const json = (await res.json()) as GridResp;

        if (!res.ok || !json?.ok) {
          const msg = json?.error || `HTTP ${res.status}`;
          setErr(msg);
          setItems([]);
          setHasMore(false);
          setFacets({});
          setPageInventoryTotal(null);
          return;
        }

        setItems(Array.isArray(json.items) ? json.items : []);
        setHasMore(!!json.has_more);
        setFacets(json.facets || {});
        setPageInventoryTotal(
          typeof json.page_inventory_total === "number" ? json.page_inventory_total : null
        );
      } catch (e: any) {
        if (e?.name === "AbortError") return;
        setErr(e?.message || "Request failed");
        setItems([]);
        setHasMore(false);
        setFacets({});
        setPageInventoryTotal(null);
      } finally {
        setLoading(false);
      }
    }

    run();
    return () => ctrl.abort();
  }, [
    dataset,
    qDebounced,
    sort,
    inStockOnly,
    applianceType,
    selectedBrands,
    selectedPartTypes,
    page,
    perPage,
  ]);

  const brandFacet = facets?.brands || [];
  const partFacet = facets?.parts || [];
  const applianceFacet = facets?.appliances || [];

  function toggleInList(list: string[], v: string) {
    const n = normalize(v);
    if (!n) return list;
    const has = list.some((x) => normalize(x) === n);
    return has ? list.filter((x) => normalize(x) !== n) : [...list, v];
  }

  function resetToFirstPage() {
    if (page !== 1) setPage(1);
  }

  return (
    <div className="w-full px-6 py-6">
      {/* Header row */}
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-2">
          <div className="text-[13px] font-semibold text-gray-700">
            {dataset === "parts" ? "New Parts" : "Refurb Offers"}
            {dataset === "offers" && typeof pageInventoryTotal === "number" ? (
              <span className="ml-2 text-gray-500 font-normal">
                (page inventory total: {fmtCount(pageInventoryTotal)})
              </span>
            ) : null}
          </div>

          <div className="flex flex-col md:flex-row gap-2 md:items-center">
            <div className="flex items-center gap-2">
              <button
                className={`px-3 py-2 rounded border text-[12px] font-semibold ${
                  dataset === "parts" ? "bg-blue-700 text-white border-blue-700" : "bg-white text-gray-800 border-gray-300"
                }`}
                onClick={() => {
                  setDataset("parts");
                  resetToFirstPage();
                }}
              >
                Parts
              </button>
              <button
                className={`px-3 py-2 rounded border text-[12px] font-semibold ${
                  dataset === "offers" ? "bg-blue-700 text-white border-blue-700" : "bg-white text-gray-800 border-gray-300"
                }`}
                onClick={() => {
                  setDataset("offers");
                  resetToFirstPage();
                }}
              >
                Offers (Refurb)
              </button>
            </div>

            <div className="flex items-center gap-2">
              <input
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setPage(1);
                }}
                placeholder="Search MPN, title, brand…"
                className="w-full md:w-[360px] border border-gray-300 rounded px-3 py-2 text-[13px] text-black"
              />

              <select
                value={sort}
                onChange={(e) => {
                  setSort(e.target.value);
                  setPage(1);
                }}
                className="border border-gray-300 rounded px-2 py-2 text-[13px] text-black"
              >
                <option value="price_desc">Price: high → low</option>
                <option value="price_asc">Price: low → high</option>
              </select>

              <label className="flex items-center gap-2 text-[12px] text-gray-700 select-none">
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => {
                    setInStockOnly(e.target.checked);
                    setPage(1);
                  }}
                />
                In stock only
              </label>
            </div>
          </div>
        </div>

        {/* Pagination controls (top) */}
        <div className="flex items-center gap-2">
          <select
            value={perPage}
            onChange={(e) => {
              setPerPage(parseInt(e.target.value, 10) || DEFAULT_PER_PAGE);
              setPage(1);
            }}
            className="border border-gray-300 rounded px-2 py-2 text-[13px] text-black"
          >
            {[15, 30, 60, 100].map((n) => (
              <option key={n} value={n}>
                {n}/page
              </option>
            ))}
          </select>

          <button
            className="px-3 py-2 rounded border border-gray-300 text-[12px] font-semibold disabled:opacity-50"
            disabled={page <= 1 || loading}
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
          >
            Prev
          </button>
          <div className="text-[12px] text-gray-700 w-[70px] text-center">
            Page {page}
          </div>
          <button
            className="px-3 py-2 rounded border border-gray-300 text-[12px] font-semibold disabled:opacity-50"
            disabled={!hasMore || loading}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">
        {/* Sidebar */}
        <aside className="border border-gray-200 rounded-lg bg-white p-4 h-fit">
          <div className="text-[13px] font-bold text-gray-800 mb-3">Filters</div>

          {/* Appliance type (single-select) */}
          <div className="mb-4">
            <div className="text-[12px] font-semibold text-gray-700 mb-2">Appliance Type</div>
            <select
              value={applianceType}
              onChange={(e) => {
                setApplianceType(e.target.value);
                setPage(1);
              }}
              className="w-full border border-gray-300 rounded px-2 py-2 text-[13px] text-black"
            >
              <option value="">All</option>
              {applianceFacet.map((x) => (
                <option key={x.value} value={x.value}>
                  {x.value} ({fmtCount(x.count)})
                </option>
              ))}
            </select>
          </div>

          {/* Brands (multi) */}
          <div className="mb-4">
            <div className="text-[12px] font-semibold text-gray-700 mb-2">Brands</div>
            <div className="max-h-[240px] overflow-auto pr-1">
              {brandFacet.length === 0 ? (
                <div className="text-[12px] text-gray-500">No facets yet.</div>
              ) : (
                brandFacet.map((x) => {
                  const checked = selectedBrands.some((b) => normalize(b) === normalize(x.value));
                  return (
                    <label key={x.value} className="flex items-center justify-between gap-2 py-1 text-[12px] text-gray-800">
                      <span className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {
                            setSelectedBrands((prev) => toggleInList(prev, x.value));
                            setPage(1);
                          }}
                        />
                        {x.value}
                      </span>
                      <span className="text-gray-500">{fmtCount(x.count)}</span>
                    </label>
                  );
                })
              )}
            </div>
          </div>

          {/* Part types (multi) */}
          <div className="mb-2">
            <div className="text-[12px] font-semibold text-gray-700 mb-2">Part Types</div>
            <div className="max-h-[240px] overflow-auto pr-1">
              {partFacet.length === 0 ? (
                <div className="text-[12px] text-gray-500">No facets yet.</div>
              ) : (
                partFacet.map((x) => {
                  const checked = selectedPartTypes.some((p) => normalize(p) === normalize(x.value));
                  return (
                    <label key={x.value} className="flex items-center justify-between gap-2 py-1 text-[12px] text-gray-800">
                      <span className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {
                            setSelectedPartTypes((prev) => toggleInList(prev, x.value));
                            setPage(1);
                          }}
                        />
                        {x.value}
                      </span>
                      <span className="text-gray-500">{fmtCount(x.count)}</span>
                    </label>
                  );
                })
              )}
            </div>
          </div>

          {/* Clear */}
          <div className="mt-4 flex gap-2">
            <button
              className="w-full px-3 py-2 rounded bg-gray-100 border border-gray-200 text-[12px] font-semibold text-gray-800 hover:bg-gray-200"
              onClick={() => {
                setQ("");
                setApplianceType("");
                setSelectedBrands([]);
                setSelectedPartTypes([]);
                setInStockOnly(false);
                setSort("price_desc");
                setPage(1);
              }}
            >
              Clear filters
            </button>
          </div>
        </aside>

        {/* Main list */}
        <main className="min-w-0">
          {loading && (
            <div className="mb-3 text-[12px] text-gray-600">Loading…</div>
          )}

          {err && (
            <div className="mb-4 border border-red-300 bg-red-50 text-red-700 rounded p-3 text-[12px]">
              <div className="font-semibold mb-1">/api/grid error</div>
              <div className="font-mono break-all">{err}</div>
            </div>
          )}

          {!loading && !err && items.length === 0 && (
            <div className="text-[13px] text-gray-700">No results.</div>
          )}

          <div className="flex flex-col gap-3">
            {items.map((p, idx) => (
              <PartRow key={p?.id ?? `${p?.mpn ?? "row"}-${idx}`} p={p} addToCart={addToCart} />
            ))}
          </div>

          {/* Pagination controls (bottom) */}
          <div className="mt-6 flex items-center justify-center gap-2">
            <button
              className="px-3 py-2 rounded border border-gray-300 text-[12px] font-semibold disabled:opacity-50"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
            >
              Prev
            </button>
            <div className="text-[12px] text-gray-700 w-[80px] text-center">
              Page {page}
            </div>
            <button
              className="px-3 py-2 rounded border border-gray-300 text-[12px] font-semibold disabled:opacity-50"
              disabled={!hasMore || loading}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
