import ProductPageServer from "@/components/ProductPage.server";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type MaybePromise<T> = T | Promise<T>;

export default async function PartsByMpnPage({
  params,
}: {
  params: MaybePromise<{ mpn: string }>;
}) {
  const { mpn } = await params;

  if (!mpn) notFound();

  return <ProductPageServer kind="parts" slug={mpn} />;
}