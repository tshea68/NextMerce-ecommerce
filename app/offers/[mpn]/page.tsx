import type { Metadata } from "next";
import { resolveLegacyOffer } from "@/lib/legacy-offer";
import ProductPageServer from "@/components/ProductPage.server";
import { notFound, permanentRedirect } from "next/navigation";
import { generateProductMetadata } from "@/lib/seo/productMetadata";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type MaybePromise<T> = T | Promise<T>;

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: MaybePromise<{ mpn: string }>;
  searchParams: MaybePromise<{ offer?: string | string[] }>;
}): Promise<Metadata> {
  const { mpn } = await params;
  const query = await searchParams;
  return generateProductMetadata("offers", mpn, typeof query.offer === "string" ? query.offer : undefined);
}

export default async function OffersByMpnPage({
  params,
  searchParams,
}: {
  params: MaybePromise<{ mpn: string }>;
  searchParams: MaybePromise<{ offer?: string | string[] }>;
}) {
  const { mpn } = await params;

  if (!mpn) notFound();

  const query = await searchParams;
  const offer = typeof query.offer === "string" ? query.offer : undefined;
  if (/^\d+$/.test(mpn)) {
    const target = await resolveLegacyOffer(mpn);
    if (target && target !== `/offers/${mpn}`) permanentRedirect(target);
  }

  return <ProductPageServer kind="offers" slug={mpn} offer={offer} />;
}
