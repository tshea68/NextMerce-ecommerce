export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import ProductPageServer from "@/components/ProductPage.server";

type MaybePromise<T> = T | Promise<T>;

export default async function OffersByMpnPage({
  params,
}: {
  params: MaybePromise<{ mpn: string }>;
}) {
  const { mpn } = await params;

  return <ProductPageServer kind="offers" slug={mpn} />;
}