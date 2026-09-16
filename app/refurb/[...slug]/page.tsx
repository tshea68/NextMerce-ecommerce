import { redirect, permanentRedirect } from "next/navigation";
import { resolveLegacyOffer } from "@/lib/legacy-offer";

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

  const target = await resolveLegacyOffer(slug, offer);
  if (target) permanentRedirect(target);

  redirect(targetedGridUrl(slug));
}
