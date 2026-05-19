import { createClient } from "@supabase/supabase-js";

const baseUrl = "https://www.appliancepartgeeks.com";
const OFFER_PAGE_SIZE = 5000;

export const revalidate = 86400;

type OfferRow = {
  mpn: string | null;
  mpn_norm: string | null;
  created_at: string | null;
};

function xmlEscape(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function enc(value: string | null | undefined): string | null {
  if (!value) return null;
  const v = String(value).trim();
  return v ? encodeURIComponent(v) : null;
}

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) return null;

  return createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false },
  });
}

function urlEntry(url: string, lastmod: string): string {
  return `  <url>
    <loc>${xmlEscape(url)}</loc>
    <lastmod>${xmlEscape(lastmod)}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`;
}

async function resolveParams(
  params: Promise<{ page: string }> | { page: string }
): Promise<{ page: string }> {
  return await Promise.resolve(params);
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ page: string }> | { page: string } }
) {
  const { page: pageRaw } = await resolveParams(context.params);
  const page = Number.parseInt(pageRaw, 10);

  if (!Number.isFinite(page) || page < 1) {
    return new Response("Invalid sitemap page", { status: 404 });
  }

  const supabase = getSupabaseClient();

  if (!supabase) {
    return new Response("Supabase env vars missing", { status: 500 });
  }

  const from = (page - 1) * OFFER_PAGE_SIZE;
  const to = from + OFFER_PAGE_SIZE - 1;

  const { data, error } = await supabase
    .from("offers")
    .select("mpn, mpn_norm, created_at")
    .not("mpn_norm", "is", null)
    .not("mpn_norm", "eq", "")
    .not("mpn", "is", null)
    .gt("price", 0)
    .gt("inventory_total", 0)
    .order("inventory_total", { ascending: false, nullsFirst: false })
    .order("mpn_norm", { ascending: true, nullsFirst: false })
    .range(from, to);

  if (error) {
    return new Response(`Sitemap query failed: ${error.message}`, {
      status: 500,
    });
  }

  const seen = new Set<string>();
  const now = new Date().toISOString();
  const urls: string[] = [];

  for (const offer of (data || []) as OfferRow[]) {
    // Use display/canonical MPN first. This must match product metadata canonicals.
    const mpn = enc(offer.mpn || offer.mpn_norm);
    if (!mpn) continue;

    const url = `${baseUrl}/offers/${mpn}`;
    if (seen.has(url)) continue;
    seen.add(url);

    urls.push(urlEntry(url, offer.created_at || now));
  }

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>
`;

  return new Response(body, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=3600",
    },
  });
}
