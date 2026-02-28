// app/grid/page.tsx
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import PartsExplorer from "./PartsExplorer.client";
import { headers } from "next/headers";

type Condition = "both" | "new" | "refurb";
type Availability = "in_stock" | "orderable" | "all";

const DEFAULT_SORT = "inventory_desc";
const DEFAULT_CONDITION: Condition = "refurb";
const DEFAULT_AVAILABILITY: Availability = "all";
const DEFAULT_PER_PAGE = 30;

type SP = Record<string, string | string[] | undefined>;

function asStr(v: any) {
  return typeof v === "string"
    ? v
    : Array.isArray(v)
    ? String(v[0] ?? "")
    : v == null
    ? ""
    : String(v);
}

function asArr(v: any): string[] {
  if (!v) return [];
  if (Array.isArray(v)) return v.map(String).filter(Boolean);
  return String(v)
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

function parseCondition(raw: string): Condition {
  const v = (raw || "").toLowerCase().trim();
  return v === "both" || v === "new" || v === "refurb" ? (v as Condition) : DEFAULT_CONDITION;
}

function parseAvailability(raw: string): Availability {
  const v = (raw || "").toLowerCase().trim();
  if (v === "in_stock" || v === "instock") return "in_stock";
  if (v === "orderable") return "orderable";
  if (v === "all") return "all";
  return DEFAULT_AVAILABILITY;
}

async function readJsonSafe(res: Response) {
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

// ✅ Keep key behavior consistent with client (including search override + stable ordering)
function stableKeyFromParams(sp: URLSearchParams) {
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
    if (!sp.get("condition")) sp.set("condition", DEFAULT_CONDITION);
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

function isCodespacesHost(host: string) {
  const h = (host || "").toLowerCase();
  return h.includes(".app.github.dev") || h.includes(".github.dev");
}

async function getRequestOrigin() {
  const h = await headers();

  const proto = (h.get("x-forwarded-proto") || "http").split(",")[0].trim();
  const host = (h.get("x-forwarded-host") || h.get("host") || "").split(",")[0].trim();

  const port = process.env.PORT || "3000";
  const localOrigin = `http://127.0.0.1:${port}`;

  // ✅ Codespaces: NEVER use forwarded host for SSR fetches (often returns auth HTML)
  if (process.env.CODESPACES === "true") return localOrigin;
  if (host && isCodespacesHost(host)) return localOrigin;

  const envOrigin =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");

  if (envOrigin) return envOrigin;
  if (host) return `${proto}://${host}`;

  return localOrigin;
}

async function fetchWithTimeout(url: string, timeoutMs = 12000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      cache: "no-store",
      headers: { accept: "application/json" },
      signal: ctrl.signal,
      redirect: "follow",
    });
    const json = await readJsonSafe(res);
    return { res, json };
  } finally {
    clearTimeout(t);
  }
}

export default async function GridPage({
  searchParams,
}: {
  searchParams?: SP | Promise<SP>;
}) {
  const spObj = (await Promise.resolve(searchParams)) || {};

  // ---- parse & whitelist URL params -> API ----
  let condition = parseCondition(asStr(spObj.condition));
  let availability = parseAvailability(asStr(spObj.availability));

  const q = asStr(spObj.q).trim();
  const appliance_type = asStr(spObj.appliance_type).trim();

  const brands = asArr(spObj.brands);
  const part_types = asArr(spObj.part_types);

  const page = Math.max(parseInt(asStr(spObj.page) || "1", 10) || 1, 1);
  const per_page = Math.min(
    Math.max(parseInt(asStr(spObj.per_page) || String(DEFAULT_PER_PAGE), 10) || DEFAULT_PER_PAGE, 1),
    100
  );

  // ✅ Mirror client “search mode”: if q exists, filters are ignored, force both/all
  const searchMode = q.length > 0;
  if (searchMode) {
    condition = "both";
    availability = "all";
  }

  // ---- build ITEMS query ----
  const itemsParams = new URLSearchParams();
  itemsParams.set("condition", condition);
  itemsParams.set("availability", availability);

  if (q) itemsParams.set("q", q);

  // Only apply filters when NOT searching
  if (!searchMode) {
    if (appliance_type) itemsParams.set("appliance_type", appliance_type);
    for (const b of brands) itemsParams.append("brands", b);
    for (const pt of part_types) itemsParams.append("part_types", pt);
  }

  itemsParams.set("page", String(page));
  itemsParams.set("per_page", String(per_page));
  itemsParams.set("sort", DEFAULT_SORT);

  const origin = await getRequestOrigin();

  // ✅ IMPORTANT: use trailing slash to avoid 308 -> HTML -> bad JSON in SSR
  const itemsUrl = new URL(`/api/grid/?${itemsParams.toString()}`, origin).toString();

  // SSR only the ITEMS. Meta facets intentionally client-side.
  let itemsRes: Response | null = null;
  let itemsJson: any = null;

  try {
    const out = await fetchWithTimeout(itemsUrl, 12000);
    itemsRes = out.res;
    itemsJson = out.json;
  } catch (e: any) {
    itemsRes = null;
    itemsJson = { __fetch_failed: true, message: e?.message || "fetch failed" };
  }

  const initialError =
    !itemsRes
      ? `SSR fetch failed: ${itemsJson?.message || "unknown"}`
      : !itemsRes.ok
      ? `HTTP ${itemsRes.status}`
      : itemsJson?.ok
      ? null
      : itemsJson?.error ||
        (itemsJson?.__non_json
          ? `Non-JSON from /api/grid (status ${itemsJson?.status ?? itemsRes.status}, ct ${itemsJson?.ct})`
          : `HTTP ${itemsRes.status}`);

  const initial = {
    condition: (itemsJson?.condition || condition || DEFAULT_CONDITION) as Condition,
    q: q || "",
    availability: (itemsJson?.availability || availability || DEFAULT_AVAILABILITY) as Availability,
    applianceType: searchMode ? "" : appliance_type || "",
    brands: searchMode ? [] : brands,
    partTypes: searchMode ? [] : part_types,
    page,
    perPage: per_page,
  };

  // ✅ Key must match client’s stableKeyFromSearchParamsString behavior
  const key = stableKeyFromParams(new URLSearchParams(itemsParams.toString()));

  const ssr =
    itemsJson?.ok === true
      ? {
          key,
          items: Array.isArray(itemsJson?.items) ? itemsJson.items : [],
          has_more: !!itemsJson?.has_more,
          page_inventory_total: typeof itemsJson?.page_inventory_total === "number" ? itemsJson.page_inventory_total : null,
          facets: null,
          total_count: null,
        }
      : undefined;

  return <PartsExplorer initial={initial} initialError={initialError} ssr={ssr} />;
}