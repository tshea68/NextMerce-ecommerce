export type OemAvailability = "in_stock" | "special_order" | "out_of_stock";

// Keep in sync with feeds_router._map_availability: explicit status wins over rank.
// Special orders remain purchasable under the existing checkout rules, but are
// not represented as immediate stock in Shopping or Product structured data.
export function oemAvailability(status: unknown, rank: unknown): OemAvailability {
  const value = String(status ?? "").trim().toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ");
  if (value === "in stock" || value === "instock" || value === "available") return "in_stock";
  if (value.includes("special order") || value.includes("backorder") || value.includes("back order") || value.includes("preorder") || value.includes("pre order")) return "special_order";
  if (value) return "out_of_stock";
  if (rank === 1) return "in_stock";
  if (rank === 2) return "special_order";
  return "out_of_stock";
}
