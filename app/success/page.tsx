"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { trackPurchase, type GA4Item } from "@/lib/ga4";

const API_BASE =
  (process.env.NEXT_PUBLIC_API_BASE || "").trim() ||
  "https://api.appliancepartgeeks.com";

function extractPiFromClientSecret(cs: string | null) {
  const v = (cs || "").trim();
  if (!v) return null;
  if (v.includes("_secret_")) return v.split("_secret_")[0];
  if (v.startsWith("pi_")) return v;
  return null;
}

async function safeJson(resp: Response) {
  const text = await resp.text();
  try {
    return JSON.parse(text);
  } catch {
    return { _raw: text };
  }
}

type OrderRow = {
  id?: number | string;
  status?: string;
  total_amount_cents?: number;
  currency?: string;
  public_lookup_token?: string;
  publicLookupToken?: string;
  reliable_order_number?: string;
  reliableOrderNumber?: string;
  customer_email?: string;
};

type StripeishOrder = {
  status?: string;
  payment_status?: string;
  payment_intent_status?: string;
  payment_intent_id?: string;
  payment_intent?: string;
  customer_email?: string;
  customer_details?: { email?: string | null } | null;
  total_cents?: number;
  amount_total?: number;
  amount?: number;
  currency?: string;
  items?: any[];
  line_items?: any[];
  lines?: { data?: any[] };
};

function normalizeSuccessStatus(j: StripeishOrder, fallback?: string | null) {
  const paymentStatus = String(j?.payment_status || "").toLowerCase();
  const piStatus = String(j?.payment_intent_status || "").toLowerCase();
  const sessionStatus = String(j?.status || "").toLowerCase();
  const fallbackStatus = String(fallback || "").toLowerCase();

  if (paymentStatus === "paid" || piStatus === "succeeded") return "succeeded";
  if (sessionStatus === "complete") return "succeeded";
  if (sessionStatus === "paid") return "paid";
  if (piStatus === "processing" || sessionStatus === "processing") return "processing";
  if (piStatus === "requires_capture") return "requires_capture";
  if (fallbackStatus === "succeeded") return "succeeded";
  if (fallbackStatus) return fallbackStatus;

  return sessionStatus || "unknown";
}

