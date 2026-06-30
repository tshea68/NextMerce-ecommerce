"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { makePartTitle } from "@/lib/PartsTitle";
import PartImage from "@/components/PartImage";
import { trackAddToCart } from "@/lib/ga4";

function priceFmt(n: any) {
  const x =
    typeof n === "number" ? n : Number(String(n ?? "").replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(x)) return "—";
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: "USD",
    }).format(x);
  } catch {
    return `$${x.toFixed(2)}`;
  }
}

function fmtCount(num: any) {
  const n = Number(num);
  return Number.isFinite(n)
    ? n.toLocaleString(undefined, { maximumFractionDigits: 0 })
    : String(num || "");
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

function getNewPartAvailability(item: any): {
  label: string;
  qty: number | null;
  tone: "in_stock" | "special_order" | "nla";
} {
  const canon = String(item?.stock_status_canon ?? "").trim().toLowerCase();
  const rank = Number(item?.availability_rank ?? NaN);
  const qtyRaw = Number(item?.inventory_total ?? NaN);
  const qty = Number.isFinite(qtyRaw) && qtyRaw > 0 ? qtyRaw : null;

  const isNla =
    rank === 9 ||
    canon.includes("nla") ||
    canon.includes("no longer available") ||
    canon.includes("discontinued") ||
    canon.includes("obsolete") ||
    canon.includes("unavailable");

  if (isNla) {
    return { label: "No Longer Available", qty: null, tone: "nla" };
  }

  if (qty) {
    return {
      label: `In Stock · ${fmtCount(qty)} Available`,
      qty,
      tone: "in_stock",
    };
  }

  return {
    label: "Usually ships within 30 days",
    qty: null,
    tone: "special_order",
  };
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
    return dedupePreserveOrder(
      value.map((x) => String(x ?? "").trim()).filter(Boolean)
    );
  }

  const s = String(value).trim();
  if (!s) return [];

  try {
    const parsed = JSON.parse(s);
    if (Array.isArray(parsed)) {
      return dedupePreserveOrder(
        parsed.map((x) => String(x ?? "").trim()).filter(Boolean)
      );
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

function asStatusForBadge(
  item: any,
  isOfferLike: boolean
): "in_stock" | "special_order" | "discontinued" | "unavailable" | "unknown" {
  if (isOfferLike) return "unknown";

  const qty = Number(item?.inventory_total ?? NaN);
  const hasQty = Number.isFinite(qty) && qty > 0;

  if (item?.is_nla === true || isNlaishStatus(item?.stock_status_canon) || Number(item?.availability_rank) === 9) {
    return "discontinued";
  }

  if (hasQty) return "in_stock";

  return "special_order";
}

type ProductCardProps = {
  item: any;
};

type CartItemInput = {
  mpn: string;
  name: string;
  price: number;
  qty: number;
  image?: string;
  condition?: string;
  is_refurb: boolean;
};

export default function ProductCard({ item }: ProductCardProps) {
  const newPartAvailability = !item?.is_refurb
    ? getNewPartAvailability(item)
    : null;

  const { addToCart } = useCart() as {
    addToCart: (item: CartItemInput) => void;
  };

  const router = useRouter();
  const [addedToCart, setAddedToCart] = useState(false);
  const [busy, setBusy] = useState(false);

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

  const isNla =
    item?.is_nla === true || (!isOfferLike && isNlaishStatus(item?.stock_status_canon));

  const replacedBy =
    (item?.replaced_by && String(item.replaced_by).trim()) ||
    (item?.replacement_mpn && String(item.replacement_mpn).trim()) ||
    "";

  const replaces = parseMaybeArray(item?.replaces_previous_parts);
  const compatibleModels = parseMaybeArray(item?.compatible_models);

  const compatibleBrands = useMemo(() => {
    return parseMaybeArray(item?.compatible_brands)
      .map(formatBrandLabel)
      .filter(Boolean);
  }, [item?.compatible_brands]);

  const headline = useMemo(() => {
    return makePartTitle(item, mpn);
  }, [item, mpn]);

  const priceNum = useMemo(() => {
    const raw = item?.price_value ?? item?.price;
    if (typeof raw === "number") return raw;
    const n = Number(String(raw ?? "").replace(/[^0-9.]/g, ""));
    return Number.isFinite(n) ? n : 0;
  }, [item]);

  const img = item?.image_url || item?.image || null;

  const detailHref = mpn
    ? isOfferLike
      ? `/offers/${encodeURIComponent(mpn)}`
      : `/parts/${encodeURIComponent(mpn)}`
    : "#";

  const replacementHref = replacedBy ? `/parts/${encodeURIComponent(replacedBy)}` : "";

  const [qty, setQty] = useState(1);

  function addCardItemToCart() {
    if (!mpn || isNla || priceNum <= 0) return false;

    const cartQty = isOfferLike ? 1 : qty;

    addToCart({
      mpn,
      name: headline,
      price: priceNum,
      qty: cartQty,
      image: img || undefined,
      condition: isOfferLike ? "refurbished" : "new",
      is_refurb: !!isOfferLike,
    });

    trackAddToCart(
      {
        ...item,
        mpn,
        title: headline,
        name: headline,
        price: priceNum,
        image_url: img || undefined,
        condition: isOfferLike ? "refurbished" : "new",
        is_refurb: !!isOfferLike,
      },
      cartQty
    );

    return true;
  }

  function handleAddToCart() {
    if (busy) return;

    setBusy(true);

    try {
      const ok = addCardItemToCart();
      if (ok) {
        setAddedToCart(true);
        window.setTimeout(() => setAddedToCart(false), 1400);
      }
    } finally {
      setBusy(false);
    }
  }

  function handleBuyNow() {
    if (busy) return;

    setBusy(true);

    try {
      const ok = addCardItemToCart();
      if (ok) router.push("/checkout");
    } finally {
      setBusy(false);
    }
  }

  const cardBg = isNla
    ? "bg-amber-50 border-orange-300"
    : isOfferLike
      ? "bg-slate-50 border-orange-200"
      : "bg-white border-orange-200";

  const badgeProps = useMemo(() => {
    if (isOfferLike) {
      return {
        mode: "offer" as const,
        refurbSummary: {
          price: item?.price ?? null,
          totalQty: Number.isFinite(Number(item?.inventory_total))
            ? Number(item.inventory_total)
            : null,
          totalOffers:
            Number.isFinite(Number(item?.inventory_total))
              ? 1
              : Number.isFinite(Number(item?.offer_count))
              ? Number(item.offer_count)
              : null,
          url: mpn ? `/offers/${encodeURIComponent(mpn)}` : null,
        },
        newSummary: {
          price: item?.new_part_price ?? null,
          status: item?.has_new_part === true ? "in_stock" : "unknown",
          qty: null,
          url: mpn ? `/parts/${encodeURIComponent(mpn)}` : null,
        },
        savings: {
          amount: item?.savings_amount ?? null,
          percent: item?.savings_percent ?? null,
        },
      };
    }

    return {
      mode: "part" as const,
      refurbSummary: {
        price: item?.best_refurb_price ?? null,
        totalQty:
          Number.isFinite(Number(item?.refurb_count))
            ? Number(item.refurb_count)
            : Number.isFinite(Number(item?.alternatives_count))
            ? Number(item.alternatives_count)
            : null,
        totalOffers:
          Number.isFinite(Number(item?.refurb_count))
            ? Number(item.refurb_count)
            : Number.isFinite(Number(item?.alternatives_count))
            ? Number(item.alternatives_count)
            : null,
        url: mpn ? `/offers/${encodeURIComponent(mpn)}` : null,
      },
      newSummary: {
        price: item?.price ?? null,
        status: asStatusForBadge(item, isOfferLike),
        qty: getNewPartAvailability(item).qty,
        url: mpn ? `/parts/${encodeURIComponent(mpn)}` : null,
      },
      savings: {
        amount: item?.savings_amount ?? null,
        percent: item?.savings_percent ?? null,
      },
    };
  }, [isOfferLike, item, mpn]);

  return (
    <div className={`overflow-hidden rounded-xl border shadow-sm transition-shadow hover:shadow-md ${cardBg}`}>
      <div className="grid grid-cols-[110px_minmax(0,1fr)] gap-4 px-4 py-4 lg:flex lg:flex-row">
        <div
          className="relative col-start-1 row-start-1 flex flex-col items-center lg:flex-shrink-0"
          style={{ width: "110px" }}
        >
          <div className="relative flex items-center justify-center overflow-visible">
            <PartImage
              enableFullscreenPreview
              imageUrl={img}
              alt={headline}
              disableHoverPreview
              className="w-[100px] h-[100px] border border-orange-200 rounded-lg bg-white flex items-center justify-center"
            />
          </div>

          <div className="mt-2 flex w-full justify-center text-center">
            <span
              className={`inline-flex rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wide ${
                isOfferLike
                  ? "bg-orange-100 text-orange-800"
                  : "bg-[#06254a] text-white"
              }`}
            >
              {isOfferLike ? "OEM Refurbished" : "OEM New"}
            </span>
          </div>
        </div>

        <div className="col-span-2 row-start-2 flex-1 min-w-0 flex flex-col gap-2 text-black lg:col-auto lg:row-auto">
          <div className="flex flex-wrap items-start gap-x-2 gap-y-1">
            <Link
              href={detailHref}
              className="text-[15px] font-semibold text-[#06254a] leading-snug hover:text-orange-700 hover:underline focus:underline focus:outline-none cursor-pointer"
              aria-label={`View ${headline}`}
            >
              {headline}{" "}
              <span className="text-[#06254a]">
                [{isOfferLike ? "Refurbished" : "New"}]
              </span>
            </Link>
          </div>

          {compatibleBrands.length > 0 && (
            <div className="text-[15px] font-semibold text-slate-900 leading-snug break-words">
              Compatible brands: {compatibleBrands.join(", ")}
            </div>
          )}

          {replaces.length > 0 && (
            <div className="text-[12px] text-slate-700 leading-snug break-words">
              <span className="font-semibold text-slate-900">Replaces:</span>{" "}
              {replaces.join(", ")}
            </div>
          )}

          {replacedBy && (
            <div className="text-[12px] text-slate-700 leading-snug break-words">
              <span className="font-semibold text-slate-900">Replaced by:</span>{" "}
              <Link href={replacementHref} className="text-[#06254a] underline font-semibold hover:text-orange-700">
                {replacedBy}
              </Link>
            </div>
          )}

          {!isNla && (
            <div className="mt-1 rounded-lg border border-orange-200 bg-white/80 p-2 text-[12px] leading-snug text-slate-700">
              <div className="font-semibold text-emerald-700">
                Inventory:{" "}
                {isOfferLike
                  ? Number.isFinite(Number(item?.inventory_total)) && Number(item?.inventory_total) > 0
                    ? `${fmtCount(item.inventory_total)} available`
                    : "Special order · generally ships within 30 days"
                  : newPartAvailability?.qty
                    ? `${fmtCount(newPartAvailability.qty)} available`
                    : "Special order · generally ships within 30 days"}
              </div>

              <div className="mt-1 font-bold text-slate-950">
                {isOfferLike ? (
                  <>
                    New OEM alternative:{" "}
                    {item?.has_new_part === true ? "available" : "not currently available"}
                  </>
                ) : (
                  <>
                    Refurbished alternative:{" "}
                    {Number.isFinite(Number(item?.refurb_count)) && Number(item?.refurb_count) > 0
                      ? `${fmtCount(item.refurb_count)} available`
                      : Number.isFinite(Number(item?.alternatives_count)) && Number(item?.alternatives_count) > 0
                        ? `${fmtCount(item.alternatives_count)} available`
                        : "not currently available"}
                  </>
                )}
              </div>
            </div>
          )}

          {compatibleModels.length > 0 && (
            <div className="rounded border border-slate-200 bg-slate-50 p-2">
              <div className="text-[12px] font-semibold text-slate-900 mb-1">
                Compatible models ({fmtCount(compatibleModels.length)})
              </div>
              <div className="max-h-[84px] overflow-y-auto pr-1">
                <div className="flex flex-wrap gap-1">
                  {compatibleModels.map((model) => (
                    <span
                      key={model}
                      className="inline-flex rounded border border-slate-200 bg-white px-2 py-1 text-[11px] text-slate-700"
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
              We recognize this as a valid part number, but it is not currently available
              for purchase.
            </div>
          )}
        </div>

        <div className="col-start-2 row-start-1 flex w-full min-w-0 flex-col items-center justify-start gap-2 text-center lg:col-auto lg:row-auto lg:max-w-[220px]">
          <div
            className={`w-full text-center text-2xl font-black leading-none lg:text-lg lg:font-bold ${
              isNla ? "text-amber-800" : "text-green-700"
            }`}
          >
            {isNla ? "—" : priceFmt(priceNum)}
          </div>

          <div className="flex w-full flex-col gap-2 lg:flex-row">
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
              type="button"
              className={`${
                isNla
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-[#06254a] hover:bg-[#031a35]"
              } w-full text-white text-[13px] font-semibold rounded px-3 py-2.5 disabled:opacity-60`}
              onClick={handleAddToCart}
              disabled={isNla || busy}
              title={isNla ? "This part is not available for purchase" : "Add to Cart"}
            >
              {busy ? "Adding..." : addedToCart ? "Added ✓" : "Add to Cart"}
            </button>
          </div>

          {!isNla && (
            <button
              type="button"
              className="w-full rounded border border-[#06254a] bg-white px-3 py-2.5 text-[13px] font-semibold text-[#06254a] hover:bg-slate-50 disabled:opacity-60"
              onClick={handleBuyNow}
              disabled={busy}
              title="Add this part and go straight to checkout"
            >
              Buy Now
            </button>
          )}
</div>
      </div>
    </div>
  );
}