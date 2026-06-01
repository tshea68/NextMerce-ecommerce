"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { money } from "@/lib/money";
import { buildProductItem, trackBeginCheckout } from "@/lib/ga4";

export default function CartPage() {
  const router = useRouter();
  const { cartItems, updateQty, removeFromCart, clearCart } = useCart();

  const subtotal = useMemo(() => {
    return cartItems.reduce(
      (sum, item) => sum + Number(item.price || 0) * Number(item.qty || 0),
      0
    );
  }, [cartItems]);

  function handleCheckout() {
    const summaryPayload = cartItems.map((item) => ({
      mpn: item.mpn,
      qty: Number(item.qty || 1),
      name: item.name || null,
      priceEach: Number.isFinite(Number(item.price))
        ? Number(item.price)
        : null,
      lineTotal: Number.isFinite(Number(item.price))
        ? Number(item.price) * Number(item.qty || 1)
        : null,
      is_refurb: !!item.is_refurb,
      condition:
        item.condition || (item.is_refurb ? "refurbished" : "new"),
    }));

    const ga4Items = cartItems.map((item) =>
      buildProductItem(
        {
          ...item,
          title: item.name,
          is_refurb: !!item.is_refurb,
        },
        Number(item.qty || 1)
      )
    );

    trackBeginCheckout(ga4Items, subtotal);

    router.push(
      `/checkout?cart=${encodeURIComponent(JSON.stringify(summaryPayload))}`
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 md:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">Shopping Cart</h1>
        <p className="mt-2 text-sm text-gray-600">
          Review your items before checkout.
        </p>
      </div>

      {cartItems.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <h2 className="text-xl font-medium">Your cart is empty</h2>
          <p className="mt-2 text-sm text-gray-600">
            Add a part or refurbished offer to continue.
          </p>
          <div className="mt-6">
            <Link
              href="/grid"
              className="inline-flex rounded-xl bg-black px-5 py-3 text-sm font-medium text-white"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[1.6fr_0.8fr]">
          <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 px-6 py-4">
              <h2 className="text-lg font-medium">Items</h2>
            </div>

            <div className="divide-y divide-gray-200">
              {cartItems.map((item) => {
                const rowKey = `${item.mpn}__${
                  item.is_refurb ? "refurb" : "new"
                }`;
                const lineTotal =
                  Number(item.price || 0) * Number(item.qty || 0);

                return (
                  <div
                    key={rowKey}
                    className="grid gap-4 px-6 py-5 md:grid-cols-[96px_1fr_auto]"
                  >
                    <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
                      {item.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.image}
                          alt={item.name}
                          className="h-full w-full object-contain"
                        />
                      ) : (
                        <div className="text-xs text-gray-400">No image</div>
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-medium">{item.name}</h3>
                        <span className="rounded-full border border-gray-200 px-2 py-0.5 text-xs text-gray-600">
                          {item.condition ||
                            (item.is_refurb ? "refurbished" : "new")}
                        </span>
                      </div>

                      <div className="mt-2 text-sm text-gray-600">
                        <div>MPN: {item.mpn}</div>
                        <div>Unit price: {money(Number(item.price || 0))}</div>
                      </div>

                      <div className="mt-4 flex items-center gap-3">
                        <label
                          htmlFor={rowKey}
                          className="text-sm text-gray-600"
                        >
                          Qty
                        </label>
                        <input
                          id={rowKey}
                          type="number"
                          min={1}
                          value={item.qty}
                          onChange={(e) =>
                            updateQty(
                              item.mpn,
                              item.is_refurb,
                              Number(e.target.value)
                            )
                          }
                          className="w-20 rounded-lg border border-gray-300 px-3 py-2 text-sm"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            removeFromCart(item.mpn, item.is_refurb)
                          }
                          className="text-sm font-medium text-red-600 hover:text-red-700"
                        >
                          Remove
                        </button>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-sm text-gray-500">Line total</div>
                      <div className="mt-1 text-lg font-semibold">
                        {money(lineTotal)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <aside className="h-fit rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-medium">Order Summary</h2>

            <div className="mt-6 space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">{money(subtotal)}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-600">Shipping</span>
                <span className="text-gray-500">Calculated at checkout</span>
              </div>
            </div>

            <div className="my-6 border-t border-gray-200" />

            <div className="flex items-center justify-between">
              <span className="text-base font-medium">Estimated total</span>
              <span className="text-xl font-semibold">{money(subtotal)}</span>
            </div>

            <button
              type="button"
              onClick={handleCheckout}
              className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-black px-5 py-3 text-sm font-medium text-white"
            >
              Proceed to Checkout
            </button>

            <button
              type="button"
              onClick={clearCart}
              className="mt-3 inline-flex w-full items-center justify-center rounded-xl border border-gray-300 px-5 py-3 text-sm font-medium text-gray-700"
            >
              Clear Cart
            </button>

            <Link
              href="/grid"
              className="mt-3 inline-flex w-full items-center justify-center rounded-xl border border-gray-300 px-5 py-3 text-sm font-medium text-gray-700"
            >
              Continue Shopping
            </Link>
          </aside>
        </div>
      )}
    </main>
  );
}