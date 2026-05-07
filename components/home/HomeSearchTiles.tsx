"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const ICON_BASE =
  "https://djvyjctjcehjyglwjniv.supabase.co/storage/v1/object/public/app_type_icons/appliance%20symbols";

const API_BASE = (
  process.env.NEXT_PUBLIC_API_BASE || "https://api.appliancepartgeeks.com"
).replace(/\/+$/, "");

type BrandLogo = {
  name: string;
  image_url: string;
};

type BrandFacet = {
  value: string;
  count: number;
  new_count?: number;
  refurb_count?: number;
};

const applianceTiles = [
  {
    label: "Washers",
    value: "Washer",
    img: `${ICON_BASE}/washer2.png`,
  },
  {
    label: "Dryers",
    value: "Dryer",
    img: `${ICON_BASE}/dryer2.png`,
  },
  {
    label: "Refrigerators",
    value: "Refrigerator",
    img: `${ICON_BASE}/fridge2.png`,
  },
  {
    label: "Dishwashers",
    value: "Dishwasher",
    img: `${ICON_BASE}/dishwasher2.png`,
  },
  {
    label: "Ranges",
    value: "Range",
    img: `${ICON_BASE}/range2.png`,
  },
  {
    label: "Microwaves",
    value: "Microwave",
    img: `${ICON_BASE}/microwave2.png`,
  },
  {
    label: "Icemakers",
    value: "Icemaker",
    img: `${ICON_BASE}/icemaker2.png`,
  },
  {
    label: "Freezers",
    value: "Freezer",
    img: `${ICON_BASE}/freezer2.png`,
  },
  {
    label: "Cooktops",
    value: "Cooktop",
    img: `${ICON_BASE}/cooktop2.png`,
  },
  {
    label: "Range Hoods",
    value: "Range Hood",
    img: `${ICON_BASE}/hood2.png`,
  },
  {
    label: "Air Conditioners",
    value: "Air Conditioner",
    img: `${ICON_BASE}/airconditioner2.png`,
  },
  {
    label: "Furnaces",
    value: "Furnace",
    img: `${ICON_BASE}/furnace2.png`,
  },
  {
    label: "Humidifiers",
    value: "Humidifier",
    img: `${ICON_BASE}/humid2.png`,
  },
  {
    label: "Dehumidifiers",
    value: "Dehumidifier",
    img: `${ICON_BASE}/dehumid2.png`,
  },
];

