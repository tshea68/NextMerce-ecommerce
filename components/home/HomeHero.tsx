"use client";

import { useEffect, useMemo, useState } from "react";

type HeroLogo = {
  brand?: string | null;
  brand_long?: string | null;
  image_url?: string | null;
  hero_enabled?: boolean | null;
  hero_priority?: number | null;
};

type Props = {
  heroLogos?: HeroLogo[];
};

const CYCLE_MS = 1600;

const catalogStats = [
  ["~795K", "UNIQUE\nPART\nMPNS"],
  ["~501K", "UNIQUE\nMODELS"],
  ["127", "BRANDS"],
  ["15", "APPLIANCE\nTYPES"],
  ["47", "PART\nTYPES"],
];

const inventoryStats = [
  ["~258K", "NEW\nOEM\nPARTS\nAVAILABLE"],
  ["~220K", "OEM\nREFURBISHED\nPARTS\nIN\nNETWORK"],
  ["~140K", "REFURBISHED\nOEM\nUNITS\nAVAILABLE"],
];

function StatTile({
  value,
  label,
}: {
  value: string;
  label: string;
}) {
  return (
    <div className="rounded-2xl border border-orange-200 bg-white px-4 py-3 shadow-sm">
      <div className="text-[16px] font-extrabold tracking-tight text-slate-900 md:text-[18px]">
        {value}
      </div>
      <div className="mt-1 whitespace-pre-line text-[10px] font-bold uppercase leading-[1.15] tracking-[0.14em] text-slate-700">
        {label}
      </div>
    </div>
  );
}

export default function HomeHero({ heroLogos = [] }: Props) {
  const logos = useMemo(
    () =>
      (heroLogos || [])
        .filter((x) => x?.image_url)
        .sort(
          (a, b) => Number(a?.hero_priority ?? 9999) - Number(b?.hero_priority ?? 9999)
        ),
    [heroLogos]
  );

  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (logos.length <= 1) return;
    const id = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % logos.length);
    }, CYCLE_MS);
    return () => window.clearInterval(id);
  }, [logos.length]);

  const activeLogo = logos[index];

  return (
    <section className="relative left-1/2 right-1/2 w-screen -translate-x-1/2 overflow-hidden bg-[#f8f4ee]">
      <div className="absolute inset-0 bg-gradient-to-r from-white/92 via-white/82 to-[#fff7ed]/70" />

      {activeLogo?.image_url && (
        <div className="pointer-events-none absolute inset-y-0 right-[4%] hidden w-[34vw] min-w-[260px] items-center justify-center lg:flex">
          <img
            key={`${activeLogo.brand || activeLogo.brand_long || "logo"}-${index}`}
            src={activeLogo.image_url}
            alt={activeLogo.brand_long || activeLogo.brand || "Brand logo"}
            className="max-h-[56%] max-w-[78%] object-contain opacity-[0.17] [animation:pulse_1.6s_ease-in-out_infinite]"
          />
        </div>
      )}

      <div className="relative mx-auto w-full max-w-[1700px] px-6 py-14 md:px-10 md:py-16 lg:px-14 lg:py-20">
        <div className="max-w-[980px]">
          <div className="inline-flex rounded-full border border-orange-200 bg-white/85 px-4 py-2 text-[11px] font-extrabold uppercase tracking-[0.22em] text-orange-700 shadow-sm">
            New OEM + OEM Refurbished Appliance Parts
          </div>

          <h1 className="mt-5 max-w-[900px] text-[44px] font-black leading-[0.95] tracking-[-0.04em] text-slate-900 md:text-[64px] lg:text-[78px]">
            If we don’t have your part, it doesn’t exist.
          </h1>

          <p className="mt-5 max-w-[900px] text-[18px] leading-8 text-slate-700 md:text-[22px]">
            Search the appliance parts network built for exact-fit model data, new OEM
            availability, and hard-to-find refurbished OEM inventory.
          </p>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[1.15fr_1fr]">
          <div className="rounded-[28px] bg-white/88 p-6 shadow-sm ring-1 ring-orange-100 backdrop-blur">
            <div className="mb-4 text-[13px] font-extrabold uppercase tracking-[0.22em] text-slate-800">
              Catalog Data
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {catalogStats.map(([value, label]) => (
                <StatTile key={`${value}-${label}`} value={value} label={label} />
              ))}
            </div>
          </div>

          <div className="rounded-[28px] bg-white/88 p-6 shadow-sm ring-1 ring-orange-100 backdrop-blur">
            <div className="mb-4 text-[13px] font-extrabold uppercase tracking-[0.22em] text-slate-800">
              Available Inventory
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {inventoryStats.map(([value, label]) => (
                <StatTile key={`${value}-${label}`} value={value} label={label} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
