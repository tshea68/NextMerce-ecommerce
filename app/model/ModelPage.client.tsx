"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import PartImage from "@/components/PartImage";
import { makePartTitle } from "@/lib/PartsTitle";

const API_BASE = (
  process.env.NEXT_PUBLIC_API_BASE || "https://api.appliancepartgeeks.com"
).replace(/\/+$/, "");

type AnyObj = Record<string, any>;

type ModelCrossref = {
  id?: number;
  source_brand?: string | null;
  source_model_number?: string | null;
  related_brand?: string | null;
  related_model_number?: string | null;
  relationship_type?: string | null;
  source_model_title?: string | null;
};

const normalize = (s: any) =>
  String(s || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .trim();

const extractRawMPN = (p: AnyObj) => {
  let mpn =
    p?.mpn ??
    p?.MPN ??
    p?.part_number ??
    p?.partNumber ??
    p?.mpn_raw ??
    p?.listing_mpn ??
    null;

  if (!mpn && p?.reliable_sku) {
    mpn = String(p.reliable_sku).replace(/^[A-Z]{2,}\s+/, "");
  }
  return mpn ? String(mpn).trim() : "";
};

const numericPrice = (p: any) => {
  const n =
    p?.price_num ??
    p?.price_numeric ??
    (typeof p?.price === "number"
      ? p.price
      : Number(String(p?.price || "").replace(/[^0-9.]/g, "")));
  return Number.isFinite(Number(n)) ? Number(n) : null;
};

const formatPrice = (v: any, curr = "USD") => {
  const n =
    typeof v === "number"
      ? v
      : v?.price_num ??
        v?.price_numeric ??
        (typeof v?.price === "number"
          ? v.price
          : Number(String(v?.price || "").replace(/[^0-9.]/g, "")));

  if (n == null || Number.isNaN(Number(n))) return "";
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: (v?.currency || curr || "USD").toUpperCase(),
      maximumFractionDigits: 2,
    }).format(Number(n));
  } catch {
    return "$" + Number(n).toFixed(2);
  }
};

const getAvailabilityRank = (input: any) => {
  if (!input || typeof input !== "object") {
    const s = String(input || "").trim().toLowerCase();
    if (s === "in stock" || s === "available") return 1;
    if (
      s === "out of stock" ||
      s === "backorder" ||
      s === "back order" ||
      s === "back-ordered" ||
      s === "backordered"
    ) {
      return 2;
    }
    return 9;
  }

  const explicitRank =
    typeof input.availability_rank === "number"
      ? input.availability_rank
      : null;
  if (explicitRank === 1 || explicitRank === 2 || explicitRank === 9) {
    return explicitRank;
  }

  const s = String(input.stock_status || "").trim().toLowerCase();
  if (s === "in stock" || s === "available") return 1;
  if (
    s === "out of stock" ||
    s === "backorder" ||
    s === "back order" ||
    s === "back-ordered" ||
    s === "backordered"
  ) {
    return 2;
  }
  return 9;
};

const stockBadge = (input: any) => {
  const rank = getAvailabilityRank(input);

  if (rank === 1) {
    return (
      <span className="rounded bg-green-600 px-2 py-0.5 text-[11px] text-white">
        In stock
      </span>
    );
  }
  if (rank === 2) {
    return (
      <span className="rounded bg-red-600 px-2 py-0.5 text-[11px] text-white">
        Backorder
      </span>
    );
  }
  return (
    <span className="rounded bg-black px-2 py-0.5 text-[11px] text-white">
      Unavailable
    </span>
  );
};

const calcSavings = (newPrice: any, refurbPrice: any) => {
  if (newPrice == null || refurbPrice == null) return null;
  const s = Number(newPrice) - Number(refurbPrice);
  return Number.isFinite(s) && s > 0 ? s : null;
};

function getRefurb(obj: AnyObj) {
  return (
    obj?.refurb ||
    (obj?.refurbished ? obj.refurbished : null) ||
    (obj?.offers && obj.offers.refurb) ||
    null
  );
}

