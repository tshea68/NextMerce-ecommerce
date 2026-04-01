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

function getPartImageUrl(item: AnyItem) {
  return (
    item?.image_url ||
    item?.image ||
    item?.picture ||
    item?.thumbnail ||
    item?.photo_url ||
    ""
  );
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
    <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded border border-gray-200 bg-white">
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
          className="max-h-10 max-w-[60px] object-contain"
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
  const refurbResults = refurb.slice(0, 4);
  const newPartResults = parts.slice(0, 4);

  const combinedPartResults = [
    ...refurbResults.slice(0, 2),
    ...newPartResults.slice(0, 2),
  ];

  const partsTabResults = [...refurbResults, ...newPartResults];

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 p-4 md:p-8">
      <div className="relative mx-auto mt-6 w-full max-w-5xl">
        <div className="overflow-hidden rounded-2xl bg-white shadow-xl">
          <div className="border-b px-6 pt-6 pb-4 md:px-8 md:pt-8">
            <div className="flex items-center rounded-lg border px-4 py-3">
              <Search size={17} className="text-gray-600" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="ml-2 flex-1 bg-transparent text-black outline-none"
                placeholder="Search by model number, MPN, brand, appliance type, or part type"
              />
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              {[
                { key: "all", label: "All" },
                { key: "models", label: "Models" },
                { key: "products", label: "Parts" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`rounded-md border px-4 py-2 text-sm font-semibold transition-all duration-200 ${
                    activeTab === tab.key
                      ? "border-blue-700 bg-blue-100 text-blue-700"
                      : "border-gray-400 text-black hover:border-blue-700 hover:bg-blue-100"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="max-h-[65vh] overflow-y-auto px-6 py-6 md:px-8 md:py-8">
            {loading && !hasAny ? (
              <div className="flex min-h-[180px] items-center justify-center">
                <p className="italic text-gray-500">Searching…</p>
              </div>
            ) : showEmptyPrompt ? (
              <div className="flex min-h-[220px] items-center justify-center">
                <p className="text-center italic text-gray-500">
                  Start typing a model number, part number, or keyword.
                </p>
              </div>
            ) : showNoResults ? (
              <div className="flex min-h-[220px] items-center justify-center">
                <p className="text-center italic text-gray-500">
                  No matching results found.
                </p>
              </div>
            ) : showResults ? (
              <div className="space-y-8">
                {(activeTab === "all" || activeTab === "models") && (
                  <section>
                    <h3 className="mb-4 text-[20px] font-bold text-black/80">
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
                              <div className="group cursor-pointer rounded-lg border border-gray-100 p-3 hover:bg-gray-100">
                                <div className="flex items-start gap-4">
                                  {modelImage ? (
                                    <SearchThumb
                                      item={m}
                                      title={model || brand || "Model"}
                                      logoFallback={logoFallback}
                                      isModel
                                    />
                                  ) : logoFallback ? (
                                    <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded border border-gray-200 bg-white">
                                      <img
                                        src={logoFallback}
                                        alt={brand || "Brand"}
                                        className="max-h-10 max-w-[60px] object-contain"
                                        loading="lazy"
                                      />
                                    </div>
                                  ) : (
                                    <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded border border-gray-200 bg-white">
                                      <div className="text-[11px] text-gray-400">
                                        No image
                                      </div>
                                    </div>
                                  )}

                                  <div className="min-w-0 flex-1">
                                    <div className="text-lg font-medium text-gray-900 group-hover:text-blue-700">
                                      {model}
                                    </div>
                                    <div className="mt-1 text-sm text-gray-600">
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
                    ) : (
                      <p className="italic text-gray-500">
                        No matching models found.
                      </p>
                    )}
                  </section>
                )}

                {(activeTab === "all" || activeTab === "products") && (
                  <section>
                    <h3 className="mb-4 text-[20px] font-bold text-black/80">
                      Parts
                    </h3>

                    {(activeTab === "all"
                      ? combinedPartResults
                      : partsTabResults
                    ).length > 0 ? (
                      <div className="space-y-3">
                        {(activeTab === "all"
                          ? combinedPartResults
                          : partsTabResults
                        ).map((p, i) => {
                          const href = itemHref(p);
                          const mpn =
                            p?.mpn ||
                            p?.part_number ||
                            p?.manufacturer_part_number ||
                            "";
                          const title = makePartTitle(p, mpn) || mpn;
                          const price =
                            p?.price ?? p?.sale_price ?? p?.current_price;
                          const brand = getBrandName(p);
                          const logoFallback = getBrandLogoUrl(p);
                          const label = partStatusLabel(p);
                          const refurbStyle = detectRefurb(p);

                          return (
                            <Link
                              key={`${mpn}-${i}`}
                              href={href}
                              onClick={onClose}
                              className="block"
                            >
                              <div className="group cursor-pointer rounded-lg border border-gray-100 p-3 hover:bg-gray-100">
                                <div className="flex items-start gap-4">
                                  <SearchThumb
                                    item={p}
                                    title={title}
                                    logoFallback={logoFallback}
                                  />

                                  <div className="min-w-0 flex-1">
                                    <div className="text-lg font-medium text-gray-900 group-hover:text-blue-700">
                                      {title}
                                    </div>
                                    <div className="mt-1 text-sm text-gray-600">
                                      {mpn}
                                    </div>
                                    <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-gray-500">
                                      <span
                                        className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                                          refurbStyle
                                            ? "bg-red-100 text-red-700"
                                            : "bg-blue-100 text-blue-700"
                                        }`}
                                      >
                                        {label}
                                      </span>
                                      {price ? <span>{priceFmt(price)}</span> : null}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="italic text-gray-500">
                        No matching parts found.
                      </p>
                    )}
                  </section>
                )}
              </div>
            ) : null}
          </div>
        </div>

        <button
          onClick={onClose}
          className="absolute -top-4 -right-4 rounded-full border border-gray-300 bg-white p-2 shadow-md hover:bg-gray-100"
          aria-label="Close search"
        >
          <X size={20} className="text-black" />
        </button>
      </div>
    </div>
  );
}