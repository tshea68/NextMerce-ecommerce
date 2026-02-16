"use client";

import React, { useMemo, useState } from "react";

type PartImageProps = Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src"> & {
  /** Preferred prop used across this repo */
  imageUrl?: string | null;

  /** Allow regular img usage too */
  src?: string | null;

  /** Back-compat: caller passes this today */
  disableHoverPreview?: boolean;

  /** Optional fallback label */
  fallbackText?: string;
};

export default function PartImage(props: PartImageProps) {
  const {
    imageUrl,
    src,
    disableHoverPreview,
    fallbackText = "No image",
    className,
    alt,
    onError,
    ...imgProps
  } = props;

  const [broken, setBroken] = useState(false);

  const resolvedSrc = useMemo(() => {
    const s = String((src ?? imageUrl ?? "")).trim();
    return s.length ? s : "";
  }, [src, imageUrl]);

  // Fallback UI (no src or broken)
  if (!resolvedSrc || broken) {
    return (
      <div
        className={
          className ??
          "flex items-center justify-center bg-gray-50 rounded border text-xs text-gray-400"
        }
        aria-label={alt ?? fallbackText}
      >
        {fallbackText}
      </div>
    );
  }

  const img = (
    <img
      {...imgProps}
      src={resolvedSrc}
      alt={alt ?? "Part image"}
      className={className}
      loading={imgProps.loading ?? "lazy"}
      onError={(e) => {
        setBroken(true);
        onError?.(e);
      }}
    />
  );

  // Caller explicitly disabled hover behavior — just render the img.
  if (disableHoverPreview) return img;

  // Lightweight hover preview (does not change layout)
  return (
    <span className="relative inline-block group">
      {img}
      <span className="pointer-events-none absolute left-full top-0 z-50 hidden group-hover:block ml-2 rounded border bg-white p-2 shadow">
        <img
          src={resolvedSrc}
          alt={alt ?? "Part image preview"}
          className="max-h-64 max-w-64 object-contain"
        />
      </span>
    </span>
  );
}
