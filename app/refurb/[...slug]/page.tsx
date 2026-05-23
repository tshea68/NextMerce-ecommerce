import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

const API_BASE = (
  process.env.LEGACY_REDIRECT_API_BASE ||
  process.env.NEXT_PUBLIC_API_BASE ||
  "https://api.appliancepartgeeks.com"
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

async function resolveLegacyRefurbRedirect(
  legacyPath: string,
  offer: string
): Promise<string> {
  const qs = new URLSearchParams();
  qs.set("path", legacyPath);
  if (offer) qs.set("offer", offer);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);

  try {
    const res = await fetch(`${API_BASE}/api/legacy/refurb-redirect?${qs.toString()}`, {
      cache: "no-store",
      signal: controller.signal,
    });

    if (!res.ok) return "/grid?condition=refurbished";

    const data = await res.json();

    if (typeof data?.redirect_to === "string" && data.redirect_to.startsWith("/")) {
      return data.redirect_to;
    }

    return "/grid?condition=refurbished";
  } catch {
    return "/grid?condition=refurbished";
  } finally {
    clearTimeout(timer);
  }
}

export default async function LegacyRefurbRedirectPage({
  params,
  searchParams,
}: PageProps) {
  const resolvedParams = await Promise.resolve(params);
  const resolvedSearchParams = await Promise.resolve(searchParams);

  const slug = (resolvedParams.slug || []).join("/");
  const offer = firstValue(resolvedSearchParams.offer);

  const destination = await resolveLegacyRefurbRedirect(slug, offer);

  redirect(destination);
}
