"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, ArrowRight } from "lucide-react";
import SearchOverlay from "@/components/search/SearchOverlay";
import type { HeroLogo } from "@/lib/home/getHeroLogos";

const CYCLE_MS = 11000;

const logoSlots = [
  { className: "right-[38%] top-[6%] h-9 w-28", offset: 0, delayMs: 0 },
  { className: "right-[25%] top-[8%] h-8 w-24", offset: 3, delayMs: 450 },
  { className: "right-[13%] top-[11%] h-9 w-28", offset: 6, delayMs: 900 },
  { className: "right-[3%] top-[16%] h-8 w-24", offset: 9, delayMs: 1350 },

  { className: "right-[42%] top-[26%] h-8 w-24", offset: 12, delayMs: 1800 },
  { className: "right-[29%] top-[31%] h-9 w-28", offset: 15, delayMs: 2250 },
  { className: "right-[16%] top-[36%] h-8 w-24", offset: 18, delayMs: 2700 },
  { className: "right-[4%] top-[42%] h-9 w-28", offset: 21, delayMs: 3150 },

  { className: "right-[41%] bottom-[28%] h-8 w-24", offset: 24, delayMs: 3600 },
  { className: "right-[28%] bottom-[24%] h-9 w-28", offset: 27, delayMs: 4050 },
  { className: "right-[15%] bottom-[21%] h-8 w-24", offset: 30, delayMs: 4500 },
  { className: "right-[3%] bottom-[25%] h-9 w-28", offset: 33, delayMs: 4950 },

  { className: "right-[36%] bottom-[10%] h-9 w-28", offset: 36, delayMs: 5400 },
  { className: "right-[22%] bottom-[8%] h-8 w-24", offset: 39, delayMs: 5850 },
  { className: "right-[9%] bottom-[12%] h-9 w-28", offset: 42, delayMs: 6300 },
];

function StatRow({
  label,
  value,
  border = true,
}: {
  label: string;
  value: string;
  border?: boolean;
}) {
  return (
    <div
      className={[
        "flex items-center justify-between gap-3",
        border ? "border-b border-slate-200/80 pb-1.5" : "",
      ].join(" ")}
    >
      <span className="text-[12px] font-semibold text-slate-600">{label}</span>
      <span className="text-[15px] font-black text-slate-950">{value}</span>
    </div>
  );
}

function ProofCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white/58 px-3 py-2.5 shadow-sm backdrop-blur-sm">
      <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-500">
        {title}
      </p>
      <div className="mt-2 space-y-1.5">{children}</div>
    </div>
  );
}

function LogoBackground({ logos }: { logos: HeroLogo[] }) {
  const cleanLogos = useMemo(() => {
    return (logos || [])
      .filter((logo) => logo.image_url)
      .sort(
        (a, b) =>
          Number(a.hero_priority ?? 9999) - Number(b.hero_priority ?? 9999),
      );
  }, [logos]);

  const [slotTicks, setSlotTicks] = useState<Record<number, number>>({});

  useEffect(() => {
    if (cleanLogos.length <= 1) return;

    const timers: number[] = [];

    logoSlots.forEach((slot, slotIndex) => {
      const timeout = window.setTimeout(() => {
        setSlotTicks((prev) => ({
          ...prev,
          [slotIndex]: (prev[slotIndex] ?? 0) + 1,
        }));

        const interval = window.setInterval(() => {
          setSlotTicks((prev) => ({
            ...prev,
            [slotIndex]: (prev[slotIndex] ?? 0) + 1,
          }));
        }, CYCLE_MS);

        timers.push(interval);
      }, slot.delayMs);

      timers.push(timeout);
    });

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      timers.forEach((timer) => window.clearInterval(timer));
    };
  }, [cleanLogos.length]);

  if (cleanLogos.length === 0) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-[25] hidden overflow-hidden min-[800px]:block">
      {logoSlots.map((slot, slotIndex) => {
        const pool = [0, 1, 2, 3]
          .map((poolIndex) => {
            const logoIndex =
              (slot.offset + slotIndex + poolIndex * logoSlots.length) %
              cleanLogos.length;
            return cleanLogos[logoIndex];
          })
          .filter((logo) => logo?.image_url);

        const tick = slotTicks[slotIndex] ?? 0;
        const logo = pool[tick % pool.length];

        if (!logo?.image_url) return null;

        return (
          <div
            key={`hero-logo-slot-${slotIndex}`}
            className={[
              "absolute",
              slot.className,
            ].join(" ")}
            style={{ animationDelay: `${slot.delayMs}ms` }}
          >
            <img
              key={`${slotIndex}-${logo.image_url}`}
              src={logo.image_url}
              alt=""
              className="h-full w-full object-contain mix-blend-multiply animate-hero-logo-bloom"
              loading="eager"
              draggable={false}
            />
          </div>
        );
      })}
    </div>
  );
}

