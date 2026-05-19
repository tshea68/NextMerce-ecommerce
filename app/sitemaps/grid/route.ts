const baseUrl = "https://www.appliancepartgeeks.com";

export const revalidate = 86400;

const BRANDS = [
  "Samsung",
  "Whirlpool",
  "GE",
  "LG",
  "Frigidaire",
  "Maytag",
  "KitchenAid",
  "Bosch",
  "Kenmore",
];

const APPLIANCE_TYPES = [
  "Washer",
  "Dryer",
  "Refrigerator",
  "Dishwasher",
  "Range",
  "Microwave",
];

const CONDITIONS = ["refurb", "new"] as const;

function xmlEscape(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function gridUrl(params: {
  condition: "refurb" | "new";
  brand?: string;
  applianceType?: string;
}) {
  const sp = new URLSearchParams();
  sp.set("condition", params.condition);
  sp.set("availability", "all");

  if (params.brand) sp.append("brands", params.brand);
  if (params.applianceType) sp.set("appliance_type", params.applianceType);

  return `${baseUrl}/grid?${sp.toString()}`;
}

function urlEntry(url: string, lastmod: string, priority: string): string {
  return `  <url>
    <loc>${xmlEscape(url)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>daily</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

export async function GET() {
  const now = new Date().toISOString();
  const urls = new Set<string>();

  // Broad condition landing pages
  for (const condition of CONDITIONS) {
    urls.add(gridUrl({ condition }));
  }

  // Brand landing pages
  for (const condition of CONDITIONS) {
    for (const brand of BRANDS) {
      urls.add(gridUrl({ condition, brand }));
    }
  }

  // Brand + appliance landing pages
  for (const condition of CONDITIONS) {
    for (const brand of BRANDS) {
      for (const applianceType of APPLIANCE_TYPES) {
        urls.add(gridUrl({ condition, brand, applianceType }));
      }
    }
  }

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${Array.from(urls)
  .map((url) => {
    const isBroad = !url.includes("brands=");
    const isBrandOnly = url.includes("brands=") && !url.includes("appliance_type=");
    return urlEntry(url, now, isBroad ? "0.75" : isBrandOnly ? "0.7" : "0.65");
  })
  .join("\n")}
</urlset>
`;

  return new Response(body, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=3600",
    },
  });
}