function getNew(obj: AnyObj) {
  return obj?.reliable || obj?.new || (obj?.offers && obj.offers.new) || null;
}

function buildRefurbMaps(offers: AnyObj[]) {
  const mpnSet = new Set<string>();
  const byNorm: Record<string, AnyObj> = {};

  for (const o of offers || []) {
    const normKey = normalize(
      o.mpn || o.mpn_normalized || o.mpn_coalesced || ""
    );
    if (!normKey) continue;

    mpnSet.add(normKey);

    const price = numericPrice(o);
    const existing = byNorm[normKey]?.refurb || null;
    const existingPrice = existing ? numericPrice(existing) : null;

    if (
      !existing ||
      (price != null && (existingPrice == null || price < existingPrice))
    ) {
      byNorm[normKey] = { refurb: o };
    }
  }

  return {
    bulk: byNorm,
    uniqueCount: mpnSet.size,
  };
}

function ModelNumberNote({ model }: { model: AnyObj }) {
  const crossrefs: ModelCrossref[] = Array.isArray(model?.model_crossrefs)
    ? model.model_crossrefs
    : [];

  if (!crossrefs.length) return null;

  const aliases = new Map<string, { brand: string; modelNumber: string }>();

  const addAlias = (brandValue: any, modelValue: any) => {
    const brand = String(brandValue || "").trim();
    const modelNumber = String(modelValue || "").trim();
    if (!modelNumber) return;

    const key = `${normalize(brand)}|${normalize(modelNumber)}`;
    aliases.set(key, { brand, modelNumber });
  };

  addAlias(model?.brand, model?.model_number);

  for (const ref of crossrefs) {
    addAlias(ref.source_brand, ref.source_model_number);
    addAlias(ref.related_brand, ref.related_model_number);
  }

  const aliasList = Array.from(aliases.values());

  if (aliasList.length < 2) return null;

  return (
    <section className="mb-5 rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-slate-900">
      <div className="text-xs font-semibold uppercase tracking-wide text-amber-900">
        Model number note
      </div>

      <p className="mt-2 leading-6">
        This appliance may appear under more than one brand or model-number
        format. Kenmore appliances are often manufactured by other OEM brands,
        so supplier catalogs and parts diagrams may list the same appliance
        under a manufacturer-formatted model number.
      </p>

      <div className="mt-3">
        <div className="text-xs font-semibold uppercase tracking-wide text-amber-900">
          Known formats
        </div>

        <div className="mt-2 flex flex-wrap gap-2">
          {aliasList.map((alias) => (
            <span
              key={`${alias.brand}-${alias.modelNumber}`}
              className="rounded-full border border-amber-300 bg-white px-3 py-1 text-xs font-semibold text-slate-950"
            >
              {alias.brand ? `${alias.brand} ` : ""}
              {alias.modelNumber}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function ModelPageContent() {
  const searchParams = useSearchParams();
  const rawParam = searchParams.get("model") || "";

  let modelNumber = rawParam;
  try {
    modelNumber = decodeURIComponent(rawParam);
  } catch {
    modelNumber = rawParam;
  }

  const refurbMode = searchParams.get("refurb") === "1";

  const [model, setModel] = useState<AnyObj | null>(null);
  const [parts, setParts] = useState<{ priced: AnyObj[]; all: AnyObj[] }>({
    priced: [],
    all: [],
  });
  const [brandLogos, setBrandLogos] = useState<AnyObj[]>([]);
  const [activeExplodedView, setActiveExplodedView] = useState<AnyObj | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [bulk, setBulk] = useState<Record<string, AnyObj>>({});
  const [bulkReady, setBulkReady] = useState(false);

  const [refurbItems, setRefurbItems] = useState<AnyObj[]>([]);
  const [refurbSummaryCount, setRefurbSummaryCount] = useState<number | null>(
    null
  );
  const [refurbSummaryLoading, setRefurbSummaryLoading] = useState(false);

  const lastModelRef = useRef<string | null>(null);
  const didFetchLogosRef = useRef(false);

  useEffect(() => {
    if (didFetchLogosRef.current) return;
    didFetchLogosRef.current = true;

    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/brand-logos`, {
          cache: "no-store",
        });
        const data = await res.json();
        setBrandLogos(Array.isArray(data) ? data : data?.logos || []);
      } catch (err) {
        console.error("Error fetching brand logos:", err);
      }
    })();
  }, []);

  useEffect(() => {
    if (!modelNumber) return;

    const comboKey = `${modelNumber}::${refurbMode ? "refurb" : "normal"}`;
    if (lastModelRef.current === comboKey) return;
    lastModelRef.current = comboKey;

    setModel(null);
    setParts({ priced: [], all: [] });
    setError(null);
    setBulk({});
    setBulkReady(false);
    setRefurbItems([]);
    setRefurbSummaryCount(null);
    setRefurbSummaryLoading(true);

    const fetchModel = async () => {
      try {
        const res = await fetch(
          `${API_BASE}/api/models/search?q=${encodeURIComponent(modelNumber)}`,
          { cache: "no-store" }
        );
        const data = await res.json();
        setModel(data && data.model_number ? data : null);
      } catch (err) {
        console.error("Error loading model:", err);
        setError("Error loading model data.");
      }
    };

    const fetchParts = async () => {
      try {
        const res = await fetch(
          `${API_BASE}/api/parts/for-model/${encodeURIComponent(modelNumber)}`,
          { cache: "no-store" }
        );
        if (!res.ok) {
          setParts({ priced: [], all: [] });
          return;
        }
        const data = await res.json();
        setParts({
          all: Array.isArray(data.all) ? data.all : [],
          priced: Array.isArray(data.priced) ? data.priced : [],
        });
      } catch (err) {
        console.error("Error loading parts:", err);
        setParts({ priced: [], all: [] });
      }
    };

    const fetchRefurb = async () => {
      try {
        const res = await fetch(
          `${API_BASE}/api/refurb/for-model/${encodeURIComponent(modelNumber)}`,
          { cache: "no-store" }
        );

        if (!res.ok) {
          setRefurbItems([]);
          setBulk({});
          setBulkReady(true);
          setRefurbSummaryCount(0);
          return;
        }

        const data = await res.json();
        const offers = Array.isArray(data)
          ? data
          : Array.isArray(data?.offers)
          ? data.offers
          : Array.isArray(data?.items)
          ? data.items
          : [];

        const { bulk: bulkMap, uniqueCount } = buildRefurbMaps(offers);

        setRefurbItems(offers);
        setBulk(bulkMap);
        setBulkReady(true);
        setRefurbSummaryCount(uniqueCount);
      } catch (err) {
        console.error("Error loading refurb offers:", err);
        setRefurbItems([]);
        setBulk({});
        setBulkReady(true);
        setRefurbSummaryCount(0);
      } finally {
        setRefurbSummaryLoading(false);
      }
    };

    fetchModel();
    fetchParts();
    fetchRefurb();
  }, [modelNumber, refurbMode]);

  const getBrandLogoUrl = (brand: string) => {
    if (!brand) return null;
    const key = normalize(brand);
    const hit = brandLogos.find((b) => normalize(b.name) === key);
    return hit?.image_url || hit?.url || hit?.logo_url || hit?.src || null;
  };

  const allKnownOrdered = useMemo(() => {
    const list = Array.isArray(parts.all) ? [...parts.all] : [];
    list.sort((a, b) => (a.sequence || 0) - (b.sequence || 0));
    return list;
  }, [parts.all]);

  const sequenceByNorm = useMemo(() => {
    const m = new Map<string, any>();
    for (const r of allKnownOrdered) {
      const normKey = normalize(extractRawMPN(r));
      if (normKey && r.sequence != null && !m.has(normKey)) {
        m.set(normKey, r.sequence);
      }
    }
    return m;
  }, [allKnownOrdered]);

  const findSequenceForNorm = (normKey: string) => {
    if (!normKey) return null;
    const mapped = sequenceByNorm.get(normKey);
    if (mapped != null) return mapped;
    const hit =
      allKnownOrdered.find(
        (r) => normalize(extractRawMPN(r)) === normKey && r.sequence != null
      ) || null;
    return hit ? hit.sequence : null;
  };

  const tiles = useMemo(() => {
    if (refurbMode) return [];

    const pricedList = parts.priced || [];
    const out: AnyObj[] = [];

    for (const newPart of pricedList) {
      const normKey = normalize(extractRawMPN(newPart));
      if (!normKey) continue;

      const cmp = bulk?.[normKey] || null;
      const refurb = getRefurb(cmp);
      const refurbPrice = refurb ? numericPrice(refurb) : null;
      const sequence = findSequenceForNorm(normKey) ?? newPart.sequence ?? null;

      if (refurb && refurbPrice != null) {
        out.push({
          type: "refurb",
          normKey,
          knownName: newPart?.name || refurb.title || null,
          newPart,
          cmp,
          sequence,
        });
      }

      const rank = getAvailabilityRank(newPart);
      if (rank === 1 || rank === 2) {
        out.push({
          type: "new",
          normKey,
          newPart,
          cmp,
          sequence,
        });
      }
    }

    if (!pricedList.length) {
      for (const [normKey, cmp] of Object.entries(bulk || {})) {
        const refurb = getRefurb(cmp);
        const refurbPrice = refurb ? numericPrice(refurb) : null;
        if (!normKey || !refurb || refurbPrice == null) continue;

        const sequence = findSequenceForNorm(normKey);

        out.push({
          type: "refurb",
          normKey,
          knownName: refurb.title || null,
          newPart: null,
          cmp,
          sequence,
        });
      }
    }

    return out;
  }, [refurbMode, parts.priced, bulk, allKnownOrdered, sequenceByNorm]);

  const tilesSorted = useMemo(() => {
    if (refurbMode) return [];
    const refurbPrice = (t: AnyObj) => {
      const v = getRefurb(t.cmp);
      return v ? numericPrice(v) ?? Infinity : Infinity;
    };
    const newPrice = (t: AnyObj) =>
      t.newPart ? numericPrice(t.newPart) ?? Infinity : Infinity;

    const arr = [...tiles];
    arr.sort((a, b) => {
      if (a.type !== b.type) return a.type === "refurb" ? -1 : 1;
      return a.type === "refurb"
        ? refurbPrice(a) - refurbPrice(b)
        : newPrice(a) - newPrice(b);
    });
    return arr;
  }, [tiles, refurbMode]);

  if (error) {
    return <div className="bg-white py-6 text-center text-red-600">{error}</div>;
  }
  if (!model) return null;

  return (
    <div className="w-full bg-white py-4 pb-12">
      <div className="mx-auto w-[90%] max-w-[1400px]">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: model.model_number || "Model" },
          ]}
          className="mb-5 text-sm text-gray-700"
        />

        <div className="rounded-md bg-white px-4 pt-8 pb-12 text-black shadow-[0_0_20px_rgba(0,0,0,0.4)] md:px-6 md:pt-10 lg:px-8">
          <div className="mb-4 flex max-h-[110px] items-center gap-4 overflow-hidden rounded border bg-white p-3 text-black">
            <div className="flex items-center justify-center rounded-md border border-gray-200 bg-white px-4 py-2">
              {getBrandLogoUrl(model.brand) ? (
                <img
                  src={getBrandLogoUrl(model.brand)!}
                  alt={`${model.brand} Logo`}
                  className="h-10 w-auto object-contain"
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                <span className="text-[10px] text-gray-500">No Logo</span>
              )}
            </div>

            <div className="flex flex-1 items-center gap-3 overflow-hidden rounded bg-gray-100 p-3 text-black">
              <div className="w-1/3 leading-tight">
                <div className="flex flex-wrap items-baseline gap-2 text-xs font-medium text-slate-900 sm:text-[13px] md:text-sm lg:text-base">
                  {model.brand && <span>{model.brand}</span>}
                  {model.brand && model.model_number && (
                    <span className="text-slate-400">•</span>
                  )}
                  {model.model_number && <span>{model.model_number}</span>}
                  {model.appliance_type && (
                    <>
                      <span className="text-slate-400">•</span>
                      <span>{model.appliance_type}</span>
                    </>
                  )}
                </div>

                <p className="mt-1 text-xs text-gray-700 md:text-sm">
                  Known Parts: {parts.all.length} &nbsp;|&nbsp; Priced Parts:{" "}
                  {parts.priced.length} {" | "}
                  <span className="inline-block rounded bg-gray-900 px-2 py-0.5 text-white">
                    Refurbished Parts:{" "}
                    {refurbSummaryLoading
                      ? "…"
                      : refurbSummaryCount != null
                      ? refurbSummaryCount
                      : 0}
                  </span>
                </p>
              </div>

              <div className="flex flex-1 gap-2 overflow-x-auto overflow-y-hidden">
                {model.exploded_views?.map((v: AnyObj, i: number) => {
                  const label = v.label || `View ${i + 1}`;

                  return (
                    <button
                      key={`${v.image_url || label}-${i}`}
                      type="button"
                      onClick={() => setActiveExplodedView({ ...v, label })}
                      className="group w-28 shrink-0 cursor-pointer text-left"
                      title={`Open ${label}`}
                    >
                      <div className="relative w-full overflow-hidden rounded-lg border border-gray-200 bg-white p-1 transition duration-150 group-hover:border-orange-500 group-hover:shadow-md">
                        <PartImage
                          imageUrl={v.image_url}
                          alt={label}
                          disableHoverPreview
                          className="h-16 w-full object-contain transition duration-150 group-hover:scale-110"
                        />

                        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition duration-150 group-hover:bg-black/30 group-hover:opacity-100">
                          <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-gray-900 shadow">
                            View
                          </span>
                        </div>

                        <p className="mt-1 truncate text-center text-[10px] leading-tight text-black group-hover:text-orange-700">
                          {label}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {activeExplodedView && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
              onClick={() => setActiveExplodedView(null)}
            >
              <div
                className="relative max-h-[90vh] w-full max-w-6xl rounded-2xl bg-white p-4 text-black shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => setActiveExplodedView(null)}
                  className="absolute right-3 top-3 z-10 rounded-full bg-gray-100 px-3 py-1 text-lg font-bold leading-none text-gray-700 hover:bg-gray-200"
                  aria-label="Close exploded view"
                >
                  ×
                </button>

                <h3 className="mb-3 pr-10 text-lg font-bold text-gray-900">
                  {activeExplodedView.label || "Exploded View"}
                </h3>

                <div className="flex max-h-[75vh] items-center justify-center overflow-auto rounded-xl bg-gray-50 p-3">
                  <PartImage
                    imageUrl={activeExplodedView.image_url}
                    alt={activeExplodedView.label || "Exploded view"}
                    disableHoverPreview
                    className="max-h-[72vh] w-auto max-w-full object-contain"
                  />
                </div>
              </div>
            </div>
          )}

          <ModelNumberNote model={model} />

          {refurbMode ? (
            <RefurbOnlyGrid items={refurbItems} modelNumber={model.model_number} />
          ) : (
            <div className="flex flex-col gap-6 md:flex-row">
              <div className="md:w-3/4">
                <h3 className="mb-2 text-lg font-semibold text-black">
                  Available Parts
                </h3>

                {!bulkReady ? (
                  <p className="text-gray-500">Loading…</p>
                ) : tilesSorted.length === 0 ? (
                  <p className="mb-6 text-gray-500">
                    No available parts for this model.
                  </p>
                ) : (
                  <div className="grid max-h-[400px] grid-cols-1 gap-4 overflow-y-auto pr-1 md:grid-cols-2">
                    {tilesSorted.map((t) =>
                      t.type === "refurb" ? (
                        <RefurbCard
                          key={`ref-${t.normKey}`}
                          normKey={t.normKey}
                          knownName={t.knownName}
                          cmp={t.cmp}
                          newPart={t.newPart}
                          modelNumber={model.model_number}
                          sequence={t.sequence}
                          allKnown={allKnownOrdered}
                        />
                      ) : (
                        <NewCard
                          key={`new-${t.normKey}`}
                          normKey={t.normKey}
                          newPart={t.newPart}
                          modelNumber={model.model_number}
                          sequence={t.sequence}
                          allKnown={allKnownOrdered}
                        />
                      )
                    )}
                  </div>
                )}
              </div>

              <div className="md:w-1/4">
                <h3 className="mb-2 text-lg font-semibold text-black">
                  All Known Parts
                </h3>
                {allKnownOrdered.length === 0 ? (
                  <p className="text-gray-500">No known parts for this model.</p>
                ) : (
                  <div className="flex max-h-[400px] flex-col gap-2 overflow-y-auto pr-1">
                    {allKnownOrdered.map((p, idx) => (
                      <OtherKnownRow key={`${p.mpn || "row"}-${idx}`} row={p} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function RefurbOnlyGrid({
  items,
}: {
  items: AnyObj[];
  modelNumber: string;
}) {
  if (!items?.length) {
    return (
      <p className="text-gray-600">No refurbished offers for this model.</p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((o, i) => {
        const mpn = o.mpn || o.mpn_normalized || "";
        const titleText = makePartTitle(o, mpn);
        const imgMpn = mpn || o.mpn_normalized || "";

        return (
          <Link
            key={`${mpn}-${i}`}
            href={`/offers/${encodeURIComponent(imgMpn)}`}
            className="group rounded-lg border border-red-300 bg-red-50 p-3 transition hover:bg-red-100"
            title={titleText || mpn}
          >
            <div className="flex gap-3">
              <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded border border-gray-100 bg-white">
                <PartImage
                  imageUrl={
                    o.image_url ||
                    o.image ||
                    o.picture ||
                    o.thumbnail ||
                    "/no-image.png"
                  }
                  mpn={imgMpn}
                  alt={titleText || mpn}
                  disableHoverPreview
                  className="h-full w-full object-contain"
                />
              </div>
              <div className="min-w-0">
                <div className="mb-0.5 text-[11px] font-semibold text-black">
                  {o.quantity_available != null
                    ? `OEM Refurbished: ${o.quantity_available} Available`
                    : "OEM Refurbished"}
                </div>
                <div className="truncate text-sm font-medium text-gray-900 group-hover:underline">
                  #{titleText || mpn}
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-sm font-semibold">{formatPrice(o)}</span>
                </div>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

function NewCard({
  newPart,
  modelNumber,
  sequence,
  allKnown,
}: {
  normKey: string;
  newPart: AnyObj;
  modelNumber: string;
  sequence: any;
  allKnown: AnyObj[];
}) {
  const rawMpn = extractRawMPN(newPart);
  const newPrice = numericPrice(newPart);

  const baseTitle =
    String(newPart?.title || "").trim() ||
    String(newPart?.name || "").trim() ||
    rawMpn;

  const seq =
    sequence ??
    newPart?.sequence ??
    allKnown.find((r) => normalize(extractRawMPN(r)) === normalize(rawMpn))
      ?.sequence ??
    null;

  const displayTitle = baseTitle || rawMpn;
  const imgAlt = displayTitle || rawMpn;

  return (
    <div className="rounded border bg-white p-3 transition hover:shadow">
      <div className="flex items-start gap-4">
        <div className="group relative flex h-20 w-20 items-center justify-center overflow-hidden rounded border border-gray-100 bg-white">
          <PartImage
            imageUrl={newPart.image_url}
            imageKey={newPart.image_key}
            mpn={newPart.mpn}
            alt={imgAlt}
            disableHoverPreview
            className="h-full w-full object-contain"
          />
        </div>
        <div className="min-w-0 flex-1">
          <Link
            href={`/parts/${encodeURIComponent(rawMpn)}`}
            className="line-clamp-2 text-[15px] font-semibold text-black hover:underline"
          >
            #{displayTitle}
          </Link>

          {seq != null && (
            <div className="mt-0.5 text-[11px] text-gray-700">
              Diagram #{seq}
            </div>
          )}

          <div className="mt-1 flex flex-wrap items-center gap-2">
            {stockBadge(newPart)}
            {newPrice != null ? (
              <span className="font-semibold">{formatPrice(newPrice)}</span>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function RefurbCard({
  normKey,
  knownName,
  cmp,
  newPart,
  modelNumber,
  sequence,
  allKnown,
}: {
  normKey: string;
  knownName: string | null;
  cmp: AnyObj;
  newPart: AnyObj | null;
  modelNumber: string;
  sequence: any;
  allKnown: AnyObj[];
}) {
  const refurb = getRefurb(cmp) || {};
  const refurbPrice = numericPrice(refurb);
  if (refurbPrice == null) return null;

  const refurbMpn = refurb?.mpn || normKey.toUpperCase();

  const basePartForTitle = newPart || refurb;
  const baseTitle = makePartTitle(basePartForTitle, refurbMpn);
  const titleText = baseTitle || knownName || normKey.toUpperCase();

  const rawMpnForUrl =
    (newPart && extractRawMPN(newPart)) || refurbMpn || normKey;

  const newFromCmp = getNew(cmp);
  const newPrice = newPart
    ? numericPrice(newPart)
    : newFromCmp
    ? numericPrice(newFromCmp)
    : null;

  const savings = calcSavings(newPrice, refurbPrice);

  const rawNorm = normalize(rawMpnForUrl);
  const seq =
    sequence ??
    newPart?.sequence ??
    allKnown.find((r) => normalize(extractRawMPN(r)) === rawNorm)?.sequence ??
    null;

  return (
    <div className="rounded border border-red-300 bg-red-50 p-3 transition hover:shadow-md">
      <div className="flex items-start gap-4">
        <div className="group flex h-20 w-20 items-center justify-center overflow-hidden rounded border border-red-100 bg-white">
          <PartImage
            imageUrl={
              refurb.image_url ||
              refurb.image ||
              refurb.picture ||
              refurb.thumbnail ||
              "/no-image.png"
            }
            mpn={refurbMpn}
            alt={titleText}
            disableHoverPreview
            className="h-full w-full object-contain"
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-0.5 text-[11px] font-semibold text-black">
            {refurb.quantity_available != null
              ? `OEM Refurbished: ${refurb.quantity_available} Available`
              : "OEM Refurbished"}
          </div>

          <Link
            href={`/offers/${encodeURIComponent(rawMpnForUrl)}`}
            className="line-clamp-2 text-[15px] font-semibold text-black hover:underline"
          >
            #{titleText}
          </Link>

          {seq != null && (
            <div className="mt-0.5 text-[11px] text-gray-700">
              Diagram #{seq}
            </div>
          )}

          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span className="font-semibold">{formatPrice(refurbPrice)}</span>
            {savings != null && (
              <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-semibold text-white">
                Save {formatPrice(savings)} vs new
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function OtherKnownRow({ row }: { row: AnyObj }) {
  const rawMpn = extractRawMPN(row);

  const title =
    String(row?.title || "").trim() ||
    String(row?.name || "").trim() ||
    rawMpn;

  return (
    <div className="rounded border bg-white px-2 py-1">
      <div className="line-clamp-2 text-[12px] font-medium text-black">
        {title || rawMpn || "Untitled part"}
      </div>
      <div className="mt-0.5 text-[11px] text-gray-600">
        MPN: {rawMpn || "–"}
      </div>
      {row.sequence != null && (
        <div className="text-[11px] text-gray-700">Diagram #{row.sequence}</div>
      )}
    </div>
  );
}

function ModelPageFallback() {
  return (
    <div className="w-full bg-white py-4 pb-12">
      <div className="mx-auto w-[90%] max-w-[1400px]">
        <div className="rounded-md bg-white px-4 pt-8 pb-12 shadow-[0_0_20px_rgba(0,0,0,0.08)] md:px-6 md:pt-10 lg:px-8" />
      </div>
    </div>
  );
}

export default function ModelPage() {
  return (
    <Suspense fallback={<ModelPageFallback />}>
      <ModelPageContent />
    </Suspense>
  );
}