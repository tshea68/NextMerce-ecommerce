"use client";

import Link from "next/link";
import {
  bestPartTitle,
  bestPartType,
  formatUsd,
  getAlternativesBadgeText,
  getStockLabel,
} from "@/lib/parts/display";
import { parseDelimitedList, parseMaybeJsonArray } from "@/lib/parts/parse";

type PartCardData = {
  id?: string | number;
  mpn?: string | null;
  title?: string | null;
  title_display?: string | null;
  feed_title?: string | null;
  brand?: string | null;
  appliance_type?: string | null;
  part_type?: string | null;
  specific_part_type?: string | null;
  canonical_part_type?: string | null;
  price?: number | string | null;
  image_url?: string | null;
  stock_status?: string | null;
  stock_status_canon?: string | null;
  compatible_models?: string[] | string | null;
  compatible_brands?: string | null;
  replaces_previous_parts?: string[] | string | null;
  replaced_by?: string | null;
  alternatives_count?: number | null;
  refurb_count?: number | null;
  href?: string | null;
};

type PartCardProps = {
  part: PartCardData;
  className?: string;
};

export default function PartCard({ part, className = "" }: PartCardProps) {
  const title = bestPartTitle(part);
  const partType = bestPartType(part);
  const price = formatUsd(part.price);
  const stock = getStockLabel(part);
  const badge = getAlternativesBadgeText(part);

  const compatibleModels = parseMaybeJsonArray(part.compatible_models);
  const compatibleBrands = parseDelimitedList(part.compatible_brands);
  const replaces = parseMaybeJsonArray(part.replaces_previous_parts);

  const mpn = String(part.mpn ?? "").trim();
  const href = String(part.href ?? "").trim() || `/parts/${encodeURIComponent(mpn)}`;

 

  return (
    <article
      className={`rounded-2xl border border-slate-200 bg-white p-4 shadow-sm ${className}`}
    >
      <div className="flex gap-4">
        <div className="w-24 shrink-0">
           <div className="text-[10px] font-bold text-red-600">PRODUCT CARD LIVE</div>
            <div className="aspect-square overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
              {part.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={part.image_url}
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
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <Link
                href={href}
                className="line-clamp-2 text-base font-semibold text-slate-900 hover:underline"
              >
                {title}
              </Link>

              <div className="mt-1 text-sm text-slate-600">
                <span>{partType}</span>
                {mpn ? <span> • MPN: {mpn}</span> : null}
                {part.brand ? <span> • {part.brand}</span> : null}
                {part.appliance_type ? <span> • {part.appliance_type}</span> : null}
              </div>
            </div>

            {badge ? (
              <div className="shrink-0 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                {badge}
              </div>
            ) : null}
          </div>

          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto]">
            <div className="space-y-2">
              {compatibleBrands.length > 0 ? (
                <div className="text-sm text-slate-700">
                  <span className="font-medium text-slate-900">Compatible brands:</span>{" "}
                  {compatibleBrands.join(", ")}
                </div>
              ) : null}

              {replaces.length > 0 ? (
                <div className="text-sm text-slate-700">
                  <span className="font-medium text-slate-900">Replaces:</span>{" "}
                  {replaces.join(", ")}
                </div>
              ) : null}

              {part.replaced_by ? (
                <div className="text-sm text-slate-700">
                  <span className="font-medium text-slate-900">Replaced by:</span>{" "}
                  {part.replaced_by}
                </div>
              ) : null}

              {compatibleModels.length > 0 ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-2">
                  <div className="mb-2 text-sm font-medium text-slate-900">
                    Compatible models ({compatibleModels.length})
                  </div>
                  <div className="max-h-24 overflow-y-auto pr-1">
                    <div className="flex flex-wrap gap-1.5">
                      {compatibleModels.map((model) => (
                        <span
                          key={model}
                          className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700"
                        >
                          {model}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="flex min-w-[140px] flex-col items-end justify-between gap-3">
              <div className="text-right">
                {price ? (
                  <div className="text-2xl font-bold text-emerald-700">{price}</div>
                ) : (
                  <div className="text-sm text-slate-400">Price unavailable</div>
                )}
                {stock ? <div className="mt-1 text-sm text-slate-600">{stock}</div> : null}
              </div>

              <Link
                href={href}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                View part
              </Link>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}