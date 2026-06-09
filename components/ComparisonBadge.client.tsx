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
type ProductDisplay = "both" | "banner" | "cta";
type AvailabilityState = "in_stock" | "special_order" | "unavailable" | "unknown";

type DecisionVm = {
  tone: "new" | "refurb";
  href: string | null;
  conditionLine: string;
  subtitleLine: string | null;
  inventoryLine: string | null;
  ctaHeadline: string | null;
  ctaBody: string | null;
  ctaButton: string | null;
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
    return `${base} · ${formatUnits(refurbQty)} Available · Ships Today`;
  }
  if (refurbOffers != null && refurbOffers > 0) {
    return `${base} · Refurbished Available · Ships Today`;
  }
  return base;
}

function buildRefurbReassuranceLine(refurbQty: number | null) {
  if (refurbQty != null && refurbQty >= 10) {
    return "Original OEM part, inspected and tested for reuse. 30-day returns. Strong refurbished inventory available.";
  }

  if (refurbQty != null && refurbQty >= 2) {
    return "Original OEM part, inspected and tested for reuse. 30-day returns. Multiple units available.";
  }

  return "Original OEM part, inspected and tested for reuse. 30-day returns.";
}

function buildRefurbStockLine(refurbQty: number | null) {
  if (refurbQty == null || refurbQty <= 0) return null;
  if (refurbQty === 1) return "1 refurbished unit available.";
  return `${refurbQty.toLocaleString()} refurbished units available.`;
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

  const newQty = toNumber(newSummary?.qty);
  const newStatus: NewStatus = (newSummary?.status ?? "unknown") as NewStatus;
  const newAvailability = classifyNewAvailability(newStatus, newQty);

  const savingsAmountNum = toNumber(savings?.amount);
  const savingsAmount = asMoney(savingsAmountNum);
  const savingsPercent = asPercent(savings?.percent);
  const refurbMoney = asMoney(refurbPrice);
  const refurbStockLine =
    buildRefurbStockLine(refurbQty) ||
    (refurbOffers != null && refurbOffers > 0
      ? refurbOffers === 1
        ? "1 refurbished listing available."
        : `${refurbOffers.toLocaleString()} refurbished listings available.`
      : null);

  const hasRefurbAlt = hasRefurbAlternative(refurbSummary);
  const refurbUrl =
    refurbSummary?.url || (mpnSafe ? `/offers/${mpnSafe}` : null);

  const conditionLine = buildNewConditionLine(newAvailability, newQty);

  let subtitleLine: string | null = null;
  let inventoryLine: string | null = null;
  let ctaHeadline: string | null = null;
  let ctaBody: string | null = null;
  let ctaButton: string | null = null;
  let href: string | null = hasRefurbAlt ? refurbUrl : null;

  if (!hasRefurbAlt) {
    subtitleLine = "No refurbished alternative currently available";
    href = null;
  } else {
    subtitleLine =
      savingsAmountNum != null && savingsAmountNum > 0
        ? savingsPercent
          ? `Refurbished option available — save ${savingsAmount} (${savingsPercent})`
          : `Refurbished option available — save ${savingsAmount}`
        : refurbMoney
          ? `Refurbished part available for ${refurbMoney}`
          : "Refurbished part available";

    ctaHeadline = refurbMoney
      ? `Refurbished Ships Today for ${refurbMoney}`
      : "Refurbished Ships Today";

    const bodyParts: string[] = [];

    if (savingsAmountNum != null && savingsAmountNum > 0 && savingsAmount) {
      bodyParts.push(
        savingsPercent
          ? `Save ${savingsAmount} (${savingsPercent}) vs new.`
          : `Save ${savingsAmount} vs new.`
      );
    }

    if (refurbStockLine) {
      bodyParts.push("Ships today.");
      bodyParts.push(refurbStockLine);
    }

    ctaBody = bodyParts.join(" ") || "Refurbished OEM option available. Ships today.";
    ctaButton = "See Refurbished Part →";
  }

  return {
    tone: "new",
    href,
    conditionLine,
    subtitleLine,
    inventoryLine,
    ctaHeadline,
    ctaBody,
    ctaButton,
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
  const newMoney = asMoney(newPrice);

  const hasNewAlt = hasNewAlternative(newSummary, newAvailability);
  const newUrl =
    newSummary?.url || (mpnSafe ? `/parts/${mpnSafe}` : null);

  const conditionLine = buildRefurbConditionLine(refurbQty, refurbOffers);

  let subtitleLine: string | null = null;
  let inventoryLine: string | null = null;
  let ctaHeadline: string | null = null;
  let ctaBody: string | null = null;
  let ctaButton: string | null = null;
  let href: string | null = hasNewAlt ? newUrl : null;

  if (!hasNewAlt || newAvailability === "unavailable") {
    subtitleLine = "No new OEM alternative currently available";
    href = null;
  } else if (newAvailability === "special_order") {
    subtitleLine = newMoney
      ? `Order it new for ${newMoney}`
      : "New OEM alternative available by special order";
    ctaHeadline = "Want factory-new OEM?";
    ctaBody = newMoney
      ? `This same MPN is available new by special order for ${newMoney}.`
      : "This same MPN is available as a new OEM special order.";
    ctaButton = "View New OEM Part →";
  } else if (newAvailability === "in_stock") {
    subtitleLine = newMoney
      ? `Buy it new for ${newMoney}`
      : "New OEM alternative currently available";
    ctaHeadline = "Prefer New OEM?";
    ctaBody = newMoney
      ? `This same MPN is available new and in stock for ${newMoney}.`
      : "This same MPN is available as a new OEM part.";
    ctaButton = "View New OEM Part →";
  } else if (savingsAmountNum != null && savingsAmountNum > 0) {
    subtitleLine = savingsPercent
      ? `Save ${savingsAmount} (${savingsPercent}) vs new OEM`
      : `Save ${savingsAmount} vs new OEM`;
    ctaHeadline = "Compare with New OEM";
    ctaBody = newMoney
      ? `New OEM is also available for ${newMoney}.`
      : "New OEM is also available for this MPN.";
    ctaButton = "View New OEM Part →";
  } else if (newMoney) {
    subtitleLine = `New OEM also available at ${newMoney}`;
    ctaHeadline = "Prefer New OEM?";
    ctaBody = `This same MPN is also available new for ${newMoney}.`;
    ctaButton = "View New OEM Part →";
  } else {
    subtitleLine = "New OEM alternative currently available";
    ctaHeadline = "Prefer New OEM?";
    ctaBody = "This same MPN is also available as a new OEM part.";
    ctaButton = "View New OEM Part →";
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
    subtitleLine,
    inventoryLine,
    ctaHeadline,
    ctaBody,
    ctaButton,
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

function ProductBanner({
  vm,
  display = "both",
}: {
  vm: DecisionVm;
  display?: ProductDisplay;
}) {
  const bannerClasses =
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

  // CTA should represent the alternative condition, not the current page condition.
  // New page -> refurb CTA = warm red/orange.
  // Refurb page -> new CTA = blue.
  const ctaClasses =
    vm.tone === "new"
      ? {
          wrap: "border-orange-300 bg-orange-50 text-orange-950 hover:border-orange-500 hover:bg-orange-100",
          eyebrow: "text-orange-700",
          button: "bg-orange-700 text-white hover:bg-orange-800",
        }
      : {
          wrap: "border-blue-300 bg-blue-50 text-blue-950 hover:border-blue-500 hover:bg-blue-100",
          eyebrow: "text-blue-700",
          button: "bg-blue-900 text-white hover:bg-blue-950",
        };

  const showBanner = display === "both" || display === "banner";
  const showCta =
    (display === "both" || display === "cta") &&
    Boolean(vm.href && vm.ctaHeadline && vm.ctaBody && vm.ctaButton);

  return (
    <div className="w-full">
      {showBanner ? (
        <div
          className={cx(
            "block w-full rounded-t-2xl rounded-b-xl border px-4 py-3 shadow-sm",
            bannerClasses.wrap
          )}
        >
          <div className={cx("text-sm font-semibold leading-5 md:text-base", bannerClasses.heading)}>
            {vm.conditionLine}
          </div>

          {vm.subtitleLine ? (
            <div className={cx("mt-1 text-sm leading-5", bannerClasses.sub)}>
              {vm.subtitleLine}
            </div>
          ) : null}

          {vm.inventoryLine ? (
            <div className={cx("mt-1 text-sm font-medium leading-5", bannerClasses.sub)}>
              {vm.inventoryLine}
            </div>
          ) : null}
        </div>
      ) : null}

      {showCta ? (
        <Link
          href={vm.href as string}
          className={cx(
            "block h-full rounded-2xl border px-4 py-4 shadow-sm transition",
            ctaClasses.wrap
          )}
        >          <div className="mt-2 text-lg font-extrabold leading-6">
            {vm.ctaHeadline}
          </div>
          <div className="mt-2 text-sm leading-5 opacity-90">
            {vm.ctaBody}
          </div>
          <div className="mt-4 inline-flex rounded-lg px-3 py-2 text-sm font-bold shadow-sm">
            <span className={cx("rounded-lg px-3 py-2 transition", ctaClasses.button)}>
              {vm.ctaButton}
            </span>
          </div>
        </Link>
      ) : null}
    </div>
  );
}

function CardBanner({ vm }: { vm: DecisionVm }) {
  const toneClasses =
    vm.tone === "new"
      ? "border-blue-900 bg-blue-900 text-white"
      : "border-red-900 bg-red-900 text-white";

  const oneLine = [vm.conditionLine, vm.subtitleLine]
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
  display = "both",
  mpn,
  refurbSummary,
  newSummary,
  savings,
}: {
  mode?: "part" | "offer";
  variant?: Variant;
  display?: ProductDisplay;
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

  if (variant === "product") {
    return <ProductBanner vm={vm} display={display} />;
  }

  const content = <CardBanner vm={vm} />;

  if (vm.href) {
    return (
      <Link href={vm.href} className="block w-full">
        {content}
      </Link>
    );
  }

  return content;
}
