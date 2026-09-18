import { amount, compareSellers } from "./seller-comparison";

type RecordRow = Record<string, unknown>;
export type AvailabilityState = "stock" | "backorder" | "unavailable" | "inconclusive";
export type AttemptedOffer = {
  price: number | null; currency: string | null; shipping_cost: number | null;
  shipping_text: string | null; returns_text: string | null; condition: string | null;
  product_url: string | null; url: string | null; destination_url: string | null; source_url: string | null;
  relationship: string | null; matched_mpn: string | null; raw: RecordRow;
};
export type AttemptedSeller = {
  key: string; name: string; group: "new" | "refurb"; check: RecordRow;
  offer: AttemptedOffer | null; state: AvailabilityState; label: string;
  pending: boolean; sources: (keyof AttemptedPayloads)[];
};
export type AttemptedPayloads = {
  newMarket: RecordRow | null; refurbMarket: RecordRow | null; catalog: RecordRow | null;
};
const str = (value: unknown): string => typeof value === "string" ? value.trim() : "";
const rows = (value: unknown): RecordRow[] => Array.isArray(value) ? value.filter((r): r is RecordRow => !!r && typeof r === "object") : [];
export const isCheckRunning = (status: unknown) => /^(?:searching|running|pending|in[ _-]progress|checking|queued|waiting|processing)$/i.test(str(status));
const record = (value: unknown): RecordRow => value && typeof value === "object" && !Array.isArray(value) ? value as RecordRow : {};
const norm = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "");
function identity(value: string) {
  const key = norm(value);
  return ["apg", "apginternal", "appliancepartgeeks", "partssherpaappliancepartgeeks"].includes(key) ? "apg" : key;
}
function fallbackGroup(row: RecordRow): "new" | "refurb" {
  return /refurb|used|pre.?owned|marketplace|ebay/i.test([row.condition, row.display_bucket, row.seller_key].join(" ")) ? "refurb" : "new";
}
function numeric(value: unknown) { return typeof value === "number" ? amount(value) : null; }
function normalizeOffer(row: RecordRow, mpn: string): AttemptedOffer {
  const matched = str(row.matched_mpn) || str(row.item_mpn) || str(row.mpn);
  return {
    price: numeric(row.price ?? row.item_price), currency: str(row.currency) || null,
    shipping_cost: numeric(row.shipping_cost ?? row.shipping_price ?? row.shipping),
    shipping_text: str(row.shipping_text) || str(row.shipping) || null,
    returns_text: str(row.returns_text) || str(row.returns) || null,
    condition: str(row.condition) || (row.is_new_genuine_oem === true ? "New OEM" : null),
    product_url: str(row.product_url) || null, url: str(row.url) || null,
    destination_url: str(row.destination_url) || null, source_url: str(row.source_url) || null,
    relationship: str(row.relationship) || (row.exact_mpn_match === false ? "related" : row.exact_mpn_match === true || matched && norm(matched) === norm(mpn) ? "exact" : null),
    matched_mpn: matched || null, raw: row,
  };
}
export function sellerAvailability(check: RecordRow, offer: AttemptedOffer | null): { state: AvailabilityState; label: string } {
  const status = [check.search_status, check.status].map(str).join(" ").toLowerCase().replace(/[_-]+/g, " ");
  // Failed checks never prove that a seller has no available product.
  if (check.error || check.fetch_ok === false || /failed|failure|error|timeout|timed out|blocked|inconclusive|skipped/.test(status) || /not supported|unsupported/i.test(str(check.availability_text))) return { state: "inconclusive", label: "Could not verify" };
  if (isCheckRunning(check.search_status) || isCheckRunning(check.status) || /searching|running|pending|in progress/.test(status)) return { state: "inconclusive", label: "Checking…" };
  if (/not found|no results?|no match|empty/.test(status)) return { state: "unavailable", label: "Not Available" };
  const raw = offer?.raw || {};
  const availability = [check.availability, check.availability_text, check.stock_status, raw.availability, raw.stock_status].map(str).join(" ").toLowerCase().replace(/[_-]+/g, " ");
  if (/back ?order|orderable|ships later|usually ships|special order|pre ?order|on order|available for order/.test(availability)) return { state: "backorder", label: "Backorder / Orderable" };
  if (raw.available === false || /out of stock|not in stock|not available|unavailable|discontinued|sold out|no longer available/.test(availability)) return { state: "unavailable", label: "Not Available" };
  if (/\bin stock\b|\binstock\b|ships? (today|same day|immediately)|available now/.test(availability)) return { state: "stock", label: "In Stock" };
  if (!offer && /complete|success|\bok\b/.test(status) && (check.offer_count === 0 || check.candidate_count === 0)) return { state: "unavailable", label: "Not Available" };
  return { state: "inconclusive", label: "—" };
}