function SuccessPageInner() {
  const params = useSearchParams();

  const [status, setStatus] = useState("loading");
  const [order, setOrder] = useState<StripeishOrder | null>(null);
  const [orderRow, setOrderRow] = useState<OrderRow | null>(null);
  const [msg, setMsg] = useState("Finalizing…");
  const purchaseTrackedRef = useRef<string | null>(null);

  const statusMeta = useMemo(() => {
    const s = (status || "").toLowerCase();
    if (s === "paid" || s === "succeeded") {
      return {
        label: "Payment confirmed",
        color: "bg-emerald-100 text-emerald-800",
      };
    }
    if (s === "processing" || s === "requires_capture") {
      return {
        label: "Payment processing",
        color: "bg-amber-100 text-amber-800",
      };
    }
    if (s === "requires_payment_method" || s === "canceled") {
      return {
        label: "Payment failed",
        color: "bg-red-100 text-red-800",
      };
    }
    if (s === "loading") {
      return {
        label: "Checking payment status…",
        color: "bg-sky-100 text-sky-800",
      };
    }
    return {
      label: "Status unknown",
      color: "bg-gray-100 text-gray-800",
    };
  }, [status]);

  const lineItems = useMemo(() => {
    if (!order) return [];

    if (Array.isArray(order.items) && order.items.length > 0) {
      return order.items.map((item: any, idx: number) => ({
        id: item.id || item.mpn || idx,
        name: item.name || item.description || "Item",
        mpn: item.mpn || item.part_number || "",
        qty: item.qty || item.quantity || 1,
        totalCents: item.total_cents ?? item.amount_cents ?? item.total ?? null,
        unitCents:
          item.unit_cents ??
          item.price_cents ??
          (item.total_cents && (item.qty || item.quantity)
            ? Math.round(item.total_cents / (item.qty || item.quantity))
            : null),
      }));
    }

    if (Array.isArray(order.line_items) && order.line_items.length > 0) {
      return order.line_items.map((li: any, idx: number) => ({
        id: li.id || idx,
        name: li.description || "Item",
        mpn: li.mpn || "",
        qty: li.quantity || 1,
        totalCents: li.amount_total ?? li.amount_subtotal ?? null,
        unitCents:
          li.amount_total && li.quantity
            ? Math.round(li.amount_total / li.quantity)
            : null,
      }));
    }

    if (Array.isArray(order.lines?.data) && order.lines.data.length > 0) {
      return order.lines.data.map((li: any, idx: number) => ({
        id: li.id || idx,
        name: li.description || "Item",
        mpn: li.mpn || "",
        qty: li.quantity || 1,
        totalCents: li.amount_total ?? li.amount_subtotal ?? null,
        unitCents:
          li.amount_total && li.quantity
            ? Math.round(li.amount_total / li.quantity)
            : null,
      }));
    }

    return [];
  }, [order]);

  useEffect(() => {
    (async () => {
      const sid = params.get("sid");
      const pi = params.get("payment_intent");
      const cs = params.get("payment_intent_client_secret");
      const redirect = params.get("redirect_status");

      const derivedPi = !pi && cs ? extractPiFromClientSecret(cs) : null;
      const piToUse = pi || derivedPi;

      async function fetchOrderRowByPi(piId: string) {
        const r = await fetch(
          `${API_BASE}/api/orders/by-payment-intent?pi=${encodeURIComponent(piId)}`
        );
        const j = await safeJson(r);
        if (!r.ok) return null;
        return j as OrderRow;
      }

      try {
        if (sid) {
          const r = await fetch(
            `/api/checkout/session/status?sid=${encodeURIComponent(sid)}`
          );
          const j = (await safeJson(r)) as StripeishOrder;

          const st = normalizeSuccessStatus(j);
          setStatus(st);
          setOrder(j);
          setMsg(
            st === "paid" || st === "succeeded"
              ? "Order confirmed. Thank you for your purchase."
              : `Payment status: ${st}`
          );

          const piFromSession = j.payment_intent_id || j.payment_intent || null;
          if (piFromSession) {
            const row = await fetchOrderRowByPi(String(piFromSession));
            if (row) setOrderRow(row);
          }
          return;
        }

        if (piToUse) {
          const r = await fetch(
            `${API_BASE}/api/checkout/intent/status?pi=${encodeURIComponent(piToUse)}`
          );
          const j = (await safeJson(r)) as StripeishOrder;

          const st = normalizeSuccessStatus(j, redirect);
          setStatus(st);
          setOrder(j);
          setMsg(
            st === "paid" || st === "succeeded"
              ? "Order confirmed. Thank you for your purchase."
              : `Payment status: ${st}`
          );

          const row = await fetchOrderRowByPi(piToUse);
          if (row) setOrderRow(row);
          return;
        }

        setStatus("unknown");
        setMsg("No payment information was found in the URL.");
      } catch (e) {
        console.error("Error loading success status:", e);
        setStatus("unknown");
        setMsg(
          "Your payment was completed, but we couldn't load the final status. Our team will verify your order."
        );
      }
    })();
  }, [params]);

  const publicToken =
    orderRow?.public_lookup_token || orderRow?.publicLookupToken || null;

  const reliableOrderNumber =
    orderRow?.reliable_order_number || orderRow?.reliableOrderNumber || null;

  const confirmationEmail =
    orderRow?.customer_email ||
    order?.customer_email ||
    order?.customer_details?.email ||
    "";

  const totalCents =
    (typeof orderRow?.total_amount_cents === "number"
      ? orderRow.total_amount_cents
      : null) ??
    (typeof order?.total_cents === "number" ? order.total_cents : null) ??
    (typeof order?.amount_total === "number" ? order.amount_total : null) ??
    (typeof order?.amount === "number" ? order.amount : null);

  const currency = (orderRow?.currency || order?.currency || "USD")
    .toString()
    .toUpperCase();

  useEffect(() => {
    const s = (status || "").toLowerCase();
    if (s !== "paid" && s !== "succeeded") return;
    if (typeof totalCents !== "number" || totalCents <= 0) return;

    const transactionId =
      String(orderRow?.id || order?.payment_intent_id || order?.payment_intent || "") ||
      params.get("payment_intent") ||
      params.get("sid") ||
      "";

    if (!transactionId) return;
    if (purchaseTrackedRef.current === transactionId) return;
    purchaseTrackedRef.current = transactionId;

    const items: GA4Item[] =
      lineItems.length > 0
        ? lineItems.map((item: any) => ({
            item_id: String(item.mpn || item.id || "unknown"),
            item_name: String(item.name || item.mpn || "Item"),
            price:
              typeof item.unitCents === "number"
                ? item.unitCents / 100
                : typeof item.totalCents === "number" && Number(item.qty || 1) > 0
                ? item.totalCents / 100 / Number(item.qty || 1)
                : undefined,
            quantity: Number(item.qty || 1),
          }))
        : [
            {
              item_id: transactionId,
              item_name: "Order",
              price: totalCents / 100,
              quantity: 1,
            },
          ];

    // Purchase tracking is handled server-side from the Stripe webhook.
    // Do not fire a client-side purchase event here, or GA4 will double-count.
  }, [status, totalCents, lineItems, order, orderRow, params]);

  function handlePrint() {
    try {
      window.print();
    } catch {}
  }

  return (
    <div className="min-h-[calc(100vh-180px)] bg-[#001f3e] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-3xl bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden print:shadow-none print:border-0">
        <div className="bg-gradient-to-r from-[#001f3e] to-[#003266] px-6 py-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-emerald-500 flex items-center justify-center text-white text-xl">
            {status === "loading" ? (
              <span className="animate-spin inline-block w-4 h-4 border-2 border-white/70 border-t-transparent rounded-full" />
            ) : (
              "✓"
            )}
          </div>
          <div>
            <h1 className="text-lg font-semibold text-white">
              Order Confirmation 
            </h1>
            <p className="text-xs text-emerald-100">
              {status === "loading" ? "We’re confirming your payment…" : msg}
            </p>
          </div>
        </div>

        <div className="px-6 py-5 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${statusMeta.color}`}
            >
              <span className="w-2 h-2 rounded-full bg-current/70 mr-2" />
              {statusMeta.label}
            </span>

            {reliableOrderNumber ? (
              <div className="text-xs text-gray-600">
                Order Number #{" "}
                <span className="font-semibold text-gray-900">
                  {reliableOrderNumber}
                </span>
              </div>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-3 print:hidden">
            {publicToken ? (
              <Link
                href={`/order/${publicToken}`}
                className="inline-flex items-center px-4 py-2 rounded-md text-sm font-semibold bg-[#efcc30] hover:bg-[#f5d955] text-[#001f3e] shadow-sm cursor-pointer"
              >
                Track your order
              </Link>
            ) : null}

            <Link
              href="/"
              className="inline-flex items-center px-4 py-2 rounded-md text-sm font-semibold border border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Continue shopping
            </Link>

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center px-4 py-2 rounded-md text-sm font-semibold border border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Print confirmation
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="bg-gray-50 rounded-md border border-gray-200 px-4 py-3 text-sm space-y-3">
              {confirmationEmail && (
                <div>
                  <div className="text-gray-600">Confirmation sent to</div>
                  <div className="break-all font-medium text-gray-900">
                    {confirmationEmail}
                  </div>
                </div>
              )}

              {typeof totalCents === "number" && (
                <div className="flex justify-between gap-4">
                  <span className="text-gray-600">Order total</span>
                  <span className="font-semibold text-gray-900">
                    ${(totalCents / 100).toFixed(2)} {currency}
                  </span>
                </div>
              )}
            </div>

            {lineItems.length > 0 && (
              <div className="bg-gray-50 rounded-md border border-gray-200 px-4 py-3 text-sm">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                    Order summary
                  </h2>
                </div>
                <ul className="divide-y divide-gray-200 max-h-40 overflow-y-auto">
                  {lineItems.map((item) => (
                    <li key={item.id} className="py-2 flex justify-between gap-3">
                      <div>
                        <div className="text-xs font-medium text-gray-900">
                          {item.name}
                        </div>
                        <div className="text-[11px] text-gray-500">
                          Qty {item.qty}
                          {item.mpn ? ` • MPN ${item.mpn}` : ""}
                        </div>
                      </div>
                      <div className="text-right text-xs text-gray-800">
                        {item.totalCents != null && (
                          <div className="font-semibold">
                            ${(item.totalCents / 100).toFixed(2)}
                          </div>
                        )}
                        {item.unitCents != null && item.qty > 1 && (
                          <div className="text-[11px] text-gray-500">
                            ${(item.unitCents / 100).toFixed(2)} each
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="text-xs text-gray-600 leading-relaxed">
            <p>
              You’ll receive an email shortly with your order confirmation and
              tracking link. If you have any questions or need to change your
              order, reply to that email and our team will help you out.
            </p>
            <p className="mt-2">
              Shipping destinations: We ship to the United States and U.S.
              territories (including Puerto Rico). We currently do not ship to
              international addresses.
            </p>
          </div>

          <div className="flex justify-end print:hidden">
            <Link
              href="/rare-part-request"
              className="inline-flex items-center px-4 py-2 rounded-md text-sm font-semibold bg-white border border-gray-200 hover:bg-gray-50 text-[#001f3e] shadow-sm cursor-pointer"
            >
              Need help finding another part?
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={null}>
      <SuccessPageInner />
    </Suspense>
  );
}