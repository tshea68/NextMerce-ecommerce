"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { BRANCH_LOCATIONS, type BranchLocation } from "@/lib/branchLocations";

const MENU_LINKS = [
  { label: "Rare Part Request", href: "/rare-part-request" },
  { label: "Shipping Policy", href: "/shipping" },
  { label: "Our Return Policy", href: "/returns" },
  { label: "Cancellation Policy", href: "/cancel" },
  { label: "How to Find Your Model Number", href: "/find-model-number" },
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms of Service", href: "/terms" },
];

export default function Footer() {
  const [activeLocation, setActiveLocation] = useState<BranchLocation | null>(null);

  const sortedLocations = useMemo(() => {
    return [...BRANCH_LOCATIONS].sort((a, b) => {
      const stateCompare = a.state.localeCompare(b.state);
      if (stateCompare !== 0) return stateCompare;
      return a.city.localeCompare(b.city);
    });
  }, []);

  return (
    <>
      <footer className="mt-12 border-t border-white/10 bg-slate-950 text-slate-200">
        <div
          className="
            mx-auto max-w-7xl px-4 py-10
            grid gap-8
            md:grid-cols-[1fr_1fr_2fr]
          "
        >
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <img
                src="https://appliancepartgeeks.batterypointcapital.co/wp-content/uploads/2025/05/output-onlinepngtools-3.webp"
                alt="Appliance Part Geeks"
                className="h-16 w-auto"
                loading="lazy"
              />
            </div>

            <p className="max-w-md text-sm leading-6 text-slate-400">
              The only parts site built to compare brand-new OEM parts and
              pro-tested refurbished parts side-by-side, so you can fix every
              appliance at the price that makes sense.
            </p>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
              Menu
            </h4>

            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/grid" className="hover:text-amber-300 transition-colors">
                  Browse Parts
                </Link>
              </li>
              <li>
                <Link href="/cart" className="hover:text-amber-300 transition-colors">
                  Cart
                </Link>
              </li>
              <li>
                <Link href="/order" className="hover:text-amber-300 transition-colors">
                  Track Order
                </Link>
              </li>

              {MENU_LINKS.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="hover:text-amber-300 transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
              Locations
            </h4>

            <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-1 text-[11px]">
              {sortedLocations.map((loc) => (
                <button
                  key={loc.id}
                  type="button"
                  onClick={() => setActiveLocation(loc)}
                  className="truncate text-left hover:text-amber-300 transition-colors"
                  title={`${loc.city}, ${loc.state}`}
                >
                  {loc.city}, {loc.state}
                </button>
              ))}
            </div>

            <div className="space-y-1 text-[12px] md:hidden">
              {sortedLocations.map((loc) => (
                <button
                  key={loc.id}
                  type="button"
                  onClick={() => setActiveLocation(loc)}
                  className="flex w-full items-center justify-between gap-2 rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-1.5 text-left hover:border-amber-400 hover:text-amber-300 transition-colors"
                >
                  <span className="truncate">
                    {loc.city}, {loc.state}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-slate-800">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-4 text-xs text-slate-500 md:flex-row">
            <span>
              © {new Date().getFullYear()} AppliancePartGeeks. All rights reserved.
            </span>

            <span className="text-center md:text-right">
              Refurbished parts are tested and shipped from 6101 Blair Rd NW Suite C,
              Washington, DC.
            </span>
          </div>
        </div>
      </footer>

      {activeLocation && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
          onClick={() => setActiveLocation(null)}
        >
          <div
            className="relative w-full max-w-lg rounded-xl bg-slate-900 p-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setActiveLocation(null)}
              className="absolute right-3 top-3 text-lg text-slate-300 hover:text-white"
              aria-label="Close location details"
            >
              ×
            </button>

            <h3 className="mb-1 text-sm font-semibold">
              {activeLocation.city}, {activeLocation.state}
            </h3>

            {activeLocation.address && (
              <p className="mb-1 text-xs text-slate-400">{activeLocation.address}</p>
            )}

            {activeLocation.phone && (
              <p className="mb-3 text-xs text-slate-400">{activeLocation.phone}</p>
            )}

            <a
              href={
                activeLocation.mapUrl ||
                `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  `${activeLocation.city}, ${activeLocation.state}`
                )}`
              }
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center rounded bg-amber-400 px-3 py-2 text-xs font-medium text-slate-900 hover:bg-amber-300"
            >
              Open in Google Maps
            </a>
          </div>
        </div>
      )}
    </>
  );
}