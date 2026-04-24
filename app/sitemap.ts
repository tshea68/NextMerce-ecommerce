import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";

const baseUrl = "https://appliancepartgeeks.com";

export const revalidate = 86400;

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
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) return urls;

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false },
  });

  const { data: offers } = await supabase
    .from("offers")
    .select("mpn_norm, mpn, created_at")
    .not("mpn_norm", "is", null)
    .not("mpn_norm", "eq", "")
    .not("mpn", "is", null)
    .gt("price", 0)
    .gt("inventory_total", 0)
    .limit(10000);

  for (const offer of offers || []) {
    const mpn = enc(offer.mpn_norm || offer.mpn);
    if (!mpn) continue;

    urls.push({
      url: `${baseUrl}/offers/${mpn}`,
      lastModified: offer.created_at || now,
      changeFrequency: "daily",
      priority: 0.8,
    });
  }

  return urls;
}
