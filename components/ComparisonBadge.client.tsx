"use client";

import React from "react";
import Link from "next/link";

type NewStatus =
  | "in_stock"
  | "special_order"
  | "discontinued"
  | "unavailable"
  | "unknown";

type RefurbSummary = {
  price?: number | null;
  totalQty?: number | null;
  totalOffers?: number | null;
  url?: string | null;
  verified_match?: boolean | null;
};

type NewSummary = {
  price?: number | null;
  url?: string | null;
  status?: NewStatus | null;
  qty?: number | null;
  verified_match?: boolean | null;
};

type Savings = {
  amount?: number | null;
  percent?: number | null;
};

type Variant = "card" | "product";
type AvailabilityState = "in_stock" | "special_order" | "unavailable" | "unknown";

type DecisionVm = {
  tone: "new" | "refurb";
  href: string | null;
  conditionLine: string;
  comparisonLine: string | null;
  inventoryLine: string | null;
  isOnlyOption: boolean;
};

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function toNumber(v: unknown): number | null {
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  const x = Number(String(v ?? "").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(x) ? x : null;
}

function asMoney(n: unknown) {
  const x = toNumber(n);
  if (x == null) return null;
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2,
    }).format(x);
  } catch {
    return `$${x.toFixed(2)}`;
  }
}

function asPercent(n: unknown) {
  const x = toNumber(n);
  if (x == null) return null;
  return `${x.toFixed(1)}%`;
}

function formatUnits(n: number, noun = "Unit") {
  return `${n.toLocaleString()} ${noun}${n === 1 ? "" : "s"}`;
}

function classifyNewAvailability(
  status: NewStatus,
  qty: number | null
): AvailabilityState {
  if (qty != null && qty > 0) return "in_stock";
  if (status === "in_stock") return "in_stock";
  if (status === "special_order") return "special_order";
  if (status === "discontinued" || status === "unavailable") {
    return "unavailable";
  }
  return "unknown";
}

function hasRefurbAlternative(refurbSummary?: RefurbSummary | null) {
  return refurbSummary?.verified_match === true;
}

function hasNewAlternative(
  newSummary?: NewSummary | null,
  newAvailability?: AvailabilityState
) {
  if (newSummary?.verified_match !== true) return false;
  if (newAvailability === "unavailable") return false;
  return true;
}

function buildNewConditionLine(
  newAvailability: AvailabilityState,
  newQty: number | null
) {
  const base = "100% Guaranteed New OEM Replacement Part";

  if (newQty != null && newQty > 0) {
    return `${base} · ${formatUnits(newQty)} In Stock`;
  }
  if (newAvailability === "in_stock") {
    return `${base} · In Stock`;
  }
  if (newAvailability === "special_order") {
    return `${base} · Special Order`;
  }
  if (newAvailability === "unavailable") {
    return `${base} · No Longer Available`;
  }
  return base;
}

function buildRefurbConditionLine(
  refurbQty: number | null,
  refurbOffers: number | null
) {
  const base = "Guaranteed Refurbished OEM Replacement Part";

  if (refurbQty != null && refurbQty > 0) {
    return `${base} · ${formatUnits(refurbQty)} Available`;
  }
  if (refurbOffers != null && refurbOffers > 0) {
    return `${base} · Refurbished Available`;
  }
  return base;
}

