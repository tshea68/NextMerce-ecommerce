"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import PartImage from "@/components/PartImage";

function priceFmt(n: any) {
  const x = typeof n === "number" ? n : Number(String(n ?? "").replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(x)) return "—";
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(x);
  } catch {
    return `$${x.toFixed(2)}`;
  }
}

function fmtCount(num: any) {
  const n = Number(num);
  return Number.isFinite(n) ? n.toLocaleString(undefined, { maximumFractionDigits: 0 }) : String(num || "");
}

function normalize(s: any) {
  return String(s ?? "").toLowerCase().trim();
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

function titleCaseWords(s: string) {
  return String(s || "")
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => {
      if (w.length <= 2) return w.toUpperCase();
      return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    })
    .join(" ");
}

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
  maytag: "Maytag",
  kenmore: "Kenmore",
  thermador: "Thermador",
  gaggenau: "Gaggenau",
  scotsmanice: "Scotsman Ice",
  "scotsman-ice": "Scotsman Ice",
  scotsman: "Scotsman",
  supco: "Supco",
};

function formatBrandLabel(raw: string) {
  const s = String(raw || "").trim();
  if (!s) return "";
  const key = s.toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, "");
  if (BRAND_LABELS[key]) return BRAND_LABELS[key];

  const spaced = s.replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
  return titleCaseWords(spaced);
}

function dedupePreserveOrder(values: string[]) {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const v of values) {
    const key = normalize(v);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(v.trim());
  }
  return out;
}

function parseMaybeArray(value: any): string[] {
  if (!value) return [];

  if (Array.isArray(value)) {
    return dedupePreserveOrder(value.map((x) => String(x ?? "").trim()).filter(Boolean));
  }

  const s = String(value).trim();
  if (!s) return [];

  try {
    const parsed = JSON.parse(s);
    if (Array.isArray(parsed)) {
      return dedupePreserveOrder(parsed.map((x) => String(x ?? "").trim()).filter(Boolean));
    }
  } catch {}

  return dedupePreserveOrder(
    s
      .split(/[|,]/)
      .map((x) => x.trim())
      .filter(Boolean)
  );
}

function bestPartType(p: any) {
  return (
    String(p?.canonical_part_type ?? "").trim() ||
    String(p?.specific_part_type ?? "").trim() ||
    String(p?.part_type ?? "").trim() ||
    "Part"
  );
}

function bestApplianceType(p: any) {
  return String(p?.appliance_type ?? "").trim();
}

function buildHeadline(p: any, mpn: string) {
  const brand = formatBrandLabel(String(p?.brand ?? "").trim());
  const partType = bestPartType(p);
  const applianceType = bestApplianceType(p);

  const parts = [brand, mpn, partType, applianceType].filter(Boolean);
  return parts.length ? parts.join(" • ") : "Part";
}

function alternativesBadgeText(p: any) {
  const count = Number(p?.alternatives_count ?? p?.refurb_count ?? 0);
  if (!Number.isFinite(count) || count <= 0) return "";
  return count === 1 ? "1 comparison option" : `${fmtCount(count)} comparison options`;
}

function availabilityBadgeText(item: any, isOfferLike: boolean, isNla: boolean) {
  if (isNla) return "No longer available";

  if (isOfferLike) {
    if (Number.isFinite(Number(item?.inventory_total))) {
      return `Qty: ${fmtCount(item.inventory_total)}`;
    }
    return "Refurbished";
  }

  const canon = String(item?.stock_status_canon ?? "").trim();
  if (canon) return canon.replace(/_/g, " ");

  const raw = String(item?.stock_status ?? "").trim();
  if (raw) return raw;

  return "";
}

type ProductCardProps = {
  item: any;
};

