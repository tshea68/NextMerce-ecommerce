"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import CartWidget from "@/components/cart/CartWidget.client";
import { ShoppingCart, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { useCart } from "@/context/CartContext";
import HeaderMenu from "@/components/site/HeaderMenu";
import SearchOverlay from "@/components/search/SearchOverlay";
import TopBar from "@/components/site/TopBar";

export default function Header() {
  const pathname = usePathname();
  const hideMobileHeaderSearch = pathname === "/";
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
      <TopBar />
<header className="border-b border-black/10 bg-white text-black shadow-sm">
        <div className="mx-auto w-full max-w-[1700px] px-3 sm:px-4">
          <div className="flex min-h-[104px] items-center justify-between gap-2 py-4 lg:min-h-[144px] lg:gap-4 lg:py-5">
            <Link href="/" className="min-w-0 flex-1 lg:flex-none lg:shrink-0">
              <img
                src="https://djvyjctjcehjyglwjniv.supabase.co/storage/v1/object/public/part_images/logofull2.png"
                alt="Appliance Part Geeks"
                className="h-[72px] max-w-full object-contain lg:h-[100px]"
              />
            </Link>

            <div className="hidden flex-1 lg:flex flex-col items-start justify-center gap-5 pl-6">
              <HeaderMenu />

              <div className="w-full pb-1">
                <button
                  type="button"
                  onClick={() => setSearchOpen(true)}
                  className="group flex h-14 w-full max-w-[960px] items-center rounded-2xl border-2 border-black/25 bg-white px-5 text-left shadow-md transition-all duration-200 hover:border-black/45 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500/25"
                >
                  <Search className="mr-3 h-5 w-5 shrink-0 text-black/65 transition-colors duration-200 group-hover:text-blue-700" />

                  <span className="truncate text-[15px] font-medium text-black/70">
                    Search by model number, part number (MPN), brand, or appliance type
                  </span>

                  <span className="ml-auto hidden items-center rounded-full border border-blue-300 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 lg:inline-flex">
                    Search
                  </span>
                </button>
              </div>
            </div>

            <div className="hidden lg:flex shrink-0">
              <CartWidget variant="header" />
            </div>

            <div className="flex shrink-0 items-center gap-2 lg:hidden">
              {!hideMobileHeaderSearch && (
                <button
                  type="button"
                  onClick={() => setSearchOpen(true)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-black/20 bg-white p-0 text-sm font-medium text-black shadow-sm transition hover:bg-black/[0.03]"
                  aria-label="Open search"
                >
                  <Search className="h-4 w-4" />
                </button>
              )}

              <CartWidget variant="compact" />

              <HeaderMenu />
            </div>
          </div>
        </div>
      </header>

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}