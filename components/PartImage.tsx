"use client";

import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

const FALLBACK_IMG =
  "https://djvyjctjcehjyglwjniv.supabase.co/storage/v1/object/public/part_images/mpn/00249736/imagecomingsoon.png";

function cleanUrl(u: unknown) {
  const s = (u ?? "").toString().trim();
  return s.length ? s : null;
}

type PartImageProps = React.ImgHTMLAttributes<HTMLImageElement> & {
  imageUrl?: string | null;
  disableHoverPreview?: boolean;
};

export default function PartImage({
  imageUrl,
  disableHoverPreview,
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

  return (
    <>
      <div
        className={`relative inline-flex h-full w-full items-center justify-center overflow-hidden ${className}`}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        onClick={() => setModalOpen(true)}
      >
        <img
          src={src}
          alt={alt}
          className="h-full w-full object-cover"
          onError={handleImgError}
          {...rest}
        />

        {!disableHoverPreview && (
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

      {modalOpen &&
        portalRoot &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-4"
            onClick={() => setModalOpen(false)}
          >
            <div
              className="relative w-[min(92vw,1100px)]"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                className="absolute -top-3 -right-3 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-white/60 bg-black text-sm font-bold text-white shadow-lg"
                onClick={() => setModalOpen(false)}
              >
                ×
              </button>

              <div className="flex h-[min(85vh,800px)] w-full items-center justify-center overflow-hidden rounded-lg bg-white">
                <img
                  src={src}
                  alt={alt}
                  className="max-h-full max-w-full object-contain"
                  onError={handleImgError}
                />
              </div>
            </div>
          </div>,
          portalRoot
        )}
    </>
  );
}