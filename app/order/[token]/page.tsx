import Link from "next/link";
import { notFound } from "next/navigation";

const API_BASE =
  (process.env.NEXT_PUBLIC_API_BASE || "").trim() ||
  "https://api.appliancepartgeeks.com";

type PublicOrder = {
  id?: number | string;
  status?: string | null;
  reliable_order_number?: string | null;
  reliable_status?: string | null;
  tracking_number?: string | null;
  shipping_carrier?: string | null;
  customer_email?: string | null;
  customer_name?: string | null;
  total_amount_cents?: number | null;
  currency?: string | null;
  shipped_at?: string | null;
  estimated_delivery?: string | null;
  last_status_check_at?: string | null;
  public_lookup_token?: string | null;
  shipping_address?: any;
  metadata?: any;
  items?: any[];
  order_items?: any[];
  line_items?: any[];
};

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const n = Number(value.replace(/[^0-9.-]/g, ""));
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function money(cents: unknown, currency = "USD") {
  const n = asNumber(cents);
  if (n == null) return "—";
  const dollars = n / 100;
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(dollars);
  } catch {
    return `$${dollars.toFixed(2)}`;
  }
}

function parseObj(value: unknown): Record<string, any> {
  if (!value) return {};
  if (typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, any>;
  }
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as Record<string, any>;
      }
    } catch {}
  }
  return {};
}

