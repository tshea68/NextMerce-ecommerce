"use client";

import React, { useEffect, useRef, useState } from "react";

type LogoItem = {
  src: string;
  name: string;
};

const ENDPOINT = "/api/brand-logos";

function coerceLogos(data: any): LogoItem[] {
  const arr = Array.isArray(data)
    ? data
    : Array.isArray(data?.logos)
      ? data.logos
      : Array.isArray(data?.items)
        ? data.items
        : [];

  const out = arr
    .map((b: any) => {
      const src =
        b?.src || b?.image_url || b?.logo_url || b?.url || b?.image || null;
      const name = b?.name || b?.brand || b?.brand_long || b?.title || "";
      return src ? { src: String(src).trim(), name: String(name).trim() } : null;
    })
    .filter(Boolean) as LogoItem[];

  const seen = new Set<string>();
  return out.filter((x) => {
    if (!x.src) return false;
    if (seen.has(x.src)) return false;
    seen.add(x.src);
    return true;
  });
}

function looksLikeImg(u = "") {
  return (
    (/^https?:\/\/.+/i.test(u) &&
      /\.(png|webp|jpg|jpeg|svg)(\?.*)?$/i.test(u)) ||
    /^https?:\/\/.+\.(?:png|webp|jpg|jpeg|svg)(?:\?.*)?$/i.test(u)
  );
}

export default function BrandLogoSliderVertical() {
  const [logos, setLogos] = useState<LogoItem[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let live = true;

    (async () => {
      try {
        setErr(null);

        const r = await fetch(ENDPOINT, {
          credentials: "same-origin",
          cache: "no-store",
        });

        if (!r.ok) {
          throw new Error(`brand logos request failed: ${r.status}`);
        }

        const data = await r.json();
        const normalized = coerceLogos(data).filter((l) => looksLikeImg(l.src));

        if (live) {
          setLogos(normalized.length > 0 ? [...normalized, ...normalized] : []);
        }
      } catch (e) {
        console.error("Error fetching logos:", e);
        if (live) {
          setErr("fail");
          setLogos([]);
        }
      }
    })();

    return () => {
      live = false;
    };
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (logos.length <= 6) return;

    let frame = 0;
    let pos = 0;

    const step = () => {
      pos += 1.0;
      const halfHeight = el.scrollHeight / 2;
      if (pos >= halfHeight) pos = 0;
      el.scrollTop = pos;
      frame = requestAnimationFrame(step);
    };

    frame = requestAnimationFrame(step);

    return () => {
      if (frame) cancelAnimationFrame(frame);
    };
  }, [logos]);

  if (err || logos.length === 0) return null;

  return (
    <div className="flex h-full w-full items-stretch justify-end">
      <div
        className="
          flex h-full w-[200px] flex-col overflow-hidden
          rounded-md border border-gray-300 bg-white text-black shadow-md
          lg:w-[220px]
        "
      >
        <div
          ref={scrollRef}
          className="flex-1 overflow-hidden"
          style={{ scrollbarWidth: "none" }}
        >
          <div className="flex flex-col items-center gap-3 py-0">
            {logos.map((logo, i) => (
              <div
                key={`${logo.src}-${i}`}
                className="flex w-full items-center justify-center"
              >
                <img
                  src={logo.src}
                  alt={logo.name || "Brand"}
                  className="
                    max-h-8 max-w-[150px] object-contain opacity-90
                    md:max-h-8 lg:max-h-9
                  "
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}