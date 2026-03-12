"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useCart } from "@/context/CartContext";

export default function AddToCartBox({ item }: { item: any }) {
  const { addToCart } = useCart() as any;
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
    return Number.isFinite(n) ? n : null;
  }, [item]);

  const imageUrl =
    item?.srp_image ||
    item?.image_url ||
    item?.image ||
    null;

  // you don't have inventory in ebay_items_current, so we treat as in-stock unless provided
  const inv = useMemo(() => {
    const n = Number(item?.inventory_total ?? item?.qty ?? item?.available ?? item?.inventory ?? NaN);
    return Number.isFinite(n) ? n : null;
  }, [item]);

  const inStock = inv == null ? true : inv > 0;

  function onAdd() {
    if (!mpn || !addToCart || !inStock) return;

    setAdding(true);
    try {
      addToCart({
        mpn,
        qty: 1,
        quantity: 1,
        is_refurb: true,
        offer_id: item?.item_id || item?.offer_id || item?.listing_id || item?.id || null,
        name: title,
        title,
        price: priceNum ?? undefined,
        image_url: imageUrl,
        image: imageUrl,
        url: item?.url || undefined,
        seller: item?.seller || undefined,
      });
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        className={`px-4 py-2 rounded text-[12px] font-semibold text-white ${
          !inStock ? "bg-gray-400 cursor-not-allowed" : "bg-blue-700 hover:bg-blue-800"
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