"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE || "").replace(/\/+$/, "");
const STRIPE_PK = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "";

const stripePromise = STRIPE_PK ? loadStripe(STRIPE_PK) : null;

/* --- pricing helpers ------------------------------------------------------ */
function moneyToCents(v: unknown): number | null {
  if (v == null) return null;

  if (typeof v === "number" && Number.isFinite(v)) {
    if (Math.abs(v % 1) > 1e-9) return Math.round(v * 100);
    return Math.round(v);
  }

  const s = String(v).trim();
  if (!s) return null;

  const cleaned = s.replace(/[^0-9.\-]/g, "");
  if (!cleaned) return null;

  const n = Number(cleaned);
  if (!Number.isFinite(n)) return null;

  if (cleaned.includes(".")) return Math.round(n * 100);
  return Math.round(n);
}

function normalizeItemUnitCents(x: any): number | null {
  const direct =
    x?.unit_amount_cents ??
    x?.unitAmountCents ??
    x?.priceEachCents ??
    x?.price_each_cents ??
    x?.price_cents ??
    x?.unit_price_cents ??
    null;

  const directCents = moneyToCents(direct);
  if (
    typeof directCents === "number" &&
    Number.isFinite(directCents) &&
    directCents > 0
  ) {
    return directCents;
  }

  const dollars =
    x?.priceEach ??
    x?.price_each ??
    x?.unit_price ??
    x?.price ??
    x?.priceEachDollars ??
    null;

  const dollarsCents = moneyToCents(dollars);
  if (
    typeof dollarsCents === "number" &&
    Number.isFinite(dollarsCents) &&
    dollarsCents > 0
  ) {
    return dollarsCents;
  }

  return null;
}

function money(cents: number) {
  const n = Number(cents || 0);
  return (n / 100).toFixed(2);
}

function buildCartFromQuery(cartParam: string | null) {
  if (!cartParam) return [];

  try {
    const decoded = decodeURIComponent(cartParam);
    const parsed = JSON.parse(decoded);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((x) => ({
        mpn: String(x?.mpn || "").trim(),
        qty: Number(x?.qty || 1),
        name: String(x?.name || "").trim(),
        unit_amount_cents: normalizeItemUnitCents(x),
        image_url: x?.image_url ?? null,
        is_refurb: Boolean(x?.is_refurb),
      }))
      .filter((x) => x.mpn && x.qty > 0);
  } catch {
    return [];
  }
}

function computeCartSubtotalCents(cartItems: any[]) {
  if (!Array.isArray(cartItems) || cartItems.length === 0) return 0;

  let total = 0;
  for (const it of cartItems) {
    const unit = it?.unit_amount_cents;
    const qty = Number(it?.qty || 1);
    if (
      typeof unit === "number" &&
      Number.isFinite(unit) &&
      unit > 0 &&
      qty > 0
    ) {
      total += Math.round(unit) * qty;
    }
  }
  return total;
}

function shippingLabel(method: string) {
  const m = (method || "").toLowerCase();
  if (m === "next_day") return "Next Day Air";
  if (m === "two_day") return "2nd Day Air";
  return "Ground";
}

function isGroundMethod(method: string) {
  const m = (method || "").trim().toLowerCase();
  return !m || m === "gnd" || m === "ground";
}

function isRefurbOnlyCart(cartItems: any[]) {
  return (
    Array.isArray(cartItems) &&
    cartItems.length > 0 &&
    cartItems.every((item) => Boolean(item?.is_refurb))
  );
}

