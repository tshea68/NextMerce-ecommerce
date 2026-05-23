import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

const API_BASE = (
  process.env.NEXT_PUBLIC_API_BASE || "https://api.appliancepartgeeks.com"
).replace(/\/+$/, "");

type SearchValue = string | string[] | undefined;

type PageProps = {
  params: Promise<{ slug?: string[] }> | { slug?: string[] };
  searchParams:
    | Promise<Record<string, SearchValue>>
    | Record<string, SearchValue>;
};

function firstValue(value: SearchValue): string {
  if (Array.isArray(value)) return value[0] || "";
  return value || "";
}

export default async function LegacyRefurbRedirectPage({
  params,
  searchParams,
}: PageProps) {
  const resolvedParams = await Promise.resolve(params);
  const resolvedSearchParams = await Promise.resolve(searchParams);

  const slug = (resolvedParams.slug || []).join("/");
  const offer = firstValue(resolvedSearchParams.offer);

  const qs = new URLSearchParams();
  qs.set("path", slug);
  if (offer) qs.set("offer", offer);

  try {
    const res = await fetch(`${API_BASE}/api/legacy/refurb-redirect?${qs.toString()}`, {
      cache: "no-store",
    });

    if (res.ok) {
      const data = await res.json();

      if (typeof data?.redirect_to === "string" && data.redirect_to.startsWith("/")) {
        redirect(data.redirect_to);
      }
    }
  } catch {
    // Fall through to safe catalog redirect.
  }

  redirect("/grid?condition=refurbished");
}
