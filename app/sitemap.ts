import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";

const baseUrl = "https://www.appliancepartgeeks.com";

export const revalidate = 86400; // refresh daily

function enc(value: string | null | undefined): string | null {
  if (!value) return null;
  const v = String(value).trim();
  return v ? encodeURIComponent(v) : null;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const urls: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${baseUrl}/grid`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/shipping`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/returns`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/rare-part-request`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/find-model-number`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${baseUrl}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return urls;
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false },
  });

  const { data: offers, error: offersError } = await supabase
    .from("offers")
    .select("mpn, mpn_norm, created_at")
    .not("mpn_norm", "is", null)
    .not("mpn_norm", "eq", "")
    .not("mpn", "is", null)
    .gt("price", 0)
    .gt("inventory_total", 0)
    .order("inventory_total", { ascending: false, nullsFirst: false })
    .limit(10000);

  if (!offersError) {
    const seen = new Set<string>();

    for (const offer of offers || []) {
      // Use display/canonical MPN, not mpn_norm.
      // Product metadata now canonicalizes to /offers/{display MPN}.
      const mpn = enc(offer.mpn || offer.mpn_norm);
      if (!mpn) continue;

      const url = `${baseUrl}/offers/${mpn}`;
      if (seen.has(url)) continue;
      seen.add(url);

      urls.push({
        url,
        lastModified: offer.created_at || now,
        changeFrequency: "daily",
        priority: 0.8,
      });
    }
  }

  return urls;
}
