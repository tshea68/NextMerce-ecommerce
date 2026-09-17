import type { AttemptedSeller } from "./attempted-sellers";
import { sellerHref } from "./seller-comparison";

type Fields = Record<string, unknown>;
const record = (value: unknown): Fields => value && typeof value === "object" && !Array.isArray(value) ? value as Fields : {};
const text = (value: unknown) => typeof value === "string" ? value.trim() : "";
const key = (value: unknown) => text(value).toLowerCase().replace(/[^a-z0-9]/g, "");
function number(value: unknown): number | null {
  if (typeof value !== "number" && !(typeof value === "string" && /^\d+(?:\.\d+)?$/.test(value.trim()))) return null;
  const result = Number(value);
  return Number.isFinite(result) && result >= 0 ? result : null;
}
function firstNumber(...values: unknown[]) {
  for (const value of values) { const result = number(value); if (result !== null) return result; }
  return null;
}
const knownText = (...values: unknown[]) => values.map(text).find(value => value && !/^(?:—|unknown|n\/a)$/i.test(value)) || "";
function money(value: number, currency: string) {
  try { return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(value); }
  catch { return `${value.toFixed(2)} ${currency}`; }
}

/** Part Sherpa seller-level policies supplement item data, never the seller roster. */
export function sellerPolicies(seller: AttemptedSeller, metadata: Fields) {
  const raw = seller.offer?.raw || {}, check = seller.check;
  const candidates = [seller.key, seller.name, check.seller_key, raw.seller_key].map(key).filter(Boolean);
  const match = Object.entries(metadata).find(([id, value]) => {
    const policy = record(value);
    return [id, policy.display_name, ...(Array.isArray(policy.aliases) ? policy.aliases : [])].map(key).some(alias => alias && candidates.includes(alias));
  });
  const policy = record(match?.[1]), shippingPolicy = record(policy.shipping_policy), returnPolicy = record(policy.return_policy);
  const itemShipping = record(raw.shipping_policy), itemReturns = record(raw.return_policy);
  const currency = seller.offer?.currency || "USD";
  const cost = firstNumber(raw.shipping_cost, raw.shipping_price, raw.shipping, itemShipping.cost, check.shipping_cost, check.shipping_price);
  const shippingType = knownText(raw.shipping_type, itemShipping.type, check.shipping_type).toLowerCase();
  const itemShippingText = knownText(raw.shipping_text, typeof raw.shipping === "string" && number(raw.shipping) === null ? raw.shipping : null, itemShipping.display);
  const policyShippingText = knownText(shippingPolicy.display);
  let shipping = "Shipping —";
  if (cost !== null) shipping = cost === 0 ? "Free Shipping" : `Shipping ${money(cost, currency)}`;
  else if (raw.free_shipping === true || itemShipping.free_shipping === true || shippingType === "free") shipping = "Free Shipping";
  else if (raw.calculated_shipping === true || shippingType === "calculated") shipping = "Calculated Shipping";
  else if (itemShippingText) shipping = /^free(?: shipping)?$/i.test(itemShippingText) ? "Free Shipping" : /calculated|shown at checkout/i.test(itemShippingText) ? "Calculated Shipping" : itemShippingText;
  else if (number(shippingPolicy.free_shipping_threshold) === 0 || /^free(?: shipping)?$/i.test(policyShippingText)) shipping = "Free Shipping";
  else if (/calculated|(?:shown|variable)\s+at checkout/i.test(policyShippingText)) shipping = "Calculated Shipping";
  else if (policyShippingText) {
    // A free-shipping threshold or "from" amount is not a fixed shipping charge.
    const fixed = policyShippingText.match(/^(?:shipping\s+)?\$\s*(\d+(?:\.\d{1,2})?)(?:\s|$)/i);
    shipping = fixed && !/over|orders|from|starting|up to|minimum|threshold/i.test(policyShippingText) ? `Shipping ${money(Number(fixed[1]), currency)}` : policyShippingText;
  } else {
    const threshold = number(shippingPolicy.free_shipping_threshold);
    if (threshold !== null && threshold > 0) shipping = `Free shipping over ${money(threshold, currency)}`;
  }
  const days = firstNumber(raw.returns_days, raw.return_window_days, raw.return_days, itemReturns.days, check.returns_days, returnPolicy.days);
  const returnText = knownText(raw.returns_text, raw.returns, typeof raw.return_policy === "string" ? raw.return_policy : null, itemReturns.display, returnPolicy.display);
  let returns = "Returns —";
  if (raw.returnable === false || itemReturns.returnable === false || returnPolicy.returnable === false || /^(?:not returnable|no returns(?: accepted)?|non.?returnable)$/i.test(returnText)) returns = "Not returnable";
  else if (days !== null) returns = `Returns ${days} days`;
  else if (returnText) returns = /^returns?\b/i.test(returnText) ? returnText : `Returns ${returnText}`;
  const returnUrl = sellerHref({ url: knownText(raw.return_policy_url, itemReturns.url, returnPolicy.url) });
  if (returns === "Returns —" && returnUrl) returns = "Returns: See seller";
  return {
    shipping, returns, returnUrl,
    shippingTitle: itemShippingText || policyShippingText || undefined,
    returnTitle: knownText(itemReturns.exclusions, returnPolicy.exclusions, raw.return_exclusions) + (knownText(itemReturns.restocking_fee, returnPolicy.restocking_fee) ? ` ${knownText(itemReturns.restocking_fee, returnPolicy.restocking_fee)}` : ""),
  };
}
