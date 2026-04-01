"use client";

import { useEffect, useState } from "react";

type ExplodedView = {
  label?: string | null;
  image_url?: string | null;
};

type ModelCardData = {
  model_number?: string | null;
  brand?: string | null;
  appliance_type?: string | null;
  image_url?: string | null;
  brand_logo_url?: string | null;

  refurb_count?: number | null;
  new_count?: number | null;
  available_count?: number | null;
  orderable_count?: number | null;
  all_known_parts?: number | null;

  total_parts?: number | null;
  priced_parts?: number | null;
  href?: string | null;

  exploded_views?: ExplodedView[] | null;
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

  const knownParts =
    typeof model.total_parts === "number"
      ? model.total_parts
      : typeof model.all_known_parts === "number"
        ? model.all_known_parts
        : 0;

  const inStockParts =
    typeof model.priced_parts === "number" ? model.priced_parts : 0;

  const refurbCount =
    typeof model.refurb_count === "number" ? model.refurb_count : 0;

  const titleBits = [
    modelNumber,
    model.brand ? String(model.brand).trim() : "",
    model.appliance_type ? String(model.appliance_type).trim() : "",
  ].filter(Boolean);

  const explodedViews = Array.isArray(model.exploded_views)
    ? model.exploded_views.filter((v) => v?.image_url)
    : [];

  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const activeView =
    lightboxIndex != null && explodedViews[lightboxIndex]
      ? explodedViews[lightboxIndex]
      : null;

  useEffect(() => {
    if (lightboxIndex == null) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setLightboxIndex(null);
      } else if (e.key === "ArrowRight") {
        setLightboxIndex((prev) => {
          if (prev == null) return prev;
          return prev >= explodedViews.length - 1 ? 0 : prev + 1;
        });
      } else if (e.key === "ArrowLeft") {
        setLightboxIndex((prev) => {
          if (prev == null) return prev;
          return prev <= 0 ? explodedViews.length - 1 : prev - 1;
        });
      }
    }

    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [lightboxIndex, explodedViews.length]);

  return (
    <>
      <article
        className={`rounded-2xl border border-slate-600 bg-slate-800 p-4 text-white shadow-sm ${className}`}
      >
        <div className="min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div
                className="block truncate text-base font-bold text-white"
                title={titleBits.join(" • ")}
              >
                {titleBits.join(" • ")}
              </div>

              <div className="mt-1 text-sm text-slate-200">
                {knownParts} known parts - {inStockParts} in-stock parts - {refurbCount} refurbished parts
              </div>
            </div>

            {model.brand_logo_url ? (
              <div className="h-10 w-10 shrink-0 overflow-hidden rounded-md border border-slate-500 bg-white p-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={model.brand_logo_url}
                  alt={model.brand ?? "Brand"}
                  className="h-full w-full object-contain"
                />
              </div>
            ) : null}
          </div>

          {explodedViews.length > 0 ? (
            <div className="mt-3 rounded-xl border border-slate-600 bg-slate-700 p-3">
              <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-300">
                Exploded diagrams
              </div>

              <div className="flex items-end gap-3">
                <div className="min-w-0 flex-1 overflow-hidden">
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {explodedViews.slice(0, 10).map((view, idx) => (
                      <button
                        key={`${view.image_url}-${idx}`}
                        type="button"
                        onClick={() => setLightboxIndex(idx)}
                        title="Click to view"
                        className="group relative w-20 shrink-0 cursor-zoom-in rounded-lg border border-slate-500 bg-slate-600 p-1 text-left hover:border-slate-300 hover:bg-slate-500"
                      >
                        <div className="flex h-12 items-center justify-center overflow-hidden rounded bg-white">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={String(view.image_url)}
                            alt={view.label ?? `Exploded diagram ${idx + 1}`}
                            className="h-full w-full object-contain"
                          />
                        </div>

                        <div className="mt-1 truncate text-[10px] text-slate-100">
                          {view.label || `Diagram ${idx + 1}`}
                        </div>

                        <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-lg bg-black/0 opacity-0 transition group-hover:bg-black/35 group-hover:opacity-100">
                          <span className="rounded bg-black/70 px-2 py-1 text-[10px] font-semibold text-white">
                            Click to view
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {onViewParts ? (
                  <button
                    type="button"
                    onClick={() => onViewParts(model)}
                    className="shrink-0 cursor-pointer rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    View all parts
                  </button>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      </article>

      {activeView ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4"
          onClick={() => setLightboxIndex(null)}
        >
          <div
            className="relative w-full max-w-6xl rounded-2xl bg-white p-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-slate-900">
                  {activeView.label || modelNumber}
                </div>
                <div className="text-xs text-slate-500">{modelNumber}</div>
              </div>

              <div className="flex items-center gap-2">
                {explodedViews.length > 1 ? (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        setLightboxIndex((prev) => {
                          if (prev == null) return prev;
                          return prev <= 0 ? explodedViews.length - 1 : prev - 1;
                        })
                      }
                      className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm hover:bg-slate-50"
                    >
                      Prev
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setLightboxIndex((prev) => {
                          if (prev == null) return prev;
                          return prev >= explodedViews.length - 1 ? 0 : prev + 1;
                        })
                      }
                      className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm hover:bg-slate-50"
                    >
                      Next
                    </button>
                  </>
                ) : null}

                <button
                  type="button"
                  onClick={() => setLightboxIndex(null)}
                  className="rounded-lg bg-slate-900 px-3 py-2 text-sm text-white hover:bg-black"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="flex h-[75vh] items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={String(activeView.image_url)}
                alt={activeView.label ?? modelNumber}
                className="max-h-full max-w-full object-contain"
              />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}