/* --- UI blocks ------------------------------------------------------------ */
function OrderSummary({
  cartItems,
  amounts,
  shippingMethod,
  isRefurbOnly,
}: {
  cartItems: any[];
  amounts: any;
  shippingMethod: string;
  isRefurbOnly: boolean;
}) {
  const cartSubtotalFallback = computeCartSubtotalCents(cartItems);

  const itemsSubtotal = Number(
    amounts?.items_subtotal_cents ??
      amounts?.items_subtotal ??
      cartSubtotalFallback
  );

  const rawShipping =
    amounts?.shipping_amount_cents ?? amounts?.shipping_amount ?? null;
  const shippingCents = rawShipping == null ? null : Number(rawShipping);
  const groundShippingIsFree = isRefurbOnly && isGroundMethod(shippingMethod);
  const shippingIsTbd =
    !groundShippingIsFree && (shippingCents == null || shippingCents <= 0);

  const rawTax = amounts?.tax_amount_cents ?? amounts?.tax_amount ?? null;
  const taxCents = rawTax == null ? null : Number(rawTax);
  const taxIsTbd = taxCents == null || taxCents <= 0;

  const totalAmount = Number(
    amounts?.total_amount_cents ?? amounts?.total_amount ?? itemsSubtotal
  );

  const first = cartItems?.[0];

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="mb-3 text-sm font-semibold">Order summary</div>

      {first ? (
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="text-xs font-semibold text-gray-900">
              {first.mpn}
            </div>
            <div className="truncate text-xs text-gray-600">
              {first.name || `${first.mpn} part`}
            </div>
          </div>
          <div className="whitespace-nowrap text-right text-xs text-gray-900">
            <div>Qty {first.qty}</div>
            {typeof first.unit_amount_cents === "number" ? (
              <div>${money(first.unit_amount_cents)}</div>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="text-xs text-gray-600">
          No items found in checkout URL.
        </div>
      )}

      <div className="mt-4 space-y-2 text-xs">
        <div className="flex justify-between">
          <span className="text-gray-600">Items subtotal</span>
          <span className="text-gray-900">${money(itemsSubtotal)}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-600">
            Shipping ({shippingLabel(shippingMethod)})
          </span>
          <span className="text-gray-900">
            {groundShippingIsFree
              ? "Free"
              : shippingIsTbd
                ? "TBD"
                : `$${money(shippingCents)}`}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-600">Sales tax</span>
          <span className="text-gray-900">
            {taxIsTbd ? "Calculated at payment" : `$${money(taxCents)}`}
          </span>
        </div>

        <div className="flex justify-between border-t pt-2">
          <span className="font-semibold text-gray-900">Order total</span>
          <span className="font-semibold text-gray-900">
            ${money(totalAmount)}
          </span>
        </div>

        <div className="pt-2 text-[11px] text-gray-500">
          {groundShippingIsFree
            ? "Free ground shipping applies to refurbished parts. Sales tax is calculated after you enter your shipping details and continue to payment."
            : "Shipping and sales tax are calculated after you enter your shipping details and continue to payment."}
        </div>
      </div>
    </div>
  );
}

function CheckoutForm({
  clientSecret,
  totalCents,
}: {
  clientSecret: string;
  totalCents: number;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [payError, setPayError] = useState("");
  const [paymentReady, setPaymentReady] = useState(false);

  const returnUrl =
    typeof window !== "undefined" ? `${window.location.origin}/success` : "";

  const canPay =
    Boolean(stripe) &&
    Boolean(elements) &&
    Boolean(clientSecret) &&
    totalCents > 0 &&
    !isSubmitting;

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPayError("");

    if (!stripe || !elements) {
      setPayError(
        "Secure payment form is still loading. Please wait a moment and try again."
      );
      return;
    }

    if (!totalCents || totalCents <= 0) {
      setPayError("Order total is missing. Please refresh and try again.");
      return;
    }

    setIsSubmitting(true);

    try {
      const submitResult = await elements.submit();

      if (submitResult?.error) {
        setPayError(submitResult.error.message || "Please check your payment details.");
        setIsSubmitting(false);
        return;
      }

      const result = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: returnUrl,
        },
        redirect: "if_required",
      });

      if (result?.error) {
        setPayError(result.error.message || "Payment failed.");
        setIsSubmitting(false);
        return;
      }

      router.push(
        `/success?payment_intent_client_secret=${encodeURIComponent(
          clientSecret
        )}`
      );
    } catch (err: any) {
      setPayError(err?.message || "Payment failed.");
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-1 text-lg font-semibold text-gray-950">Payment</div>
        <div className="mb-4 text-sm text-gray-600">
          You will be charged{" "}
          <span className="font-semibold text-gray-950">
            ${money(totalCents)}
          </span>
          .
        </div>

        {!STRIPE_PK ? (
          <div className="mb-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            Stripe publishable key is missing. Payment cannot load.
          </div>
        ) : null}

        <div className="rounded-md border border-gray-200 bg-white p-3">
          <PaymentElement
            onReady={() => {
              setPaymentReady(true);
              setPayError("");
            }}
            onLoadError={(event: any) => {
              setPaymentReady(false);
              setPayError(
                event?.error?.message ||
                  "Secure payment form failed to load. Please refresh and try again."
              );
            }}
          />
        </div>

        {payError ? (
          <div className="mt-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {payError}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={!canPay}
          className="mt-4 w-full cursor-pointer rounded-md bg-green-600 px-4 py-3 text-sm font-semibold text-white hover:bg-green-700 active:bg-green-800 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-green-600"
        >
          {isSubmitting ? "Processing..." : `Pay $${money(totalCents)}`}
        </button>

        <div className="mt-2 text-[11px] text-gray-500">
          Your payment is securely processed by Stripe. We will email your
          order confirmation.
        </div>
      </div>

      <div className="text-xs text-gray-600">
        <Link href="/" className="text-blue-600 hover:underline">
          ← Continue shopping
        </Link>
      </div>
    </form>
  );
}

/* --- page ---------------------------------------------------------------- */
export default function CheckoutClientPage() {
  const params = useSearchParams();
  const { cartItems: contextCartItems } = useCart();

  const queryCartItems = useMemo(() => {
    const cartParam = params.get("cart");
    const parsed = buildCartFromQuery(cartParam);
    if (parsed.length) return parsed;

    const mpn = (params.get("mpn") || "").trim();
    if (!mpn) return [];

    return [
      {
        mpn,
        qty: Number(params.get("qty") || 1),
        name: params.get("name") || "",
        unit_amount_cents: normalizeItemUnitCents({
          unit_amount_cents: params.get("unit_amount_cents"),
          priceEachCents: params.get("priceEachCents"),
          priceEach: params.get("priceEach"),
          price: params.get("price"),
        }),
        image_url: params.get("image_url") || null,
        is_refurb: false,
      },
    ];
  }, [params]);

  const cartItems = useMemo(() => {
    if (Array.isArray(contextCartItems) && contextCartItems.length > 0) {
      return contextCartItems
        .map((item) => ({
          mpn: String(item?.mpn || "").trim(),
          qty: Number(item?.qty || 1),
          name: String(item?.name || "").trim(),
          unit_amount_cents: normalizeItemUnitCents({
            unit_amount_cents:
              item?.unit_amount_cents ??
              item?.unitAmountCents ??
              item?.price ??
              item?.priceEach ??
              item?.price_each,
            price:
              item?.price ??
              item?.priceEach ??
              item?.price_each,
          }),
          image_url: item?.image_url ?? item?.image ?? null,
          is_refurb: Boolean(item?.is_refurb),
        }))
        .filter((x) => x.mpn && x.qty > 0);
    }

    return queryCartItems;
  }, [contextCartItems, queryCartItems]);

  const isRefurbOnly = useMemo(() => isRefurbOnlyCart(cartItems), [cartItems]);

  const [shippingMethod, setShippingMethod] = useState(
    params.get("ship_method") || "GND"
  );

  const groundShippingIsFree = isRefurbOnly && isGroundMethod(shippingMethod);
  const [email, setEmail] = useState(params.get("email") || "");
  const [phone, setPhone] = useState(params.get("phone") || "");
  const [fullName, setFullName] = useState(params.get("full_name") || "");
  const [address1, setAddress1] = useState(params.get("address1") || "");
  const [address2, setAddress2] = useState(params.get("address2") || "");
  const [city, setCity] = useState(params.get("city") || "");
  const [state, setState] = useState(params.get("state") || "");
  const [postal, setPostal] = useState(params.get("postal") || "");
  const [country, setCountry] = useState(params.get("country") || "US");

  const [clientSecret, setClientSecret] = useState("");
  const [amounts, setAmounts] = useState<any>(null);
  const [creatingIntent, setCreatingIntent] = useState(false);
  const [createError, setCreateError] = useState("");

  const canCreateIntent =
    cartItems.length > 0 &&
    (shippingMethod || "").trim() &&
    email.trim() &&
    fullName.trim() &&
    address1.trim() &&
    city.trim() &&
    state.trim() &&
    postal.trim() &&
    country.trim();

  const createIntent = async () => {
    setCreateError("");

    if (!API_BASE) {
      setCreateError("Missing NEXT_PUBLIC_API_BASE.");
      return;
    }

    if (!canCreateIntent) {
      setCreateError(
        "Please complete shipping details and choose a shipping method before paying."
      );
      return;
    }

    setCreatingIntent(true);
    try {
      const payload = {
        shippingMethod: (shippingMethod || "GND").trim(),
        items: cartItems.map((x) => ({
          mpn: x.mpn,
          quantity: x.qty,
          is_refurb: Boolean(x?.is_refurb),
          price:
            typeof x.unit_amount_cents === "number"
              ? x.unit_amount_cents / 100
              : undefined,
          name: x.name || undefined,
          image_url: x.image_url || undefined,
        })),
        contact: {
          email: email.trim(),
          fullName: fullName.trim(),
          phone: phone.trim() || "0000000000",
        },
        ship_to: {
          name: fullName.trim(),
          phone: phone.trim() || "0000000000",
          address1: address1.trim(),
          address2: address2.trim(),
          city: city.trim(),
          state: state.trim(),
          postal: postal.trim(),
          country: country.trim(),
        },
      };

      const resp = await fetch("/api/checkout/session-cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const text = await resp.text();
      let data: any;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(text || "Failed to create Checkout Session.");
      }

      if (!resp.ok) {
        throw new Error(
          data?.detail || data?.error || "Failed to create Checkout Session."
        );
      }

      if (!data?.url) {
        throw new Error("Backend did not return checkout URL.");
      }

      window.location.href = data.url;
      return;
    } catch (e: any) {
      setCreateError(e?.message || "Failed to create Checkout Session.");
    } finally {
      setCreatingIntent(false);
    }
  };

  const appearance = useMemo(
    () => ({
      theme: "stripe" as const,
    }),
    []
  );

  if (!STRIPE_PK || !stripePromise) {
    return (
      <div className="mx-auto max-w-5xl p-6 text-sm text-red-600">
        Missing NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-4 text-sm text-white/80">
        Review your order, choose shipping, enter your shipping details, and
        pay securely with Stripe.
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <div className="mb-3 text-sm font-semibold">
              Contact &amp; Shipping
            </div>

            <div className="mb-4 rounded-md border border-blue-200 bg-blue-50 p-3">
              <label className="mb-1 block text-xs font-semibold text-gray-900">
                Shipping method (required)
              </label>
              <select
                value={shippingMethod}
                onChange={(e) => setShippingMethod(e.target.value)}
                className="mt-1 h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm font-medium text-zinc-950 shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="GND" className="bg-white text-black cursor-pointer">
                  {isRefurbOnly ? "Ground (Free)" : "Ground ($11.95)"}
                </option>
                <option value="two_day" className="bg-white text-black cursor-pointer">
                  2nd Day Air ($34.95)
                </option>
                <option value="next_day" className="bg-white text-black cursor-pointer">
                  Next Day Air ($45.95)
                </option>
              </select>

              <div className="mt-2 text-[11px] text-gray-700">
                {isRefurbOnly ? (
                  <>
                    Refurbished parts include{" "}
                    <span className="font-semibold">free ground shipping</span>.
                    Faster shipping is available for an added premium.
                  </>
                ) : (
                  <>
                    Reliable requires <span className="font-semibold">Ground</span>{" "}
                    on the PO payload. If you choose a faster method, we notify
                    Reliable&apos;s support desk to upgrade the shipment.
                  </>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-700">
                  Email (for confirmation)
                </label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-950 shadow-sm outline-none placeholder:text-zinc-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-700">
                  Cell phone (for updates)
                </label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="mt-1 h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-950 shadow-sm outline-none placeholder:text-zinc-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  placeholder="2125550123"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-medium text-zinc-700">
                  Full name
                </label>
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="mt-1 h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-950 shadow-sm outline-none placeholder:text-zinc-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  placeholder="Your name"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-medium text-zinc-700">
                  Address line 1
                </label>
                <input
                  value={address1}
                  onChange={(e) => setAddress1(e.target.value)}
                  className="mt-1 h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-950 shadow-sm outline-none placeholder:text-zinc-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  placeholder="Street address"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-medium text-zinc-700">
                  Address line 2 (optional)
                </label>
                <input
                  value={address2}
                  onChange={(e) => setAddress2(e.target.value)}
                  className="mt-1 h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-950 shadow-sm outline-none placeholder:text-zinc-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  placeholder="Apt, suite, unit"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-700">City</label>
                <input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="mt-1 h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-950 shadow-sm outline-none placeholder:text-zinc-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-700">
                  State
                </label>
                <input
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="mt-1 h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-950 shadow-sm outline-none placeholder:text-zinc-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  placeholder="FL"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-700">ZIP</label>
                <input
                  value={postal}
                  onChange={(e) => setPostal(e.target.value)}
                  className="mt-1 h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-950 shadow-sm outline-none placeholder:text-zinc-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-700">
                  Country
                </label>
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="mt-1 h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm font-medium text-zinc-950 shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="US">United States</option>
                </select>
              </div>
            </div>

            {createError ? (
              <div className="mt-3 text-xs text-red-600">{createError}</div>
            ) : null}

            {!clientSecret ? (
              <button
                onClick={createIntent}
                disabled={creatingIntent || !canCreateIntent}
                className="mt-4 w-full rounded-md bg-blue-700 px-4 py-3 text-sm font-semibold text-white cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {creatingIntent ? "Preparing payment..." : "Continue to payment"}
              </button>
            ) : null}
          </div>

          {clientSecret ? (
            <Elements
              key={clientSecret}
              stripe={stripePromise}
              options={{
                clientSecret,
                appearance,
              }}
            >
              <CheckoutForm
                clientSecret={clientSecret}
                totalCents={Number(
                  amounts?.total_amount_cents ??
                    amounts?.total_amount ??
                    computeCartSubtotalCents(cartItems)
                )}
              />
            </Elements>
          ) : null}
        </div>

        <div className="space-y-4">
          <OrderSummary
            cartItems={cartItems}
            amounts={amounts}
            shippingMethod={shippingMethod}
            isRefurbOnly={isRefurbOnly}
          />

          {!clientSecret ? (
            <div className="text-xs text-white/80">
              Complete shipping details and click{" "}
              <span className="font-semibold">Continue to payment</span>.
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}