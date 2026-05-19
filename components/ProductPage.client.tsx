"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Breadcrumbs, { type BreadcrumbItem } from "@/components/ui/Breadcrumbs";
import PartImage from "@/components/PartImage";
import ComparisonBadge from "@/components/ComparisonBadge.client";
import { useCart } from "@/context/CartContext";
import { makePartTitle } from "@/lib/PartsTitle";
import { resolveKeyPartFields } from "@/lib/product-detail-fields";

export type ProductVM = {
  mpn?: string | null;
  part_number?: string | null;

  title?: string | null;
  title_display?: string | null;
  feed_title?: string | null;
  description?: string | null;

  brand?: string | null;
  brand_logo_url?: string | null;
  appliance_type?: string | null;
  specific_part_type?: string | null;
  part_type?: string | null;

  image_url?: string | null;
  price?: number | string | null;

  is_refurb?: boolean | null;
  condition?: string | null;

  stock_status_canon?: string | null;
  availability_rank?: number | null;
  inventory_total?: number | null;

  compatible_models?: string[] | null;
  compatible_models_count?: number | null;
  compatible_brands?: string | string[] | null;

  replaces_previous_parts?: string[] | string | null;
  replaced_by?: string | null;

  weight?: string | number | null;
  dimensions?: string | null;
  alternate_numbers?: string[] | string | null;

  breadcrumb_items?: BreadcrumbItem[] | null;

  reliable?: {
    ship_status?: string | null;
    pickup_status?: string | null;
    pickup_location?: string | null;
    pickup_locations?: Array<{
      name?: string | null;
      city?: string | null;
      state?: string | null;
      qty?: number | null;
      available?: boolean | null;
    }> | null;
    lead_time_text?: string | null;
    checked_at?: string | null;
    dealer_price?: number | null;
    retail_price?: number | null;
  } | null;
};

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const n = Number(value.replace(/[^0-9.-]/g, ""));
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function money(value: unknown) {
  const n = asNumber(value);
  if (n == null) return "—";
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(n);
  } catch {
    return `$${n.toFixed(2)}`;
  }
}

function toArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((v) => String(v ?? "").trim()).filter(Boolean);
  }
  if (typeof value === "string") {
    const s = value.trim();
    if (!s) return [];
    try {
      const parsed = JSON.parse(s);
      if (Array.isArray(parsed)) {
        return parsed.map((v) => String(v ?? "").trim()).filter(Boolean);
      }
    } catch {}
    return s
      .split(/[,|]/)
      .map((v) => v.trim())
      .filter(Boolean);
  }
  return [];
}

function normalize(s: unknown) {
  return String(s ?? "").trim().toLowerCase();
}

function isNlaish(vm: ProductVM) {
  const s = normalize(vm.stock_status_canon);
  return (
    s.includes("nla") ||
    s.includes("no longer available") ||
    s.includes("discontinued") ||
    s.includes("unavailable") ||
    vm.availability_rank === 9
  );
}

function hasPositiveInventory(vm: ProductVM) {
  return (asNumber(vm.inventory_total) ?? 0) > 0;
}

function isOrderable(vm: ProductVM) {
  if (vm.is_refurb) return hasPositiveInventory(vm);
  if (isNlaish(vm)) return false;
  return !hasPositiveInventory(vm);
}

function titleFor(vm: ProductVM) {
  const forced = vm.mpn || vm.part_number || undefined;
  return vm.title_display || vm.feed_title || vm.title || makePartTitle(vm as any, forced);
}

function modelMatch(input: string, models: string[]) {
  const q = normalize(input).replace(/[^a-z0-9]/g, "");
  if (!q) return null;

  const exact = models.find(
    (m) => normalize(m).replace(/[^a-z0-9]/g, "") === q
  );
  if (exact) return { exact: true, model: exact };

  const partial = models.find((m) =>
    normalize(m).replace(/[^a-z0-9]/g, "").includes(q)
  );
  if (partial) return { exact: false, model: partial };

  return null;
}

