import ProductPageServer from "@/components/ProductPage.server";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type MaybePromise<T> = T | Promise<T>;

export default async function OffersByMpnPage({
  params,
}: {
  params: MaybePromise<{ mpn: string }>;
}) {
  const { mpn } = await params;

  if (!mpn) notFound();

  return <ProductPageServer kind="offers" slug={mpn} />;
}