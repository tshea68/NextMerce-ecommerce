"use client";

import Link from "next/link";
import { ShoppingCart, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { useCart } from "@/context/CartContext";
import HeaderMenu from "@/components/site/HeaderMenu";
import SearchOverlay from "@/components/search/SearchOverlay";

export default function Header() {
  const { cartItems } = useCart();
  const [searchOpen, setSearchOpen] = useState(false);

  const cartCount = useMemo(() => {
    return (cartItems || []).reduce((sum: number, item: any) => {
      const qty = Number(item?.qty ?? item?.quantity ?? 1);
      return sum + (Number.isFinite(qty) ? qty : 1);
    }, 0);
  }, [cartItems]);

  return (
    <>
      <header className="border-b border-black/10 bg-white text-black shadow-sm">
        <div className="mx-auto w-[96%] max-w-[1700px] px-4">
          <div className="flex min-h-[124px] items-center justify-between gap-4">
            <Link href="/" className="shrink-0">
              <img
                src="https://djvyjctjcehjyglwjniv.supabase.co/storage/v1/object/public/part_images/logofull2.png"
                alt="Appliance Part Geeks"
                className="h-[100px] w-auto object-contain"
              />
            </Link>

            <div className="hidden flex-1 lg:flex flex-col items-start justify-center gap-4 pl-6">
              <HeaderMenu />

              <div className="w-full">
                <button
                  type="button"
                  onClick={() => setSearchOpen(true)}
                  className="group flex h-14 w-full max-w-[960px] items-center rounded-2xl border border-black/15 bg-white px-5 text-left shadow-sm transition-all duration-200 hover:border-blue-500 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <Search className="mr-3 h-5 w-5 shrink-0 text-black/50 transition-colors duration-200 group-hover:text-blue-600" />

                  <span className="truncate text-[15px] text-black/65">
                    Search by model number, part number (MPN), brand, or appliance type
                  </span>

                  <span className="ml-auto hidden items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 lg:inline-flex">
                    Search
                  </span>
                </button>

                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-black/55">
                  <span>New OEM parts</span>
                  <span>Refurbished savings</span>
                  <span>Model + MPN lookup</span>
                </div>
              </div>
            </div>

            <div className="hidden lg:flex shrink-0">
              <Link
                href="/cart"
                className="inline-flex items-center gap-2 rounded-xl border border-black/15 bg-white px-4 py-3 text-sm font-medium text-black shadow-sm transition hover:bg-black/[0.03] hover:shadow-md"
              >
                <ShoppingCart className="h-4 w-4" />
                <span>Cart</span>
                <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-black px-1.5 py-0.5 text-[11px] font-semibold text-white">
                  {cartCount}
                </span>
              </Link>
            </div>

            <div className="flex items-center gap-2 lg:hidden">
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl border border-black/15 bg-white px-3 py-2.5 text-sm font-medium text-black shadow-sm transition hover:bg-black/[0.03]"
                aria-label="Open search"
              >
                <Search className="h-4 w-4" />
              </button>

              <HeaderMenu />
            </div>
          </div>
        </div>
      </header>

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}