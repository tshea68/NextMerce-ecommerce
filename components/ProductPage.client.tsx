"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Breadcrumbs, { type BreadcrumbItem } from "@/components/ui/Breadcrumbs";
import PartImage from "@/components/PartImage";
import ComparisonBadge from "@/components/ComparisonBadge.client";
import { useCart } from "@/context/CartContext";
import { makePartTitle } from "@/lib/PartsTitle";
import { buildProductItem, trackAddToCart, trackBeginCheckout, trackViewItem } from "@/lib/ga4";

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
  note,
}: {
  title: string;
  children: React.ReactNode;
  note?: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
          {title}
        </div>
      </div>
      {note ? <p className="mb-2 text-xs leading-5 text-zinc-600">{note}</p> : null}
      <div className="max-h-[104px] overflow-y-auto pr-1">{children}</div>
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

  const previousParts = useMemo(
    () => toArray(vm.replaces_previous_parts),
    [vm.replaces_previous_parts]
  );

  const alternateNumbers = useMemo(
    () => toArray(vm.alternate_numbers),
    [vm.alternate_numbers]
  );

  const breadcrumbItems = useMemo<BreadcrumbItem[]>(() => {
    const sectionLabel = vm.is_refurb ? "Refurbished Part" : "Part";

    if (vm.breadcrumb_items?.length) {
      const items = [...vm.breadcrumb_items];
      const hasSection = items.some((item) =>
        String(item.label || "").toLowerCase().includes("part")
      );

      if (!hasSection && items.length >= 2) {
        return [
          items[0],
          { label: sectionLabel },
          ...items.slice(1),
        ];
      }

      return items;
    }

    return [
      { label: "Home", href: "/" },
      { label: sectionLabel },
      ...(mpn ? [{ label: mpn }] : []),
    ];
  }, [vm.breadcrumb_items, mpn, vm.is_refurb]);

  const [qty, setQty] = useState(1);
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

  const hasPrice = asNumber(vm.price) != null;
  const priceText = money(vm.price);
  const canPurchase = vm.is_refurb ? hasPositiveInventory(vm) : !isNlaish(vm);

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

  useEffect(() => {
    trackViewItem(
      {
        ...vm,
        mpn,
        title,
        price: asNumber(vm.price) ?? undefined,
      },
      1
    );
  }, [mpn, title, vm]);

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

      trackAddToCart(
        {
          ...vm,
          mpn,
          title,
          price: asNumber(vm.price) ?? undefined,
        },
        qty
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleBuyNow() {
    await handleAddToCart();

    const item = buildProductItem(
      {
        ...vm,
        mpn,
        title,
        price: asNumber(vm.price) ?? undefined,
      },
      qty
    );

    trackBeginCheckout(
      [item],
      item.price != null ? item.price * qty : undefined
    );

    router.push("/checkout");
  }

  const partTypeText = vm.specific_part_type || vm.part_type || null;
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

  return (
    <div className="bg-zinc-50">
      <div className="mx-auto w-full max-w-6xl px-4 py-4 sm:px-5 lg:px-6 lg:py-5">
        <Breadcrumbs items={breadcrumbItems} className="mb-4 text-sm text-zinc-500" />
<section className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm sm:p-4">
            <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
              <PartImage
                enableFullscreenPreview
                imageUrl={vm.image_url || ""}
                alt={title}
                className="max-h-[340px] w-full object-contain"
                disableHoverPreview={false}
              />
            </div>

            <div className="mt-3 space-y-3">
              <MiniScrollSection
                title={
                  compatibleModels.length
                    ? `Fits ${compatibleModels.length.toLocaleString("en-US")} Published Models`
                    : "Compatible Models"
                }
                note="Published model numbers currently linked to this part. Always match your full model number when possible."
              >
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

              {vm.replaced_by || previousParts.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  {vm.replaced_by ? (
                    <MiniScrollSection
                      title="Replacement"
                    >
                      <Link
                        href={`/parts/${encodeURIComponent(vm.replaced_by)}`}
                        className="inline-flex rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-900 hover:border-zinc-400 hover:bg-zinc-50"
                      >
                        {vm.replaced_by}
                      </Link>
                    </MiniScrollSection>
                  ) : null}

                  {previousParts.length > 0 ? (
                    <MiniScrollSection
                      title="Also Replaces"
                    >
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
                    </MiniScrollSection>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0 w-full">
                <div className="mb-4">
                  <ComparisonBadge
                    mode={badgeProps.mode}
                    variant="product"
                    mpn={mpn}
                    refurbSummary={badgeProps.refurbSummary}
                    newSummary={badgeProps.newSummary}
                    savings={badgeProps.savings}
                  />
                </div>

                <h1 className="max-w-3xl text-2xl font-bold leading-tight tracking-tight text-zinc-950 sm:text-3xl">
                  {title}
                </h1>

              </div>
            </div>

            <div className="mt-5 grid gap-4 xl:grid-cols-[1fr_315px]">
              <div className="space-y-4">
                {vm.description ? (
                  <section className="rounded-xl border border-zinc-200 bg-white p-3">
                    <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                      Description
                    </h2>
                    <div className="whitespace-pre-line text-sm leading-6 text-zinc-700">
                      {vm.description}
                    </div>
                  </section>
                ) : null}

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

              </div>

              <aside className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                <div className="text-sm text-zinc-500">Price</div>
                <div className="mt-1 text-3xl font-bold tracking-tight text-zinc-950">
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