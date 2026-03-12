"use client";

/**
 * PartsExplorer.client.tsx
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
 * Models in cards:
 * - API may return:
 *    - items: product rows
 *    - model_cards: model rows
 * - Model cards render above product rows in search mode
 * - Clicking "View all parts" enters a model-focused state with the model pinned at top
 *   and matching parts shown below, without leaving the page
 */

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

import ProductCard from "@/components/cards/ProductCard";
import ModelCard from "@/components/cards/ModelCard";

/* ================================
   CONFIG
   ================================ */
const API_BASE = "";
const DEFAULT_PER_PAGE = 30;

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
  initial?: GridInit;
  initialItems?: any[];
  initialModelCards?: any[];
  initialHasMore?: boolean;
  initialPageInventoryTotal?: number | null;
  initialFacets?: Facets;
  initialTotalCount?: number | null;
  initialError?: string | null;
  ssr?: {
    key: string;
    items: any[];
    model_cards?: any[];
    has_more: boolean;
    page_inventory_total: number | null;
    facets: Facets | null;
    total_count: number | null;
  };
};

const DEFAULT_LANDING_Q = "";
const DEFAULT_LANDING_CONDITION: Condition = "refurb";
const DEFAULT_SORT = "inventory_desc";
const DEFAULT_AVAILABILITY: Availability = "all";
const normalize = (s: any) => (s || "").toLowerCase().trim();

