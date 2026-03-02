export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import ProductPageServer from "@/components/ProductPage.server";

export default async function PartByMpnPage({
  params,
}: {
  params: { mpn: string };
}) {
  return <ProductPageServer kind="parts" slug={params.mpn} />;
}
