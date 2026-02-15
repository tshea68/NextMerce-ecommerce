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
};

export default function PartImage({
  imageUrl,
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
        className={`relative inline-flex items-center justify-center ${className}`}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        onClick={() => setModalOpen(true)}
      >
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-contain"
          onError={handleImgError}
          {...rest}
        />

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
      </div>

      {modalOpen &&
        portalRoot &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80"
            onClick={() => setModalOpen(false)}
          >
            <div className="relative max-w-4xl w-[min(90vw,900px)] max-h-[90vh]">
              <button
                type="button"
                className="absolute -top-3 -right-3 h-8 w-8 rounded-full bg-black text-white flex items-center justify-center text-sm font-bold shadow-lg border border-white/60"
                onClick={() => setModalOpen(false)}
              >
                ×
              </button>

              <img
                src={src}
                alt={alt}
                className="w-full h-auto max-h-[90vh] object-contain bg-white rounded-lg"
                onClick={(e) => e.stopPropagation()}
                onError={handleImgError}
              />
            </div>
          </div>,
          portalRoot
        )}
    </>
  );
}
