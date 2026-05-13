"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
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
    value: "washer",
    img: `${ICON_BASE}/washer2.png`,
  },
  {
    label: "Dryers",
    value: "dryer",
    img: `${ICON_BASE}/dryer2.png`,
  },
  {
    label: "Refrigerators",
    value: "refrigerator",
    img: `${ICON_BASE}/fridge2.png`,
  },
  {
    label: "Dishwashers",
    value: "dishwasher",
    img: `${ICON_BASE}/dishwasher2.png`,
  },
  {
    label: "Ranges",
    value: "range",
    img: `${ICON_BASE}/range2.png`,
  },
  {
    label: "Ovens",
    value: "oven",
    img: `${ICON_BASE}/range2.png`,
  },
  {
    label: "Microwaves",
    value: "microwave",
    img: `${ICON_BASE}/microwave2.png`,
  },
  {
    label: "Air Conditioners",
    value: "air conditioner",
    img: `${ICON_BASE}/airconditioner2.png`,
  },
  {
    label: "Cooktops",
    value: "cooktop",
    img: `${ICON_BASE}/cooktop2.png`,
  },
  {
    label: "Freezers",
    value: "freezer",
    img: `${ICON_BASE}/freezer2.png`,
  },
  {
    label: "Icemakers",
    value: "ice maker",
    img: `${ICON_BASE}/icemaker2.png`,
  },
  {
    label: "Grills",
    value: "grill",
    img: `${ICON_BASE}/range2.png`,
  },
];

function normalizeBrand(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function normalizeFacetValue(value: string) {
  return String(value || "").trim().toLowerCase();
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
  const router = useRouter();
  const [logos, setLogos] = useState<BrandLogo[]>([]);
  const [facets, setFacets] = useState<BrandFacet[]>([]);
  const [applianceFacets, setApplianceFacets] = useState<BrandFacet[]>([]);

  function scrollToGrid() {
    window.setTimeout(() => {
      document.getElementById("parts-grid")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 80);
  }

  function handleBrowseClick(
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string,
  ) {
    e.preventDefault();
    router.push(href, { scroll: false });
    scrollToGrid();
  }

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
        setApplianceFacets(Array.isArray(facetJson?.appliances) ? facetJson.appliances : []);
      } catch (err) {
        console.error("Failed to load home search tiles data:", err);
        if (!live) return;
        setLogos([]);
        setFacets([]);
        setApplianceFacets([]);
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

  const applianceCountByValue = useMemo(() => {
    const map = new Map<string, number>();

    for (const facet of applianceFacets) {
      const key = normalizeFacetValue(facet.value);
      if (key) map.set(key, Number(facet.count || 0));
    }

    return map;
  }, [applianceFacets]);

  const availableApplianceTiles = useMemo(() => {
    if (applianceCountByValue.size === 0) return applianceTiles;

    return applianceTiles.filter((tile) =>
      applianceCountByValue.has(normalizeFacetValue(tile.value)),
    );
  }, [applianceCountByValue]);

  return (
    <section className="w-full text-slate-950">
      <div className="w-full">
        <aside className="w-full max-w-[235px] rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
          <div className="mb-3">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-600">
              Browse by appliance
            </p>
            <h2 className="mt-1 text-base font-black tracking-tight text-[#001f3e]">
              Appliance types
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-2">
            {availableApplianceTiles.map((tile) => {
              const count =
                applianceCountByValue.get(normalizeFacetValue(tile.value)) ?? null;
              const href = `/?condition=refurb&availability=all&appliance_type=${encodeURIComponent(
                tile.value,
              )}&page=1&per_page=30`;

              return (
                <Link
                  key={tile.value}
                  href={href}
                  onClick={(e) => handleBrowseClick(e, href)}
                  className="group flex h-10 items-center gap-2 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 px-2.5 transition hover:border-orange-400 hover:bg-orange-50 hover:shadow-sm"
                >
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center">
                    <img
                      src={tile.img}
                      alt={`${tile.label} parts`}
                      className="h-6 w-6 object-contain transition group-hover:scale-105"
                      loading="lazy"
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="truncate text-left text-[12px] font-black leading-tight text-[#001f3e]">
                      {tile.label}
                    </div>
                    {count != null ? (
                      <div className="text-[9px] font-semibold leading-tight text-slate-500">
                        {formatCount(count)} parts
                      </div>
                    ) : null}
                  </div>
                </Link>
              );
            })}
          </div>

          <div className="mt-4 border-t border-slate-200 pt-3">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-600">
              Top brands
            </p>
            <h3 className="mt-1 text-base font-black tracking-tight text-[#001f3e]">
              Manufacturers
            </h3>

            <div className="mt-3 max-h-[280px] overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              <div className="flex flex-col gap-2">
                {topBrands.map((brand, index) => (
                  <Link
                    key={`${brand.value}-${index}`}
                    href={`/?condition=refurb&availability=all&brands=${encodeURIComponent(
                      brand.value,
                    )}&page=1&per_page=30`}
                    onClick={(e) =>
                      handleBrowseClick(
                        e,
                        `/?condition=refurb&availability=all&brands=${encodeURIComponent(
                          brand.value,
                        )}&page=1&per_page=30`,
                      )
                    }
                    className="group flex h-[62px] items-center justify-center rounded-lg px-2 transition hover:bg-orange-50"
                    title={`${brand.logo.name} parts`}
                  >
                    <img
                      src={brand.logo.image_url}
                      alt={brand.logo.name}
                      className="max-h-11 w-full object-contain transition group-hover:scale-105"
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
        </aside>
      </div>
    </section>
  );
}