function buildPartDecisionVm({
  mpn,
  refurbSummary,
  newSummary,
  savings,
}: {
  mpn?: string | null;
  refurbSummary?: RefurbSummary | null;
  newSummary?: NewSummary | null;
  savings?: Savings | null;
}): DecisionVm {
  const mpnSafe = mpn ? encodeURIComponent(mpn) : "";

  const refurbPrice = toNumber(refurbSummary?.price);
  const refurbQty = toNumber(refurbSummary?.totalQty);
  const refurbOffers = toNumber(refurbSummary?.totalOffers);

  const newPrice = toNumber(newSummary?.price);
  const newQty = toNumber(newSummary?.qty);
  const newStatus: NewStatus = (newSummary?.status ?? "unknown") as NewStatus;
  const newAvailability = classifyNewAvailability(newStatus, newQty);

  const savingsAmountNum = toNumber(savings?.amount);
  const savingsAmount = asMoney(savingsAmountNum);
  const savingsPercent = asPercent(savings?.percent);

  const hasRefurbAlt = hasRefurbAlternative(refurbSummary);
  const refurbUrl =
    refurbSummary?.url || (mpnSafe ? `/offers/${mpnSafe}` : null);

  const conditionLine = buildNewConditionLine(newAvailability, newQty);

  let comparisonLine: string | null = null;
  let inventoryLine: string | null = null;
  let href: string | null = hasRefurbAlt ? refurbUrl : null;

  if (!hasRefurbAlt) {
    comparisonLine = "No refurbished alternative currently available";
    href = null;
  } else if (newAvailability === "unavailable") {
    comparisonLine =
      "New OEM part is no longer available; refurbished may be your only current option";
  } else if (newAvailability === "special_order") {
    if (savingsAmountNum != null && savingsAmountNum > 0) {
      comparisonLine = savingsPercent
        ? `Refurbished option available — save ${savingsAmount} (${savingsPercent})`
        : `Refurbished option available — save ${savingsAmount}`;
    } else if (refurbPrice != null) {
      comparisonLine = `Refurbished alternative available from ${asMoney(refurbPrice)}`;
    } else if (refurbQty != null && refurbQty > 0) {
      comparisonLine =
        refurbQty === 1
          ? "Refurbished alternative currently available"
          : `${refurbQty.toLocaleString()} refurbished units currently available`;
    } else {
      comparisonLine = "Refurbished alternative currently available";
    }
    inventoryLine = "Ships when available from supplier";
  } else if (savingsAmountNum != null && savingsAmountNum > 0) {
    comparisonLine = savingsPercent
      ? `Refurbished option available — save ${savingsAmount} (${savingsPercent})`
      : `Refurbished option available — save ${savingsAmount}`;
  } else if (
    newPrice != null &&
    refurbPrice != null &&
    refurbPrice > newPrice
  ) {
    const delta = asMoney(refurbPrice - newPrice);
    comparisonLine = delta
      ? `This new OEM option is ${delta} less than available refurbished`
      : "This new OEM option is priced below available refurbished";
  } else if (
    newPrice != null &&
    refurbPrice != null &&
    newPrice > refurbPrice
  ) {
    const delta = asMoney(newPrice - refurbPrice);
    comparisonLine = delta
      ? `Refurbished option available for ${delta} less`
      : "Refurbished option available at a lower price";
  } else if (refurbPrice != null) {
    comparisonLine = `Refurbished alternative available from ${asMoney(refurbPrice)}`;
  } else if (refurbQty != null && refurbQty > 0) {
    comparisonLine =
      refurbQty === 1
        ? "Refurbished alternative currently available"
        : `${refurbQty.toLocaleString()} refurbished units currently available`;
  } else if (refurbOffers != null && refurbOffers > 0) {
    comparisonLine =
      refurbOffers === 1
        ? "1 refurbished listing currently available"
        : `${refurbOffers.toLocaleString()} refurbished listings currently available`;
  }

  if (newAvailability === "unavailable" && hasRefurbAlt) {
    inventoryLine = "Check refurbished availability below";
  }

  return {
    tone: "new",
    href,
    conditionLine,
    comparisonLine,
    inventoryLine,
    isOnlyOption: !hasRefurbAlt,
  };
}

function buildOfferDecisionVm({
  mpn,
  refurbSummary,
  newSummary,
  savings,
}: {
  mpn?: string | null;
  refurbSummary?: RefurbSummary | null;
  newSummary?: NewSummary | null;
  savings?: Savings | null;
}): DecisionVm {
  const mpnSafe = mpn ? encodeURIComponent(mpn) : "";

  const refurbPrice = toNumber(refurbSummary?.price);
  const refurbQty = toNumber(refurbSummary?.totalQty);
  const refurbOffers = toNumber(refurbSummary?.totalOffers);

  const newPrice = toNumber(newSummary?.price);
  const newQty = toNumber(newSummary?.qty);
  const newStatus: NewStatus = (newSummary?.status ?? "unknown") as NewStatus;
  const newAvailability = classifyNewAvailability(newStatus, newQty);

  const savingsAmountNum = toNumber(savings?.amount);
  const savingsAmount = asMoney(savingsAmountNum);
  const savingsPercent = asPercent(savings?.percent);

  const hasNewAlt = hasNewAlternative(newSummary, newAvailability);
  const newUrl =
    newSummary?.url || (mpnSafe ? `/parts/${mpnSafe}` : null);

  const conditionLine = buildRefurbConditionLine(refurbQty, refurbOffers);

  let comparisonLine: string | null = null;
  let inventoryLine: string | null = null;
  let href: string | null = hasNewAlt ? newUrl : null;

  if (!hasNewAlt || newAvailability === "unavailable") {
    comparisonLine = "No new OEM alternative currently available";
    href = null;
  } else if (newAvailability === "special_order" && newPrice != null) {
    comparisonLine = `New OEM only available by special order at ${asMoney(newPrice)}`;
  } else if (savingsAmountNum != null && savingsAmountNum > 0) {
    comparisonLine = savingsPercent
      ? `Save ${savingsAmount} (${savingsPercent}) vs new OEM`
      : `Save ${savingsAmount} vs new OEM`;
  } else if (
    refurbPrice != null &&
    newPrice != null &&
    refurbPrice < newPrice
  ) {
    const delta = asMoney(newPrice - refurbPrice);
    comparisonLine = delta
      ? `Priced ${delta} below available new OEM`
      : "Priced below available new OEM";
  } else if (
    refurbPrice != null &&
    newPrice != null &&
    refurbPrice > newPrice
  ) {
    const delta = asMoney(refurbPrice - newPrice);
    comparisonLine = delta
      ? `Priced ${delta} above available new OEM`
      : "Priced above available new OEM";
  } else if (newAvailability === "in_stock" && newPrice != null) {
    comparisonLine = `New OEM also available at ${asMoney(newPrice)}`;
  } else if (newAvailability === "special_order") {
    comparisonLine = "New OEM alternative currently available by special order";
  } else {
    comparisonLine = "No new OEM alternative currently available";
    href = null;
  }

  if ((refurbQty == null || refurbQty <= 0) && refurbOffers != null && refurbOffers > 0) {
    inventoryLine =
      refurbOffers === 1
        ? "1 refurbished listing available"
        : `${refurbOffers.toLocaleString()} refurbished listings available`;
  } else if (refurbQty == null || refurbQty <= 0) {
    inventoryLine = "Refurbished availability currently limited";
  }

  return {
    tone: "refurb",
    href,
    conditionLine,
    comparisonLine,
    inventoryLine,
    isOnlyOption: !hasNewAlt,
  };
}

