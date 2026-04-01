"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useCart } from "@/context/CartContext";

type CartItemInput = {
  mpn: string;
  name: string;
  price: number;
  qty: number;
  image?: string;
  condition?: string;
  is_refurb: boolean;
};

export default function AddToCartBox({ item }: { item: any }) {
  const { addToCart } = useCart() as {
    addToCart: (item: CartItemInput) => void;
  };

  const [adding, setAdding] = useState(false);

  const mpn = useMemo(() => {
    return String(
      item?.mpn_display ||
        item?.mpn ||
        item?.mpn_normalized ||
        item?.mpn_norm ||
        item?.mpn_raw ||
        ""
    ).trim();
  }, [item]);

  const title = useMemo(() => {
    const t = String(item?.title || item?.name || "").trim();
    return t || (mpn ? `Refurbished ${mpn}` : "Refurbished part");
  }, [item, mpn]);

  const priceNum = useMemo(() => {
    const v = item?.price_value ?? item?.price;
    if (typeof v === "number") return v;

    const n = Number(String(v ?? "").replace(/[^0-9.]/g, ""));
    return Number.isFinite(n) ? n : 0;
  }, [item]);

  const imageUrl = useMemo(() => {
    return item?.srp_image || item?.image_url || item?.image || null;
  }, [item]);

  const inv = useMemo(() => {
    const n = Number(
      item?.inventory_total ??
        item?.qty ??
        item?.available ??
        item?.inventory ??
        NaN
    );
    return Number.isFinite(n) ? n : null;
  }, [item]);

  const inStock = inv == null ? true : inv > 0;

  function onAdd() {
    if (!mpn || !inStock) return;

    setAdding(true);
    try {
      addToCart({
        mpn,
        name: title,
        price: priceNum,
        qty: 1,
        image: imageUrl || undefined,
        condition: "refurbished",
        is_refurb: true,
      });
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        className={`rounded px-4 py-2 text-[12px] font-semibold text-white ${
          !inStock
            ? "cursor-not-allowed bg-gray-400"
            : "bg-blue-700 hover:bg-blue-800"
        }`}
        onClick={onAdd}
        disabled={!inStock || adding}
        title={!inStock ? "Out of stock" : "Add to Cart"}
      >
        {adding ? "Adding..." : "Add to Cart"}
      </button>

      <Link href="/cart" className="text-[12px] text-blue-700 underline">
        View cart
      </Link>

      {inv != null && (
        <span className="text-[12px] text-gray-600">
          Qty: <span className="font-semibold">{inv.toLocaleString()}</span>
        </span>
      )}
    </div>
  );
}