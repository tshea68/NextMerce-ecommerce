import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

// Use the public FastAPI domain directly for legacy SEO redirects.
// Do not depend on NEXT_PUBLIC_API_BASE here; that may point at a frontend-relative
// or stale environment value and cause this route to fall back.
const API_BASE = "https://api.appliancepartgeeks.com";

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

function fallbackGridUrl(legacyPath: string): string {
  const cleaned = legacyPath.trim();

  if (!cleaned) {
    return fallbackGridUrl(legacyPath);
  }

  const qs = new URLSearchParams();
  qs.set("condition", "refurbished");
  qs.set("q", cleaned);

  return `/grid?${qs.toString()}`;
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

    if (!res.ok) return fallbackGridUrl(legacyPath);

    const data = await res.json();

    if (typeof data?.redirect_to === "string" && data.redirect_to.startsWith("/")) {
      return data.redirect_to;
    }

    return fallbackGridUrl(legacyPath);
  } catch {
    return fallbackGridUrl(legacyPath);
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
