import type {
  LivePartResponse,
  LivePartResult,
  SourceHealthResponse,
} from "@/types/live-part-search";

export const API_BASE =
  (process.env.NEXT_PUBLIC_API_BASE || "https://api.appliancepartgeeks.com").replace(/\/+$/, "");

export const MONITORED_OEM_SOURCES = [
  "samsungparts",
  "genuinereplacementparts",
  "lgparts",
];

export function sellerLabel(sellerKey: string) {
  const labels: Record<string, string> = {
    apg_internal: "APG",
    genuinereplacementparts: "GRP",
    samsungparts: "SamsungParts",
    lgparts: "LG Parts",
    ebay: "eBay",
  };

  return labels[sellerKey] || sellerKey;
}

export function oemSourceLabel(sellerKey: string) {
  const labels: Record<string, string> = {
    samsungparts: "SamsungParts",
    genuinereplacementparts: "Genuine Replacement Parts",
    lgparts: "LG Parts",
  };

  return labels[sellerKey] || sellerLabel(sellerKey);
}

export function money(value: number | null | undefined, currency = "USD") {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(value);
}

export function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function isUsedLike(row: LivePartResult) {
  const text = `${row.condition || ""} ${row.display_bucket || ""} ${row.seller_key || ""}`.toLowerCase();

  return (
    text.includes("refurb") ||
    text.includes("used") ||
    text.includes("pre-owned") ||
    text.includes("marketplace")
  );
}

export function isOemDistributor(row: LivePartResult) {
  if (row.seller_key === "ebay") return false;
  if (row.seller_key === "apg_internal") return false;

  return !isUsedLike(row);
}

export function customOrderPrice(sourcePrice: number | null | undefined) {
  if (sourcePrice === null || sourcePrice === undefined || Number.isNaN(sourcePrice)) return null;

  return sourcePrice + 10;
}

export function sourceCount(sources: SourceHealthResponse | null, sellerKey: string) {
  return sources?.sources?.find((source) => source.seller_key === sellerKey)?.candidate_count || 0;
}

export function normalizeResponseToSources(json: LivePartResponse): SourceHealthResponse {
  return {
    searched_mpn: json.searched_mpn,
    searched_mpn_norm: json.searched_mpn_norm,
    source_count: json.source_count || json.sources?.length || 0,
    sources: json.sources || [],
  };
}

export async function loadSavedLivePartSearch(mpn: string) {
  const clean = mpn.trim();

  const [resultRes, sourceRes] = await Promise.all([
    fetch(`${API_BASE}/api/live-part-search/${encodeURIComponent(clean)}`, {
      cache: "no-store",
    }),
    fetch(`${API_BASE}/api/live-part-search/${encodeURIComponent(clean)}/sources`, {
      cache: "no-store",
    }),
  ]);

  if (!resultRes.ok) {
    throw new Error(`Result request failed: ${resultRes.status}`);
  }

  if (!sourceRes.ok) {
    throw new Error(`Source request failed: ${sourceRes.status}`);
  }

  const data = (await resultRes.json()) as LivePartResponse;
  const sources = (await sourceRes.json()) as SourceHealthResponse;

  return { data, sources };
}

export async function refreshLivePartSearch(mpn: string) {
  const clean = mpn.trim();

  const refreshRes = await fetch(
    `${API_BASE}/api/live-part-search/${encodeURIComponent(clean)}/refresh`,
    {
      method: "POST",
      cache: "no-store",
    }
  );

  if (!refreshRes.ok) {
    let detail = "";

    try {
      const errJson = await refreshRes.json();
      detail = errJson?.detail ? `: ${errJson.detail}` : "";
    } catch {
      // ignore JSON parse failure
    }

    throw new Error(`Refresh request failed: ${refreshRes.status}${detail}`);
  }

  const refreshJson = (await refreshRes.json()) as LivePartResponse;

  const data: LivePartResponse = {
    searched_mpn: refreshJson.searched_mpn,
    searched_mpn_norm: refreshJson.searched_mpn_norm,
    saved_run_id: refreshJson.saved_run_id,
    result_count: refreshJson.result_count,
    source_count: refreshJson.source_count,
    results: refreshJson.results || [],
    sources: refreshJson.sources || [],
  };

  const sources = normalizeResponseToSources(refreshJson);

  return { data, sources };
}

export function splitLivePartRows(
  data: LivePartResponse | null,
  sources: SourceHealthResponse | null
) {
  const rows = data?.results || [];

  const apgRows = rows.filter((row) => row.seller_key === "apg_internal");

  const oemRows = rows.filter((row) => isOemDistributor(row));

  const marketplaceRefurbRows = rows
    .filter((row) => row.seller_key === "ebay" && isUsedLike(row))
    .sort((a, b) => (a.price ?? 999999) - (b.price ?? 999999));

  const bestMarketplaceRefurb = marketplaceRefurbRows[0] || null;

  const ebayCandidateCount = sourceCount(sources, "ebay");

  return {
    apgRows,
    oemRows,
    marketplaceRefurbRows,
    bestMarketplaceRefurb,
    ebayCandidateCount,
  };
}
