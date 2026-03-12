export type PartDisplayInput = {
  mpn?: string | null;
  title?: string | null;
  title_display?: string | null;
  feed_title?: string | null;
  brand?: string | null;
  appliance_type?: string | null;
  part_type?: string | null;
  specific_part_type?: string | null;
  canonical_part_type?: string | null;
  price?: number | string | null;
  stock_status?: string | null;
  stock_status_canon?: string | null;
  alternatives_count?: number | null;
  refurb_count?: number | null;
};

export function bestPartTitle(part: PartDisplayInput): string {
  const titleDisplay = String(part.title_display ?? "").trim();
  if (titleDisplay) return titleDisplay;

  const feedTitle = String(part.feed_title ?? "").trim();
  if (feedTitle) return feedTitle;

  const brand = String(part.brand ?? "").trim();
  const mpn = String(part.mpn ?? "").trim();
  const rawTitle = String(part.title ?? "").trim();

  const generated = [brand, mpn, rawTitle].filter(Boolean).join(" ");
  return generated || mpn || rawTitle || "Part";
}

export function bestPartType(part: PartDisplayInput): string {
  return (
    String(part.canonical_part_type ?? "").trim() ||
    String(part.specific_part_type ?? "").trim() ||
    String(part.part_type ?? "").trim() ||
    "Part"
  );
}

export function formatUsd(value: unknown): string {
  const n = Number(value);
  if (!Number.isFinite(n)) return "";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(n);
}

export function getStockLabel(part: PartDisplayInput): string {
  const canon = String(part.stock_status_canon ?? "").trim().toLowerCase();
  const raw = String(part.stock_status ?? "").trim();

  if (canon === "in_stock") return "In stock";
  if (canon === "orderable") return "Orderable";
  if (canon) {
    return canon
      .replace(/_/g, " ")
      .replace(/\b\w/g, (m) => m.toUpperCase());
  }

  return raw || "";
}

export function getAlternativesBadgeText(part: PartDisplayInput): string {
  const count = Number(part.alternatives_count ?? part.refurb_count ?? 0);
  if (!Number.isFinite(count) || count <= 0) return "";
  return count === 1 ? "1 refurb alternative" : `${count} refurb alternatives`;
}