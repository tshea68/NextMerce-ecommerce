"use client";

import Link from "next/link";

type ModelCardData = {
  model_number?: string | null;
  brand?: string | null;
  appliance_type?: string | null;
  image_url?: string | null;
  brand_logo_url?: string | null;
  total_parts?: number | null;
  priced_parts?: number | null;
  href?: string | null;
};

type ModelCardProps = {
  model: ModelCardData;
  className?: string;
  onViewParts?: (model: ModelCardData) => void;
};

export default function ModelCard({
  model,
  className = "",
  onViewParts,
}: ModelCardProps) {
  const modelNumber = String(model.model_number ?? "").trim() || "Model";
  const href =
    String(model.href ?? "").trim() || `/models/${encodeURIComponent(modelNumber)}`;

  return (
    <article
      className={`rounded-2xl border border-slate-200 bg-white p-4 shadow-sm ${className}`}
    >
      <div className="flex gap-4">
        <div className="w-24 shrink-0">
          <Link href={href}>
            <div className="aspect-square overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
              {model.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={model.image_url}
                  alt={modelNumber}
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
                {modelNumber}
              </Link>

              <div className="mt-1 text-sm text-slate-600">
                {model.brand ? <span>{model.brand}</span> : null}
                {model.appliance_type ? <span> • {model.appliance_type}</span> : null}
              </div>
            </div>

            {model.brand_logo_url ? (
              <div className="h-10 w-10 shrink-0 overflow-hidden rounded-md border border-slate-200 bg-white p-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={model.brand_logo_url}
                  alt={model.brand ?? "Brand"}
                  className="h-full w-full object-contain"
                />
              </div>
            ) : null}
          </div>

          <div className="mt-4 flex items-end justify-between gap-4">
            <div className="text-sm text-slate-700">
              {typeof model.total_parts === "number" ? (
                <div>Total parts: {model.total_parts}</div>
              ) : null}
              {typeof model.priced_parts === "number" ? (
                <div>Priced parts: {model.priced_parts}</div>
              ) : null}
            </div>

            <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center">
              {onViewParts ? (
                <button
                  type="button"
                  onClick={() => onViewParts(model)}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
                >
                  View all parts
                </button>
              ) : null}

              <Link
                href={href}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                View model
              </Link>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}