function normalizeBrand(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function formatCount(count: number) {
  if (!Number.isFinite(count)) return "";
  if (count >= 1000) return `${Math.round(count / 1000)}K parts`;
  return `${count.toLocaleString()} parts`;
}

function coerceLogos(data: any): BrandLogo[] {
  const arr = Array.isArray(data)
    ? data
    : Array.isArray(data?.logos)
      ? data.logos
      : Array.isArray(data?.items)
        ? data.items
        : [];

  const seen = new Set<string>();

  return arr
    .map((item: any) => {
      const image_url =
        item?.image_url || item?.logo_url || item?.url || item?.src || null;
      const name =
        item?.name || item?.brand || item?.brand_long || item?.title || "";

      if (!image_url || !name) return null;

      return {
        name: String(name).trim(),
        image_url: String(image_url).trim(),
      };
    })
    .filter(Boolean)
    .filter((item: BrandLogo) => {
      const key = normalizeBrand(item.name);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }) as BrandLogo[];
}

export default function HomeSearchTiles() {
  const [logos, setLogos] = useState<BrandLogo[]>([]);
  const [facets, setFacets] = useState<BrandFacet[]>([]);

  useEffect(() => {
    let live = true;

    async function load() {
      try {
        const [logoRes, facetRes] = await Promise.all([
          fetch(`${API_BASE}/api/brand-logos`, { cache: "no-store" }),
          fetch(
            `/api/parts/facets?condition=both&availability=all&facet_limit=200`,
            { cache: "no-store" },
          ),
        ]);

        const logoJson = logoRes.ok ? await logoRes.json() : [];
        const facetJson = facetRes.ok ? await facetRes.json() : {};

        if (!live) return;

        setLogos(coerceLogos(logoJson));
        setFacets(Array.isArray(facetJson?.brands) ? facetJson.brands : []);
      } catch (err) {
        console.error("Failed to load home search tiles data:", err);
        if (!live) return;
        setLogos([]);
        setFacets([]);
      }
    }

    load();

    return () => {
      live = false;
    };
  }, []);

  const topBrands = useMemo(() => {
    const logoByNorm = new Map<string, BrandLogo>();

    for (const logo of logos) {
      const key = normalizeBrand(logo.name);
      if (!key || !logo.image_url) continue;

      if (!logoByNorm.has(key)) {
        logoByNorm.set(key, logo);
      }
    }

    const seenBrands = new Set<string>();
    const seenUrls = new Set<string>();

    const rows = facets
      .filter((facet) => Number(facet.count || 0) > 0)
      .map((facet) => {
        const brandKey = normalizeBrand(facet.value);
        if (!brandKey || seenBrands.has(brandKey)) return null;

        const logo = logoByNorm.get(brandKey);
        if (!logo?.image_url) return null;

        const urlKey = logo.image_url.trim().toLowerCase();
        if (seenUrls.has(urlKey)) return null;

        seenBrands.add(brandKey);
        seenUrls.add(urlKey);

        return {
          value: facet.value,
          count: facet.count,
          logo,
        };
      })
      .filter(Boolean) as Array<{
        value: string;
        count: number;
        logo: BrandLogo;
      }>;

    return rows.sort((a, b) => {
      const an = String(a.logo.name || a.value || "").toLowerCase();
      const bn = String(b.logo.name || b.value || "").toLowerCase();
      return an.localeCompare(bn);
    });
  }, [facets, logos]);

  return (
    <section className="bg-white py-8 text-slate-950">
      <div className="mx-auto w-[96%] max-w-[1700px] px-4">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,4fr)_minmax(280px,1fr)]">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-600">
                  Browse by appliance
                </p>
                <h2 className="mt-1 text-2xl font-black tracking-tight text-[#001f3e]">
                  Shop appliance part types
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
              {applianceTiles.map((tile) => (
                <Link
                  key={tile.value}
                  href={`/?appliance_type=${encodeURIComponent(tile.value)}`}
                  className="group flex h-[132px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-orange-400 hover:shadow-md"
                >
                  <div className="flex min-h-0 flex-1 items-center justify-center px-3 pt-3">
                    <img
                      src={tile.img}
                      alt={`${tile.label} parts`}
                      className="h-full max-h-[88px] w-full object-contain transition group-hover:scale-105"
                      loading="lazy"
                    />
                  </div>

                  <div className="px-2 pb-3 pt-2 text-center text-[13px] font-black leading-tight text-[#001f3e]">
                    {tile.label}
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
            <div className="mb-3">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-600">
                Top brands
              </p>
              <h3 className="mt-1 text-xl font-black tracking-tight text-[#001f3e]">
                Search by manufacturer
              </h3>
            </div>

            <div className="max-h-[300px] overflow-y-auto rounded-2xl border border-slate-200 bg-white pr-1">
              <div className="grid grid-cols-2 gap-x-3 gap-y-4 px-4 py-4">
                {topBrands.map((brand, index) => (
                  <Link
                    key={`${brand.value}-${index}`}
                    href={`/?brands=${encodeURIComponent(brand.value)}`}
                    className="group flex h-20 items-center justify-center rounded-xl px-3 transition hover:bg-orange-50"
                  >
                    <img
                      src={brand.logo.image_url}
                      alt={brand.logo.name}
                      className="h-full max-h-16 w-full max-w-[160px] object-contain"
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
