import type { Metadata } from "next";
import ProductPageServer from "@/components/ProductPage.server";
import { notFound } from "next/navigation";
import { generateProductMetadata } from "@/lib/seo/productMetadata";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type MaybePromise<T> = T | Promise<T>;

export async function generateMetadata({
  params,
}: {
  params: MaybePromise<{ mpn: string }>;
}): Promise<Metadata> {
  const { mpn } = await params;
  return generateProductMetadata("offers", mpn);
}

export default async function OffersByMpnPage({
  params,
}: {
  params: MaybePromise<{ mpn: string }>;
}) {
  const { mpn } = await params;

  if (!mpn) notFound();

  return <ProductPageServer kind="offers" slug={mpn} />;
}
