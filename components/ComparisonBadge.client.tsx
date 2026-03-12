"use client";

import Link from "next/link";

type ProductCardVM = {
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
  compatible_brands?: string | null;

  listing_id?: string | null;
};

type ProductVM = {
  kind: "parts" | "offers";
  slug: string;
  mpn_norm: string;

  primary: ProductCardVM;
  new_part: ProductCardVM | null;
  refurb_offers: ProductCardVM[];
};

function money(v: any) {
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) return null;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(n);
}

function buildComparison(vm: ProductVM) {
  const p = vm.primary;

  if (p.source === "parts") {
    const offers = Array.isArray(vm.refurb_offers) ? vm.refurb_offers : [];
    const count = offers.length;
    const best = offers[0] ?? null;
    const priceText = best?.price != null ? money(best.price) : null;

    if (count > 0) {
      return {
        tone: "refurb" as const,
        href: best?.href || null,
        text: `${count} Refurbished Substitute${
          count === 1 ? "" : "s"
        } Available${priceText ? ` from ${priceText}` : ""}`,
      };
    }

    return {
      tone: "none" as const,
      href: null,
      text: "No Refurbished Substitutes Available",
    };
  }

  if (p.source === "offers") {
    const np = vm.new_part;
    const priceText = np?.price != null ? money(np.price) : null;

    if (np) {
      return {
        tone: "new" as const,
        href: np.href,
        text: `New OEM Part Available${priceText ? ` for ${priceText}` : ""}`,
      };
    }

    return {
      tone: "none" as const,
      href: null,
      text: "No New OEM Part Available",
    };
  }

  return null;
}

export default function ComparisonBadge({ vm }: { vm: ProductVM }) {
  const badge = buildComparison(vm);

  if (!badge) return null;

  const className =
    badge.tone === "refurb"
      ? "inline-flex items-center rounded-full bg-red-100 px-4 py-2 text-sm font-bold text-red-800 ring-1 ring-red-200 hover:bg-red-200 md:text-base"
      : badge.tone === "new"
        ? "inline-flex items-center rounded-full bg-slate-100 px-4 py-2 text-sm font-bold text-slate-900 ring-1 ring-slate-300 hover:bg-slate-200 md:text-base"
        : "inline-flex items-center rounded-full bg-amber-50 px-4 py-2 text-sm font-bold text-amber-800 ring-1 ring-amber-200 md:text-base";

  if (badge.href) {
    return (
      <Link href={badge.href} className={className}>
        {badge.text}
      </Link>
    );
  }

  return <div className={className}>{badge.text}</div>;
}