/** The roster comes only from backend selections, checks, sources, and offers. */
export function buildAttemptedSellers(payloads: AttemptedPayloads, mpn: string): AttemptedSeller[] {
  const sellers = new Map<string, { key: string; name: string; group: "new" | "refurb"; check: RecordRow; candidates: AttemptedOffer[]; sources: Set<keyof AttemptedPayloads> }>();
  const aliases = new Map<string, string>();
  function add(name: string, group: "new" | "refurb", source: keyof AttemptedPayloads, check: RecordRow = {}, sellerKey = "") {
    const key = aliases.get(identity(sellerKey)) || aliases.get(identity(name)) || identity(name || sellerKey);
    if (!key) return null;
    let seller = sellers.get(key);
    if (!seller) {
      seller = { key, name: name || sellerKey, group, check: {}, candidates: [], sources: new Set() };
      sellers.set(key, seller);
    }
    seller.sources.add(source);
    // A later reported status replaces an earlier status from another source.
    if (check.search_status != null && check.status == null) delete seller.check.status;
    if (check.status != null && check.search_status == null) delete seller.check.search_status;
    seller.check = { ...seller.check, ...check };
    if (name) seller.name = name;
    if (sellerKey) aliases.set(identity(sellerKey), key);
    if (name) aliases.set(identity(name), key);
    return seller;
  }
  const market = payloads.newMarket || {};
  for (const name of Array.isArray(market.selected_sellers) ? market.selected_sellers : []) {
    if (str(name)) add(str(name), "new", "newMarket");
  }
  for (const [key, raw] of Object.entries(record(market.seller_dispositions))) {
    const check = record(raw);
    add(str(check.seller) || key, "new", "newMarket", check, str(check.seller_key));
  }
  const progress = record(market.progress);
  const pendingSelections = new Set((Array.isArray(progress.pending_groups) ? progress.pending_groups : []).map(name => identity(str(name))));
  for (const name of Array.isArray(progress.failed_groups) ? progress.failed_groups : []) {
    if (str(name)) add(str(name), "new", "newMarket", { search_status: "failed" });
  }
  for (const name of Array.isArray(progress.completed_groups) ? progress.completed_groups : []) {
    if (str(name)) {
      const seller = add(str(name), "new", "newMarket");
      if (seller && !seller.check.search_status && !seller.check.status) seller.check.search_status = "complete";
    }
  }
  for (const name of Array.isArray(progress.pending_groups) ? progress.pending_groups : []) {
    if (str(name)) add(str(name), "new", "newMarket");
  }
  const used = record(payloads.refurbMarket?.used_seller_comparison);
  for (const check of rows(used.seller_statuses)) add(str(check.seller) || str(check.seller_name), "refurb", "refurbMarket", check, str(check.seller_key));
  const catalogOffers = rows(payloads.catalog?.results);
  for (const check of rows(payloads.catalog?.sources)) {
    const offer = catalogOffers.find(r => identity(str(r.seller_name) || str(r.seller_key)) === identity(str(check.seller_name) || str(check.seller_key)));
    add(str(check.seller_name), fallbackGroup(offer || check), "catalog", check, str(check.seller_key));
  }
  function addOffers(offers: RecordRow[], source: keyof AttemptedPayloads, group?: "new" | "refurb") {
    for (const raw of offers) {
      const seller = add(str(raw.seller) || str(raw.seller_name), group || fallbackGroup(raw), source, {}, str(raw.seller_key));
      if (seller) seller.candidates.push(normalizeOffer(raw, mpn));
    }
  }
  // Use offers, not display_offers: the latter intentionally excludes unavailable offers.
  addOffers(rows(market.offers), "newMarket", "new");
  addOffers(rows(market.display_offers), "newMarket", "new");
  addOffers(rows(payloads.refurbMarket?.used_seller_competitors), "refurbMarket", "refurb");
  addOffers(catalogOffers, "catalog");
  return [...sellers.values()].map(seller => {
    const offer = seller.candidates.sort(compareSellers)[0] || null;
    const check = { ...seller.check };
    // Selected sellers are pending only until their own result arrives. A
    // completed seller must not inherit the overall market's searching status.
    if (seller.sources.has("newMarket") && (isCheckRunning(market.status) || pendingSelections.has(seller.key) || pendingSelections.has(identity(seller.name))) && !check.search_status && !check.status && !offer) check.search_status = "searching";
    const availability = sellerAvailability(check, offer);
    return { key: seller.key, name: seller.name, group: seller.group, check, offer,
      ...availability, pending: availability.label === "Checking…", sources: [...seller.sources] };
  }).sort((a, b) => compareSellers(a.offer || {}, b.offer || {}) || a.name.localeCompare(b.name));
}

export function hasReportedSellerResult(row: AttemptedSeller) {
  return !row.pending && (!!row.offer || row.state !== "inconclusive" || !!row.check.error || row.check.fetch_ok === false ||
    /found|complete|success|not[ _-]found|failed|failure|error|timeout|timed[ _-]out|blocked|inconclusive|skipped|unsupported|\bok\b/i.test([row.check.search_status, row.check.status].join(" ")));
}
