import { createClient } from "@supabase/supabase-js";

const baseUrl = "https://www.appliancepartgeeks.com";
const OFFER_PAGE_SIZE = 5000;

export const revalidate = 86400;

function xmlEscape(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function sitemapEntry(loc: string, lastmod?: string): string {
  return [
    "  <sitemap>",
    `    <loc>${xmlEscape(loc)}</loc>`,
    lastmod ? `    <lastmod>${xmlEscape(lastmod)}</lastmod>` : "",
    "  </sitemap>",
  ]
    .filter(Boolean)
    .join("\n");
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

export async function GET() {
  const now = new Date().toISOString();
  const entries: string[] = [sitemapEntry(`${baseUrl}/sitemaps/static`, now)];

  const supabase = getSupabaseClient();

  if (supabase) {
    const { count, error } = await supabase
      .from("offers")
      .select("mpn_norm", { count: "exact", head: true })
      .not("mpn_norm", "is", null)
      .not("mpn_norm", "eq", "")
      .not("mpn", "is", null)
      .gt("price", 0)
      .gt("inventory_total", 0);

    if (!error && typeof count === "number" && count > 0) {
      const pages = Math.ceil(count / OFFER_PAGE_SIZE);

      for (let page = 1; page <= pages; page += 1) {
        entries.push(sitemapEntry(`${baseUrl}/sitemaps/offers/${page}`, now));
      }
    }
  }

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join("\n")}
</sitemapindex>
`;

  return new Response(body, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=3600",
    },
  });
}
