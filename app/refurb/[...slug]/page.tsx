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

function targetedRefurbGridUrl(mpn: string, offer: string): string {
  const cleaned = mpn.trim();

  const qs = new URLSearchParams();
  qs.set("condition", "refurb");
  qs.set("q", cleaned);
  qs.set("mpn", cleaned);
  qs.set("search", cleaned);

  if (offer) qs.set("offer", offer);

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

  // Current Shopping feed format:
  // /refurb/w10157246?offer=...
  //
  // Never let this collapse to a generic /grid page.
  if (looksLikeMpn(slug)) {
    redirect(targetedRefurbGridUrl(slug, offer));
  }

  redirect("/grid?condition=refurb");
}