function buildDecisionVm({
  mode,
  mpn,
  refurbSummary,
  newSummary,
  savings,
}: {
  mode: "part" | "offer";
  mpn?: string | null;
  refurbSummary?: RefurbSummary | null;
  newSummary?: NewSummary | null;
  savings?: Savings | null;
}): DecisionVm | null {
  return mode === "part"
    ? buildPartDecisionVm({ mpn, refurbSummary, newSummary, savings })
    : buildOfferDecisionVm({ mpn, refurbSummary, newSummary, savings });
}

function ProductBanner({ vm }: { vm: DecisionVm }) {
  const toneClasses =
    vm.tone === "new"
      ? {
          wrap: "border-blue-900 bg-blue-900 text-white",
          heading: "text-white",
          sub: "text-white/90",
        }
      : {
          wrap: "border-red-900 bg-red-900 text-white",
          heading: "text-white",
          sub: "text-white/90",
        };

  return (
    <div
      className={cx(
        "block w-full rounded-t-2xl rounded-b-xl border px-4 py-3 shadow-sm",
        toneClasses.wrap
      )}
    >
      <div className={cx("text-sm font-semibold leading-5 md:text-base", toneClasses.heading)}>
        {vm.conditionLine}
      </div>

      {vm.comparisonLine ? (
        <div className={cx("mt-1 text-sm leading-5", toneClasses.sub)}>
          {vm.comparisonLine}
        </div>
      ) : null}

      {vm.inventoryLine ? (
        <div className={cx("mt-1 text-sm font-medium leading-5", toneClasses.sub)}>
          {vm.inventoryLine}
        </div>
      ) : null}
    </div>
  );
}

function CardBanner({ vm }: { vm: DecisionVm }) {
  const toneClasses =
    vm.tone === "new"
      ? "border-blue-900 bg-blue-900 text-white"
      : "border-red-900 bg-red-900 text-white";

  const oneLine = [vm.conditionLine, vm.comparisonLine]
    .filter(Boolean)
    .join(" — ");

  return (
    <div
      className={cx(
        "block w-full border-b px-3 py-2 text-left",
        toneClasses
      )}
    >
      <div className="truncate text-[12px] font-semibold leading-4 text-white">
        {oneLine}
      </div>
    </div>
  );
}

export default function ComparisonBadge({
  mode = "part",
  variant = "card",
  mpn,
  refurbSummary,
  newSummary,
  savings,
}: {
  mode?: "part" | "offer";
  variant?: Variant;
  mpn?: string | null;
  refurbSummary?: RefurbSummary | null;
  newSummary?: NewSummary | null;
  savings?: Savings | null;
}) {
  const vm = buildDecisionVm({
    mode,
    mpn,
    refurbSummary,
    newSummary,
    savings,
  });

  if (!vm) return null;

  const content =
    variant === "product" ? <ProductBanner vm={vm} /> : <CardBanner vm={vm} />;

  if (vm.href) {
    return (
      <Link href={vm.href} className="block w-full">
        {content}
      </Link>
    );
  }

  return content;
}