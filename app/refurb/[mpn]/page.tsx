export const runtime = "edge";
export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";

export default async function RefurbAlias(props: any) {
  const params = await props.params;
  const mpn = params?.mpn ? String(params.mpn) : "";
  redirect(`/offers/${encodeURIComponent(mpn)}`);
}