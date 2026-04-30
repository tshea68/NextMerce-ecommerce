"use client";

import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

const FALLBACK_IMG =
  "https://djvyjctjcehjyglwjniv.supabase.co/storage/v1/object/public/part_images/mpn/00249736/imagecomingsoon.png";

function cleanUrl(u: unknown) {
  const s = (u ?? "").toString().trim();
  return s.length ? s : null;
}

type PartImageProps = Omit<
  React.ImgHTMLAttributes<HTMLImageElement>,
  "onClick"
> & {
  imageUrl?: string | null;

  /**
   * Hides the hover overlay text only.
   * Does not disable fullscreen when enableFullscreenPreview is true.
   */
  disableHoverPreview?: boolean;

  /**
   * Fullscreen preview is opt-in.
   * Use this on cards and product pages where we want a large image modal.
   */
  enableFullscreenPreview?: boolean;
};

export default function PartImage({
  imageUrl,
  disableHoverPreview = false,
  enableFullscreenPreview = false,
  alt = "",
  className = "",
  ...rest
}: PartImageProps) {
  const [isHovering, setIsHovering] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setPortalRoot(document.body);
  }, []);

  const initialSrc = useMemo(
    () => cleanUrl(imageUrl) || FALLBACK_IMG,
    [imageUrl]
  );

  const [src, setSrc] = useState(initialSrc);

  useEffect(() => {
    setSrc(initialSrc);
  }, [initialSrc]);

  const handleImgError = () => {
    setSrc((prev) => (prev === FALLBACK_IMG ? prev : FALLBACK_IMG));
  };

  const canOpenPreview = enableFullscreenPreview && src !== FALLBACK_IMG;

  const openPreview = () => {
    if (!canOpenPreview) return;
    setModalOpen(true);
  };

  const closePreview = () => {
    setModalOpen(false);
  };

  return (
    <>
      <div
        className={`relative inline-flex h-full w-full items-center justify-center overflow-hidden ${
          canOpenPreview ? "cursor-zoom-in" : "cursor-default"
        } ${className}`}
        onMouseEnter={() => {
          if (canOpenPreview) setIsHovering(true);
        }}
        onMouseLeave={() => setIsHovering(false)}
        onClick={openPreview}
        role={canOpenPreview ? "button" : undefined}
        tabIndex={canOpenPreview ? 0 : undefined}
        onKeyDown={(e) => {
          if (!canOpenPreview) return;

          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setModalOpen(true);
          }
        }}
      >
        <img
          src={src}
          alt={alt}
          className="h-full w-full object-cover"
          onError={handleImgError}
          {...rest}
        />

        {canOpenPreview && !disableHoverPreview && (
          <div
            className={[
              "pointer-events-none absolute inset-0 flex items-center justify-center",
              "bg-black/55 text-white text-[11px] font-semibold uppercase tracking-wide",
              "rounded transition-opacity duration-300 ease-out",
              isHovering ? "opacity-100" : "opacity-0",
            ].join(" ")}
          >
            <span className="px-2 text-center leading-tight">
              Click for Full Screen View
            </span>
          </div>
        )}
      </div>

      {canOpenPreview &&
        modalOpen &&
        portalRoot &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-4"
            onClick={closePreview}
          >
            <div
              className="relative w-[min(96vw,1350px)]"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                className="absolute -right-3 -top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-white/60 bg-black text-sm font-bold text-white shadow-lg"
                onClick={closePreview}
                aria-label="Close image preview"
              >
                ×
              </button>

              <div className="flex h-[min(90vh,950px)] w-full items-center justify-center overflow-hidden rounded-lg bg-white">
                <img
                  src={src}
                  alt={alt}
                  className="h-full w-full object-contain p-6"
                  onError={handleImgError}
                  draggable={false}
                />
              </div>
            </div>
          </div>,
          portalRoot
        )}
    </>
  );
}
