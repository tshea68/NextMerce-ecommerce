"use client";

import Link from "next/link";
import { PackageSearch, Phone, Truck } from "lucide-react";

export default function TopBar() {
  return (
    <div className="bg-[#06254a] text-white">
      <div className="mx-auto w-full max-w-[1700px] px-3 sm:px-4">
        <div className="flex flex-col gap-2 py-2 lg:hidden">
          <div className="grid grid-cols-2 gap-2">
            <a
              href="tel:2028821699"
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-[13px] font-extrabold leading-tight text-white shadow-sm active:bg-white/20"
              aria-label="Call Appliance Part Geeks at 202-882-1699"
            >
              <Phone className="h-4 w-4 shrink-0 text-orange-300" />
              <span>202-882-1699</span>
            </a>

            <Link
              href="/track-order"
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-[13px] font-extrabold leading-tight text-white shadow-sm active:bg-white/20"
              aria-label="Track your order"
            >
              <PackageSearch className="h-4 w-4 shrink-0 text-orange-300" />
              <span>Track Order</span>
            </Link>
          </div>

          <div className="flex items-center justify-center gap-2 text-center text-[11px] font-bold leading-tight text-white/90">
            <Truck className="h-3.5 w-3.5 shrink-0 text-orange-300" />
            <span>Overnight shipping available on eligible in-stock parts</span>
          </div>
        </div>

        <div className="hidden min-h-10 items-center justify-between gap-4 py-2 text-[13px] font-bold lg:flex">
          <a
            href="tel:2028821699"
            className="inline-flex items-center gap-2 text-white hover:text-orange-200"
            aria-label="Call Appliance Part Geeks at 202-882-1699"
          >
            <Phone className="h-4 w-4 text-orange-300" />
            <span>202-882-1699</span>
          </a>

          <div className="inline-flex items-center gap-2 text-white">
            <Truck className="h-4 w-4 text-orange-300" />
            <span>Overnight Shipping Available on Eligible In-Stock Parts</span>
          </div>

          <Link
            href="/track-order"
            className="inline-flex items-center gap-2 text-white hover:text-orange-200"
          >
            <PackageSearch className="h-4 w-4 text-orange-300" />
            <span>Track Order</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
