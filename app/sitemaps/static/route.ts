const baseUrl = "https://www.appliancepartgeeks.com";

export const revalidate = 86400;

type StaticUrl = {
  url: string;
  changefreq: "daily" | "weekly" | "monthly" | "yearly";
  priority: string;
};

const staticUrls: StaticUrl[] = [
  { url: `${baseUrl}/`, changefreq: "daily", priority: "1.0" },
  { url: `${baseUrl}/grid`, changefreq: "daily", priority: "0.9" },
  { url: `${baseUrl}/shipping`, changefreq: "monthly", priority: "0.5" },
  { url: `${baseUrl}/returns`, changefreq: "monthly", priority: "0.5" },
  { url: `${baseUrl}/rare-part-request`, changefreq: "monthly", priority: "0.5" },
  { url: `${baseUrl}/find-model-number`, changefreq: "monthly", priority: "0.5" },
  { url: `${baseUrl}/privacy`, changefreq: "yearly", priority: "0.3" },
  { url: `${baseUrl}/terms`, changefreq: "yearly", priority: "0.3" },
];

function xmlEscape(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function urlEntry(item: StaticUrl, lastmod: string): string {
  return `  <url>
    <loc>${xmlEscape(item.url)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${item.changefreq}</changefreq>
    <priority>${item.priority}</priority>
  </url>`;
}

export async function GET() {
  const now = new Date().toISOString();

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticUrls.map((item) => urlEntry(item, now)).join("\n")}
</urlset>
`;

  return new Response(body, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=3600",
    },
  });
}
