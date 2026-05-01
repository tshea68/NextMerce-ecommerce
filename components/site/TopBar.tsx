import Link from "next/link";
import { Phone, Truck, RotateCcw, PackageSearch, ShoppingCart } from "lucide-react";

export default function TopBar() {
  return (
    <div className="bg-[#06254a] text-white">
      <div className="mx-auto flex min-h-10 w-[96%] max-w-[1700px] flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-2 text-[12px] font-semibold sm:text-[13px]">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <a href="tel:2028821699" className="inline-flex items-center gap-2 hover:text-orange-200">
            <Phone className="h-4 w-4 text-orange-300" />
            <span>202-882-1699</span>
          </a>

          <div className="inline-flex items-center gap-2">
            <Truck className="h-4 w-4 text-orange-300" />
            <span>Overnight Delivery Available on All Orders</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-white/90">
          <Link href="/order" className="inline-flex items-center gap-1.5 hover:text-orange-200">
            <PackageSearch className="h-4 w-4" />
            <span>Track Order</span>
          </Link>

          <Link href="/returns" className="inline-flex items-center gap-1.5 hover:text-orange-200">
            <RotateCcw className="h-4 w-4" />
            <span>Returns</span>
          </Link>

          <Link href="/cart" className="inline-flex items-center gap-1.5 hover:text-orange-200">
            <ShoppingCart className="h-4 w-4" />
            <span>Cart</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
