"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

type CheckoutItem = {
  mpn: string;
  qty: number;
  name?: string | null;
  priceEach?: number | null;
  lineTotal?: number | null;
  is_refurb?: boolean;
  condition?: string | null;
};

type IntentResponse = {
  client_secret: string;
  amount?: number | null;
  currency?: string | null;
};

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "");

function apiBase() {
  return (process.env.NEXT_PUBLIC_API_BASE || "").replace(/\/+$/, "");
}

function moneyFromCents(cents: number | null | undefined, currency = "USD") {
  const amt = Number(cents || 0) / 100;
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(amt);
  } catch {
    return `$${amt.toFixed(2)}`;
  }
}

function money(n: number | null | undefined) {
  const amt = Number(n || 0);
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amt);
  } catch {
    return `$${amt.toFixed(2)}`;
  }
}

function normalizeItemUnitPrice(item: any): number | null {
  const raw = item?.priceEach ?? item?.price ?? item?.price_value ?? null;
  if (raw == null) return null;
  const n =
    typeof raw === "number"
      ? raw
      : Number(String(raw).replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? n : null;
}

function buildCartFromQuery(raw: string | null): CheckoutItem[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(decodeURIComponent(raw));
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item: any) => {
        const mpn = String(item?.mpn || "").trim();
        if (!mpn) return null;

        const qtyRaw = Number(item?.qty ?? item?.quantity ?? 1);
        const qty = Number.isFinite(qtyRaw) && qtyRaw > 0 ? Math.floor(qtyRaw) : 1;

        const priceEach = normalizeItemUnitPrice(item);
        const lineTotal =
          item?.lineTotal != null && Number.isFinite(Number(item.lineTotal))
            ? Number(item.lineTotal)
            : priceEach != null
              ? priceEach * qty
              : null;

        return {
          mpn,
          qty,
          name: item?.name ?? item?.title ?? null,
          priceEach,
          lineTotal,
          is_refurb: !!item?.is_refurb,
          condition:
            item?.condition || (item?.is_refurb ? "refurbished" : "new"),
        } satisfies CheckoutItem;
      })
      .filter(Boolean) as CheckoutItem[];
  } catch {
    return [];
  }
}

