export type CatalogProduct = {
  id: string;        // use MPN here eventually
  title: string;
  price: number;     // numeric, not "$26"
  compareAt?: number;
  image: string;     // string URL or next/image static path string
  mode?: "parts" | "refurb";
};

/**
 * TEMP: mock catalog to keep UI working.
 * Later: replace this with fetch() from your FastAPI endpoints.
 */
export const MOCK_CATALOG: CatalogProduct[] = [
  {
    id: "DEMO-IMAC",
    title: "Apple iMac M4 24-inch 2025",
    price: 1100,
    compareAt: 999,
    image: "/images/newarrival8.png",
    mode: "parts",
  },
  {
    id: "DEMO-IPAD",
    title: "Apple iPad Pro Max",
    price: 700,
    compareAt: 800,
    image: "/images/newarrival5.png",
    mode: "parts",
  },
];

export function productRoute(p: Pick<CatalogProduct, "id" | "mode">) {
  const base = p.mode === "refurb" ? "/refurb" : "/parts";
  return `${base}/${encodeURIComponent(p.id)}`;
}

export function toCartItem(p: CatalogProduct) {
  return {
    id: p.id,
    title: p.title,
    price: p.price,
    image: p.image,
  };
}