export default function HomeHeroRebuild({
  heroLogos,
}: {
  heroLogos: HeroLogo[];
}) {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <>
      <section className="relative w-full overflow-visible bg-[#eef4fb]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(249,115,22,0.12),transparent_31%),radial-gradient(circle_at_88%_18%,rgba(14,56,102,0.14),transparent_32%),linear-gradient(135deg,#f8fafc_0%,#edf3fb_50%,#f8fafc_100%)]" />

        <LogoBackground logos={heroLogos} />


        <div className="relative mx-auto grid min-h-[430px] w-full max-w-[1780px] grid-cols-1 items-center gap-5 px-8 py-5 md:grid-cols-[1.15fr_0.85fr] md:px-12 lg:px-16">
          <div className="relative z-20 max-w-[820px] rounded-[22px] border border-white/30 bg-white/24 p-4 shadow-[0_12px_34px_rgba(15,23,42,0.07)] backdrop-blur-sm sm:p-5">
            <h1 className="max-w-[760px] text-[34px] font-black leading-[0.98] tracking-[-0.04em] text-slate-950 sm:text-[42px] lg:text-[48px]">
              If we don&apos;t have your part, it doesn&apos;t exist.
            </h1>

            <p className="mt-3 max-w-xl text-[15px] leading-6 text-slate-700">
              Search by appliance model number or part number. Find OEM new and
              OEM refurbished parts across one of the deepest appliance parts
              catalogs online.
            </p>

            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="mt-4 flex w-full items-center justify-between gap-4 rounded-2xl border-2 border-slate-950 bg-white px-4 py-3 text-left shadow-[0_10px_24px_rgba(15,23,42,0.12)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_28px_rgba(15,23,42,0.16)] focus:outline-none focus:ring-4 focus:ring-orange-300 sm:max-w-[520px]"
            >
              <span className="flex min-w-0 items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-white">
                  <Search className="h-5 w-5" />
                </span>

                <span className="min-w-0">
                  <span className="block text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">
                    Search parts
                  </span>
                  <span className="block truncate text-[15px] font-black text-slate-950 sm:text-base text-slate-500 whitespace-normal leading-tight">
                    Enter your part or model number
                  </span>
                </span>
              </span>

              <ArrowRight className="h-5 w-5 shrink-0 text-orange-600" />
            </button>

            <div className="relative z-20 mt-3 grid max-w-[760px] grid-cols-1 gap-2 lg:grid-cols-2">
              <ProofCard title="Catalog Data">
                <StatRow label="Unique Part MPNs" value="~795K" />
                <StatRow label="Unique Models" value="~501K" />
                <StatRow
                  label="Part-Model Matches"
                  value="35MM+"
                  border={false}
                />
              </ProofCard>

              <ProofCard title="Available Inventory">
                <StatRow label="New OEM Parts Available" value="~258K" />
                <StatRow
                  label="OEM Refurbished Parts in Network"
                  value="~220K"
                />
                <StatRow
                  label="Refurbished OEM Units Available"
                  value="~140K"
                  border={false}
                />
              </ProofCard>
            </div>
          </div>

          <div className="relative z-[90] hidden min-h-[430px] overflow-visible md:flex items-end justify-end">
            <img
              src="https://djvyjctjcehjyglwjniv.supabase.co/storage/v1/object/public/geeklogos/geek_hero_logo.png"
              alt="Appliance Part Geeks repair geek"
              draggable={false}
              style={{ transform: "translateY(125px)" }}
              className="
                pointer-events-none relative h-auto max-w-none
                w-[385px]
                mr-[10px]
                lg:w-[455px] lg:mr-[45px]
                xl:w-[500px] xl:mr-[80px]
              "
            />
          </div>
        </div>
      </section>

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
