export const runtime = "edge";
export const dynamic = "force-dynamic";

import ProductPageServer from "@/app/_components/ProductPage.server";

export default async function Page({ params }: { params: { mpn: string } }) {
  return <ProductPageServer kind="parts" slug={params.mpn} />;
}