function CheckoutInner({
  clientSecret,
  amountCents,
  currency,
  customerEmail,
}: {
  clientSecret: string;
  amountCents: number | null;
  currency: string;
  customerEmail: string;
}) {
  const stripe = useStripe();
  const elements = useElements();

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>("");

  async function handleConfirmPayment() {
    if (!stripe || !elements) return;
    setSubmitting(true);
    setSubmitError("");

    try {
      const result = await stripe.confirmPayment({
        elements,
        confirmParams: {
          receipt_email: customerEmail || undefined,
          return_url: `${window.location.origin}/success`,
        },
        redirect: "if_required",
      });

      if (result.error) {
        setSubmitError(result.error.message || "Payment failed.");
        return;
      }

      if (result.paymentIntent?.status === "succeeded") {
        const pi = result.paymentIntent.id;
        const clientSecretOut = result.paymentIntent.client_secret;
        const qs = new URLSearchParams();
        if (pi) qs.set("payment_intent", pi);
        if (clientSecretOut) qs.set("payment_intent_client_secret", clientSecretOut);
        window.location.href = `/success?${qs.toString()}`;
        return;
      }

      // Some methods still redirect after confirmPayment. If not, let the user know.
      setSubmitError("Payment is processing. If you were not redirected, please refresh shortly.");
    } catch (err: any) {
      setSubmitError(err?.message || "Payment failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold">Payment</h2>
      <p className="mt-2 text-sm text-gray-600">
        Enter your payment details to complete checkout.
      </p>

      {amountCents != null && (
        <div className="mt-3 text-sm text-gray-700">
          Amount due:{" "}
          <span className="font-semibold">
            {moneyFromCents(amountCents, currency || "USD")}
          </span>
        </div>
      )}

      <div className="mt-5">
        <PaymentElement />
      </div>

      {submitError ? (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {submitError}
        </div>
      ) : null}

      <button
        type="button"
        onClick={handleConfirmPayment}
        disabled={!stripe || !elements || submitting}
        className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-black px-5 py-3 text-sm font-medium text-white disabled:opacity-50"
      >
        {submitting ? "Processing..." : "Pay now"}
      </button>
    </div>
  );
}

function CheckoutPageContent() {
  const searchParams = useSearchParams();
  const rawCart = searchParams.get("cart");

  const cartItems = useMemo(() => buildCartFromQuery(rawCart), [rawCart]);

  const [shippingMethod, setShippingMethod] = useState<"ground" | "two_day" | "next_day">("ground");

  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [shipName, setShipName] = useState("");
  const [shipLine1, setShipLine1] = useState("");
  const [shipLine2, setShipLine2] = useState("");
  const [shipCity, setShipCity] = useState("");
  const [shipState, setShipState] = useState("");
  const [shipPostalCode, setShipPostalCode] = useState("");
  const [shipCountry, setShipCountry] = useState("US");

  const [creatingIntent, setCreatingIntent] = useState(false);
  const [intentError, setIntentError] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [intentAmountCents, setIntentAmountCents] = useState<number | null>(null);
  const [intentCurrency, setIntentCurrency] = useState("usd");

  const subtotal = useMemo(() => {
    return cartItems.reduce((sum, item) => {
      if (item.lineTotal != null && Number.isFinite(item.lineTotal)) {
        return sum + Number(item.lineTotal);
      }
      if (item.priceEach != null && Number.isFinite(item.priceEach)) {
        return sum + Number(item.priceEach) * Number(item.qty || 1);
      }
      return sum;
    }, 0);
  }, [cartItems]);

  const canCreateIntent = useMemo(() => {
    return (
      cartItems.length > 0 &&
      email.trim().length > 0 &&
      shipName.trim().length > 0 &&
      shipLine1.trim().length > 0 &&
      shipCity.trim().length > 0 &&
      shipState.trim().length > 0 &&
      shipPostalCode.trim().length > 0 &&
      shipCountry.trim().length > 0
    );
  }, [
    cartItems,
    email,
    shipName,
    shipLine1,
    shipCity,
    shipState,
    shipPostalCode,
    shipCountry,
  ]);

  useEffect(() => {
    setClientSecret("");
    setIntentError("");
  }, [rawCart, shippingMethod]);

  async function handleContinueToPayment() {
    if (!canCreateIntent) {
      setIntentError("Please complete contact and shipping details first.");
      return;
    }

    setCreatingIntent(true);
    setIntentError("");

    try {
      const base = apiBase();
      const res = await fetch(`${base}/api/checkout/intent-cart`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shipping_method: shippingMethod,
          items: cartItems.map((item) => ({
            mpn: item.mpn,
            quantity: Number(item.qty || 1),
            is_refurb: !!item.is_refurb,
          })),
          contact: {
            email: email.trim(),
            phone: phone.trim() || null,
          },
          ship_to: {
            name: shipName.trim(),
            line1: shipLine1.trim(),
            line2: shipLine2.trim() || null,
            city: shipCity.trim(),
            state: shipState.trim(),
            postal_code: shipPostalCode.trim(),
            country: shipCountry.trim().toUpperCase(),
          },
        }),
      });

      const data = (await res.json()) as any;
      if (!res.ok) {
        throw new Error(data?.detail || data?.message || "Failed to create payment intent.");
      }

      const intent = data as IntentResponse;
      if (!intent?.client_secret) {
        throw new Error("Missing client_secret from checkout intent response.");
      }

      setClientSecret(intent.client_secret);
      setIntentAmountCents(
        Number.isFinite(Number(intent.amount)) ? Number(intent.amount) : null
      );
      setIntentCurrency(String(intent.currency || "usd").toLowerCase());
    } catch (err: any) {
      setIntentError(err?.message || "Failed to initialize payment.");
      setClientSecret("");
      setIntentAmountCents(null);
    } finally {
      setCreatingIntent(false);
    }
  }

  if (cartItems.length === 0) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-10 md:px-6 lg:px-8">
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-semibold">Checkout</h1>
          <p className="mt-3 text-sm text-gray-600">
            Your checkout cart is empty or invalid.
          </p>
          <div className="mt-6">
            <Link
              href="/cart"
              className="inline-flex rounded-xl bg-black px-5 py-3 text-sm font-medium text-white"
            >
              Return to cart
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 md:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">Checkout</h1>
        <p className="mt-2 text-sm text-gray-600">
          Enter shipping information, then continue to payment.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="space-y-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Contact</h2>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
                  placeholder="you@example.com"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Phone
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
                  placeholder="Optional"
                />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Shipping address</h2>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Full name
                </label>
                <input
                  value={shipName}
                  onChange={(e) => setShipName(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Address line 1
                </label>
                <input
                  value={shipLine1}
                  onChange={(e) => setShipLine1(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Address line 2
                </label>
                <input
                  value={shipLine2}
                  onChange={(e) => setShipLine2(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  City
                </label>
                <input
                  value={shipCity}
                  onChange={(e) => setShipCity(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  State / Province
                </label>
                <input
                  value={shipState}
                  onChange={(e) => setShipState(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Postal code
                </label>
                <input
                  value={shipPostalCode}
                  onChange={(e) => setShipPostalCode(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Country
                </label>
                <input
                  value={shipCountry}
                  onChange={(e) => setShipCountry(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Shipping method</h2>

            <div className="mt-4 space-y-3">
              {[
                { value: "ground", label: "Ground" },
                { value: "two_day", label: "Two-day" },
                { value: "next_day", label: "Next-day" },
              ].map((opt) => (
                <label
                  key={opt.value}
                  className="flex cursor-pointer items-center gap-3 rounded-xl border border-gray-200 px-4 py-3"
                >
                  <input
                    type="radio"
                    name="shipping_method"
                    value={opt.value}
                    checked={shippingMethod === opt.value}
                    onChange={() =>
                      setShippingMethod(opt.value as "ground" | "two_day" | "next_day")
                    }
                  />
                  <span className="text-sm font-medium text-gray-800">
                    {opt.label}
                  </span>
                </label>
              ))}
            </div>

            <p className="mt-3 text-xs text-gray-500">
              Shipping price and final total are calculated server-side when payment is initialized.
            </p>
          </div>

          {!clientSecret ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <button
                type="button"
                onClick={handleContinueToPayment}
                disabled={!canCreateIntent || creatingIntent}
                className="inline-flex w-full items-center justify-center rounded-xl bg-black px-5 py-3 text-sm font-medium text-white disabled:opacity-50"
              >
                {creatingIntent ? "Initializing payment..." : "Continue to payment"}
              </button>

              {intentError ? (
                <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {intentError}
                </div>
              ) : null}
            </div>
          ) : (
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <CheckoutInner
                clientSecret={clientSecret}
                amountCents={intentAmountCents}
                currency={intentCurrency}
                customerEmail={email}
              />
            </Elements>
          )}
        </section>

        <aside className="h-fit rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Order summary</h2>

          <div className="mt-5 space-y-4">
            {cartItems.map((item, idx) => (
              <div
                key={`${item.mpn}__${idx}`}
                className="rounded-xl border border-gray-200 p-4"
              >
                <div className="text-sm font-medium text-gray-900">
                  {item.name || item.mpn}
                </div>
                <div className="mt-1 text-xs text-gray-600">
                  MPN: {item.mpn}
                </div>
                <div className="mt-1 text-xs text-gray-600">
                  Condition:{" "}
                  {item.condition || (item.is_refurb ? "refurbished" : "new")}
                </div>
                <div className="mt-1 text-xs text-gray-600">
                  Qty: {item.qty}
                </div>
                <div className="mt-2 text-sm font-semibold text-gray-900">
                  {item.lineTotal != null
                    ? money(item.lineTotal)
                    : item.priceEach != null
                      ? money(item.priceEach * item.qty)
                      : "Calculated at payment"}
                </div>
              </div>
            ))}
          </div>

          <div className="my-6 border-t border-gray-200" />

          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Items subtotal</span>
              <span className="font-medium">{money(subtotal)}</span>
            </div>

            {intentAmountCents != null && (
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Backend total</span>
                <span className="font-medium">
                  {moneyFromCents(intentAmountCents, intentCurrency)}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-gray-600">Shipping</span>
              <span className="text-gray-500">Added by backend</span>
            </div>
          </div>

          <div className="mt-6">
            <Link
              href="/cart"
              className="inline-flex w-full items-center justify-center rounded-xl border border-gray-300 px-5 py-3 text-sm font-medium text-gray-700"
            >
              Back to cart
            </Link>
          </div>
        </aside>
      </div>
    </main>
  );
}
function CheckoutPageFallback() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-10 md:px-6 lg:px-8">
      <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-semibold tracking-tight">Checkout</h1>
        <p className="mt-2 text-sm text-gray-600">Loading checkout…</p>
      </div>
    </main>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<CheckoutPageFallback />}>
      <CheckoutPageContent />
    </Suspense>
  );
}