function compareStatusToNewSummaryStatus(
  compareData: any
): "in_stock" | "special_order" | "discontinued" | "unavailable" | "unknown" {
  const status = normalize(compareData?.reliable?.stock_status);

  if (!status) {
    return compareData?.reliable?.price != null ? "in_stock" : "unknown";
  }

  if (
    status.includes("discontinued") ||
    status.includes("unavailable") ||
    status.includes("nla") ||
    status.includes("no longer available")
  ) {
    return "discontinued";
  }

  if (
    status.includes("special") ||
    status.includes("order") ||
    status.includes("backorder") ||
    status.includes("preorder")
  ) {
    return "special_order";
  }

  if (
    status.includes("in stock") ||
    status.includes("instock") ||
    status.includes("available")
  ) {
    return "in_stock";
  }

  return compareData?.reliable?.price != null ? "in_stock" : "unknown";
}

function MiniScrollSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
      <div className="mb-3 text-xs font-medium uppercase tracking-wide text-zinc-500">
        {title}
      </div>
      <div className="max-h-[108px] overflow-y-auto pr-1">
        {children}
      </div>
    </div>
  );
}

export default function ProductPageClient({ vm }: { vm: ProductVM }) {
  const router = useRouter();
  const { addToCart: addItem } = useCart();

  const mpn = vm.mpn || vm.part_number || "";
  const title = titleFor(vm);

  const compatibleModels = useMemo(
    () => toArray(vm.compatible_models),
    [vm.compatible_models]
  );

  const compatibleBrands = useMemo(
    () => toArray(vm.compatible_brands),
    [vm.compatible_brands]
  );

  const previousParts = useMemo(
    () => toArray(vm.replaces_previous_parts),
    [vm.replaces_previous_parts]
  );

  const alternateNumbers = useMemo(
    () => toArray(vm.alternate_numbers),
    [vm.alternate_numbers]
  );

  const breadcrumbItems = useMemo<BreadcrumbItem[]>(() => {
    if (vm.breadcrumb_items?.length) return vm.breadcrumb_items;
    return [{ label: "Home", href: "/" }, ...(mpn ? [{ label: mpn }] : [])];
  }, [vm.breadcrumb_items, mpn]);

  const [qty, setQty] = useState(1);
  const [fitInput, setFitInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [compareData, setCompareData] = useState<any>(null);

  useEffect(() => {
    if (!mpn) return;
    let cancelled = false;

    const apiBase =
      process.env.NEXT_PUBLIC_API_BASE?.replace(/\/+$/, "") || "";

    if (!apiBase) {
      setCompareData(null);
      return;
    }

    const url = `${apiBase}/api/compare/xmarket/${encodeURIComponent(mpn)}`;

    fetch(url, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled) setCompareData(data);
      })
      .catch(() => {
        if (!cancelled) setCompareData(null);
      });

    return () => {
      cancelled = true;
    };
  }, [mpn]);

  const fitResult = useMemo(() => {
    if (!fitInput.trim()) return null;
    return modelMatch(fitInput, compatibleModels);
  }, [fitInput, compatibleModels]);

  const hasPrice = asNumber(vm.price) != null;
  const priceText = money(vm.price);
  const conditionText = vm.condition || (vm.is_refurb ? "Refurbished" : "Genuine OEM");

  const canPurchase = vm.is_refurb
    ? hasPositiveInventory(vm)
    : !isNlaish(vm);

  const badgeProps = useMemo(() => {
    if (vm.is_refurb) {
      return {
        mode: "offer" as const,
        refurbSummary: {
          price: asNumber(vm.price),
          totalQty: vm.inventory_total,
          totalOffers:
            asNumber(compareData?.refurb?.total_offers) ??
            asNumber(compareData?.refurb?.offers) ??
            1,
          url: mpn ? `/offers/${encodeURIComponent(mpn)}` : null,
        },
        newSummary: {
          price: asNumber(compareData?.reliable?.price),
          status: compareStatusToNewSummaryStatus(compareData),
          qty:
            asNumber(compareData?.reliable?.qty) ??
            asNumber(compareData?.reliable?.inventory_total) ??
            null,
          url: mpn ? `/parts/${encodeURIComponent(mpn)}` : null,
        },
        savings: {
          amount: asNumber(compareData?.savings?.amount),
          percent: asNumber(compareData?.savings?.percent),
        },
      };
    }

    const partQty = asNumber(vm.inventory_total);
    const newStatus = isNlaish(vm)
      ? "discontinued"
      : partQty != null && partQty > 0
      ? "in_stock"
      : "special_order";

    return {
      mode: "part" as const,
      refurbSummary: {
        price:
          asNumber(compareData?.refurb?.best?.price) ??
          asNumber(compareData?.refurb?.price),
        totalQty:
          asNumber(compareData?.refurb?.total_qty) ??
          asNumber(compareData?.refurb?.qty) ??
          asNumber(compareData?.refurb?.inventory_total),
        totalOffers:
          asNumber(compareData?.refurb?.total_offers) ??
          asNumber(compareData?.refurb?.offers),
        url: mpn ? `/offers/${encodeURIComponent(mpn)}` : null,
      },
      newSummary: {
        price: asNumber(vm.price),
        status: newStatus,
        qty: partQty != null && partQty > 0 ? partQty : null,
        url: mpn ? `/parts/${encodeURIComponent(mpn)}` : null,
      },
      savings: {
        amount: asNumber(compareData?.savings?.amount),
        percent: asNumber(compareData?.savings?.percent),
      },
    };
  }, [compareData, mpn, vm]);

  async function handleAddToCart() {
    try {
      setBusy(true);
      addItem({
        mpn,
        name: title,
        price: asNumber(vm.price) ?? 0,
        image: vm.image_url || "",
        qty,
        is_refurb: !!vm.is_refurb,
      });
    } finally {
      setBusy(false);
    }
  }

  async function handleBuyNow() {
    await handleAddToCart();
    router.push("/checkout");
  }

  const partTypeText = vm.specific_part_type || vm.part_type || null;
  const availabilityText = isNlaish(vm)
    ? "No Longer Available"
    : vm.is_refurb
      ? hasPositiveInventory(vm)
        ? `${asNumber(vm.inventory_total)?.toLocaleString("en-US") || vm.inventory_total} units available`
        : "Currently unavailable"
      : hasPositiveInventory(vm)
        ? `${asNumber(vm.inventory_total)?.toLocaleString("en-US") || vm.inventory_total} units available`
        : isOrderable(vm)
          ? "Special order / orderable"
          : "Availability varies";

  const identityRows = [
    ["Part Number / MPN", mpn],
    ["Brand", vm.brand],
    ["Condition", conditionText],
    ["Appliance Type", vm.appliance_type],
    ["Part Type", partTypeText],
    ["Availability", availabilityText],
    [
      "Compatible Models",
      compatibleModels.length
        ? `${compatibleModels.length.toLocaleString("en-US")} published model${compatibleModels.length === 1 ? "" : "s"}`
        : vm.compatible_models_count
          ? `${Number(vm.compatible_models_count).toLocaleString("en-US")} published model${Number(vm.compatible_models_count) === 1 ? "" : "s"}`
          : null,
    ],
    [
      "Replaces Previous Parts",
      previousParts.length ? previousParts.join(", ") : null,
    ],
    ["Replaced By", vm.replaced_by],
  ].filter((row): row is [string, string] => Boolean(row[1]));

  function gridHref(params: {
    condition?: "new" | "refurb" | "both";
    availability?: "all" | "in_stock";
    brand?: string | null;
    applianceType?: string | null;
    partType?: string | null;
    q?: string | null;
  }) {
    const sp = new URLSearchParams();
    sp.set("condition", params.condition || (vm.is_refurb ? "refurb" : "new"));
    sp.set("availability", params.availability || "all");

    if (params.q) sp.set("q", params.q);
    if (params.brand) sp.append("brands", params.brand);
    if (params.applianceType) sp.set("appliance_type", params.applianceType);
    if (params.partType) sp.append("part_types", params.partType);

    return `/grid?${sp.toString()}`;
  }

  const relatedLinks = [
    vm.brand
      ? {
          label: `Browse more ${vm.brand} parts`,
          href: gridHref({ condition: "both", brand: vm.brand }),
        }
      : null,
    vm.appliance_type
      ? {
          label: `Browse ${vm.appliance_type.toLowerCase()} parts`,
          href: gridHref({ condition: "both", applianceType: vm.appliance_type }),
        }
      : null,
    partTypeText
      ? {
          label: `Browse ${partTypeText.toLowerCase()} parts`,
          href: gridHref({ condition: "both", partType: partTypeText }),
        }
      : null,
    vm.brand && vm.appliance_type
      ? {
          label: `Browse ${vm.brand} ${vm.appliance_type.toLowerCase()} parts`,
          href: gridHref({
            condition: "both",
            brand: vm.brand,
            applianceType: vm.appliance_type,
          }),
        }
      : null,
    vm.brand && partTypeText
      ? {
          label: `Browse ${vm.brand} ${partTypeText.toLowerCase()} parts`,
          href: gridHref({
            condition: "both",
            brand: vm.brand,
            partType: partTypeText,
          }),
        }
      : null,
    {
      label: vm.is_refurb
        ? "Browse all refurbished appliance parts"
        : "Browse all new OEM appliance parts",
      href: gridHref({ condition: vm.is_refurb ? "refurb" : "new" }),
    },
    {
      label: `Search for ${mpn} alternatives`,
      href: gridHref({ condition: "both", q: mpn }),
    },
    {
      label: "Shipping information",
      href: "/shipping",
    },
    {
      label: "Returns policy",
      href: "/returns",
    },
    {
      label: "Request a rare part",
      href: "/rare-part-request",
    },
  ].filter((link): link is { label: string; href: string } => Boolean(link));

  return (
    <div className="bg-zinc-50">
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <Breadcrumbs items={breadcrumbItems} className="mb-6 text-zinc-500" />

        {vm.replaced_by ? (
          <div className="mb-6 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-amber-900">
            <div className="text-sm font-semibold">Superseded Part Number</div>
            <div className="mt-1 text-sm">
              This part appears to have been replaced by{" "}
              <Link
                href={`/parts/${encodeURIComponent(vm.replaced_by)}`}
                className="font-semibold underline"
              >
                {vm.replaced_by}
              </Link>
              .
            </div>
          </div>
        ) : null}

        <section className="grid gap-6 lg:grid-cols-[1.05fr_1.25fr]">
          <div className="rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-6">
            <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
              <PartImage
              enableFullscreenPreview
                imageUrl={vm.image_url || ""}
                alt={title}
                className="h-auto w-full object-contain"
                disableHoverPreview={false}
              />
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full border border-zinc-300 bg-zinc-50 px-3 py-1 text-xs font-medium text-zinc-700">
                {conditionText}
              </span>

              {vm.brand ? (
                <span className="rounded-full border border-zinc-300 bg-zinc-50 px-3 py-1 text-xs font-medium text-zinc-700">
                  {vm.brand}
                </span>
              ) : null}

              {vm.specific_part_type || vm.part_type ? (
                <span className="rounded-full border border-zinc-300 bg-zinc-50 px-3 py-1 text-xs font-medium text-zinc-700">
                  {vm.specific_part_type || vm.part_type}
                </span>
              ) : null}
            </div>

            <div className="mt-5 space-y-4">
              <MiniScrollSection title="Compatible Models">
                {compatibleModels.length ? (
                  <div className="flex flex-wrap gap-2">
                    {compatibleModels.map((model) => (
                      <Link
                        key={model}
                        href={`/model?model=${encodeURIComponent(model)}`}
                        className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 hover:border-zinc-400 hover:bg-zinc-50"
                      >
                        {model}
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-zinc-600">
                    No compatible models published.
                  </div>
                )}
              </MiniScrollSection>

              <div className="grid gap-4 sm:grid-cols-2">
                <MiniScrollSection title="Replaced By">
                  {vm.replaced_by ? (
                    <Link
                      href={`/parts/${encodeURIComponent(vm.replaced_by)}`}
                      className="inline-flex rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-900 hover:border-zinc-400 hover:bg-zinc-50"
                    >
                      {vm.replaced_by}
                    </Link>
                  ) : (
                    <div className="text-sm text-zinc-600">
                      No newer superseding part published.
                    </div>
                  )}
                </MiniScrollSection>

                <MiniScrollSection title="Replaces Previous Parts">
                  {previousParts.length ? (
                    <div className="flex flex-wrap gap-2">
                      {previousParts.map((part) => (
                        <Link
                          key={part}
                          href={`/parts/${encodeURIComponent(part)}`}
                          className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 hover:border-zinc-400 hover:bg-zinc-50"
                        >
                          {part}
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-zinc-600">
                      No previous part numbers published.
                    </div>
                  )}
                </MiniScrollSection>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0 w-full">
                <div className="mb-5">
                  <ComparisonBadge
                    mode={badgeProps.mode}
                    variant="product"
                    mpn={mpn}
                    refurbSummary={badgeProps.refurbSummary}
                    newSummary={badgeProps.newSummary}
                    savings={badgeProps.savings}
                  />
                </div>

                <h1 className="max-w-4xl text-3xl font-bold tracking-tight text-zinc-950 sm:text-4xl">
                  {title}
                </h1>

                {compatibleBrands.length > 0 ? (
                  <div className="mt-4">
                    <div className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
                      Compatible Brands
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {compatibleBrands.slice(0, 10).map((b) => (
                        <span
                          key={b}
                          className="rounded-full border border-zinc-300 bg-zinc-50 px-3 py-1 text-xs font-medium text-zinc-800"
                        >
                          {b}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : vm.brand ? (
                  <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-700">
                    This part may fit other brands known to be compatible with{" "}
                    <span className="font-medium">{vm.brand}</span>.
                  </div>
                ) : null}

                {identityRows.length > 0 ? (
                  <section
                    aria-labelledby="product-details-heading"
                    className="mt-6 rounded-2xl border border-zinc-200 bg-zinc-50 p-4"
                  >
                    <h2
                      id="product-details-heading"
                      className="text-sm font-semibold uppercase tracking-wide text-zinc-700"
                    >
                      Product Details
                    </h2>

                    <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                      {identityRows.map(([label, value]) => (
                        <div
                          key={label}
                          className="rounded-xl border border-zinc-200 bg-white px-3 py-2"
                        >
                          <dt className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                            {label}
                          </dt>
                          <dd className="mt-1 break-words text-sm font-medium text-zinc-950">
                            {value}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </section>
                ) : null}
              </div>
            </div>

            <div className="mt-6 grid gap-4 xl:grid-cols-[1fr_360px]">
              <div className="space-y-5">
                {vm.description ? (
                  <div>
                    <div className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
                      Description
                    </div>
                    <div className="text-base leading-7 text-zinc-700">
                      {vm.description}
                    </div>
                  </div>
                ) : null}

                <div>
                  <div className="mb-3 text-xs font-medium uppercase tracking-wide text-zinc-500">
                    Check Fit by Model Number
                  </div>

                  <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                    <input
                      type="text"
                      value={fitInput}
                      onChange={(e) => setFitInput(e.target.value)}
                      placeholder="Enter your model number to check fit"
                      className="h-12 w-full rounded-xl border border-zinc-300 bg-white px-4 text-sm outline-none ring-0 placeholder:text-zinc-400 focus:border-zinc-500"
                    />

                    {fitInput.trim() ? (
                      <div className="mt-3">
                        {fitResult?.exact ? (
                          <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-900">
                            Exact compatibility match found:{" "}
                            <span className="font-semibold">{fitResult.model}</span>
                          </div>
                        ) : fitResult?.model ? (
                          <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
                            Partial compatibility match found:{" "}
                            <span className="font-semibold">{fitResult.model}</span>
                          </div>
                        ) : (
                          <div className="rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-900">
                            No compatible model match found in the current data.
                          </div>
                        )}
                      </div>
                    ) : null}
                  </div>
                </div>

                {alternateNumbers.length > 0 ? (
                  <div>
                    <div className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
                      Alternate Numbers
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {alternateNumbers.map((num) => (
                        <span
                          key={num}
                          className="rounded-full border border-zinc-300 bg-zinc-50 px-3 py-1 text-xs font-medium text-zinc-700"
                        >
                          {num}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}

                {relatedLinks.length > 0 ? (
                  <section
                    aria-labelledby="related-links-heading"
                    className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4"
                  >
                    <h2
                      id="related-links-heading"
                      className="text-sm font-semibold uppercase tracking-wide text-zinc-700"
                    >
                      Explore Related Appliance Parts
                    </h2>

                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      {relatedLinks.map((link) => (
                        <Link
                          key={`${link.href}-${link.label}`}
                          href={link.href}
                          className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-900 hover:border-zinc-400 hover:bg-white"
                        >
                          {link.label}
                        </Link>
                      ))}
                    </div>
                  </section>
                ) : null}
              </div>

              <aside className="rounded-3xl border border-zinc-200 bg-zinc-50 p-5">
                <div className="text-sm text-zinc-500">Price</div>
                <div className="mt-1 text-4xl font-bold tracking-tight text-zinc-950">
                  {priceText}
                </div>

                {!vm.is_refurb && isOrderable(vm) ? (
                  <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                    Special order item. Usually ships within 30 days.
                  </div>
                ) : null}

                {!vm.is_refurb && isNlaish(vm) ? (
                  <div className="mt-3 rounded-xl border border-zinc-300 bg-zinc-100 p-3 text-sm text-zinc-800">
                    This part is currently marked no longer available.
                  </div>
                ) : null}

                <div className="mt-5">
                  <label className="mb-2 block text-sm font-medium text-zinc-900">
                    Quantity
                  </label>
                  <div className="inline-flex items-center overflow-hidden rounded-xl border border-zinc-300 bg-white">
                    <button
                      type="button"
                      className="h-11 w-11 text-lg text-zinc-700 hover:bg-zinc-50"
                      onClick={() => setQty((q) => Math.max(1, q - 1))}
                    >
                      −
                    </button>
                    <div className="flex h-11 min-w-[52px] items-center justify-center border-x border-zinc-300 px-4 font-semibold text-zinc-900">
                      {qty}
                    </div>
                    <button
                      type="button"
                      className="h-11 w-11 text-lg text-zinc-700 hover:bg-zinc-50"
                      onClick={() => setQty((q) => Math.min(10, q + 1))}
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  <button
                    type="button"
                    onClick={handleAddToCart}
                    disabled={!canPurchase || busy}
                    className={cn(
                      "flex h-12 w-full items-center justify-center rounded-xl px-4 text-sm font-semibold text-white transition",
                      canPurchase && !busy
                        ? "bg-blue-600 hover:bg-blue-700"
                        : "cursor-not-allowed bg-zinc-400"
                    )}
                  >
                    {busy ? "Adding..." : "Add to Cart"}
                  </button>

                  <button
                    type="button"
                    onClick={handleBuyNow}
                    disabled={!canPurchase || busy}
                    className={cn(
                      "flex h-12 w-full items-center justify-center rounded-xl px-4 text-sm font-semibold text-white transition",
                      canPurchase && !busy
                        ? "bg-emerald-600 hover:bg-emerald-700"
                        : "cursor-not-allowed bg-zinc-400"
                    )}
                  >
                    Buy Now
                  </button>
                </div>

                <div className="mt-5 space-y-2 text-sm text-zinc-700">
                  <div>• Compatibility and replacement data shown under the image</div>
                  {!vm.is_refurb ? (
                    <div>• Availability shown above when applicable</div>
                  ) : (
                    <div>• Refurbished inventory shown in the badge above</div>
                  )}
                </div>

                {!hasPrice ? (
                  <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                    Price not published yet.
                  </div>
                ) : null}
              </aside>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}