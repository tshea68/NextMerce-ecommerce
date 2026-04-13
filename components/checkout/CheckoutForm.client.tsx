"use client";

import React, { useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";

const API_BASE =
  (process.env.NEXT_PUBLIC_API_BASE || "").replace(/\/+$/, "") ||
  "https://api.appliancepartgeeks.com";

const STRIPE_PK = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "";
const stripePromise = STRIPE_PK ? loadStripe(STRIPE_PK) : null;

/* ---------------- PRICING HELPERS ---------------- */

function moneyToCents(v: any) {
  if (v == null) return null;
  if (typeof v === "number" && Number.isFinite(v)) {
    if (Math.abs(v % 1) > 1e-9) return Math.round(v * 100);
    return Math.round(v);
  }
  const s = String(v).trim();
  const cleaned = s.replace(/[^0-9.\-]/g, "");
  const n = Number(cleaned);
  if (!Number.isFinite(n)) return null;
  if (cleaned.includes(".")) return Math.round(n * 100);
  return Math.round(n);
}

function normalizeItemUnitCents(x: any) {
  return (
    moneyToCents(
      x?.unit_amount_cents ??
        x?.priceEachCents ??
        x?.priceEach ??
        x?.price
    ) || null
  );
}

/* ---------------- CART PARSING ---------------- */

function buildCartFromQuery(cartParam: string | null) {
  if (!cartParam) return [];
  try {
    const decoded = decodeURIComponent(cartParam);
    const parsed = JSON.parse(decoded);
    return parsed.map((x: any) => ({
      mpn: x.mpn,
      qty: Number(x.qty || 1),
      name: x.name,
      unit_amount_cents: normalizeItemUnitCents(x),
      is_refurb: Boolean(x?.is_refurb),
    }));
  } catch {
    return [];
  }
}

function money(cents: number) {
  return (cents / 100).toFixed(2);
}

/* ---------------- ORDER SUMMARY ---------------- */

function OrderSummary({ cartItems, amounts, shippingMethod }: any) {
  const subtotal =
    amounts?.items_subtotal_cents ||
    cartItems.reduce(
      (sum: number, i: any) =>
        sum + (i.unit_amount_cents || 0) * i.qty,
      0
    );

  const shipping = amounts?.shipping_amount_cents;

  return (
    <div className="rounded border p-4 bg-white">
      <div className="font-semibold mb-3 text-sm">Order Summary</div>

      {cartItems.map((item: any, i: number) => (
        <div key={i} className="flex justify-between text-xs mb-2">
          <span>{item.mpn} (x{item.qty})</span>
          <span>
            {item.unit_amount_cents
              ? `$${money(item.unit_amount_cents * item.qty)}`
              : "—"}
          </span>
        </div>
      ))}

      <div className="border-t pt-2 mt-2 text-xs space-y-1">
        <div className="flex justify-between">
          <span>Items</span>
          <span>${money(subtotal)}</span>
        </div>

        <div className="flex justify-between">
          <span>Shipping ({shippingMethod})</span>
          <span>{shipping ? `$${money(shipping)}` : "TBD"}</span>
        </div>
      </div>
    </div>
  );
}

/* ---------------- STRIPE FORM ---------------- */

function CheckoutForm({ clientSecret }: any) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: any) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);

    const result = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/success`,
      },
      redirect: "if_required",
    });

    if (result.error) {
      setError(result.error.message || "Payment failed");
      setLoading(false);
      return;
    }

    router.push(
      `/success?payment_intent_client_secret=${encodeURIComponent(
        clientSecret
      )}`
    );
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <PaymentElement />

      {error && <div className="text-red-600 text-xs">{error}</div>}

      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full bg-green-600 text-white py-3 rounded"
      >
        {loading ? "Processing..." : "Pay"}
      </button>
    </form>
  );
}

/* ---------------- MAIN PAGE ---------------- */

export default function CheckoutPage() {
  const params = useSearchParams();

  const cartItems = useMemo(() => {
    return buildCartFromQuery(params.get("cart"));
  }, [params]);

  const [shippingMethod, setShippingMethod] = useState("ground");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [address1, setAddress1] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postal, setPostal] = useState("");

  const [clientSecret, setClientSecret] = useState("");
  const [amounts, setAmounts] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const createIntent = async () => {
    setLoading(true);

    const resp = await fetch(`${API_BASE}/api/checkout/intent-cart`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        shipping_method: shippingMethod,
        items: cartItems.map((i: any) => ({
          mpn: i.mpn,
          quantity: i.qty,
        })),
        contact: { email, fullName },
        ship_to: { address1, city, state, postal },
      }),
    });

    const data = await resp.json();

    setClientSecret(data.client_secret);
    setAmounts(data);
    setLoading(false);
  };

  if (!STRIPE_PK || !stripePromise) {
    return <div className="p-6 text-red-600">Stripe not configured</div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-6 grid lg:grid-cols-2 gap-6">
      <div className="space-y-4">
        <div className="border p-4 bg-white rounded">
          <div className="font-semibold mb-3">Shipping</div>

          <input
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border p-2 w-full mb-2"
          />

          <input
            placeholder="Full Name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="border p-2 w-full mb-2"
          />

          <input
            placeholder="Address"
            value={address1}
            onChange={(e) => setAddress1(e.target.value)}
            className="border p-2 w-full mb-2"
          />

          <button
            onClick={createIntent}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded"
          >
            {loading ? "Preparing..." : "Continue to Payment"}
          </button>
        </div>

        {clientSecret && (
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <CheckoutForm clientSecret={clientSecret} />
          </Elements>
        )}
      </div>

      <OrderSummary
        cartItems={cartItems}
        amounts={amounts}
        shippingMethod={shippingMethod}
      />
    </div>
  );
}