import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";

const baseUrl = "https://appliancepartgeeks.com";

export const revalidate = 86400; // rebuild daily

function cleanPathPart(value: string | null | undefined): string | null {
  if (!value) return null;
  const cleaned = String(value).trim();
  if (!cleaned) return null;
  return encodeURIComponent(cleaned);
}

function getSupabase() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL;

  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) return null;

  return createClient(url, key, {
    auth: { persistSession: false },
  });
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticUrls: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/grid`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/shipping`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/returns`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/rare-part-request`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/find-model-number`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  const supabase = getSupabase();

  if (!supabase) {
    return staticUrls;
  }

  const urls: MetadataRoute.Sitemap = [...staticUrls];

  const { data: offers } = await supabase
    .from("offers")
    .select("mpn_norm, mpn, updated_at, last_seen_at")
    .not("mpn_norm", "is", null)
    .gt("price", 0)
    .gt("inventory_total", 0)
    .limit(5000);

  for (const offer of offers || []) {
    const mpn = cleanPathPart(offer.mpn_norm || offer.mpn);
    if (!mpn) continue;

    urls.push({
      url: `${baseUrl}/offers/${mpn}`,
      lastModified: offer.updated_at || offer.last_seen_at || now,
      changeFrequency: "daily",
      priority: 0.8,
    });
  }

  const { data: parts } = await supabase
    .from("parts")
    .select("mpn, mpn_normalized, updated_at")
    .not("mpn", "is", null)
    .in("availability_rank", [1, 2])
    .limit(5000);

  for (const part of parts || []) {
    const mpn = cleanPathPart(part.mpn_normalized || part.mpn);
    if (!mpn) continue;

    urls.push({
      url: `${baseUrl}/parts/${mpn}`,
      lastModified: part.updated_at || now,
      changeFrequency: "weekly",
      priority: 0.75,
    });
  }

  const { data: models } = await supabase
    .from("models")
    .select("model_number, updated_at, total_links, available_count, priced_parts")
    .not("model_number", "is", null)
    .or("available_count.gt.0,priced_parts.gt.0,total_links.gt.0")
    .limit(5000);

  for (const model of models || []) {
    const modelNumber = cleanPathPart(model.model_number);
    if (!modelNumber) continue;

    urls.push({
      url: `${baseUrl}/model/${modelNumber}`,
      lastModified: model.updated_at || now,
      changeFrequency: "weekly",
      priority: 0.7,
    });
  }

  return urls;
}
