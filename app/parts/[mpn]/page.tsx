export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import ProductPageServer from "@/components/ProductPage.server";

type MaybePromise<T> = T | Promise<T>;

export default async function PartsByMpnPage({
  params,
}: {
  params: MaybePromise<{ mpn: string }>;
}) {
  const { mpn } = await params;
  return <ProductPageServer kind="parts" slug={mpn} />;
}