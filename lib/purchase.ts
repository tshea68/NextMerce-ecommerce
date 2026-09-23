import type Stripe from "stripe";
import type {} from "./ga4";

export type Purchase = {
  transaction_id: string;
  value: number;
  currency: string;
  tax: number;
  shipping: number;
  items: {
    item_id: string;
    item_name: string;
    price: number;
    quantity: number;
  }[];
};

/** Only call with Stripe API responses, never URL parameters or UI status. */
export function purchaseFromStripe(
  session: Stripe.Checkout.Session,
  lines: Stripe.LineItem[],
): Purchase | null {
  const intent = session.payment_intent;
  const id = typeof intent === "string" ? intent : intent?.id;
  const succeeded = typeof intent === "object" && intent?.status === "succeeded";
  if (session.payment_status !== "paid" && !succeeded) return null;
  if (!id || !/^pi_[A-Za-z0-9]+$/.test(id)) return null;

  // This checkout creates USD sessions. Fail closed for other currencies rather
  // than guessing Stripe's minor-unit conversion rules.
  if (session.currency !== "usd" || !lines.length) return null;
  const total = session.amount_total;
  const tax = session.total_details?.amount_tax;
  const shipping = session.total_details?.amount_shipping;
  const cents = (n: unknown): n is number =>
    typeof n === "number" && Number.isSafeInteger(n) && n >= 0;
  if (!cents(total) || !cents(tax) || !cents(shipping)) return null;

  let merchandise = 0;
  const items: Purchase["items"] = [];
  for (const line of lines) {
    const quantity = line.quantity;
    if (
      !quantity || !Number.isSafeInteger(quantity) || quantity < 1 ||
      line.currency !== session.currency || !cents(line.amount_total) ||
      !cents(line.amount_tax) || line.amount_tax > line.amount_total
    ) return null;
    // Stripe's line total is after discounts and includes tax (inclusive or
    // exclusive). GA4 item price and value exclude tax and shipping.
    const net = line.amount_total - line.amount_tax;
    const product = line.price?.product;
    const expanded = product && typeof product === "object" && !product.deleted ? product : null;
    items.push({
      item_id: expanded?.metadata?.mpn ||
        (typeof product === "string" ? product : product?.id) || line.id,
      item_name: line.description || expanded?.name || line.id,
      price: net / quantity / 100,
      quantity,
    });
    merchandise += net;
  }
  // Reject incomplete/paginated or inconsistent data, rather than fabricate an item.
  if (merchandise !== total - tax - shipping) return null;
  return {
    transaction_id: id,
    value: merchandise / 100,
    currency: session.currency.toUpperCase(),
    tax: tax / 100,
    shipping: shipping / 100,
    items,
  };
}

export function purchaseDiagnostic(message: string) {
  if (process.env.NODE_ENV === "development") console.debug(`[purchase] ${message}`);
}

/** One browser event feeds the existing GA4 and OpenAI GTM tags. */
export async function emitPurchaseOnce(purchase: Purchase): Promise<void> {
  if (typeof window === "undefined") return;
  const key = `apg:purchase:${purchase.transaction_id}`;
  const emit = () => {
    let storage: Storage;
    try {
      storage = window.localStorage;
      if (storage.getItem(key)) {
        purchaseDiagnostic("duplicate purchase suppressed");
        return;
      }
      // Claim before pushing, including across remounts and full reloads.
      // This is an emission marker, not an acknowledgement from either vendor.
      storage.setItem(key, "1");
    } catch {
      purchaseDiagnostic("purchase skipped: persistent storage unavailable");
      return;
    }
    try {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({ event: "purchase", ...purchase });
      purchaseDiagnostic("purchase event emitted");
    } catch {
      // A synchronous queue failure can safely be retried on the next visit.
      try { storage.removeItem(key); } catch { /* Keep the claim if storage failed. */ }
      purchaseDiagnostic("purchase queue failed");
    }
  };
  try {
    if (window.navigator.locks) await window.navigator.locks.request(key, emit);
    else emit();
  } catch {
    purchaseDiagnostic("purchase skipped: browser lock unavailable");
  }
}
