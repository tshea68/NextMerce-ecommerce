"use client";

/**
 * NOTE:
 * This file is your PartsExplorer.jsx ported to Next.js App Router.
 * We are NOT rewriting the UI — only swapping routing primitives + API_BASE.
 */

import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

// TEMP: comment SEO until we port it to Next metadata cleanly
// import SEO from "../seo/SEO";

import { makePartTitle } from "@/lib/PartsTitle";
import { useCart } from "@/context/CartContext";
import PartImage from "@/components/PartImage";

/* ================================
   CONFIG
   ================================ */
// IMPORTANT: use relative URLs so this runs in Next and hits your route handlers
const API_BASE = "";
const BG_BLUE = "#001f3e";
const SHOP_BAR = "#efcc30";
const DEFAULT_PER_PAGE = 30;
const MODEL_SIDEBAR_LIMIT = 20;
const PART_SIDEBAR_LIMIT = 20;

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

const isBaseCase = ({
  invMode,
  model,
  selectedBrands,
  selectedPartTypes,
  applianceType,
}: any) =>
  invMode === "all" &&
  !normalize(model) &&
  (!selectedBrands || selectedBrands.length === 0) &&
  (!selectedPartTypes || selectedPartTypes.length === 0) &&
  !applianceType;

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
    makePartTitle(p, mpn) ||
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
export default function PartsExplorer() {
  const { addToCart } = useCart();
  const router = useRouter();

  const pathname = usePathname();
  const searchParams = useSearchParams();

  const location = useMemo(() => {
    const s = searchParams?.toString?.() ?? "";
    return {
      pathname,
      search: s ? `?${s}` : "",
      hash: typeof window !== "undefined" ? window.location.hash : "",
    };
  }, [pathname, searchParams]);

  // --- YOUR ORIGINAL STATE/LOGIC BELOW ---
  // Paste the rest of your existing file here unchanged,
  // EXCEPT:
  // - replace navigate(...) with router.push(...)
  // - replace <Link to=...> with <Link href=...>
  // - change API_BASE usage so buildGridUrl points to /api/grid (relative)

  return (
    <div className="p-6 text-white">
      <div className="font-semibold">PartsExplorer port stub</div>
      <div className="opacity-80 text-sm">
        Paste the remainder of your component below this return.
      </div>
    </div>
  );
}
