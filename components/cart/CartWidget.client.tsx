"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/context/CartContext";

type CartWidgetVariant = "topbar" | "header" | "compact";

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value || 0);
}

export default function CartWidget({
  variant = "header",
}: {
  variant?: CartWidgetVariant;
}) {
  const { cartItems } = useCart();

  const itemCount = Array.isArray(cartItems)
    ? cartItems.reduce((sum, item) => sum + Math.max(1, Number(item.qty) || 1), 0)
    : 0;

  const subtotal = Array.isArray(cartItems)
    ? cartItems.reduce((sum, item) => {
        const price = Number(item.price) || 0;
        const qty = Math.max(1, Number(item.qty) || 1);
        return sum + price * qty;
      }, 0)
    : 0;

  const subtotalText = formatMoney(subtotal);

  const ariaLabel =
    itemCount > 0
      ? `Cart with ${itemCount} item${itemCount === 1 ? "" : "s"}, subtotal ${subtotalText}`
      : "Cart is empty";

  if (variant === "topbar") {
    return (
      <Link
        href="/cart"
        aria-label={ariaLabel}
        className="inline-flex cursor-pointer items-center gap-2.5 rounded-full px-2.5 py-1 font-semibold text-white transition hover:bg-white/10 hover:text-orange-200"
      >
        <span className="relative inline-flex h-7 w-7 items-center justify-center">
          <ShoppingCart className="h-6 w-6" />
          {itemCount > 0 ? (
            <span className="absolute -right-2.5 -top-2.5 z-10 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-orange-300 px-1.5 text-[11px] font-extrabold leading-none text-[#06254a] ring-2 ring-[#06254a]">
              {itemCount}
            </span>
          ) : null}
        </span>
        <span className="whitespace-nowrap text-[12px] font-extrabold">{subtotalText}</span>
      </Link>
    );
  }

  if (variant === "compact") {
    return (
      <Link
        href="/cart"
        aria-label={ariaLabel}
        className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-950 shadow-sm transition hover:bg-zinc-50 hover:shadow-md active:bg-zinc-100"
      >
        <span className="relative inline-flex h-6 w-6 items-center justify-center">
          <ShoppingCart className="h-5 w-5" />
          {itemCount > 0 ? (
            <span className="absolute -right-2 -top-2 z-10 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-zinc-950 px-1.5 text-[11px] font-extrabold leading-none text-white ring-2 ring-white">
              {itemCount}
            </span>
          ) : null}
        </span>
      </Link>
    );
  }

  return (
    <Link
      href="/cart"
      aria-label={ariaLabel}
      className="inline-flex min-w-[104px] cursor-pointer items-center justify-center gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-zinc-950 shadow-sm transition hover:bg-zinc-50 hover:shadow-md active:bg-zinc-100"
    >
      <span className="relative inline-flex h-6 w-6 items-center justify-center">
        <ShoppingCart className="h-5 w-5" />
        {itemCount > 0 ? (
          <span className="absolute -right-2 -top-2 z-10 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-zinc-950 px-1.5 text-[11px] font-extrabold leading-none text-white ring-2 ring-white">
            {itemCount}
          </span>
        ) : null}
      </span>
      <span className="whitespace-nowrap text-[15px] font-extrabold leading-none">{subtotalText}</span>
    </Link>
  );
}
