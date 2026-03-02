"use client";

import Link from "next/link";

export type ProductCardVM = {
  source: "parts" | "offers";
  id: string;
  href: string;

  mpn: string | null;
  title: string | null;
  price: any;
  image_url: string | null;

  brand: string | null;
  part_type: string | null;
  appliance_type: string | null;

  in_stock: boolean;
  inventory_total: number | null;

  stock_status_canon?: string | null;
  availability_rank?: number | null;

  replaced_by?: string | null;
  replaces_previous_parts?: string | null;

  compatible_models?: string | null;

  listing_id?: string | null;
};

export type ProductVM = {
  kind: "parts" | "offers";
  slug: string;
  mpn_norm: string;

  primary: ProductCardVM;

  new_part: ProductCardVM | null;
  refurb_offers: ProductCardVM[];
};

function money(v: any) {
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

function splitModels(s: string | null | undefined) {
  if (!s) return [];
  // supports comma/space/newline delims
  return String(s)
    .split(/[\n,]+/)
    .map((x) => x.trim())
    .filter(Boolean)
    .slice(0, 50);
}

export default function ProductPageClient({ vm }: { vm: ProductVM }) {
  const p = vm.primary;

  const title = p.title || p.mpn || "Product";
  const models = splitModels(p.compatible_models);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="mb-4 text-sm text-gray-600">
        <Link className="hover:underline" href="/grid">
          Home
        </Link>
        <span className="mx-2">/</span>
        <Link className="hover:underline" href="/grid">
          Grid
        </Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900">{p.mpn ?? vm.slug}</span>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border bg-white p-4">
          {/* Image */}
          <div className="aspect-square w-full overflow-hidden rounded-lg bg-gray-50">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={p.image_url || "/placeholder.png"}
              alt={title}
              className="h-full w-full object-contain"
            />
          </div>
        </div>

        <div className="rounded-xl border bg-white p-5">
          <div className="flex items-center gap-2">
            <span
              className={`rounded-full px-2 py-1 text-xs font-semibold ${
                p.source === "offers"
                  ? "bg-amber-100 text-amber-800"
                  : "bg-emerald-100 text-emerald-800"
              }`}
            >
              {p.source === "offers" ? "Refurbished Offer" : "New Part"}
            </span>

            {p.in_stock ? (
              <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">
                In stock{p.source === "offers" && p.inventory_total != null ? ` (${p.inventory_total})` : ""}
              </span>
            ) : (
              <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">
                Out of stock
              </span>
            )}
          </div>

          <h1 className="mt-3 text-2xl font-semibold text-gray-900">{title}</h1>

          <div className="mt-2 text-sm text-gray-600">
            <div>
              <span className="font-medium text-gray-800">MPN:</span> {p.mpn ?? vm.slug}
            </div>
            {p.brand && (
              <div>
                <span className="font-medium text-gray-800">Brand:</span> {p.brand}
              </div>
            )}
            {p.appliance_type && (
              <div>
                <span className="font-medium text-gray-800">Appliance:</span> {p.appliance_type}
              </div>
            )}
            {p.part_type && (
              <div>
                <span className="font-medium text-gray-800">Part type:</span> {p.part_type}
              </div>
            )}
            {p.source === "offers" && p.listing_id && (
              <div>
                <span className="font-medium text-gray-800">Listing ID:</span> {p.listing_id}
              </div>
            )}
          </div>

          <div className="mt-4 text-3xl font-bold text-gray-900">{money(p.price)}</div>

          {/* Minimal action row (you can wire into your cart/checkout later) */}
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href={p.href}
              className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-black"
            >
              Refresh page
            </Link>

            {p.source === "offers" && vm.new_part?.href ? (
              <Link
                href={vm.new_part.href}
                className="rounded-lg border px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50"
              >
                View new part
              </Link>
            ) : null}

            {p.source === "parts" && vm.refurb_offers?.[0]?.href ? (
              <Link
                href={vm.refurb_offers[0].href}
                className="rounded-lg border px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50"
              >
                View refurbished options
              </Link>
            ) : null}
          </div>

          {/* Replacement info for new parts */}
          {(p.replaced_by || p.replaces_previous_parts) && (
            <div className="mt-6 rounded-lg border bg-gray-50 p-4 text-sm">
              <div className="font-semibold text-gray-900">Replacement info</div>
              {p.replaced_by && (
                <div className="mt-1">
                  <span className="font-medium">Replaced by:</span> {p.replaced_by}
                </div>
              )}
              {p.replaces_previous_parts && (
                <div className="mt-1">
                  <span className="font-medium">Replaces:</span> {p.replaces_previous_parts}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Alternates */}
      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border bg-white p-5">
          <div className="text-lg font-semibold text-gray-900">New part (if available)</div>
          {vm.new_part ? (
            <Link href={vm.new_part.href} className="mt-3 block rounded-lg border p-3 hover:bg-gray-50">
              <div className="text-sm font-semibold text-gray-900">{vm.new_part.title || vm.new_part.mpn}</div>
              <div className="mt-1 text-sm text-gray-700">{money(vm.new_part.price)}</div>
              <div className="mt-1 text-xs text-gray-600">{vm.new_part.in_stock ? "In stock" : "Out of stock"}</div>
            </Link>
          ) : (
            <div className="mt-2 text-sm text-gray-600">No matching new part found.</div>
          )}
        </div>

        <div className="rounded-xl border bg-white p-5">
          <div className="text-lg font-semibold text-gray-900">Refurbished offers</div>
          {vm.refurb_offers.length ? (
            <div className="mt-3 space-y-2">
              {vm.refurb_offers.slice(0, 6).map((o) => (
                <Link key={o.id} href={o.href} className="block rounded-lg border p-3 hover:bg-gray-50">
                  <div className="text-sm font-semibold text-gray-900">{o.title || o.mpn}</div>
                  <div className="mt-1 text-sm text-gray-700">{money(o.price)}</div>
                  <div className="mt-1 text-xs text-gray-600">
                    {o.in_stock ? `In stock (${o.inventory_total ?? 0})` : "Out of stock"}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="mt-2 text-sm text-gray-600">No refurb offers found.</div>
          )}
        </div>
      </div>

      {/* Compatible models */}
      <div className="mt-8 rounded-xl border bg-white p-5">
        <div className="text-lg font-semibold text-gray-900">Compatible models</div>
        {models.length ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {models.map((m) => (
              <span key={m} className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-800">
                {m}
              </span>
            ))}
          </div>
        ) : (
          <div className="mt-2 text-sm text-gray-600">No compatibility list available for this item.</div>
        )}
      </div>
    </div>
  );
}