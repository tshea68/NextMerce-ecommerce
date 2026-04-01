import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#00172d]">
      <div className="mx-auto w-[92%] max-w-[1400px] px-0 py-10">
        <div className="grid gap-10 md:grid-cols-3">
          <div>
            <h3 className="text-base font-semibold">Appliance Part Geeks</h3>
            <p className="mt-3 max-w-md text-sm leading-6 text-white/75">
              New and refurbished OEM appliance parts, with fast purchase paths
              and support for hard-to-find replacements.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wide text-white/85">
              Shop
            </h4>
            <div className="mt-3 flex flex-col gap-2 text-sm text-white/75">
              <Link href="/grid" className="hover:text-white">Browse Parts</Link>
              <Link href="/cart" className="hover:text-white">Cart</Link>
              <Link href="/order" className="hover:text-white">Track Order</Link>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wide text-white/85">
              Policies
            </h4>
            <div className="mt-3 flex flex-col gap-2 text-sm text-white/75">
              <Link href="/shipping" className="hover:text-white">Shipping</Link>
              <Link href="/returns" className="hover:text-white">Returns</Link>
              <Link href="/terms" className="hover:text-white">Terms</Link>
              <Link href="/privacy" className="hover:text-white">Privacy</Link>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-white/10 pt-6 text-xs text-white/55">
          © {new Date().getFullYear()} Appliance Part Geeks. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