function formatDate(value: unknown) {
  const s = String(value ?? "").trim();
  if (!s) return "—";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s;
  return d.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function statusTone(status: string | null | undefined) {
  const s = String(status ?? "").trim().toLowerCase();

  if (!s) {
    return "bg-slate-100 text-slate-800 border-slate-200";
  }
  if (s.includes("backorder")) {
    return "bg-amber-100 text-amber-900 border-amber-200";
  }
  if (s.includes("ship") || s.includes("delivered")) {
    return "bg-emerald-100 text-emerald-900 border-emerald-200";
  }
  if (s.includes("cancel") || s.includes("fail")) {
    return "bg-red-100 text-red-900 border-red-200";
  }
  return "bg-sky-100 text-sky-900 border-sky-200";
}

function normalizeItems(order: PublicOrder) {
  const raw =
    (Array.isArray(order.items) && order.items) ||
    (Array.isArray(order.order_items) && order.order_items) ||
    (Array.isArray(order.line_items) && order.line_items) ||
    [];

  return raw.map((item: any, idx: number) => {
    const qty = Number(item.quantity ?? item.qty ?? 1) || 1;
    const unit =
      asNumber(item.unit_amount_cents) ??
      asNumber(item.price_cents) ??
      asNumber(item.unit_cents) ??
      null;

    const total =
      asNumber(item.total_amount_cents) ??
      asNumber(item.total_cents) ??
      (unit != null ? unit * qty : null);

    return {
      id: item.id || `${item.mpn || item.part_number || "item"}-${idx}`,
      name: item.name || item.title || item.description || item.mpn || "Item",
      mpn: item.mpn || item.part_number || "",
      qty,
      unitCents: unit,
      totalCents: total,
      isRefurb: !!item.is_refurb,
    };
  });
}

async function fetchOrder(token: string): Promise<PublicOrder | null> {
  const url = `${API_BASE}/api/orders/public/${encodeURIComponent(token)}`;

  try {
    const resp = await fetch(url, { cache: "no-store" });
    if (resp.status === 404) return null;

    const text = await resp.text();
    let json: any = null;
    try {
      json = JSON.parse(text);
    } catch {
      json = { _raw: text };
    }

    if (!resp.ok) {
      throw new Error(
        json?.detail ||
          json?.error ||
          `Failed to load order (${resp.status})`
      );
    }

    return (json?.order || json) as PublicOrder;
  } catch (err) {
    console.error("Order lookup failed:", err);
    throw err;
  }
}

export default async function PublicOrderPage({
  params,
}: {
  params: Promise<{ token: string }> | { token: string };
}) {
  const resolved = await Promise.resolve(params);
  const token = resolved?.token;

  if (!token) notFound();

  const order = await fetchOrder(token);
  if (!order) notFound();

  const shipping = parseObj(order.shipping_address);
  const metadata = parseObj(order.metadata);
  const items = normalizeItems(order);

  const orderNumber = order.reliable_order_number || "Pending";
  const reliableStatus = order.reliable_status || order.status || "Processing";
  const total = money(order.total_amount_cents, order.currency || "USD");

  const shipName =
    shipping.name ||
    order.customer_name ||
    metadata.contact_name ||
    metadata.ship_name ||
    "—";

  const shipAddress1 =
    shipping.address1 || shipping.line1 || metadata.ship_address1 || "";
  const shipAddress2 =
    shipping.address2 || shipping.line2 || metadata.ship_address2 || "";
  const shipCity = shipping.city || metadata.ship_city || "";
  const shipState = shipping.state || metadata.ship_state || "";
  const shipPostal =
    shipping.postal ||
    shipping.postal_code ||
    shipping.zip ||
    metadata.ship_postal ||
    "";
  const shipCountry = shipping.country || metadata.ship_country || "US";

  return (
    <>
      <style>{`
        @media print {
          header, footer, nav, .print-hidden {
            display: none !important;
          }
          body {
            background: #fff !important;
          }
          body * {
            visibility: hidden;
          }
          #print-order,
          #print-order * {
            visibility: visible;
          }
          #print-order {
            position: absolute;
            inset: 0 auto auto 0;
            width: 100%;
            max-width: 100%;
            box-shadow: none !important;
            border: 0 !important;
            border-radius: 0 !important;
            margin: 0;
          }
          @page {
            margin: 12mm;
          }
        }
      `}</style>

      <div className="min-h-[calc(100vh-180px)] bg-[#001f3e] px-4 py-10">
        <div
          id="print-order"
          className="mx-auto w-full max-w-4xl overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl"
        >
          <div className="bg-gradient-to-r from-[#001f3e] to-[#003266] px-6 py-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-xs uppercase tracking-[0.16em] text-white/70">
                  Order Tracking
                </div>
                <h1 className="mt-1 text-2xl font-semibold text-white">
                  Order #{orderNumber}
                </h1>
              </div>

              <div
                className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusTone(
                  reliableStatus
                )}`}
              >
                {reliableStatus}
              </div>
            </div>
          </div>

          <div className="space-y-6 px-6 py-6">
            <div className="print-hidden flex flex-wrap gap-3">
              <Link
                href="/"
                className="inline-flex items-center rounded-md border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
              >
                Continue shopping
              </Link>

              <button
                type="button"
                onClick={() => {
                  if (typeof window !== "undefined") window.print();
                }}
                className="inline-flex items-center rounded-md border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
              >
                Print order
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
                <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Order Details
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between gap-3">
                    <span className="text-zinc-600">Reliable Order</span>
                    <span className="font-medium text-zinc-900">{orderNumber}</span>
                  </div>

                  <div className="flex justify-between gap-3">
                    <span className="text-zinc-600">Current Status</span>
                    <span className="font-medium text-zinc-900">
                      {reliableStatus}
                    </span>
                  </div>

                  <div className="flex justify-between gap-3">
                    <span className="text-zinc-600">Order Total</span>
                    <span className="font-medium text-zinc-900">{total}</span>
                  </div>

                  <div className="flex justify-between gap-3">
                    <span className="text-zinc-600">Placed</span>
                    <span className="font-medium text-zinc-900">
                      {formatDate((order as any).created_at)}
                    </span>
                  </div>

                  <div className="flex justify-between gap-3">
                    <span className="text-zinc-600">Last Status Check</span>
                    <span className="font-medium text-zinc-900">
                      {formatDate(order.last_status_check_at)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
                <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Shipping
                </div>

                <div className="space-y-2 text-sm text-zinc-800">
                  <div className="font-medium">{shipName}</div>
                  {shipAddress1 ? <div>{shipAddress1}</div> : null}
                  {shipAddress2 ? <div>{shipAddress2}</div> : null}
                  <div>
                    {[shipCity, shipState, shipPostal].filter(Boolean).join(", ")}
                  </div>
                  <div>{shipCountry}</div>

                  <div className="pt-3">
                    <div className="flex justify-between gap-3">
                      <span className="text-zinc-600">Carrier</span>
                      <span className="font-medium text-zinc-900">
                        {order.shipping_carrier || "—"}
                      </span>
                    </div>
                    <div className="mt-2 flex justify-between gap-3">
                      <span className="text-zinc-600">Tracking Number</span>
                      <span className="font-medium text-zinc-900 break-all text-right">
                        {order.tracking_number || "Not available yet"}
                      </span>
                    </div>
                    <div className="mt-2 flex justify-between gap-3">
                      <span className="text-zinc-600">Estimated Delivery</span>
                      <span className="font-medium text-zinc-900">
                        {formatDate(order.estimated_delivery)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {String(reliableStatus).toLowerCase().includes("backorder") ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                This order is currently marked as <strong>Backordered</strong> by
                Reliable Parts. We’ll update this page as fulfillment changes.
              </div>
            ) : null}

            <div className="rounded-xl border border-zinc-200 bg-white">
              <div className="border-b border-zinc-200 px-4 py-3">
                <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Order Items
                </div>
              </div>

              <div className="divide-y divide-zinc-200">
                {items.length ? (
                  items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start justify-between gap-4 px-4 py-4"
                    >
                      <div>
                        <div className="text-sm font-medium text-zinc-900">
                          {item.name}
                        </div>
                        <div className="mt-1 text-xs text-zinc-500">
                          Qty {item.qty}
                          {item.mpn ? ` • MPN ${item.mpn}` : ""}
                          {item.isRefurb ? " • Refurbished" : " • OEM"}
                        </div>
                      </div>

                      <div className="text-right text-sm">
                        <div className="font-semibold text-zinc-900">
                          {item.totalCents != null
                            ? money(item.totalCents, order.currency || "USD")
                            : "—"}
                        </div>
                        {item.unitCents != null && item.qty > 1 ? (
                          <div className="mt-1 text-xs text-zinc-500">
                            {money(item.unitCents, order.currency || "USD")} each
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-6 text-sm text-zinc-600">
                    No line items were returned for this order.
                  </div>
                )}
              </div>
            </div>

            {order.customer_email ? (
              <div className="text-sm text-zinc-600">
                Confirmation sent to{" "}
                <span className="font-medium text-zinc-900">
                  {order.customer_email}
                </span>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </>
  );
}