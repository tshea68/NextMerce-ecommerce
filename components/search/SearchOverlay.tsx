"use client";

import Link from "next/link";
import { Search, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import PartImage from "@/components/PartImage";
import { makePartTitle } from "@/lib/PartsTitle";

type AnyItem = Record<string, any>;

type Props = {
  open: boolean;
  onClose: () => void;
};

const API_BASE = (
  process.env.NEXT_PUBLIC_API_BASE || "https://api.appliancepartgeeks.com"
).replace(/\/+$/, "");

function priceFmt(n: any) {
  const x =
    typeof n === "number"
      ? n
      : Number(String(n ?? "").replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(x)) return "";
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: "USD",
    }).format(x);
  } catch {
    return `$${x.toFixed(2)}`;
  }
}

function norm(s: any) {
  return String(s ?? "").trim().toLowerCase();
}

function modelHref(item: AnyItem) {
  const model = item?.model_number || item?.model || item?.number || "";
  if (!model) return "#";
  return `/model?model=${encodeURIComponent(model)}`;
}

function itemHref(item: AnyItem) {
  const mpn =
    item?.mpn || item?.part_number || item?.manufacturer_part_number || "";
  if (!mpn) return "#";

  const isRefurb =
    item?.is_refurb === true ||
    String(item?.condition ?? "").toLowerCase() === "refurb" ||
    String(item?.source ?? item?.vendor ?? "")
      .toLowerCase()
      .includes("refurb") ||
    String(item?.source ?? item?.vendor ?? "")
      .toLowerCase()
      .includes("offer") ||
    String(item?.source ?? item?.vendor ?? "")
      .toLowerCase()
      .includes("ebay") ||
    String(item?.source ?? item?.vendor ?? "")
      .toLowerCase()
      .includes("a-z") ||
    item?.listing_id != null ||
    item?.best_offer_id != null;

  return isRefurb
    ? `/offers/${encodeURIComponent(mpn)}`
    : `/parts/${encodeURIComponent(mpn)}`;
}

function getBrandName(item: AnyItem) {
  return item?.brand || item?.brand_name || item?.manufacturer || "";
}

function getModelImageUrl(item: AnyItem) {
  return item?.model_image_url || item?.image_url || item?.image || "";
}

function modelPartsSummary(m: AnyItem) {
  const totalParts =
    m?.total_parts ?? m?.total_links ?? m?.all_known_parts ?? null;
  const pricedParts = m?.priced_parts ?? null;
  const refurbCount = m?.refurb_count ?? null;

  const bits: string[] = [];
  if (totalParts != null) bits.push(`${totalParts} parts`);
  if (pricedParts != null) bits.push(`${pricedParts} priced`);
  if (refurbCount != null) bits.push(`${refurbCount} refurb`);
  return bits.join(" • ");
}

function detectRefurb(item: AnyItem) {
  return (
    item?.is_refurb === true ||
    String(item?.condition ?? "").toLowerCase() === "refurb" ||
    String(item?.source ?? item?.vendor ?? "")
      .toLowerCase()
      .includes("refurb") ||
    String(item?.source ?? item?.vendor ?? "")
      .toLowerCase()
      .includes("offer") ||
    String(item?.source ?? item?.vendor ?? "")
      .toLowerCase()
      .includes("ebay") ||
    String(item?.source ?? item?.vendor ?? "")
      .toLowerCase()
      .includes("a-z") ||
    item?.listing_id != null ||
    item?.best_offer_id != null
  );
}

function partStatusLabel(item: AnyItem) {
  return detectRefurb(item) ? "Refurbished OEM" : "New OEM";
}

function rawMpn(item: AnyItem) {
  return (
    item?.mpn ||
    item?.mpn_canonical ||
    item?.part_number ||
    item?.manufacturer_part_number ||
    ""
  );
}

