export type GA4Item = {
  item_id: string;
  item_name?: string;
  item_brand?: string;
  item_category?: string;
  item_category2?: string;
  item_variant?: string;
  price?: number;
  quantity?: number;
};

declare global {
  interface Window {
    dataLayer?: Array<Record<string, any>>;
    gtag?: (...args: any[]) => void;
  }
}

function cleanParams(params: Record<string, any>) {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(params || {})) {
    if (v === undefined || v === null || v === "") continue;
    out[k] = v;
  }
  return out;
}

export function trackEvent(eventName: string, params: Record<string, any> = {}) {
  if (typeof window === "undefined") return;

  const clean = cleanParams(params);

  if (typeof window.gtag === "function") {
    window.gtag("event", eventName, clean);
    return;
  }

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: eventName,
    ...clean,
  });
}

export function buildProductItem(product: any, quantity = 1): GA4Item {
  const mpn =
    product?.mpn ||
    product?.part_number ||
    product?.partNumber ||
    product?.sku ||
    "";

  const title =
    product?.title ||
    product?.title_display ||
    product?.feed_title ||
    product?.name ||
    mpn;

  const rawPrice =
    typeof product?.price === "number"
      ? product.price
      : Number(String(product?.price || "").replace(/[^0-9.]/g, ""));

  return {
    item_id: String(mpn),
    item_name: String(title),
    item_brand: product?.brand || undefined,
    item_category: product?.appliance_type || undefined,
    item_category2:
      product?.canonical_part_type ||
      product?.specific_part_type ||
      product?.part_type ||
      undefined,
    item_variant:
      product?.is_refurb || product?.condition === "refurbished"
        ? "refurbished"
        : "new",
    price: Number.isFinite(rawPrice) ? rawPrice : undefined,
    quantity,
  };
}

export function trackViewItem(product: any, quantity = 1) {
  const item = buildProductItem(product, quantity);
  trackEvent("view_item", {
    currency: "USD",
    value: item.price,
    items: [item],
  });
}

export function trackAddToCart(product: any, quantity = 1) {
  const item = buildProductItem(product, quantity);
  trackEvent("add_to_cart", {
    currency: "USD",
    value: item.price != null ? item.price * quantity : undefined,
    items: [item],
  });
}

export function trackBeginCheckout(items: GA4Item[], value?: number) {
  trackEvent("begin_checkout", {
    currency: "USD",
    value,
    items,
  });
}

export function trackPurchase(args: {
  transactionId: string;
  items: GA4Item[];
  value: number;
  tax?: number;
  shipping?: number;
}) {
  trackEvent("purchase", {
    transaction_id: args.transactionId,
    currency: "USD",
    value: args.value,
    tax: args.tax,
    shipping: args.shipping,
    items: args.items,
  });
}
