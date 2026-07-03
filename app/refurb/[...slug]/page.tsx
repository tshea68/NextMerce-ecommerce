import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type SearchValue = string | string[] | undefined;

type PageProps = {
  params: Promise<{ slug?: string[] }> | { slug?: string[] };
  searchParams:
    | Promise<Record<string, SearchValue>>
    | Record<string, SearchValue>;
};

function firstValue(value: SearchValue): string {
  if (Array.isArray(value)) return value[0] || "";
  return value || "";
}

function looksLikeMpn(value: string): boolean {
  const cleaned = value.trim();
  return /^[a-z0-9][a-z0-9._-]{2,}$/i.test(cleaned);
}

function looksLikeListingId(value: string): boolean {
  return /^\d{8,20}$/.test(value.trim());
}

function listingIdFromOfferToken(offer: string): string {
  const raw = String(offer || "").trim();
  if (!raw) return "";

  // Usually: v1|listing_id|variation_id
  const decoded = raw.replace(/%7C/gi, "|");
  const parts = decoded.split("|").map((x) => x.trim()).filter(Boolean);

  for (const part of parts) {
    if (looksLikeListingId(part)) return part;
  }

  return "";
}

function offersUrl(slug: string, offer: string): string {
  const cleanedSlug = slug.trim();
  const listingId = listingIdFromOfferToken(offer);
  const targetSlug = listingId || cleanedSlug;

  const qs = new URLSearchParams();
  if (offer) qs.set("offer", offer);
  if (listingId && cleanedSlug) qs.set("mpn", cleanedSlug);

  const query = qs.toString();
  return `/offers/${encodeURIComponent(targetSlug)}${query ? `?${query}` : ""}`;
}

function targetedGridUrl(value: string): string {
  const cleaned = value.trim();

  const qs = new URLSearchParams();
  qs.set("condition", "refurb");

  if (cleaned) {
    qs.set("q", cleaned);
    qs.set("mpn", cleaned);
    qs.set("search", cleaned);
  }

  return `/grid?${qs.toString()}`;
}

export default async function RefurbLandingPage({
  params,
  searchParams,
}: PageProps) {
  const resolvedParams = await Promise.resolve(params);
  const resolvedSearchParams = await Promise.resolve(searchParams);

  const slug = (resolvedParams.slug || []).join("/").trim();
  const offer = firstValue(resolvedSearchParams.offer);

  // Shopping feed format:
  // /refurb/{mpn}?offer=v1|listing_id|variation_id
  //
  // Use listing_id from the offer token when available because /offers/[slug]
  // already resolves listing_id directly.
  if (looksLikeMpn(slug)) {
    redirect(offersUrl(slug, offer));
  }

  redirect(targetedGridUrl(slug));
}