function normMpnKey(v: any) {
  return String(v ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function groupKey(item: AnyItem) {
  return (
    normMpnKey(item?.mpn_canonical_norm) ||
    normMpnKey(item?.mpn_norm) ||
    normMpnKey(item?.mpn_canonical) ||
    normMpnKey(rawMpn(item))
  );
}

function inventoryQty(item: AnyItem) {
  const raw =
    item?.inventory_total ??
    item?.total_quantity ??
    item?.quantity ??
    item?.qty ??
    null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

type PartOfferGroup = {
  key: string;
  part: AnyItem | null;
  offer: AnyItem | null;
  base: AnyItem;
};

function buildPartOfferGroups(refurbRows: AnyItem[], partRows: AnyItem[]) {
  const map = new Map<string, PartOfferGroup>();
  const order: string[] = [];

  function ensure(item: AnyItem) {
    const key = groupKey(item);
    if (!key) return null;

    if (!map.has(key)) {
      map.set(key, {
        key,
        part: null,
        offer: null,
        base: item,
      });
      order.push(key);
    }

    return map.get(key)!;
  }

  // Parts/new OEM data wins as the display identity.
  for (const item of partRows) {
    const g = ensure(item);
    if (!g) continue;
    if (!g.part) g.part = item;
    g.base = g.part || g.offer || item;
  }

  // Refurb offer becomes an option inside the same card.
  for (const item of refurbRows) {
    const g = ensure(item);
    if (!g) continue;
    if (!g.offer) g.offer = item;
    g.base = g.part || g.offer || item;
  }

  return order
    .map((key) => map.get(key)!)
    .filter((g) => g.part || g.offer);
}

function optionHref(item: AnyItem, isRefurb: boolean) {
  const mpn = rawMpn(item);
  if (!mpn) return "#";
  return isRefurb
    ? `/offers/${encodeURIComponent(mpn)}`
    : `/parts/${encodeURIComponent(mpn)}`;
}

function SearchThumb({
  item,
  title,
  logoFallback,
  isModel = false,
}: {
  item: AnyItem;
  title: string;
  logoFallback: string;
  isModel?: boolean;
}) {
  const [useLogoFallback, setUseLogoFallback] = useState(false);

  const imageUrl = isModel
    ? item?.model_image_url || item?.image_url || item?.image || ""
    : item?.image_url ||
      item?.image ||
      item?.picture ||
      item?.thumbnail ||
      item?.photo_url ||
      "";

  const imageKey = isModel ? "" : item?.image_key || item?.img_key || "";
  const mpn = isModel
    ? ""
    : item?.mpn || item?.part_number || item?.manufacturer_part_number || "";

  const canTryPartImage = !!(imageUrl || imageKey || mpn);

  return (
    <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
      {!useLogoFallback && canTryPartImage ? (
        <PartImage
          imageUrl={imageUrl}
          imageKey={imageKey}
          mpn={mpn}
          alt={title}
          disableHoverPreview
          className="h-full w-full object-contain"
          onError={() => setUseLogoFallback(true)}
        />
      ) : logoFallback ? (
        <img
          src={logoFallback}
          alt={title}
          className="max-h-10 max-w-[54px] object-contain"
          loading="lazy"
        />
      ) : (
        <div className="text-[11px] text-gray-400">No image</div>
      )}
    </div>
  );
}

export default function SearchOverlay({ open, onClose }: Props) {
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "models" | "products">(
    "all"
  );
  const [loading, setLoading] = useState(false);

  const [models, setModels] = useState<AnyItem[]>([]);
  const [refurb, setRefurb] = useState<AnyItem[]>([]);
  const [parts, setParts] = useState<AnyItem[]>([]);
  const [brandLogos, setBrandLogos] = useState<AnyItem[]>([]);

  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;

    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/brand-logos`, {
          cache: "no-store",
        });
        const data = await res.json();
        setBrandLogos(Array.isArray(data) ? data : data?.logos || []);
      } catch (err) {
        console.error("brand logos fetch failed", err);
        setBrandLogos([]);
      }
    })();
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const q = query.trim();
    if (q.length < 2) {
      setModels([]);
      setRefurb([]);
      setParts([]);
      setLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const [modelsRes, refurbRes, partsRes] = await Promise.all([
          fetch(`${API_BASE}/api/suggest?q=${encodeURIComponent(q)}`, {
            cache: "no-store",
          }),
          fetch(`${API_BASE}/api/suggest/refurb?q=${encodeURIComponent(q)}`, {
            cache: "no-store",
          }),
          fetch(`${API_BASE}/api/suggest/parts?q=${encodeURIComponent(q)}`, {
            cache: "no-store",
          }),
        ]);

        const modelsJson = modelsRes.ok ? await modelsRes.json() : {};
        const refurbJson = refurbRes.ok ? await refurbRes.json() : [];
        const partsJson = partsRes.ok ? await partsRes.json() : [];

        const modelRows = Array.isArray(modelsJson)
          ? modelsJson
          : [
              ...(Array.isArray(modelsJson?.with_priced_parts)
                ? modelsJson.with_priced_parts
                : []),
              ...(Array.isArray(modelsJson?.without_priced_parts)
                ? modelsJson.without_priced_parts
                : []),
              ...(Array.isArray(modelsJson?.refurb_only_models)
                ? modelsJson.refurb_only_models
                : []),
            ];

        setModels(modelRows);
        setRefurb(Array.isArray(refurbJson) ? refurbJson : []);
        setParts(Array.isArray(partsJson) ? partsJson : []);
      } catch (err) {
        console.error("overlay search failed", err);
        setModels([]);
        setRefurb([]);
        setParts([]);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query, open]);

  const brandLogoMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const b of brandLogos) {
      const key = norm(b?.name || b?.brand || b?.brand_long);
      const img = b?.image_url || b?.url || b?.logo_url || b?.src || "";
      if (key && img && !map.has(key)) map.set(key, img);
    }
    return map;
  }, [brandLogos]);

  const getBrandLogoUrl = (item: AnyItem) => {
    const direct =
      item?.brand_logo_url || item?.logo_url || item?.brand_logo || "";
    if (direct) return direct;

    const brand = getBrandName(item);
    if (!brand) return "";
    return brandLogoMap.get(norm(brand)) || "";
  };

  const hasAny = useMemo(() => {
    return models.length > 0 || refurb.length > 0 || parts.length > 0;
  }, [models, refurb, parts]);

  const showEmptyPrompt = query.trim().length < 2 && !loading;
  const showNoResults = query.trim().length >= 2 && !loading && !hasAny;
  const showResults = hasAny;

  const modelResults = models.slice(0, 4);
  const refurbResults = refurb.slice(0, 8);
  const newPartResults = parts.slice(0, 8);

  const partOfferGroups = useMemo(
    () => buildPartOfferGroups(refurbResults, newPartResults),
    [refurbResults, newPartResults]
  );

  const combinedPartResults = partOfferGroups.slice(0, 4);
  const partsTabResults = partOfferGroups.slice(0, 8);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm p-4 md:p-8">
      <div className="relative mx-auto mt-3 flex max-h-[calc(100vh-2rem)] w-full max-w-6xl flex-col md:mt-4">
        <div className="relative flex max-h-[calc(100vh-2rem)] flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
          <div className="shrink-0 border-b border-black/10 px-6 pb-4 pt-5 md:px-10 md:pb-5 md:pt-6">
            <div className="mb-4">
              <div className="text-[12px] font-semibold uppercase tracking-[0.18em] text-blue-700">
                Search Appliance Part Geeks
              </div>
              <h2 className="mt-2 text-2xl font-bold text-black md:text-3xl">
                Find your model or part fast
              </h2>
              <p className="mt-2 text-sm text-black/60 md:text-[15px]">
                Search by model number, part number, brand, appliance type, or
                part type.
              </p>
            </div>

            <div className="flex items-center rounded-2xl border border-black/15 bg-white px-5 py-4 shadow-sm transition focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20">
              <Search size={20} className="shrink-0 text-black/60" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="ml-3 flex-1 bg-transparent text-[16px] text-black outline-none placeholder:text-black/40"
                placeholder="Search by model number, part number (MPN), brand, or appliance type"
              />
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              {[
                { key: "all", label: "All Results" },
                { key: "models", label: "Models" },
                { key: "products", label: "Parts" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`rounded-full border px-4 py-2 text-sm font-semibold transition-all duration-200 ${
                    activeTab === tab.key
                      ? "border-blue-700 bg-blue-700 text-white shadow-sm"
                      : "border-gray-300 bg-white text-black hover:border-blue-700 hover:text-blue-700"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>


            <div className="pointer-events-none absolute bottom-0 right-8 z-[10] hidden overflow-visible opacity-95 min-[1200px]:block">
              <img
                src="https://djvyjctjcehjyglwjniv.supabase.co/storage/v1/object/public/geeklogos/geek_hero_logo.png"
                alt=""
                className="h-72 w-auto sm:h-80 md:h-[22rem]"
                loading="lazy"
              />
            </div>
          <div className="relative min-h-0 flex-1 overflow-y-auto px-6 py-5 pb-8 md:px-10 md:py-6 min-[1200px]:pb-32">
            {loading && !hasAny ? (
              <div className="flex min-h-[130px] items-center justify-center">
                <p className="text-[15px] text-gray-500">Searching…</p>
              </div>
            ) : showEmptyPrompt ? (
              <div className="min-h-[70px]" />
            ) : showNoResults ? (
              <div className="relative z-20 flex min-h-[110px] items-center justify-center">
                <div className="max-w-xl text-center">
                  <p className="text-[16px] text-gray-600">
                    No matching results found.
                  </p>
                </div>
              </div>
            ) : showResults ? (
              <div className="relative z-40 space-y-6">
                {(activeTab === "all" || activeTab === "models") && (
                  <section>
                    <h3 className="mb-3 text-[19px] font-semibold text-black">
                      Models
                    </h3>

                    {modelResults.length > 0 ? (
                      <div className="space-y-3">
                        {modelResults.map((m, i) => {
                          const model =
                            m?.model_number || m?.model || m?.number || "";
                          const brand = m?.brand || "";
                          const applianceType = m?.appliance_type || "";
                          const modelImage = getModelImageUrl(m);
                          const logoFallback = getBrandLogoUrl(m);

                          return (
                            <Link
                              key={`${model}-${i}`}
                              href={modelHref(m)}
                              onClick={onClose}
                              className="block"
                            >
                              <div className="group cursor-pointer rounded-xl border border-gray-200 bg-white p-3 transition hover:border-gray-300 hover:shadow-md">
                                <div className="flex items-start gap-4">
                                  {modelImage ? (
                                    <SearchThumb
                                      item={m}
                                      title={model || brand || "Model"}
                                      logoFallback={logoFallback}
                                      isModel
                                    />
                                  ) : logoFallback ? (
                                    <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
                                      <img
                                        src={logoFallback}
                                        alt={brand || "Brand"}
                                        className="max-h-10 max-w-[54px] object-contain"
                                        loading="lazy"
                                      />
                                    </div>
                                  ) : (
                                    <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
                                      <div className="text-[11px] text-gray-400">
                                        No image
                                      </div>
                                    </div>
                                  )}

                                  <div className="min-w-0 flex-1">
                                    <div className="text-[15px] font-semibold leading-snug text-gray-900 group-hover:text-blue-700">
                                      {model}
                                    </div>
                                    <div className="mt-0.5 text-xs text-gray-600">
                                      {[brand, applianceType]
                                        .filter(Boolean)
                                        .join(" • ")}
                                    </div>
                                    <div className="mt-2 text-sm text-gray-500">
                                      {modelPartsSummary(m)}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    ) : activeTab === "models" ? (
                      <p className="text-[15px] text-gray-500">
                        No matching models found.
                      </p>
                    ) : null}
                  </section>
                )}

                {(activeTab === "all" || activeTab === "products") && (
                  <section>
                    <h3 className="mb-3 text-[19px] font-semibold text-black">
                      Parts
                    </h3>

                    {(activeTab === "all"
                      ? combinedPartResults
                      : partsTabResults
                    ).length > 0 ? (
                      <div className="max-w-[680px] space-y-3">
                        {(activeTab === "all"
                          ? combinedPartResults
                          : partsTabResults
                        ).map((g, i) => {
                          const part = g.part;
                          const offer = g.offer;
                          const base = g.base;
                          const displayMpn = rawMpn(part || offer || base);
                          const offerMpn = offer ? rawMpn(offer) : "";
                          const partMpn = part ? rawMpn(part) : "";

                          const title =
                            makePartTitle(part || offer || base, displayMpn) ||
                            (part || offer || base)?.title ||
                            displayMpn;

                          const logoFallback = getBrandLogoUrl(base);

                          const offerPrice =
                            offer?.price ?? offer?.sale_price ?? offer?.current_price;
                          const partPrice =
                            part?.price ?? part?.sale_price ?? part?.current_price;
                          const offerQty = offer ? inventoryQty(offer) : null;

                          const hasBoth = !!part && !!offer;
                          const relationshipLabel =
                            hasBoth && normMpnKey(partMpn) && normMpnKey(offerMpn)
                              ? normMpnKey(partMpn) === normMpnKey(offerMpn)
                                ? "Same exact part number"
                                : `New replacement/interchange: ${partMpn}`
                              : offer
                                ? "Refurbished OEM option"
                                : "New OEM option";

                          return (
                            <div
                              key={`${g.key}-${i}`}
                              className="group rounded-xl border border-gray-200 bg-white p-3 transition hover:border-gray-300 hover:shadow-md"
                            >
                              <div className="flex items-start gap-4">
                                <SearchThumb
                                  item={base}
                                  title={title}
                                  logoFallback={logoFallback}
                                />

                                <div className="min-w-0 flex-1">
                                  <div className="text-[15px] font-semibold leading-snug text-gray-900">
                                    {title}
                                  </div>

                                  <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-gray-600">
                                    {displayMpn ? (
                                      <span className="font-mono">{displayMpn}</span>
                                    ) : null}
                                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-700">
                                      {relationshipLabel}
                                    </span>
                                  </div>

                                  <div className="mt-3 grid gap-2">
                                    {offer ? (
                                      <Link
                                        href={optionHref(offer, true)}
                                        onClick={onClose}
                                        className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 transition hover:border-red-300 hover:bg-red-100"
                                      >
                                        <div className="flex items-center justify-between gap-3">
                                          <span className="text-[11px] font-bold uppercase tracking-wide text-red-700">
                                            Refurbished OEM
                                          </span>
                                          {offerPrice ? (
                                            <span className="text-sm font-bold text-green-700">
                                              {priceFmt(offerPrice)}
                                            </span>
                                          ) : null}
                                        </div>
                                        <div className="mt-1 text-xs font-medium text-red-900">
                                          Ships Today
                                          {offerQty != null && offerQty > 0
                                            ? ` · ${offerQty.toLocaleString()} in stock`
                                            : ""}
                                        </div>
                                      </Link>
                                    ) : null}

                                    {part ? (
                                      <Link
                                        href={optionHref(part, false)}
                                        onClick={onClose}
                                        className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 transition hover:border-blue-300 hover:bg-blue-100"
                                      >
                                        <div className="flex items-center justify-between gap-3">
                                          <span className="text-[11px] font-bold uppercase tracking-wide text-blue-700">
                                            New OEM
                                          </span>
                                          {partPrice ? (
                                            <span className="text-sm font-bold text-green-700">
                                              {priceFmt(partPrice)}
                                            </span>
                                          ) : null}
                                        </div>
                                        <div className="mt-1 text-xs font-medium text-blue-900">
                                          View new OEM option
                                        </div>
                                      </Link>
                                    ) : null}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : activeTab === "products" ? (
                      <p className="text-[15px] text-gray-500">
                        No matching parts found.
                      </p>
                    ) : null}
                  </section>
                )}
              </div>
            ) : null}
          </div>
        </div>

        <button
          onClick={onClose}
          className="absolute right-3 top-3 z-[120] flex h-14 w-14 items-center justify-center rounded-full border border-gray-300 bg-white shadow-xl transition hover:bg-gray-100"
          aria-label="Close search"
        >
          <X size={34} className="text-black" />
        </button>
      </div>
    </div>
  );
}