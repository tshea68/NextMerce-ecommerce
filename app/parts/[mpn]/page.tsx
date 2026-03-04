import ProductPageServer, { getProductSeo } from "@/components/ProductPage.server";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function generateMetadata({ params }: { params: { mpn: string } }) {
  const seo = await getProductSeo("parts", params.mpn);
  if (!seo) return {};

  return {
    title: seo.title,
    description: seo.description,
    alternates: { canonical: `/parts/${encodeURIComponent(params.mpn)}` },
  };
}

export default async function PartsByMpnPage({ params }: { params: { mpn: string } }) {
  if (!params?.mpn) notFound();
  return <ProductPageServer kind="parts" slug={params.mpn} />;
}