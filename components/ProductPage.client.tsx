"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Breadcrumbs, { type BreadcrumbItem } from "@/components/ui/Breadcrumbs";
import PartImage from "@/components/PartImage";
import ComparisonBadge from "@/components/ComparisonBadge.client";
import { useCart } from "@/context/CartContext";
import { makePartTitle } from "@/lib/PartsTitle";
import { trackAddToCart, trackViewItem } from "@/lib/ga4";

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

function cleanDescriptionText(v: unknown) {
  return String(v ?? "")
    .replace(/\s*Â¢\s*/g, " ")
    .replace(/â€™/g, "'")
    .replace(/â€œ|â€�/g, '"')
    .replace(/â€“/g, "–")
    .replace(/â€”/g, "—")
    .replace(/\s+/g, " ")
    .trim();
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
  const [addedToCart, setAddedToCart] = useState(false);
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
      .then((r) => {
        console.log("[xmarket compare response]", {
          mpn,
          url,
          ok: r.ok,
          status: r.status,
        });
        return r.ok ? r.json() : null;
      })
      .then((data) => {
        console.log("[xmarket compare data]", {
          mpn,
          is_refurb: vm.is_refurb,
          data,
        });
        if (!cancelled) setCompareData(data);
      })
      .catch((err) => {
        console.error("[xmarket compare failed]", {
          mpn,
          url,
          err,
        });
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
          verified_match: true,
          price: asNumber(vm.price),
          totalQty: vm.inventory_total,
          totalOffers:
            asNumber(compareData?.refurb?.total_offers) ??
            asNumber(compareData?.refurb?.offers) ??
            1,
          url: mpn ? `/offers/${encodeURIComponent(mpn)}` : null,
        },
        newSummary: {
          verified_match: asNumber(compareData?.reliable?.price) != null,
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
        verified_match:
          (asNumber(compareData?.refurb?.best?.price) ??
            asNumber(compareData?.refurb?.price)) != null,
        price:
          asNumber(compareData?.refurb?.best?.price) ??
          asNumber(compareData?.refurb?.price),
        totalQty:
          asNumber(compareData?.refurb?.total_quantity) ??
          asNumber(compareData?.refurb?.total_qty) ??
          asNumber(compareData?.refurb?.qty) ??
          asNumber(compareData?.refurb?.inventory_total),
        totalOffers:
          asNumber(compareData?.refurb?.total_offers) ??
          asNumber(compareData?.refurb?.offers),
        url: mpn ? `/offers/${encodeURIComponent(mpn)}` : null,
      },
      newSummary: {
        verified_match: true,
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

      setAddedToCart(true);
      window.setTimeout(() => setAddedToCart(false), 4500);
    } finally {
      setBusy(false);
    }
  }

  async function handleBuyNow() {
    await handleAddToCart();
    router.push("/checkout");
  }

  const partTypeText = vm.specific_part_type || vm.part_type || null;
  const descriptionText = cleanDescriptionText(vm.description);
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

  const inventoryCount = asNumber(vm.inventory_total);
  const isSpecialOrderNew = !vm.is_refurb && isOrderable(vm);

  const conditionLabel = vm.is_refurb ? "Refurbished OEM" : "New OEM";

  const statusDetail = vm.is_refurb
    ? inventoryCount != null && inventoryCount > 0
      ? `${inventoryCount.toLocaleString("en-US")} in stock`
      : "Refurbished availability limited"
    : isNlaish(vm)
      ? "New part no longer available"
      : inventoryCount != null && inventoryCount > 0
        ? `${inventoryCount.toLocaleString("en-US")} in stock`
        : "New part is not in stock, only special order";

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
                <div className="rounded-2xl border border-blue-900 bg-blue-900 px-4 py-3 text-white shadow-sm">
                  <h1 className="max-w-4xl text-base font-extrabold leading-snug tracking-tight sm:text-lg">
                    {conditionLabel}: <span className="font-bold">{title}</span>
                  </h1>

                  <div className="mt-1.5 text-xs font-medium leading-5 text-white/85">
                    {statusDetail}
                  </div>
                </div>

              </div>
            </div>

            <div className="mt-5 space-y-4">
              <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_315px]">
                <div className="space-y-4">
                  <ComparisonBadge
                    mode={badgeProps.mode}
                    variant="product"
                    display="cta"
                    mpn={mpn}
                    refurbSummary={badgeProps.refurbSummary}
                    newSummary={badgeProps.newSummary}
                    savings={badgeProps.savings}
                  />

                  {descriptionText ? (
                    <section className="rounded-xl border border-zinc-200 bg-white p-3">
                      <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                        Description
                      </h2>
                      <div className="text-xs leading-5 text-zinc-700 sm:text-[13px] sm:leading-6">
                        {descriptionText}
                      </div>
                    </section>
                  ) : null}
                </div>

                <aside className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-sm text-zinc-500">Price</div>
                      <div className="mt-1 text-3xl font-bold tracking-tight text-zinc-950">
                        {priceText}
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                        Quantity
                      </label>
                      <div className="inline-flex items-center overflow-hidden rounded-lg border border-zinc-300 bg-white">
                        <button
                          type="button"
                          className="h-9 w-9 cursor-pointer text-base text-zinc-700 transition hover:bg-zinc-100 active:bg-zinc-200"
                          onClick={() => setQty((q) => Math.max(1, q - 1))}
                        >
                          −
                        </button>
                        <div className="flex h-9 min-w-[42px] items-center justify-center border-x border-zinc-300 px-3 text-sm font-semibold text-zinc-900">
                          {qty}
                        </div>
                        <button
                          type="button"
                          className="h-9 w-9 text-base text-zinc-700 hover:bg-zinc-50"
                          onClick={() => setQty((q) => Math.min(10, q + 1))}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={handleAddToCart}
                      disabled={!canPurchase || busy}
                      className={cn(
                        "flex h-10 items-center justify-center rounded-lg px-3 text-sm font-semibold text-white transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
                        canPurchase && !busy
                          ? "cursor-pointer bg-blue-600 shadow-sm hover:-translate-y-[1px] hover:bg-blue-700 hover:shadow-md active:translate-y-0 active:scale-[0.99] focus-visible:ring-blue-500"
                          : "cursor-not-allowed bg-zinc-400 opacity-70"
                      )}
                    >
                      {busy ? "Adding..." : addedToCart ? "Added ✓" : "Add to Cart"}
                    </button>

                    <button
                      type="button"
                      onClick={handleBuyNow}
                      disabled={!canPurchase || busy}
                      className={cn(
                        "flex h-10 items-center justify-center rounded-lg px-3 text-sm font-semibold text-white transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
                        canPurchase && !busy
                          ? "cursor-pointer bg-emerald-600 shadow-sm hover:-translate-y-[1px] hover:bg-emerald-700 hover:shadow-md active:translate-y-0 active:scale-[0.99] focus-visible:ring-emerald-500"
                          : "cursor-not-allowed bg-zinc-400 opacity-70"
                      )}
                    >
                      Buy Now
                    </button>
                  </div>

                  {addedToCart ? (
                    <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900 shadow-sm">
                      <div className="font-semibold">Added to cart ✓</div>
                      <div className="mt-1 text-emerald-800">
                        This item is now in your cart.
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Link
                          href="/cart"
                          className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-emerald-300 bg-white px-3 py-2 text-xs font-semibold text-emerald-800 transition hover:bg-emerald-100 active:bg-emerald-200"
                        >
                          View Cart
                        </Link>
                        <Link
                          href="/checkout"
                          className="inline-flex cursor-pointer items-center justify-center rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700 active:bg-emerald-800"
                        >
                          Checkout
                        </Link>
                      </div>
                    </div>
                  ) : null}

                  {!vm.is_refurb && isOrderable(vm) ? (
                    <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm leading-6 text-red-800">
                      <strong>Special order item.</strong> Usually ships within 30 days.
                       Special-order parts are not returnable once ordered unless the
                      item arrives damaged, incorrect, or is approved for a warranty or
                      defect claim.
                    </div>
                  ) : null}

                  {!vm.is_refurb && isNlaish(vm) ? (
                    <div className="mt-3 rounded-xl border border-zinc-300 bg-zinc-100 p-3 text-sm text-zinc-800">
                      This part is currently marked no longer available.
                    </div>
                  ) : null}

                  {!isSpecialOrderNew ? (
                    <div className="mt-4 rounded-xl border border-zinc-200 bg-white p-3 text-sm leading-6 text-zinc-700">
                      {vm.is_refurb ? (
                        <>
                          <p>
                            Free standard shipping on refurbished parts. Overnight
                            available at checkout for an added premium. Orders received
                            by 4pm CT ship the same business day.
                          </p>
                          <p className="mt-2">
                            <strong className="text-zinc-950">Refurbished OEM part.</strong>{" "}
                            We visually inspect each part for damage, then check it
                            with diagnostic equipment when applicable before resale.
                          </p>
                        </>
                      ) : (
                        <>
                          <strong className="text-zinc-950">New supplier part.</strong>{" "}
                          {inventoryCount != null && inventoryCount > 0
                            ? `${inventoryCount.toLocaleString("en-US")} in stock. `
                            : "In stock. "}
                          Overnight shipping is available at checkout for eligible
                          in-stock parts. Eligible unopened, uninstalled returns are
                          accepted under our return policy.
                        </>
                      )}
                    </div>
                  ) : null}

                  {!hasPrice ? (
                    <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                      Price not published yet.
                    </div>
                  ) : null}
                </aside>
              </div>

              <div className="space-y-4">
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
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}