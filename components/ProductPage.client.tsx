"use client";

import Link from "next/link";
import ReliableAvailabilityPill from "./ReliableAvailabilityPill.client";
import ComparisonBadge from "./ComparisonBadge.client";

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

  // Replacement fields
  replaced_by?: string | null;
  replaces_previous_parts?: string | null;

  // Compatibility fields
  compatible_models?: string | null;
  compatible_brands?: string | null; // <-- must be sent by server VM

  // offers-only (DO NOT DISPLAY)
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

function cleanStr(s: any): string {
  return String(s ?? "").trim();
}

function splitList(s: string | null | undefined) {
  const raw = cleanStr(s);
  if (!raw) return [];
  return raw
    .split(/[\n,]+/)
    .map((x) => x.trim())
    .filter(Boolean);
}

function splitModels(s: string | null | undefined) {
  return splitList(s).slice(0, 200);
}

function splitBrands(s: string | null | undefined) {
  // You said you have "3 compatible brands" in table; assume comma/newline delims.
  return splitList(s).slice(0, 50);
}

export default function ProductPageClient({ vm }: { vm: ProductVM }) {
  const p = vm.primary;

  const title = p.title || p.mpn || "Product";
  const models = splitModels(p.compatible_models);
  const brands = splitBrands(p.compatible_brands);

  const refurbAlternatives =
    p.source === "offers"
      ? vm.refurb_offers.filter((o) => o.id !== p.id).length
      : vm.refurb_offers.length;

  const newOemAlternatives =
    p.source === "offers" && vm.new_part ? 1 : 0;

  const totalAlternatives = refurbAlternatives + newOemAlternatives;

  const headerLeft = vm.new_part?.mpn
    ? `NEW OEM PART: ${vm.new_part.mpn}`
    : "NEW OEM PART: None Available";

  const headerRight =
    totalAlternatives > 0
      ? `${totalAlternatives} Refurbished/New OEM Alternatives Available`
      : "None Available";

  const availabilityPartNumber =
    p.source === "parts"
      ? (p.mpn || null)
      : (vm.new_part?.mpn || null);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      {/* Breadcrumb: Home / Title */}
      <div className="mb-4 text-base text-gray-700">
        <Link className="font-medium hover:underline" href="/grid">
          Home
        </Link>
        <span className="mx-2 text-gray-400">/</span>
        <span className="font-semibold text-gray-900">{title}</span>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* LEFT: Image */}
        <div className="rounded-xl border bg-white p-4">
          <div className="aspect-square w-full overflow-hidden rounded-lg bg-gray-50">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={p.image_url || "/placeholder.png"}
              alt={title}
              className="h-full w-full object-contain"
            />
          </div>
        </div>

        {/* RIGHT: Details */}
        <div className="rounded-xl border bg-white">
          <div className="flex flex-col justify-between gap-3 rounded-t-xl bg-slate-900 px-5 py-4 text-white md:flex-row md:items-center">
            <div className="text-sm font-semibold tracking-wide md:text-base">
              {headerLeft}
            </div>

            <div className="text-sm font-semibold md:text-right md:text-base">
              {headerRight}
            </div>
          </div>

          <div className="flex justify-end px-5 pt-3">
            <ComparisonBadge vm={vm} />
          </div>

          <div className="px-5 py-4">
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>

            {/* Compatible brands — BIG + under header bar */}
            {brands.length ? (
              <div className="mt-2 text-base font-semibold text-gray-900">
                Compatible brands:{" "}
                <span className="font-bold">
                  {brands.join(", ")}
                </span>
              </div>
            ) : null}

            {/* Availability badge — customer-facing only */}
            <div className="mt-3">
              {(() => {
                const status = (p.stock_status_canon || "").toLowerCase();

                const isNoLongerAvailable =
                  status.includes("no longer") ||
                  status.includes("discontinued") ||
                  status.includes("nla");

                const isInStock = p.in_stock;
                const isSpecialOrder = !isNoLongerAvailable && !isInStock;

                if (isNoLongerAvailable) {
                  return (
                    <div>
                      <span className="inline-flex items-center rounded-full bg-black px-4 py-2 text-base font-bold text-white">
                        No Longer Available
                      </span>
                    </div>
                  );
                }

                if (isInStock) {
                  return (
                    <div>
                      <span className="inline-flex items-center rounded-full bg-emerald-600 px-4 py-2 text-base font-bold text-white">
                        In Stock
                      </span>
                    </div>
                  );
                }

                if (isSpecialOrder) {
                  return (
                    <div>
                      <span className="inline-flex items-center rounded-full bg-red-600 px-4 py-2 text-base font-bold text-white">
                        Special Order
                      </span>
                      <div className="mt-2 text-sm font-medium text-gray-600">
                        (Usually ships within 30 Days)
                      </div>
                    </div>
                  );
                }

                return null;
              })()}
            </div>

            {availabilityPartNumber ? (
              <div className="mt-3">
                <ReliableAvailabilityPill
                  partNumber={availabilityPartNumber}
                  qty={1}
                  hideWhenUnknown={false}
                />
              </div>
            ) : null}

            {/* Meta (NO listing/ebay id) */}
            <div className="mt-4 text-base text-gray-700">
              {p.appliance_type ? (
                <div>
                  <span className="font-semibold text-gray-900">Appliance:</span> {p.appliance_type}
                </div>
              ) : null}
              {p.part_type ? (
                <div>
                  <span className="font-semibold text-gray-900">Part type:</span> {p.part_type}
                </div>
              ) : null}
            </div>

            {/* Price only */}
            <div className="mt-5">
              <div className="text-4xl font-extrabold text-gray-900">{money(p.price)}</div>
            </div>

            {/* Replacement info — only show if present */}
            {(p.replaced_by || p.replaces_previous_parts) ? (
              <div className="mt-6 rounded-lg border bg-gray-50 p-4 text-base">
                <div className="text-lg font-bold text-gray-900">Replacement info</div>
                {p.replaced_by ? (
                  <div className="mt-1">
                    <span className="font-semibold">Replaced by:</span> {p.replaced_by}
                  </div>
                ) : null}
                {p.replaces_previous_parts ? (
                  <div className="mt-1">
                    <span className="font-semibold">Replaces:</span> {p.replaces_previous_parts}
                  </div>
                ) : null}
              </div>
            ) : null}

            {/* Compatible models — INSIDE right container only, fixed height + scroll */}
            {models.length ? (
              <div className="mt-6 rounded-lg border bg-white p-4">
                <div className="text-lg font-bold text-gray-900">Compatible models</div>

                {/* Shows about 5 rows then scrolls */}
                <div className="mt-3 max-h-44 overflow-auto rounded-md border bg-gray-50 p-2">
                  <ul className="space-y-2">
                    {models.map((m) => (
                      <li
                        key={m}
                        className="rounded-md border bg-white px-3 py-2 text-base font-semibold text-gray-900"
                      >
                        {m}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}