export const runtime = "edge";
export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";

function first(v: any): string {
  if (Array.isArray(v)) return String(v[0] ?? "");
  return String(v ?? "");
}

export default async function ProductAlias(props: any) {
  const params = await props?.params;
  const searchParams = await props?.searchParams;

  const slugDecoded = decodeURIComponent(first(params?.slug)).trim();
  const offerDecoded = decodeURIComponent(first(searchParams?.offer)).trim();

  const slug = encodeURIComponent(slugDecoded);
  const qs = offerDecoded ? `?offer=${encodeURIComponent(offerDecoded)}` : "";

  if (offerDecoded) redirect(`/offers/${slug}${qs}`);
  redirect(`/parts/${slug}`);
}
