"use client";

/**
 * PartsExplorer.client.tsx
<<<<<<< HEAD:merce/app/grid/PartsExplorer.client.tsx
 * - Real grid UI that fetches /api/grid
 * - No expensive frontend counting by default
 * - Supports dataset=parts|offers (offers are refurb/netted)
=======
 * - Grid UI that fetches /api/grid
 * - Item type filter: both | new | refurb
 * - Availability filter: in_stock | orderable | all  (DEFAULT: all)
 * - Split calls:
 *    1) Items:  /api/grid (NO facets)
 *    2) Facets (cached): /api/parts/facets  (fast; includes estimated totals)
 *    3) Search totals (optional): /api/grid?meta_only=1&total=1 (exact count for search mode)
 *
 * Search override behavior:
 * - Any non-empty q puts the page into "search mode"
 * - In search mode: filters DO NOT apply (condition/availability/brands/part_types/appliance_type ignored)
 * - Requests force: condition=both, availability=all
 * - Filter UI is disabled and dimmed while searching
 *
 * Layout rules:
 * - Filters column stays full-height (no scroll)
 * - Results card becomes the SAME HEIGHT as the filters column on lg+ screens
 * - Results list scrolls inside the results card
 *
 * NLA parts:
 * - When availability=all, NLA-ish parts can appear in results (client infers)
 * - API can inject an "is_nla" row on exact MPN searches when a part exists but is not sellable
 * - UI shows clear NLA badge + replacement info + disables Add to Cart
 *
 * Models in cards:
 * - If API returns items with `model_number`, UI renders ModelRow cards automatically.
>>>>>>> 4bcdcfcc (SSR PDP foundation + grid reapply + netted offers integration):app/grid/PartsExplorer.client.tsx
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

<<<<<<< HEAD:merce/app/grid/PartsExplorer.client.tsx
/* ================================
   UTILS
   ================================ */
=======
type Condition = "both" | "new" | "refurb";
type Availability = "in_stock" | "orderable" | "all";

type FacetRow = { value: string; count: number };
type Facets = {
  brands?: FacetRow[];
  parts?: FacetRow[];
  appliances?: FacetRow[];
};

type FacetsMeta = {
  estimated_total?: number;
  estimated_total_all?: number;
  estimated_total_in_stock?: number;
  effective_availability?: Availability;
  facet_limit?: number;
  source?: string;
};

type GridInit = {
  condition: Condition;
  q: string;
  availability: Availability;
  applianceType: string;
  brands: string[];
  partTypes: string[];
  page: number;
  perPage: number;
};

type PartsExplorerProps = {
  // legacy seed (still supported)
  initial?: GridInit;
  initialItems?: any[];
  initialHasMore?: boolean;
  initialPageInventoryTotal?: number | null;
  initialFacets?: Facets;
  initialTotalCount?: number | null;
  initialError?: string | null;

  // ✅ SSR seed (from app/grid/page.tsx)
  ssr?: {
    key: string;
    items: any[];
    has_more: boolean;
    page_inventory_total: number | null;
    facets: Facets | null;
    total_count: number | null;
  };
};

// Landing defaults
const DEFAULT_LANDING_Q = "";
const DEFAULT_LANDING_CONDITION: Condition = "refurb";
const DEFAULT_SORT = "inventory_desc";
const DEFAULT_AVAILABILITY: Availability = "all";

>>>>>>> 4bcdcfcc (SSR PDP foundation + grid reapply + netted offers integration):app/grid/PartsExplorer.client.tsx
const normalize = (s: any) => (s || "").toLowerCase().trim();

/* ================================
   FACET DISPLAY HELPERS
   - Keep raw facet values for filtering
   - Render human labels for UI
   ================================ */

const BRAND_LABELS: Record<string, string> = {
  ge: "GE",
  lg: "LG",
  ikea: "IKEA",
  bosch: "Bosch",
  whirlpool: "Whirlpool",
  samsung: "Samsung",
  frigidaire: "Frigidaire",
  fisherpaykel: "Fisher & Paykel",
  "fisher-paykel": "Fisher & Paykel",
  speedqueen: "Speed Queen",
  "speed-queen": "Speed Queen",
  kitchenaid: "KitchenAid",
  "kitchen-aid": "KitchenAid",
};

function titleCaseWords(s: string) {
  return s
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => {
      if (w.length <= 2) return w.toUpperCase();
      return w[0].toUpperCase() + w.slice(1);
    })
    .join(" ");
}

const PART_WORDS = [
  "circuit",
  "board",
  "timer",
  "overlay",
  "control",
  "panel",
  "user",
  "interface",
  "touch",
  "power",
  "supply",
  "heater",
  "heating",
  "element",
  "motor",
  "motors",
  "blower",
  "blowers",
  "harness",
  "wire",
  "wiring",
  "switch",
  "valve",
  "pump",
  "filter",
  "fan",
  "compressor",
  "thermostat",
  "sensor",
  "igniter",
  "burner",
  "door",
  "knob",
  "handle",
  "latch",
  "seal",
  "gasket",
  "housing",
  "assembly",
  "cap",
  "cover",
  "dispenser",
  "tray",
  "drawer",
  "bracket",
  "belt",
  "pulley",
  "roller",
  "tub",
  "drum",
  "agitator",
  "auger",
  "gear",
  "case",
  "chassis",
  "cabinet",
].sort((a, b) => b.length - a.length);

function splitCompound(raw: string) {
  const s = normalize(raw).replace(/[-_]+/g, " ").trim();
  if (!s) return "";
  if (s.includes(" ")) return titleCaseWords(s);

  // greedy dictionary split (best-effort)
  const out: string[] = [];
  let i = 0;

  while (i < s.length) {
    let matched = "";
    for (const w of PART_WORDS) {
      if (s.startsWith(w, i)) {
        matched = w;
        break;
      }
    }
    if (matched) {
      out.push(matched);
      i += matched.length;
      continue;
    }

    // fallback: consume until next known token, or one char
    let j = i + 1;
    while (j < s.length) {
      const tail = s.slice(j);
      if (PART_WORDS.some((w) => tail.startsWith(w))) break;
      j++;
    }
    out.push(s.slice(i, Math.max(j, i + 1)));
    i = Math.max(j, i + 1);
  }

  return titleCaseWords(out.join(" ").replace(/\s+/g, " ").trim());
}

