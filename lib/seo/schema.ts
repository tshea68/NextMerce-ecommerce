type BreadcrumbItem = {
  label: string;
  href?: string;
};

type ProductLike = {
  mpn?: string | null;
  part_number?: string | null;
  title?: string | null;
  title_display?: string | null;
  feed_title?: string | null;
  description?: string | null;
  brand?: string | null;
  image_url?: string | null;
  price?: number | string | null;
  currency?: string | null;
  is_refurb?: boolean | null;
  stock_status_canon?: string | null;
  availability_rank?: number | null;
  inventory_total?: number | null;
  breadcrumb_items?: BreadcrumbItem[] | null;
};

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const n = Number(value.replace(/[^0-9.-]/g, ""));
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function normalize(value: unknown) {
  return String(value ?? "").trim().toLowerCase();
}

export function getSchemaAvailability(p: ProductLike) {
  const qty = asNumber(p.inventory_total) ?? 0;
  const rank = Number(p.availability_rank ?? NaN);
  const canon = normalize(p.stock_status_canon);

  if (
    rank === 9 ||
    canon.includes("nla") ||
    canon.includes("no longer available") ||
    canon.includes("discontinued") ||
    canon.includes("obsolete") ||
    canon.includes("unavailable")
  ) {
    return "https://schema.org/OutOfStock";
  }

  if (qty > 0) {
    return "https://schema.org/InStock";
  }

  return "https://schema.org/BackOrder";
}

export function buildProductSchema(
  p: ProductLike,
  url: string
): Record<string, any> {
  const name =
    p.title_display ||
    p.feed_title ||
    p.title ||
    p.mpn ||
    p.part_number ||
    "Appliance Part";

  const price = asNumber(p.price);

  const schema: Record<string, any> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    url,
    sku: p.mpn || p.part_number || undefined,
    mpn: p.mpn || p.part_number || undefined,
    description: p.description || undefined,
    brand: p.brand
      ? {
          "@type": "Brand",
          name: p.brand,
        }
      : undefined,
    image: p.image_url ? [p.image_url] : undefined,
    itemCondition: p.is_refurb
      ? "https://schema.org/RefurbishedCondition"
      : "https://schema.org/NewCondition",
    offers: {
      "@type": "Offer",
      url,
      price: price != null ? price.toFixed(2) : undefined,
      priceCurrency: (p.currency || "USD").toString().toUpperCase(),
      availability: getSchemaAvailability(p),
      itemCondition: p.is_refurb
        ? "https://schema.org/RefurbishedCondition"
        : "https://schema.org/NewCondition",
    },
  };

  return JSON.parse(JSON.stringify(schema));
}

export function buildBreadcrumbSchema(
  items: BreadcrumbItem[] | null | undefined,
  siteUrl: string
): Record<string, any> | null {
  const arr = Array.isArray(items) ? items : [];
  if (!arr.length) return null;

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: arr.map((item, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: item.label,
      item: item.href
        ? `${siteUrl.replace(/\/+$/, "")}${item.href.startsWith("/") ? "" : "/"}${item.href}`
        : undefined,
    })),
  };
}
