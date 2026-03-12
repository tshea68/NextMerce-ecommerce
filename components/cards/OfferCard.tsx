"use client";

import Link from "next/link";
import { formatUsd } from "@/lib/parts/display";
import { parseDelimitedList } from "@/lib/parts/parse";

type OfferCardData = {
  id?: string | number;
  mpn?: string | null;
  title?: string | null;
  title_display?: string | null;
  feed_title?: string | null;
  brand?: string | null;
  appliance_type?: string | null;
  part_type?: string | null;
  canonical_part_type?: string | null;
  price?: number | string | null;
  image_url?: string | null;
  compatible_brands?: string | null;
  inventory_total?: number | null;
  marketplace?: string | null;
  href?: string | null;
};

type OfferCardProps = {
  offer: OfferCardData;
  className?: string;
};

function bestOfferTitle(offer: OfferCardData): string {
  const titleDisplay = String(offer.title_display ?? "").trim();
  if (titleDisplay) return titleDisplay;

  const feedTitle = String(offer.feed_title ?? "").trim();
  if (feedTitle) return feedTitle;

  const rawTitle = String(offer.title ?? "").trim();
  return rawTitle || String(offer.mpn ?? "").trim() || "Offer";
}

export default function OfferCard({ offer, className = "" }: OfferCardProps) {
  const title = bestOfferTitle(offer);
  const price = formatUsd(offer.price);
  const brands = parseDelimitedList(offer.compatible_brands);
  const href =
    String(offer.href ?? "").trim() ||
    `/offers/${encodeURIComponent(String(offer.mpn ?? "").trim())}`;

  return (
    <article
      className={`rounded-2xl border border-slate-200 bg-white p-4 shadow-sm ${className}`}
    >
      <div className="flex gap-4">
        <div className="w-24 shrink-0">
          <Link href={href}>
            <div className="aspect-square overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
              {offer.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={offer.image_url}
                  alt={title}
                  className="h-full w-full object-contain"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-center text-xs text-slate-400">
                  No image
                </div>
              )}
            </div>
          </Link>
        </div>

        <div className="min-w-0 flex-1">
          <Link
            href={href}
            className="line-clamp-2 text-base font-semibold text-slate-900 hover:underline"
          >
            {title}
          </Link>

          <div className="mt-1 text-sm text-slate-600">
            {offer.canonical_part_type || offer.part_type ? (
              <span>{offer.canonical_part_type || offer.part_type}</span>
            ) : null}
            {offer.mpn ? <span> • MPN: {offer.mpn}</span> : null}
            {offer.brand ? <span> • {offer.brand}</span> : null}
            {offer.appliance_type ? <span> • {offer.appliance_type}</span> : null}
          </div>

          <div className="mt-3 text-sm text-slate-700">
            {brands.length > 0 ? (
              <div>
                <span className="font-medium text-slate-900">Compatible brands:</span>{" "}
                {brands.join(", ")}
              </div>
            ) : null}

            {typeof offer.inventory_total === "number" ? (
              <div className="mt-1">Inventory: {offer.inventory_total}</div>
            ) : null}

            {offer.marketplace ? <div className="mt-1">Marketplace: {offer.marketplace}</div> : null}
          </div>

          <div className="mt-4 flex items-end justify-between gap-4">
            <div>
              {price ? (
                <div className="text-2xl font-bold text-emerald-700">{price}</div>
              ) : (
                <div className="text-sm text-slate-400">Price unavailable</div>
              )}
            </div>

            <Link
              href={href}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              View offer
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}