function facetLabel(kind: "brand" | "appliance" | "part", value: string) {
  const raw = String(value ?? "").trim();
  const v = normalize(raw);
  if (!v) return "";

  if (kind === "brand") return BRAND_LABELS[v] || titleCaseWords(v.replace(/[-_]+/g, " "));
  if (kind === "appliance") return titleCaseWords(v.replace(/[-_]+/g, " "));
  // part
  return splitCompound(v);
}

const priceFmt = (n: any) => {
  const x = typeof n === "number" ? n : Number(String(n ?? "").replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(x)) return "—";
  try {
<<<<<<< HEAD:merce/app/grid/PartsExplorer.client.tsx
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: "USD",
    }).format(Number(n));
=======
    return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(x);
>>>>>>> 4bcdcfcc (SSR PDP foundation + grid reapply + netted offers integration):app/grid/PartsExplorer.client.tsx
  } catch {
    return `$${x.toFixed(2)}`;
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

function parseAvailability(sp: URLSearchParams): Availability {
  // New param
  const raw = normalize(sp.get("availability"));
  if (raw === "in_stock" || raw === "instock") return "in_stock";
  if (raw === "orderable") return "orderable";
  if (raw === "all") return "all";

  // Legacy support
  if (asBool(sp.get("in_stock_only"))) return "in_stock";

  return DEFAULT_AVAILABILITY;
}

function isNlaishStatus(stockStatusCanon: any) {
  const s = String(stockStatusCanon ?? "").toLowerCase();
  if (!s) return false;
  return (
    s.includes("nla") ||
    s.includes("no longer") ||
    s.includes("discontinued") ||
    s.includes("obsolete") ||
    s.includes("not available")
  );
}

// ✅ Match the server-side key behavior EXACTLY (including search override + defaults)
function stableKeyFromSearchParamsString(spString: string) {
  const sp = new URLSearchParams(spString || "");

  const q = (sp.get("q") || "").trim();
  const searchMode = q.length > 0;

  if (searchMode) {
    // Server forces these, even if URL omits them
    sp.set("condition", "both");
    sp.set("availability", "all");

    // Server ignores filters in search mode -> remove from key
    sp.delete("appliance_type");
    sp.delete("brands");
    sp.delete("part_types");
    sp.delete("in_stock_only");
  } else {
    if (!sp.get("condition")) sp.set("condition", DEFAULT_LANDING_CONDITION);
    if (!sp.get("availability")) sp.set("availability", DEFAULT_AVAILABILITY);
  }

  if (!sp.get("page")) sp.set("page", "1");
  if (!sp.get("per_page")) sp.set("per_page", String(DEFAULT_PER_PAGE));
  if (!sp.get("sort")) sp.set("sort", DEFAULT_SORT);

  const entries = Array.from(sp.entries())
    .filter(([k]) => !!k)
    .sort(([aK, aV], [bK, bV]) => (aK === bK ? aV.localeCompare(bV) : aK.localeCompare(bK)));

  return entries.map(([k, v]) => `${k}=${v}`).join("&");
}

async function readJsonSafeClient(res: Response) {
  const ct = res.headers.get("content-type") || "";
  const text = await res.text();

  if (!ct.toLowerCase().includes("application/json")) {
    return { __non_json: true, status: res.status, ct, text };
  }
  try {
    return JSON.parse(text);
  } catch {
    return { __bad_json: true, status: res.status, ct, text };
  }
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

<<<<<<< HEAD:merce/app/grid/PartsExplorer.client.tsx
  const isRefurb =
    p?.is_refurb === true ||
    String(p?.condition || "").toLowerCase().includes("used") ||
    String(p?.source || "").toLowerCase().includes("refurb") ||
    String(p?.offer_type || "").toLowerCase().includes("refurb");
=======
  // ✅ authoritative refurb detection
  const isRefurb = p?.is_refurb === true || String(p?.source || "").toLowerCase() === "offers";

  // ✅ injected by API OR inferred from status when availability=all
  const isNla = p?.is_nla === true || (!isRefurb && isNlaishStatus(p?.stock_status_canon));

  const replacedBy =
    (p?.replaced_by && String(p.replaced_by).trim()) ||
    (p?.replacement_mpn && String(p.replacement_mpn).trim()) ||
    "";
>>>>>>> 4bcdcfcc (SSR PDP foundation + grid reapply + netted offers integration):app/grid/PartsExplorer.client.tsx

  const baseTitle =
    makePartTitle(p, mpn) ||
    p?.title ||
    `${p?.brand || ""} ${p?.part_type || ""} ${p?.appliance_type || ""}`.trim() ||
    mpn ||
    "Part";

  const displayTitle = isRefurb ? `Refurbished: ${baseTitle}` : baseTitle;

  const priceNum =
<<<<<<< HEAD:merce/app/grid/PartsExplorer.client.tsx
    typeof p?.price === "number"
      ? p.price
      : Number(String(p?.price ?? "").replace(/[^0-9.]/g, ""));

=======
    typeof p?.price === "number" ? p.price : Number(String(p?.price ?? "").replace(/[^0-9.]/g, ""));
>>>>>>> 4bcdcfcc (SSR PDP foundation + grid reapply + netted offers integration):app/grid/PartsExplorer.client.tsx
  const img = p?.image_url || null;

  const detailHref = (() => {
    if (!mpn) return "#";
<<<<<<< HEAD:merce/app/grid/PartsExplorer.client.tsx
    if (isRefurb) {
      const listingId = p?.listing_id || p?.offer_id || "";
      return `/refurb/${encodeURIComponent(mpn)}${
        listingId ? `?offer=${encodeURIComponent(listingId)}` : ""
      }`;
    }
    return `/parts/${encodeURIComponent(mpn)}`;
=======
    return isRefurb ? `/offers/${encodeURIComponent(mpn)}` : `/parts/${encodeURIComponent(mpn)}`;
>>>>>>> 4bcdcfcc (SSR PDP foundation + grid reapply + netted offers integration):app/grid/PartsExplorer.client.tsx
  })();

  const replacementHref = replacedBy ? `/parts/${encodeURIComponent(replacedBy)}` : "";

  const [qty, setQty] = useState(1);

  function handleAddToCart() {
    if (!mpn) return;
    if (isNla) return;

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

<<<<<<< HEAD:merce/app/grid/PartsExplorer.client.tsx
  const cardBg = isRefurb
=======
  const cardBg = isNla
    ? "bg-amber-50 border-amber-300"
    : isRefurb
>>>>>>> 4bcdcfcc (SSR PDP foundation + grid reapply + netted offers integration):app/grid/PartsExplorer.client.tsx
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

          {isNla && (
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-amber-700 text-white leading-none">
              No longer available
            </span>
          )}

          {!isNla && !isRefurb && p?.stock_status_canon && (
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-green-600 text-white leading-none">
              {p.stock_status_canon}
            </span>
          )}

          {!isNla && isRefurb && Number.isFinite(Number(p?.inventory_total)) && (
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

        {isNla && (
          <div className="text-[12px] text-amber-900 leading-snug">
            We recognize this as a valid part number, but it is not currently available for purchase.
            {replacedBy ? (
              <>
                {" "}
                Replacement:{" "}
                <a
                  href={replacementHref}
                  onClick={(e) => {
                    e.preventDefault();
                    router.push(replacementHref);
                  }}
                  className="text-blue-700 underline font-semibold"
                >
                  {replacedBy}
                </a>
              </>
            ) : null}
          </div>
        )}
      </div>

<<<<<<< HEAD:merce/app/grid/PartsExplorer.client.tsx
      {/* right */}
      <div className="w-full max-w-[200px] flex-shrink-0 flex flex-col items-end text-right gap-2">
        <div className="text-lg font-bold text-green-700 leading-none">
          {priceFmt(priceNum)}
=======
      <div className="w-full max-w-[220px] flex-shrink-0 flex flex-col items-end text-right gap-2">
        <div className={`text-lg font-bold leading-none ${isNla ? "text-amber-800" : "text-green-700"}`}>
          {isNla ? "—" : priceFmt(priceNum)}
>>>>>>> 4bcdcfcc (SSR PDP foundation + grid reapply + netted offers integration):app/grid/PartsExplorer.client.tsx
        </div>

        <div className="flex items-center w-full justify-end gap-2">
          {!isRefurb && !isNla && (
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
<<<<<<< HEAD:merce/app/grid/PartsExplorer.client.tsx
            className={`${isRefurb ? "bg-blue-600 hover:bg-blue-700" : "bg-blue-700 hover:bg-blue-800"} text-white text-[12px] font-semibold rounded px-3 py-2`}
=======
            className={`${
              isNla
                ? "bg-gray-400 cursor-not-allowed"
                : isRefurb
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-blue-700 hover:bg-blue-800"
            } text-white text-[12px] font-semibold rounded px-3 py-2`}
>>>>>>> 4bcdcfcc (SSR PDP foundation + grid reapply + netted offers integration):app/grid/PartsExplorer.client.tsx
            onClick={handleAddToCart}
            disabled={isNla}
            title={isNla ? "This part is not available for purchase" : "Add to Cart"}
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
   MODEL ROW
   ================================ */
function ModelRow({ m }: any) {
  const router = useRouter();

  const modelNumber = String(m?.model_number || m?.model || "").trim();
  const brand = String(m?.brand || "").trim();
  const applianceType = String(m?.appliance_type || "").trim();

  const title = [brand, modelNumber].filter(Boolean).join(" ") || modelNumber || "Model";
  const href = modelNumber ? `/models/${encodeURIComponent(modelNumber)}` : "#";

  const logo = m?.brand_logo_url || m?.image_url || null;
  const totalParts = m?.total_parts;
  const pricedParts = m?.priced_parts;

  return (
    <div className="border rounded-md shadow-sm px-4 py-3 flex flex-col lg:flex-row gap-4 bg-white border-gray-200">
      <div className="relative flex-shrink-0 flex flex-col items-center" style={{ width: "110px" }}>
        <PartImage
          imageUrl={logo}
          alt={brand || "Model"}
          disableHoverPreview
          className="w-[100px] h-[100px] border border-gray-200 rounded bg-white flex items-center justify-center"
        />
      </div>

      <div className="flex-1 min-w-0 flex flex-col gap-2 text-black">
        <div className="flex flex-wrap items-start gap-x-2 gap-y-1">
          <a
            href={href}
            onClick={(e) => {
              e.preventDefault();
              if (href !== "#") router.push(href);
            }}
            className="text-[15px] font-semibold text-blue-700 leading-snug hover:text-blue-900 hover:underline focus:underline focus:outline-none cursor-pointer"
          >
            {title}
          </a>

          <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-gray-800 text-white leading-none">
            Model
          </span>

          {modelNumber && (
            <span className="text-[11px] font-mono text-gray-600 leading-none">Model #: {modelNumber}</span>
          )}
        </div>

        <div className="text-[12px] text-gray-700 leading-snug">{applianceType ? `${applianceType}` : ""}</div>

        {(Number.isFinite(Number(totalParts)) || Number.isFinite(Number(pricedParts))) && (
          <div className="text-[12px] text-gray-600">
            {Number.isFinite(Number(totalParts)) ? <>Total parts: {fmtCount(totalParts)}</> : null}
            {Number.isFinite(Number(pricedParts)) ? (
              <>
                {Number.isFinite(Number(totalParts)) ? " • " : ""}
                Priced parts: {fmtCount(pricedParts)}
              </>
            ) : null}
          </div>
        )}
      </div>

      <div className="w-full max-w-[220px] flex-shrink-0 flex flex-col items-end text-right gap-2">
        <button
          className="bg-blue-700 hover:bg-blue-800 text-white text-[12px] font-semibold rounded px-3 py-2"
          onClick={() => {
            if (href !== "#") router.push(href);
          }}
          disabled={href === "#"}
        >
          View model
        </button>
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
<<<<<<< HEAD:merce/app/grid/PartsExplorer.client.tsx
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
=======
  facets?: Facets | null;
  total_count?: number | null;
  facets_source?: string;
  page_inventory_total?: number | null;
};

function RadioDot({ checked }: { checked: boolean }) {
  return (
    <span
      className={`inline-flex w-4 h-4 rounded-full border ${
        checked ? "border-blue-700" : "border-gray-400"
      } items-center justify-center`}
    >
      <span className={`w-2.5 h-2.5 rounded-full ${checked ? "bg-blue-700" : "bg-transparent"}`} />
    </span>
  );
}

export default function PartsExplorer(props: PartsExplorerProps) {
>>>>>>> 4bcdcfcc (SSR PDP foundation + grid reapply + netted offers integration):app/grid/PartsExplorer.client.tsx
  const { addToCart } = useCart();
  const router = useRouter();

  const pathname = usePathname();
  const searchParams = useSearchParams();

<<<<<<< HEAD:merce/app/grid/PartsExplorer.client.tsx
  // initialize from URL once
=======
  // ✅ SSR match check (prevents hydration double-fetch)
  const currentKey = useMemo(() => {
    return stableKeyFromSearchParamsString(searchParams?.toString() ?? "");
  }, [searchParams]);

  const canUseSsr = !!props?.ssr && props.ssr.key === currentKey;

>>>>>>> 4bcdcfcc (SSR PDP foundation + grid reapply + netted offers integration):app/grid/PartsExplorer.client.tsx
  const init = useMemo(() => {
    // ✅ legacy explicit seed wins (kept)
    if (props?.initial) return props.initial;

    const sp = new URLSearchParams(searchParams?.toString() ?? "");
<<<<<<< HEAD:merce/app/grid/PartsExplorer.client.tsx
    const dataset = ((sp.get("dataset") || "parts").toLowerCase() as Dataset) || "parts";
    const q = (sp.get("q") || "").trim();
    const sort = (sp.get("sort") || "price_desc").trim();
    const inStockOnly = asBool(sp.get("in_stock_only"));
=======
    const hasAnyParam = sp.toString().length > 0;

    const conditionRaw = (sp.get("condition") || "").toLowerCase();
    let condition: Condition =
      conditionRaw === "new" || conditionRaw === "refurb" || conditionRaw === "both"
        ? (conditionRaw as Condition)
        : hasAnyParam
        ? "both"
        : DEFAULT_LANDING_CONDITION;

    const qFromUrl = (sp.get("q") || "").trim();
    const q = qFromUrl || (!hasAnyParam ? DEFAULT_LANDING_Q : "");

    const availability = parseAvailability(sp);

>>>>>>> 4bcdcfcc (SSR PDP foundation + grid reapply + netted offers integration):app/grid/PartsExplorer.client.tsx
    const applianceType = (sp.get("appliance_type") || "").trim();
    const brands = parseCsvMulti(sp, "brands");
    const partTypes = parseCsvMulti(sp, "part_types");
    const page = Math.max(parseInt(sp.get("page") || "1", 10) || 1, 1);
    const perPage = Math.min(Math.max(parseInt(sp.get("per_page") || String(DEFAULT_PER_PAGE), 10) || DEFAULT_PER_PAGE, 1), 100);

<<<<<<< HEAD:merce/app/grid/PartsExplorer.client.tsx
    return { dataset, q, sort, inStockOnly, applianceType, brands, partTypes, page, perPage };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // only once

  const [dataset, setDataset] = useState<Dataset>(init.dataset);
  const [q, setQ] = useState(init.q);
  const [sort, setSort] = useState(init.sort);
  const [inStockOnly, setInStockOnly] = useState(init.inStockOnly);
=======
    return { condition, q, availability, applianceType, brands, partTypes, page, perPage };
  }, [props?.initial, searchParams]);

  const [condition, setCondition] = useState<Condition>(init.condition);
  const [availability, setAvailability] = useState<Availability>(init.availability);

  const [q, setQ] = useState(init.q);
>>>>>>> 4bcdcfcc (SSR PDP foundation + grid reapply + netted offers integration):app/grid/PartsExplorer.client.tsx
  const [applianceType, setApplianceType] = useState(init.applianceType);
  const [selectedBrands, setSelectedBrands] = useState<string[]>(init.brands);
  const [selectedPartTypes, setSelectedPartTypes] = useState<string[]>(init.partTypes);
  const [page, setPage] = useState(init.page);
  const [perPage, setPerPage] = useState(init.perPage);

  const [loading, setLoading] = useState(false);
<<<<<<< HEAD:merce/app/grid/PartsExplorer.client.tsx
  const [err, setErr] = useState<string | null>(null);
  const [items, setItems] = useState<any[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [facets, setFacets] = useState<GridResp["facets"]>({});
  const [pageInventoryTotal, setPageInventoryTotal] = useState<number | null>(null);

=======

  const [err, setErr] = useState<string | null>(() => {
    if (canUseSsr) return null;
    return props?.initialError ? String(props.initialError) : null;
  });

  const [items, setItems] = useState<any[]>(() => {
    if (canUseSsr) return Array.isArray(props.ssr?.items) ? props.ssr!.items : [];
    return Array.isArray(props?.initialItems) ? props.initialItems : [];
  });

  const [hasMore, setHasMore] = useState(() => {
    if (canUseSsr) return !!props.ssr?.has_more;
    return !!props?.initialHasMore;
  });

  const [pageInventoryTotal, setPageInventoryTotal] = useState<number | null>(() => {
    if (canUseSsr)
      return typeof props.ssr?.page_inventory_total === "number" ? props.ssr.page_inventory_total : null;
    return typeof props?.initialPageInventoryTotal === "number" ? props.initialPageInventoryTotal : null;
  });

  const [metaLoading, setMetaLoading] = useState(false);

  const [facets, setFacets] = useState<Facets>(() => {
    if (canUseSsr) return (props.ssr?.facets as any) || {};
    return props?.initialFacets ?? {};
  });

  // exact total_count (only used in search mode)
  const [totalCount, setTotalCount] = useState<number | null>(() => {
    if (canUseSsr) return typeof props.ssr?.total_count === "number" ? props.ssr.total_count : null;
    return typeof props?.initialTotalCount === "number" ? props.initialTotalCount : null;
  });

  // cached facets meta (estimated totals)
  const [facetsMeta, setFacetsMeta] = useState<FacetsMeta | null>(null);

  // ✅ prevent immediate duplicate fetch on hydration when SSR seeded
  const initialItemsProvided = typeof props?.initialItems !== "undefined";
  const initialMetaProvided =
    typeof props?.initialFacets !== "undefined" || typeof props?.initialTotalCount !== "undefined";

  const skipFirstItemsFetch = useRef<boolean>(canUseSsr || initialItemsProvided);

  // facets cache fetch skip (if SSR already provided facets)
  const skipFirstFacetsFetch = useRef<boolean>(!!props?.initialFacets || (canUseSsr && props.ssr?.facets != null));

  // search total skip (if SSR already provided total_count)
  const skipFirstSearchTotalFetch = useRef<boolean>(
    initialMetaProvided || (canUseSsr && typeof props.ssr?.total_count === "number")
  );

  // ---- Equal-height behavior (lg+): results card height == filters height ----
  const asideRef = useRef<HTMLDivElement | null>(null);
  const [asideHeight, setAsideHeight] = useState<number | null>(null);
  const [isLg, setIsLg] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(min-width: 1024px)");
    const onChange = () => setIsLg(!!mq.matches);

    onChange();

    // @ts-ignore
    if (mq.addEventListener) mq.addEventListener("change", onChange);
    // @ts-ignore
    else mq.addListener(onChange);

    return () => {
      // @ts-ignore
      if (mq.removeEventListener) mq.removeEventListener("change", onChange);
      // @ts-ignore
      else mq.removeListener(onChange);
    };
  }, []);

  useEffect(() => {
    const el = asideRef.current;
    if (!el) return;
    if (typeof ResizeObserver === "undefined") return;

    const update = () => {
      const h = Math.ceil(el.getBoundingClientRect().height);
      setAsideHeight(h > 0 ? h : null);
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);

    return () => ro.disconnect();
  }, []);

>>>>>>> 4bcdcfcc (SSR PDP foundation + grid reapply + netted offers integration):app/grid/PartsExplorer.client.tsx
  // debounce q
  const [qDebounced, setQDebounced] = useState(q);
  useEffect(() => {
    const t = setTimeout(() => setQDebounced(q), 250);
    return () => clearTimeout(t);
  }, [q]);

<<<<<<< HEAD:merce/app/grid/PartsExplorer.client.tsx
  // keep URL in sync (no infinite loop)
=======
  const searchMode = qDebounced.trim().length > 0;

  function toggleInList(list: string[], v: string) {
    const n = normalize(v);
    if (!n) return list;
    const has = list.some((x) => normalize(x) === n);
    return has ? list.filter((x) => normalize(x) !== n) : [...list, v];
  }

  const filtersDisabled = searchMode;

  function doReset() {
    setCondition(DEFAULT_LANDING_CONDITION);
    setAvailability(DEFAULT_AVAILABILITY);
    setQ(DEFAULT_LANDING_Q);
    setApplianceType("");
    setSelectedBrands([]);
    setSelectedPartTypes([]);
    setPage(1);
  }

  // keep URL in sync
>>>>>>> 4bcdcfcc (SSR PDP foundation + grid reapply + netted offers integration):app/grid/PartsExplorer.client.tsx
  const didInitUrl = useRef(false);
  useEffect(() => {
    if (!pathname) return;

    // reset to page 1 when filters/search change
    // (page state changes separately below)
    // handled by callers setting page(1)

    const sp = new URLSearchParams();
<<<<<<< HEAD:merce/app/grid/PartsExplorer.client.tsx
    sp.set("dataset", dataset);
    if (qDebounced) sp.set("q", qDebounced);
    if (sort) sp.set("sort", sort);
    if (inStockOnly) sp.set("in_stock_only", "1");
    if (applianceType) sp.set("appliance_type", applianceType);
    for (const b of selectedBrands) sp.append("brands", b);
    for (const pt of selectedPartTypes) sp.append("part_types", pt);
=======

    // In search mode, keep URL clean & truthful: search overrides filters.
    if (!searchMode) {
      sp.set("condition", condition);

      // ✅ FIX: always include availability in URL (even when "all")
      sp.set("availability", availability);

      if (applianceType) sp.set("appliance_type", applianceType);
      for (const b of selectedBrands) sp.append("brands", b);
      for (const pt of selectedPartTypes) sp.append("part_types", pt);
    }

    if (qDebounced) sp.set("q", qDebounced);
>>>>>>> 4bcdcfcc (SSR PDP foundation + grid reapply + netted offers integration):app/grid/PartsExplorer.client.tsx
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
<<<<<<< HEAD:merce/app/grid/PartsExplorer.client.tsx
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
=======
    condition,
    availability,
    applianceType,
    selectedBrands,
    selectedPartTypes,
    qDebounced,
    page,
    perPage,
    searchMode,
  ]);

  // facets fetch (cached; global; fast) + estimated totals
>>>>>>> 4bcdcfcc (SSR PDP foundation + grid reapply + netted offers integration):app/grid/PartsExplorer.client.tsx
  useEffect(() => {
    if (skipFirstFacetsFetch.current) {
      skipFirstFacetsFetch.current = false;
      return;
    }

    const ctrl = new AbortController();

<<<<<<< HEAD:merce/app/grid/PartsExplorer.client.tsx
    async function run() {
=======
    async function runFacetsCache() {
      setMetaLoading(true);

      // Search mode forces global truth for cache view
      const effectiveAvailability: Availability = searchMode ? "all" : availability;
      const effectiveCondition: Condition = searchMode ? "both" : condition;

      const sp = new URLSearchParams();
      sp.set("availability", effectiveAvailability);
      sp.set("condition", effectiveCondition); // ✅ enable new vs offers segmented facets
      sp.set("facet_limit", "300");

      // ✅ NO TRAILING SLASH
      const facetsUrl = `${API_BASE}/api/parts/facets?${sp.toString()}`;

      try {
        const res = await fetch(facetsUrl, {
          method: "GET",
          signal: ctrl.signal,
          headers: { accept: "application/json" },
          cache: "no-store",
        });

        const json = (await readJsonSafeClient(res)) as any;

        if (!res.ok || json?.__non_json || json?.__bad_json || !json?.ok) {
          setFacets({});
          setFacetsMeta(null);
          return;
        }

        setFacets({
          brands: Array.isArray(json.brands) ? json.brands : [],
          parts: Array.isArray(json.parts) ? json.parts : [],
          appliances: Array.isArray(json.appliances) ? json.appliances : [],
        });

        setFacetsMeta((json.meta as any) || null);
      } catch (e: any) {
        if (e?.name === "AbortError") return;
        setFacets({});
        setFacetsMeta(null);
      } finally {
        setMetaLoading(false);
      }
    }

    runFacetsCache();
    return () => ctrl.abort();
  }, [availability, condition, searchMode]);

  // exact search total_count (only in search mode)
  useEffect(() => {
    if (!searchMode) {
      // non-search mode uses estimated totals from cache
      setTotalCount(null);
      return;
    }

    if (skipFirstSearchTotalFetch.current) {
      skipFirstSearchTotalFetch.current = false;
      return;
    }

    const ctrl = new AbortController();

    async function runSearchTotal() {
      const sp = new URLSearchParams();
      sp.set("meta_only", "1");
      sp.set("total", "1");
      sp.set("condition", "both");
      sp.set("availability", "all");
      if (qDebounced) sp.set("q", qDebounced);

      const url = `${API_BASE}/api/grid?${sp.toString()}`;

      try {
        const res = await fetch(url, {
          method: "GET",
          signal: ctrl.signal,
          headers: { accept: "application/json" },
          cache: "no-store",
        });

        const json = (await readJsonSafeClient(res)) as any;

        if (!res.ok || json?.__non_json || json?.__bad_json || !json?.ok) {
          setTotalCount(null);
          return;
        }

        setTotalCount(typeof json.total_count === "number" ? json.total_count : null);
      } catch (e: any) {
        if (e?.name === "AbortError") return;
        setTotalCount(null);
      }
    }

    runSearchTotal();
    return () => ctrl.abort();
  }, [qDebounced, searchMode]);

  // items fetch
  useEffect(() => {
    if (skipFirstItemsFetch.current) {
      skipFirstItemsFetch.current = false;
      return;
    }

    const ctrl = new AbortController();

    async function runItems() {
>>>>>>> 4bcdcfcc (SSR PDP foundation + grid reapply + netted offers integration):app/grid/PartsExplorer.client.tsx
      setLoading(true);
      setErr(null);

      const sp = new URLSearchParams();
<<<<<<< HEAD:merce/app/grid/PartsExplorer.client.tsx
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
=======

      // ✅ FIX: always send availability to /api/grid (even when "all")
      sp.set("condition", searchMode ? "both" : condition);
      sp.set("availability", searchMode ? "all" : availability);

      if (qDebounced) sp.set("q", qDebounced);

      if (!searchMode) {
        if (applianceType) sp.set("appliance_type", applianceType);
        for (const b of selectedBrands) sp.append("brands", b);
        for (const pt of selectedPartTypes) sp.append("part_types", pt);
      }

      sp.set("page", String(page));
      sp.set("per_page", String(perPage));
      sp.set("sort", DEFAULT_SORT);

      // ✅ NO TRAILING SLASH
      const itemsUrl = `${API_BASE}/api/grid?${sp.toString()}`;
>>>>>>> 4bcdcfcc (SSR PDP foundation + grid reapply + netted offers integration):app/grid/PartsExplorer.client.tsx

      try {
        const res = await fetch(url, {
          method: "GET",
          signal: ctrl.signal,
          headers: { "accept": "application/json" },
          cache: "no-store",
        });

        const json = (await readJsonSafeClient(res)) as any;

        if (!res.ok || json?.__non_json || json?.__bad_json || !json?.ok) {
          const msg =
            json?.error ||
            (json?.__non_json
              ? `Non-JSON response (HTTP ${json?.status ?? res.status})`
              : `HTTP ${res.status}`);
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
<<<<<<< HEAD:merce/app/grid/PartsExplorer.client.tsx
    dataset,
    qDebounced,
    sort,
    inStockOnly,
=======
    condition,
    availability,
    qDebounced,
>>>>>>> 4bcdcfcc (SSR PDP foundation + grid reapply + netted offers integration):app/grid/PartsExplorer.client.tsx
    applianceType,
    selectedBrands,
    selectedPartTypes,
    page,
    perPage,
<<<<<<< HEAD:merce/app/grid/PartsExplorer.client.tsx
=======
    searchMode,
>>>>>>> 4bcdcfcc (SSR PDP foundation + grid reapply + netted offers integration):app/grid/PartsExplorer.client.tsx
  ]);

  // ✅ facet key compat shims (API may return part_types / appliance_types)
  const brandFacet: FacetRow[] = (facets as any)?.brands || [];
  const partFacet: FacetRow[] = (facets as any)?.parts || (facets as any)?.part_types || [];
  const applianceFacet: FacetRow[] = (facets as any)?.appliances || (facets as any)?.appliance_types || [];

  function toggleInList(list: string[], v: string) {
    const n = normalize(v);
    if (!n) return list;
    const has = list.some((x) => normalize(x) === n);
    return has ? list.filter((x) => normalize(x) !== n) : [...list, v];
  }

  function resetToFirstPage() {
    if (page !== 1) setPage(1);
  }

  // estimated totals from cache (non-search mode)
  const estimatedTotal =
    typeof facetsMeta?.estimated_total === "number" ? facetsMeta!.estimated_total : null;

  return (
    <div className="w-full px-6 py-6">
      {/* Header row */}
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-2">
          <div className="text-[13px] font-semibold text-gray-700">
<<<<<<< HEAD:merce/app/grid/PartsExplorer.client.tsx
            {dataset === "parts" ? "New Parts" : "Refurb Offers"}
            {dataset === "offers" && typeof pageInventoryTotal === "number" ? (
              <span className="ml-2 text-gray-500 font-normal">
                (page inventory total: {fmtCount(pageInventoryTotal)})
              </span>
=======
            Models and Parts Results{" "}
            {searchMode ? (
              typeof totalCount === "number" ? (
                <span className="font-normal text-gray-500">
                  (showing {fmtCount(items.length)} of {fmtCount(totalCount)})
                </span>
              ) : (
                <span className="font-normal text-gray-500">(counting…)</span>
              )
            ) : typeof estimatedTotal === "number" ? (
              <span className="font-normal text-gray-500">
                (showing {fmtCount(items.length)} of ~{fmtCount(estimatedTotal)})
              </span>
            ) : metaLoading ? (
              <span className="font-normal text-gray-500">(counting…)</span>
            ) : null}
            {(condition === "refurb" || condition === "both") && typeof pageInventoryTotal === "number" ? (
              <span className="ml-2 text-gray-500 font-normal">
                (page refurb qty total: {fmtCount(pageInventoryTotal)})
              </span>
>>>>>>> 4bcdcfcc (SSR PDP foundation + grid reapply + netted offers integration):app/grid/PartsExplorer.client.tsx
            ) : null}
          </div>

          <div className="flex flex-col md:flex-row gap-2 md:items-center">
<<<<<<< HEAD:merce/app/grid/PartsExplorer.client.tsx
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
=======
            <input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
              placeholder="Search Part # (MPN) or Model #…"
              inputMode="search"
              autoCapitalize="none"
              autoCorrect="off"
              className="w-full md:w-[520px] border border-gray-300 rounded px-3 py-2 text-[13px] text-black"
            />
            {searchMode && (
              <button
                type="button"
                className="px-3 py-2 rounded border border-gray-300 text-[12px] font-semibold text-gray-800 hover:bg-gray-50"
                onClick={() => {
                  setQ("");
                  setPage(1);
                }}
              >
                Clear search
              </button>
            )}
>>>>>>> 4bcdcfcc (SSR PDP foundation + grid reapply + netted offers integration):app/grid/PartsExplorer.client.tsx
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

<<<<<<< HEAD:merce/app/grid/PartsExplorer.client.tsx
      {/* Body */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">
        {/* Sidebar */}
        <aside className="border border-gray-200 rounded-lg bg-white p-4 h-fit">
          <div className="text-[13px] font-bold text-gray-800 mb-3">Filters</div>

          {/* Appliance type (single-select) */}
=======
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6 items-start">
        <aside
          ref={asideRef}
          className={`border border-gray-200 rounded-lg bg-white p-4 ${filtersDisabled ? "opacity-60" : ""}`}
        >
          {/* ✅ RESET MOVED TO TOP */}
          <div className="flex items-center justify-between mb-3">
            <div className="text-[13px] font-bold text-gray-800">Filters</div>
            <button
              className="px-3 py-1.5 rounded bg-gray-100 border border-gray-200 text-[12px] font-semibold text-gray-800 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={filtersDisabled}
              onClick={doReset}
              title={filtersDisabled ? "Clear search to re-enable filters" : "Reset all filters"}
            >
              Reset
            </button>
          </div>

          {filtersDisabled && (
            <div className="mb-3 rounded border border-amber-200 bg-amber-50 p-2 text-[12px] text-amber-900">
              Search overrides filters. Clear search to re-enable filtering.
            </div>
          )}

          <div className="mb-4">
            <div className="text-[12px] font-semibold text-gray-700 mb-2">Item type</div>
            {[
              { value: "both" as const, label: "All (New + Refurbished)" },
              { value: "new" as const, label: "New only" },
              { value: "refurb" as const, label: "Refurbished only" },
            ].map((opt) => {
              const checked = condition === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  disabled={filtersDisabled}
                  className="w-full flex items-center gap-2 py-1 text-[12px] text-gray-800 hover:bg-gray-50 disabled:hover:bg-transparent rounded px-1 disabled:cursor-not-allowed"
                  onClick={() => {
                    if (filtersDisabled) return;
                    setCondition(opt.value);
                    setPage(1);
                  }}
                  aria-pressed={checked}
                >
                  <RadioDot checked={checked} />
                  <span>{opt.label}</span>
                </button>
              );
            })}

            <div className="mt-3">
              <div className="text-[12px] font-semibold text-gray-700 mb-2">Availability</div>
              {[
                { value: "in_stock" as const, label: "In stock" },
                { value: "orderable" as const, label: "Orderable or In Stock" },
                { value: "all" as const, label: "All (including no longer available parts)" },
              ].map((opt) => {
                const checked = availability === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    disabled={filtersDisabled}
                    className="w-full flex items-center gap-2 py-1 text-[12px] text-gray-800 hover:bg-gray-50 disabled:hover:bg-transparent rounded px-1 disabled:cursor-not-allowed"
                    onClick={() => {
                      if (filtersDisabled) return;
                      setAvailability(opt.value);
                      setPage(1);
                    }}
                    aria-pressed={checked}
                  >
                    <RadioDot checked={checked} />
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

>>>>>>> 4bcdcfcc (SSR PDP foundation + grid reapply + netted offers integration):app/grid/PartsExplorer.client.tsx
          <div className="mb-4">
            <div className="text-[12px] font-semibold text-gray-700 mb-2">Appliance Type</div>
            <select
              value={applianceType}
              disabled={filtersDisabled}
              onChange={(e) => {
                setApplianceType(e.target.value);
                setPage(1);
              }}
              className="w-full border border-gray-300 rounded px-2 py-2 text-[13px] text-black disabled:cursor-not-allowed"
            >
              <option value="">All</option>
              {applianceFacet.map((x) => (
                <option key={x.value} value={x.value}>
                  {facetLabel("appliance", x.value)} ({fmtCount(x.count)})
                </option>
              ))}
            </select>
<<<<<<< HEAD:merce/app/grid/PartsExplorer.client.tsx
=======

            {applianceFacet.length > 10 && (
              <button
                type="button"
                disabled={filtersDisabled}
                className="mt-2 text-[12px] text-blue-700 underline disabled:cursor-not-allowed disabled:text-gray-400"
                onClick={() => setShowAllAppliances((v) => !v)}
              >
                {showAllAppliances ? "Show top 10" : "Show all"}
              </button>
            )}
>>>>>>> 4bcdcfcc (SSR PDP foundation + grid reapply + netted offers integration):app/grid/PartsExplorer.client.tsx
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
                          disabled={filtersDisabled}
                          onChange={() => {
                            if (filtersDisabled) return;
                            setSelectedBrands((prev) => toggleInList(prev, x.value));
                            setPage(1);
                          }}
                        />
                        {facetLabel("brand", x.value)}
                      </span>
                      <span className="text-gray-500">{fmtCount(x.count)}</span>
                    </label>
                  );
                })
              )}
            </div>
<<<<<<< HEAD:merce/app/grid/PartsExplorer.client.tsx
=======

            {brandFacet.length > 10 && (
              <button
                type="button"
                disabled={filtersDisabled}
                className="mt-2 text-[12px] text-blue-700 underline disabled:cursor-not-allowed disabled:text-gray-400"
                onClick={() => setShowAllBrands((v) => !v)}
              >
                {showAllBrands ? "Show top 10" : "Show all"}
              </button>
            )}
>>>>>>> 4bcdcfcc (SSR PDP foundation + grid reapply + netted offers integration):app/grid/PartsExplorer.client.tsx
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
                          disabled={filtersDisabled}
                          onChange={() => {
                            if (filtersDisabled) return;
                            setSelectedPartTypes((prev) => toggleInList(prev, x.value));
                            setPage(1);
                          }}
                        />
                        {facetLabel("part", x.value)}
                      </span>
                      <span className="text-gray-500">{fmtCount(x.count)}</span>
                    </label>
                  );
                })
              )}
            </div>
<<<<<<< HEAD:merce/app/grid/PartsExplorer.client.tsx
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
=======

            {partFacet.length > 10 && (
              <button
                type="button"
                disabled={filtersDisabled}
                className="mt-2 text-[12px] text-blue-700 underline disabled:cursor-not-allowed disabled:text-gray-400"
                onClick={() => setShowAllParts((v) => !v)}
              >
                {showAllParts ? "Show top 10" : "Show all"}
              </button>
            )}
          </div>
>>>>>>> 4bcdcfcc (SSR PDP foundation + grid reapply + netted offers integration):app/grid/PartsExplorer.client.tsx
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

<<<<<<< HEAD:merce/app/grid/PartsExplorer.client.tsx
          {!loading && !err && items.length === 0 && (
            <div className="text-[13px] text-gray-700">No results.</div>
=======
          {!loading && !err && items.length === 0 && <div className="text-[13px] text-gray-700">No results.</div>}

          {items.length > 0 && (
            <div
              className="border border-gray-200 rounded-lg bg-white flex flex-col min-h-0"
              style={isLg && asideHeight ? { height: asideHeight } : undefined}
            >
              <div className="flex-1 min-h-0 overflow-y-auto p-4">
                <div className="flex flex-col gap-3">
                  {items.map((row, idx) => {
                    const hasModel =
                      !!row?.model_number && !row?.mpn && !row?.mpn_display && !row?.mpn_normalized;
                    return hasModel ? (
                      <ModelRow key={row?.rid ?? `model-${row?.model_number ?? idx}`} m={row} />
                    ) : (
                      <PartRow key={row?.rid ?? `${row?.mpn ?? "row"}-${idx}`} p={row} addToCart={addToCart} />
                    );
                  })}
                </div>
              </div>

              <div className="border-t border-gray-200 bg-white p-3 flex items-center justify-center gap-2">
                <button
                  className="px-3 py-2 rounded border border-gray-300 text-[12px] font-semibold disabled:opacity-50"
                  disabled={page <= 1 || loading}
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                >
                  Prev
                </button>
                <div className="text-[12px] text-gray-700 w-[80px] text-center">Page {page}</div>
                <button
                  className="px-3 py-2 rounded border border-gray-300 text-[12px] font-semibold disabled:opacity-50"
                  disabled={!hasMore || loading}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </button>
              </div>
            </div>
>>>>>>> 4bcdcfcc (SSR PDP foundation + grid reapply + netted offers integration):app/grid/PartsExplorer.client.tsx
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