export default function ProductCard({ item }: ProductCardProps) {
  const router = useRouter();
  const { addToCart } = useCart();

  const mpn =
    (item?.mpn && String(item.mpn).trim()) ||
    (item?.mpn_display && String(item.mpn_display).trim()) ||
    (item?.mpn_normalized && String(item.mpn_normalized).trim()) ||
    "";

  const isOfferLike =
    item?.is_refurb === true ||
    normalize(item?.source) === "offers" ||
    normalize(item?.source).includes("refurb") ||
    normalize(item?.offer_type).includes("refurb") ||
    normalize(item?.condition).includes("used");

  const isNla = item?.is_nla === true || (!isOfferLike && isNlaishStatus(item?.stock_status_canon));

  const replacedBy =
    (item?.replaced_by && String(item.replaced_by).trim()) ||
    (item?.replacement_mpn && String(item.replacement_mpn).trim()) ||
    "";

  const replaces = parseMaybeArray(item?.replaces_previous_parts);
  const compatibleModels = parseMaybeArray(item?.compatible_models);

  const compatibleBrands = useMemo(() => {
    return parseMaybeArray(item?.compatible_brands).map(formatBrandLabel).filter(Boolean);
  }, [item?.compatible_brands]);

  const headline = buildHeadline(item, mpn);
  const comparisonBadge = alternativesBadgeText(item);
  const availabilityBadge = availabilityBadgeText(item, isOfferLike, isNla);

  const priceNum =
    typeof item?.price === "number" ? item.price : Number(String(item?.price ?? "").replace(/[^0-9.]/g, ""));

  const img = item?.image_url || null;

  const detailHref = (() => {
    if (!mpn) return "#";
    if (isOfferLike) return `/offers/${encodeURIComponent(mpn)}`;
    return `/parts/${encodeURIComponent(mpn)}`;
  })();

  const replacementHref = replacedBy ? `/parts/${encodeURIComponent(replacedBy)}` : "";

  const [qty, setQty] = useState(1);

  function handleAddToCart() {
    if (!mpn || isNla) return;

    const payload = {
      mpn,
      qty: isOfferLike ? 1 : qty,
      quantity: isOfferLike ? 1 : qty,
      is_refurb: !!isOfferLike,
      name: headline,
      title: headline,
      price: priceNum,
      image_url: img,
      image: img,
    };

    try {
      addToCart?.(payload);
    } catch {}
  }

  function goToDetail(e: any) {
    e?.preventDefault?.();
    if (detailHref && detailHref !== "#") router.push(detailHref);
  }

  const cardBg = isNla
    ? "bg-amber-50 border-amber-300"
    : isOfferLike
      ? "bg-blue-50 border-blue-300"
      : "bg-white border-gray-200";

  const availabilityBadgeClass = isNla
    ? "bg-amber-700 text-white"
    : isOfferLike
      ? "bg-blue-700 text-white"
      : "bg-green-600 text-white";

  return (
    <div className={`border rounded-md shadow-sm px-4 py-3 flex flex-col lg:flex-row gap-4 ${cardBg}`}>
      <div className="relative flex-shrink-0 flex flex-col items-center" style={{ width: "110px" }}>
        <div className="relative flex items-center justify-center overflow-visible">
          <PartImage
            imageUrl={img}
            alt={headline}
            disableHoverPreview
            className="w-[100px] h-[100px] border border-gray-200 rounded bg-white flex items-center justify-center"
          />
        </div>
      </div>

      <div className="flex-1 min-w-0 flex flex-col gap-2 text-black">
        <div className="flex flex-wrap items-start gap-x-2 gap-y-1">
          <a
            href={detailHref}
            onClick={goToDetail}
            className="text-[15px] font-semibold text-blue-700 leading-snug hover:text-blue-900 hover:underline focus:underline focus:outline-none cursor-pointer"
            aria-label={`View ${headline}`}
          >
            {headline}
          </a>
        </div>

        {compatibleBrands.length > 0 && (
          <div className="text-[15px] font-semibold text-gray-900 leading-snug break-words">
            Compatible brands: {compatibleBrands.join(", ")}
          </div>
        )}

        {(availabilityBadge || comparisonBadge) && (
          <div className="flex flex-wrap items-center gap-2">
            {availabilityBadge && (
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded leading-none ${availabilityBadgeClass}`}>
                {availabilityBadge}
              </span>
            )}

            {comparisonBadge && (
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 leading-none">
                {comparisonBadge}
              </span>
            )}
          </div>
        )}

        {replaces.length > 0 && (
          <div className="text-[12px] text-gray-700 leading-snug break-words">
            <span className="font-semibold text-gray-900">Replaces:</span> {replaces.join(", ")}
          </div>
        )}

        {replacedBy && (
          <div className="text-[12px] text-gray-700 leading-snug break-words">
            <span className="font-semibold text-gray-900">Replaced by:</span>{" "}
            <Link href={replacementHref} className="text-blue-700 underline font-semibold">
              {replacedBy}
            </Link>
          </div>
        )}

        {compatibleModels.length > 0 && (
          <div className="rounded border border-gray-200 bg-gray-50 p-2">
            <div className="text-[12px] font-semibold text-gray-900 mb-1">
              Compatible models ({fmtCount(compatibleModels.length)})
            </div>
            <div className="max-h-[84px] overflow-y-auto pr-1">
              <div className="flex flex-wrap gap-1">
                {compatibleModels.map((model) => (
                  <span
                    key={model}
                    className="inline-flex rounded border border-gray-200 bg-white px-2 py-1 text-[11px] text-gray-700"
                  >
                    {model}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {isNla && (
          <div className="text-[12px] text-amber-900 leading-snug">
            We recognize this as a valid part number, but it is not currently available for purchase.
          </div>
        )}
      </div>

      <div className="w-full max-w-[220px] flex-shrink-0 flex flex-col items-end text-right gap-2">
        <div className={`text-lg font-bold leading-none ${isNla ? "text-amber-800" : "text-green-700"}`}>
          {isNla ? "—" : priceFmt(priceNum)}
        </div>

        <div className="flex items-center w-full justify-end gap-2">
          {!isOfferLike && !isNla && (
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
            className={`${
              isNla
                ? "bg-gray-400 cursor-not-allowed"
                : isOfferLike
                  ? "bg-blue-600 hover:bg-blue-700"
                  : "bg-blue-700 hover:bg-blue-800"
            } text-white text-[12px] font-semibold rounded px-3 py-2`}
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