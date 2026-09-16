import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export function normalizeOfferMpn(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function listingIdFromToken(value: string): string | null {
  const token = value.trim().replace(/%7c/gi, "|");
  if (/^\d{1,40}$/.test(token)) return token;
  return /^v1\|(\d{1,40})\|[^|]*$/i.exec(token)?.[1] ?? null;
}

export function offerDatabase(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return url && key
    ? createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
    : null;
}

// A lookup failure is never evidence that a slug is safe to reinterpret.
export async function resolveLegacyOffer(
  slug: string,
  token = "",
  db = offerDatabase(),
): Promise<string | null> {
  if (!db || !/^[a-z0-9][a-z0-9._-]*$/i.test(slug)) return null;
  const mpn = normalizeOfferMpn(slug);
  const [offers, parts] = await Promise.all([
    db.from("offers").select("mpn_norm").eq("mpn_norm", mpn).limit(1),
    db.from("parts").select("mpn_normalized").eq("mpn_normalized", mpn).limit(1),
  ]);
  if (offers.error || parts.error) return null;
  const isMpn = Boolean(offers.data?.length || parts.data?.length);
  const explicitId = listingIdFromToken(token);
  if (token && !explicitId) return null;
  const id = explicitId || (!isMpn && /^\d{1,40}$/.test(slug) ? slug : null);
  if (!id) return offers.data?.length ? `/offers/${mpn}` : null;

  const mapping = await db.from("offers").select("mpn,mpn_norm,listing_id")
    .eq("listing_id", id).limit(2);
  // Reject duplicates conservatively; never select an arbitrary listing row.
  if (mapping.error || mapping.data?.length !== 1) return null;
  const row = mapping.data[0];
  const target = normalizeOfferMpn(String(row.mpn_norm || ""));
  if (!target || target !== normalizeOfferMpn(String(row.mpn || ""))) return null;
  if (isMpn && target !== mpn) {
    return offers.data?.length ? `/offers/${mpn}` : null;
  }
  // An explicit token on an alphanumeric MPN must identify that same product.
  if (explicitId && !/^\d+$/.test(slug) && target !== mpn) return null;
  return `/offers/${target}?offer=${encodeURIComponent(id)}`;
}