/* ================================
   FACET DISPLAY HELPERS
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
  return splitCompound(v);
}

const fmtCount = (num: any) => {
  const n = Number(num);
  return Number.isFinite(n) ? n.toLocaleString(undefined, { maximumFractionDigits: 0 }) : String(num || "");
};

function uniq(arr: string[]) {
  return Array.from(new Set(arr.filter(Boolean)));
}

function parseCsvMulti(sp: URLSearchParams, key: string) {
  const all = sp.getAll(key).flatMap((v) => v.split(","));
  return uniq(all.map((x) => x.trim()).filter(Boolean));
}

function asBool(v: string | null) {
  if (!v) return false;
  const s = v.toLowerCase();
  return s === "1" || s === "true" || s === "yes";
}

function parseAvailability(sp: URLSearchParams): Availability {
  const raw = normalize(sp.get("availability"));
  if (raw === "in_stock" || raw === "instock") return "in_stock";
  if (raw === "orderable") return "orderable";
  if (raw === "all") return "all";

  if (asBool(sp.get("in_stock_only"))) return "in_stock";

  return DEFAULT_AVAILABILITY;
}

function stableKeyFromSearchParamsString(spString: string) {
  const sp = new URLSearchParams(spString || "");

  const q = (sp.get("q") || "").trim();
  const searchMode = q.length > 0;

  if (searchMode) {
    sp.set("condition", "both");
    sp.set("availability", "all");
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

function looksLikePartRow(x: any) {
  return !!(
    x &&
    typeof x === "object" &&
    (
      "mpn" in x ||
      "part_number" in x ||
      "manufacturer_part_number" in x ||
      "title" in x ||
      "name" in x ||
      "price" in x ||
      "sequence" in x
    )
  );
}

function findPartsArrayDeep(value: any, seen = new WeakSet<object>()): any[] {
  if (Array.isArray(value)) {
    if (value.length === 0) return [];
    if (value.some(looksLikePartRow)) return value;
    for (const item of value) {
      const found = findPartsArrayDeep(item, seen);
      if (found.length) return found;
    }
    return [];
  }

  if (!value || typeof value !== "object") return [];

  if (seen.has(value)) return [];
  seen.add(value);

  const preferredKeys = [
    "items",
    "parts",
    "data",
    "results",
    "rows",
    "available_parts",
    "all_parts",
    "model_parts",
    "matched_parts",
    "parts_list",
    "model",
  ];

  for (const key of preferredKeys) {
    if (key in value) {
      const found = findPartsArrayDeep((value as any)[key], seen);
      if (found.length) return found;
    }
  }

  for (const key of Object.keys(value)) {
    const found = findPartsArrayDeep((value as any)[key], seen);
    if (found.length) return found;
  }

  return [];
}

/* ================================
   MAIN EXPLORER
   ================================ */

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
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentKey = useMemo(() => {
    return stableKeyFromSearchParamsString(searchParams?.toString() ?? "");
  }, [searchParams]);

  const canUseSsr = !!props?.ssr && props.ssr.key === currentKey;

  const init = useMemo(() => {
    if (props?.initial) return props.initial;

    const sp = new URLSearchParams(searchParams?.toString() ?? "");
    const hasAnyParam = sp.toString().length > 0;

    const conditionRaw = (sp.get("condition") || "").toLowerCase();
    const condition: Condition =
      conditionRaw === "new" || conditionRaw === "refurb" || conditionRaw === "both"
        ? (conditionRaw as Condition)
        : hasAnyParam
          ? "both"
          : DEFAULT_LANDING_CONDITION;

    const qFromUrl = (sp.get("q") || "").trim();
    const q = qFromUrl || (!hasAnyParam ? DEFAULT_LANDING_Q : "");

    const availability = parseAvailability(sp);
    const applianceType = (sp.get("appliance_type") || "").trim();
    const brands = parseCsvMulti(sp, "brands");
    const partTypes = parseCsvMulti(sp, "part_types");
    const page = Math.max(parseInt(sp.get("page") || "1", 10) || 1, 1);
    const perPage = Math.min(
      Math.max(parseInt(sp.get("per_page") || String(DEFAULT_PER_PAGE), 10) || DEFAULT_PER_PAGE, 1),
      100
    );

    return { condition, q, availability, applianceType, brands, partTypes, page, perPage };
  }, [props?.initial, searchParams]);

  const [condition, setCondition] = useState<Condition>(init.condition);
  const [availability, setAvailability] = useState<Availability>(init.availability);

  const [q, setQ] = useState(init.q);
  const [applianceType, setApplianceType] = useState(init.applianceType);
  const [selectedBrands, setSelectedBrands] = useState<string[]>(init.brands);
  const [selectedPartTypes, setSelectedPartTypes] = useState<string[]>(init.partTypes);
  const [page, setPage] = useState(init.page);
  const [perPage, setPerPage] = useState(init.perPage);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(() => {
    if (canUseSsr) return null;
    return props?.initialError ? String(props.initialError) : null;
  });

  const [items, setItems] = useState<any[]>(() => {
    if (canUseSsr) return Array.isArray(props.ssr?.items) ? props.ssr!.items : [];
    return Array.isArray(props?.initialItems) ? props.initialItems : [];
  });

  const [modelCards, setModelCards] = useState<any[]>(() => {
    if (canUseSsr) return Array.isArray(props.ssr?.model_cards) ? props.ssr!.model_cards! : [];
    return Array.isArray(props?.initialModelCards) ? props.initialModelCards : [];
  });

  const [hasMore, setHasMore] = useState(() => {
    if (canUseSsr) return !!props.ssr?.has_more;
    return !!props?.initialHasMore;
  });

  const [pageInventoryTotal, setPageInventoryTotal] = useState<number | null>(() => {
    if (canUseSsr) {
      return typeof props.ssr?.page_inventory_total === "number" ? props.ssr.page_inventory_total : null;
    }
    return typeof props?.initialPageInventoryTotal === "number" ? props.initialPageInventoryTotal : null;
  });

  const [metaLoading, setMetaLoading] = useState(false);

  const [facets, setFacets] = useState<Facets>(() => {
    if (canUseSsr) return (props.ssr?.facets as any) || {};
    return props?.initialFacets ?? {};
  });

  const [totalCount, setTotalCount] = useState<number | null>(() => {
    if (canUseSsr) return typeof props.ssr?.total_count === "number" ? props.ssr.total_count : null;
    return typeof props?.initialTotalCount === "number" ? props.initialTotalCount : null;
  });

  const [facetsMeta, setFacetsMeta] = useState<FacetsMeta | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const initialMetaProvided =
    typeof props?.initialFacets !== "undefined" || typeof props?.initialTotalCount !== "undefined";

  const skipFirstFacetsFetch = useRef<boolean>(!!props?.initialFacets || (canUseSsr && props.ssr?.facets != null));
  const skipFirstSearchTotalFetch = useRef<boolean>(
    initialMetaProvided || (canUseSsr && typeof props.ssr?.total_count === "number")
  );

  const asideRef = useRef<HTMLDivElement | null>(null);
  const [asideHeight, setAsideHeight] = useState<number | null>(null);
  const [isLg, setIsLg] = useState(false);

  const [activeModel, setActiveModel] = useState<any | null>(null);
  const [activeModelParts, setActiveModelParts] = useState<any[]>([]);
  const [activeModelLoading, setActiveModelLoading] = useState(false);
  const [activeModelError, setActiveModelError] = useState<string | null>(null);

  useEffect(() => {
    setHydrated(true);
  }, []);

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

  const [qDebounced, setQDebounced] = useState(q);
  useEffect(() => {
    const t = setTimeout(() => setQDebounced(q), 250);
    return () => clearTimeout(t);
  }, [q]);

  const searchMode = qDebounced.trim().length > 0;

  function toggleInList(list: string[], v: string) {
    const n = normalize(v);
    if (!n) return list;
    const has = list.some((x) => normalize(x) === n);
    return has ? list.filter((x) => normalize(x) !== n) : [...list, v];
  }

  const filtersDisabled = searchMode || !!activeModel;

  function doReset() {
    setCondition(DEFAULT_LANDING_CONDITION);
    setAvailability(DEFAULT_AVAILABILITY);
    setQ(DEFAULT_LANDING_Q);
    setApplianceType("");
    setSelectedBrands([]);
    setSelectedPartTypes([]);
    setPage(1);
    setModelCards([]);
    closeModelParts();
  }

  function closeModelParts() {
    setActiveModel(null);
    setActiveModelParts([]);
    setActiveModelLoading(false);
    setActiveModelError(null);
  }

  async function openModelParts(model: any) {
    const modelNumber = String(model?.model_number ?? model?.model ?? "").trim();
    if (!modelNumber) return;

    setActiveModel({
      ...model,
      href: model?.href || `/models/${encodeURIComponent(modelNumber)}`,
    });
    setActiveModelParts([]);
    setActiveModelError(null);
    setActiveModelLoading(true);

    try {
      const url = `https://api.appliancepartgeeks.com/api/parts/for-model/${encodeURIComponent(modelNumber)}`;
      const res = await fetch(url, {
        method: "GET",
        headers: { accept: "application/json" },
        cache: "no-store",
      });

      const json = await readJsonSafeClient(res);

      if (!res.ok || (json as any)?.__non_json || (json as any)?.__bad_json) {
        const msg =
          (json as any)?.error ||
          ((json as any)?.__non_json
            ? `Non-JSON response (HTTP ${(json as any)?.status ?? res.status})`
            : `HTTP ${res.status}`);
        throw new Error(msg);
      }

      const rows = findPartsArrayDeep(json);

      console.log("for-model payload", json);
      console.log("parsed rows length", rows.length);
      console.log("parsed first row", rows[0]);

      setActiveModelParts(rows);
    } catch (e: any) {
      setActiveModelError(e?.message || "Failed to load model parts");
      setActiveModelParts([]);
    } finally {
      setActiveModelLoading(false);
    }
  }

  const didInitUrl = useRef(false);
  useEffect(() => {
    if (!pathname) return;
    if (activeModel) return;

    const sp = new URLSearchParams();

    if (!searchMode) {
      sp.set("condition", condition);
      sp.set("availability", availability);

      if (applianceType) sp.set("appliance_type", applianceType);
      for (const b of selectedBrands) sp.append("brands", b);
      for (const pt of selectedPartTypes) sp.append("part_types", pt);
    }

    if (qDebounced) sp.set("q", qDebounced);
    sp.set("page", String(page));
    sp.set("per_page", String(perPage));

    const nextUrl = `${pathname}?${sp.toString()}`;

    if (!didInitUrl.current) {
      didInitUrl.current = true;
      return;
    }

    router.replace(nextUrl, { scroll: false });
  }, [
    pathname,
    router,
    condition,
    availability,
    applianceType,
    selectedBrands,
    selectedPartTypes,
    qDebounced,
    page,
    perPage,
    searchMode,
    activeModel,
  ]);

  useEffect(() => {
    if (!hydrated) return;
    if (skipFirstFacetsFetch.current) {
      skipFirstFacetsFetch.current = false;
      return;
    }
    if (activeModel) return;

    const ctrl = new AbortController();

    async function runFacetsCache() {
      setMetaLoading(true);

      const effectiveAvailability: Availability = searchMode ? "all" : availability;
      const effectiveCondition: Condition = searchMode ? "both" : condition;

      const sp = new URLSearchParams();
      sp.set("availability", effectiveAvailability);
      sp.set("condition", effectiveCondition);
      sp.set("facet_limit", "20");

      if (!searchMode) {
        if (applianceType) sp.set("appliance_type", applianceType);
        for (const b of selectedBrands) sp.append("brands", b);
        for (const pt of selectedPartTypes) sp.append("part_types", pt);
      }

      const facetsUrl = `/api/parts/facets?${sp.toString()}`;

      try {
        const res = await fetch(facetsUrl, {
          method: "GET",
          signal: ctrl.signal,
          headers: { accept: "application/json" },
          cache: "no-store",
        });

        const json = (await readJsonSafeClient(res)) as any;

        if (!res.ok || json?.__non_json || json?.__bad_json || !json?.ok) {
          setFacets({ brands: [], parts: [], appliances: [] });
          setFacetsMeta((json?.meta as any) || null);
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
        setFacets({ brands: [], parts: [], appliances: [] });
        setFacetsMeta(null);
      } finally {
        setMetaLoading(false);
      }
    }

    runFacetsCache();
    return () => ctrl.abort();
  }, [hydrated, availability, condition, searchMode, applianceType, selectedBrands, selectedPartTypes, activeModel]);

  useEffect(() => {
    if (!hydrated) return;

    if (!searchMode) {
      setTotalCount(null);
      return;
    }
    if (activeModel) return;

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

      const url = `${API_BASE}/api/grid/?${sp.toString()}`;

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
  }, [hydrated, qDebounced, searchMode, activeModel]);

  useEffect(() => {
    if (!hydrated) return;
    if (activeModel) return;

    const ctrl = new AbortController();

    async function runItems() {
      setLoading(true);
      setErr(null);

      const sp = new URLSearchParams();
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

      const itemsUrl = `${API_BASE}/api/grid/?${sp.toString()}`;

      try {
        const res = await fetch(itemsUrl, {
          method: "GET",
          signal: ctrl.signal,
          headers: { accept: "application/json" },
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
          setModelCards([]);
          setHasMore(false);
          setPageInventoryTotal(null);
          return;
        }

        setItems(Array.isArray(json.items) ? json.items : []);
        setModelCards(Array.isArray(json.model_cards) ? json.model_cards : []);
        setHasMore(!!json.has_more);
        setPageInventoryTotal(typeof json.page_inventory_total === "number" ? json.page_inventory_total : null);
      } catch (e: any) {
        if (e?.name === "AbortError") return;
        setErr(e?.message || "Request failed");
        setItems([]);
        setModelCards([]);
        setHasMore(false);
        setPageInventoryTotal(null);
      } finally {
        setLoading(false);
      }
    }

    runItems();
    return () => ctrl.abort();
  }, [
    hydrated,
    condition,
    availability,
    qDebounced,
    searchMode,
    applianceType,
    selectedBrands,
    selectedPartTypes,
    page,
    perPage,
    activeModel,
  ]);

  const brandFacet = useMemo(() => (Array.isArray(facets?.brands) ? facets.brands! : []), [facets]);
  const partFacetRaw = useMemo(() => (Array.isArray(facets?.parts) ? facets.parts! : []), [facets]);
  const applianceFacet = useMemo(() => (Array.isArray(facets?.appliances) ? facets.appliances! : []), [facets]);

  const [showAllBrands, setShowAllBrands] = useState(false);
  const [showAllParts, setShowAllParts] = useState(false);

  const brandFacetShown = useMemo(
    () => (showAllBrands ? brandFacet : brandFacet.slice(0, 10)),
    [brandFacet, showAllBrands]
  );
  const partFacetShown = useMemo(
    () => (showAllParts ? partFacetRaw : partFacetRaw.slice(0, 10)),
    [partFacetRaw, showAllParts]
  );

  const estimatedTotal = useMemo(() => {
    if (!facetsMeta) return null;
    const x = facetsMeta.estimated_total;
    return typeof x === "number" ? x : null;
  }, [facetsMeta]);

  const isModelFocused = !!activeModel;
  const hasAnyResults = modelCards.length > 0 || items.length > 0;

  return (
    <div className="max-w-[1250px] mx-auto px-4 py-8">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-3">
        <div className="flex flex-col gap-2">
          <div className="text-[18px] font-bold text-gray-900">
            {isModelFocused ? (
              <>
                Model Parts View{" "}
                {activeModel?.model_number ? (
                  <span className="font-normal text-gray-500">({String(activeModel.model_number)})</span>
                ) : null}
              </>
            ) : (
              <>
                Models and Parts Results{" "}
                {searchMode ? (
                  typeof totalCount === "number" ? (
                    <span className="font-normal text-gray-500">
                      (showing {fmtCount(modelCards.length + items.length)} of {fmtCount(totalCount)})
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
                ) : null}
              </>
            )}
          </div>

          <div className="flex flex-col md:flex-row gap-2 md:items-center">
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
              disabled={isModelFocused}
              className="w-full md:w-[520px] border border-gray-300 rounded px-3 py-2 text-[13px] text-black disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
            />
            {searchMode && !isModelFocused && (
              <button
                type="button"
                className="px-3 py-2 rounded border border-gray-300 text-[12px] font-semibold text-gray-800 hover:bg-gray-50"
                onClick={() => {
                  setQ("");
                  setPage(1);
                  setModelCards([]);
                }}
              >
                Clear search
              </button>
            )}

            {isModelFocused && (
              <button
                type="button"
                className="px-3 py-2 rounded border border-gray-300 text-[12px] font-semibold text-gray-800 hover:bg-gray-50"
                onClick={closeModelParts}
              >
                Back to results
              </button>
            )}
          </div>
        </div>

        {!isModelFocused && (
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
            <div className="text-[12px] text-gray-700 w-[70px] text-center">Page {page}</div>
            <button
              className="px-3 py-2 rounded border border-gray-300 text-[12px] font-semibold disabled:opacity-50"
              disabled={!hasMore || loading}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
        )}
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6 items-start">
        <aside
          ref={asideRef}
          className={`border border-gray-200 rounded-lg bg-white p-4 ${filtersDisabled ? "opacity-60" : ""}`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="text-[13px] font-bold text-gray-800">Filters</div>
            <button
              className="px-3 py-1.5 rounded bg-gray-100 border border-gray-200 text-[12px] font-semibold text-gray-800 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={filtersDisabled}
              onClick={doReset}
              title={filtersDisabled ? "Exit focused/search state to re-enable filters" : "Reset all filters"}
            >
              Reset
            </button>
          </div>

          {filtersDisabled && (
            <div className="mb-3 rounded border border-amber-200 bg-amber-50 p-2 text-[12px] text-amber-900">
              {isModelFocused
                ? "Model-focused view is active. Click Back to results to re-enable filtering."
                : "Search overrides filters. Clear search to re-enable filtering."}
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
                    if (opt.value === "new") setAvailability("in_stock");
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
          </div>

          <div className="mb-4">
            <div className="text-[12px] font-semibold text-gray-700 mb-2">Brands</div>
            <div className="max-h-[240px] overflow-auto pr-1">
              {brandFacetShown.length === 0 ? (
                <div className="text-[12px] text-gray-500">No facets yet.</div>
              ) : (
                brandFacetShown.map((x) => {
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
          </div>

          <div className="mb-2">
            <div className="text-[12px] font-semibold text-gray-700 mb-2">Part Types</div>
            <div className="max-h-[240px] overflow-auto pr-1">
              {partFacetShown.length === 0 ? (
                <div className="text-[12px] text-gray-500">No facets yet.</div>
              ) : (
                partFacetShown.map((x) => {
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

            {partFacetRaw.length > 10 && (
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
        </aside>

        <main className="min-w-0">
          {!isModelFocused && loading && <div className="mb-3 text-[12px] text-gray-600">Loading…</div>}

          {!isModelFocused && err && (
            <div className="mb-4 border border-red-300 bg-red-50 text-red-700 rounded p-3 text-[12px]">
              <div className="font-semibold mb-1">/api/grid error</div>
              <div className="font-mono break-all">{err}</div>
            </div>
          )}

          {isModelFocused ? (
            <div
              className="border border-gray-200 rounded-lg bg-white flex flex-col min-h-0 overflow-hidden"
              style={isLg && asideHeight ? { height: asideHeight } : undefined}
            >
              <div className="shrink-0 p-4 border-b border-gray-200 bg-white">
                {activeModel ? <ModelCard model={activeModel} onViewParts={openModelParts} /> : null}
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto p-4">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-[15px] font-semibold text-gray-900">
                      Matching parts{" "}
                      {activeModelLoading ? (
                        <span className="font-normal text-gray-500">(loading…)</span>
                      ) : (
                        <span className="font-normal text-gray-500">({fmtCount(activeModelParts.length)})</span>
                      )}
                    </div>

                    <button
                      type="button"
                      className="px-3 py-2 rounded border border-gray-300 text-[12px] font-semibold text-gray-800 hover:bg-gray-50"
                      onClick={closeModelParts}
                    >
                      Back to results
                    </button>
                  </div>

                  {activeModelError && (
                    <div className="border border-red-300 bg-red-50 text-red-700 rounded p-3 text-[12px]">
                      <div className="font-semibold mb-1">Model parts error</div>
                      <div className="font-mono break-all">{activeModelError}</div>
                    </div>
                  )}

                  {!activeModelLoading && !activeModelError && activeModelParts.length === 0 && (
                    <div className="text-[13px] text-gray-700">No parts found for this model.</div>
                  )}

                  {activeModelParts.length > 0 && (
                    <div className="flex flex-col gap-3">
                      {activeModelParts.map((row, idx) => (
                        <ProductCard
                          key={row?.rid ?? row?.id ?? row?.mpn ?? `model-part-${idx}`}
                          item={row}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <>
              {!loading && !err && !hasAnyResults && <div className="text-[13px] text-gray-700">No results.</div>}

              {hasAnyResults && (
                <div
                  className="border border-gray-200 rounded-lg bg-white flex flex-col min-h-0"
                  style={isLg && asideHeight ? { height: asideHeight } : undefined}
                >
                  <div className="flex-1 min-h-0 overflow-y-auto p-4">
                    <div className="flex flex-col gap-3">
                      {modelCards.length > 0 && (
                        <>
                          <div className="text-[13px] font-semibold text-gray-900">
                            Matching models ({fmtCount(modelCards.length)})
                          </div>
                          {modelCards.map((row, idx) => (
                            <ModelCard
                              key={row?.rid ?? `model-${row?.model_number ?? idx}`}
                              model={{
                                ...row,
                                href: row?.model_number
                                  ? `/models/${encodeURIComponent(String(row.model_number))}`
                                  : "#",
                              }}
                              onViewParts={openModelParts}
                            />
                          ))}
                        </>
                      )}

                      {items.length > 0 && (
                        <>
                          {modelCards.length > 0 && (
                            <div className="mt-2 pt-3 border-t border-gray-200 text-[13px] font-semibold text-gray-900">
                              Matching parts ({fmtCount(items.length)})
                            </div>
                          )}

                          {items.map((row, idx) => (
                            <ProductCard key={row?.rid ?? `${row?.mpn ?? "row"}-${idx}`} item={row} />
                          ))}
                        </>
                      )}
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
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}