import ProductPageServer, { getProductSeo } from "@/components/ProductPage.server";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function generateMetadata({ params }: { params: { mpn: string } }) {
  const seo = await getProductSeo("offers", params.mpn);
  if (!seo) return {};

  return {
    title: seo.title,
    description: seo.description,
    alternates: { canonical: `/offers/${encodeURIComponent(params.mpn)}` },
  };
}

export default async function OffersByMpnPage({ params }: { params: { mpn: string } }) {
  if (!params?.mpn) notFound();
  return <ProductPageServer kind="offers" slug={params.mpn} />;
}