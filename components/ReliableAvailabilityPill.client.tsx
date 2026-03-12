"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

const AVAIL_URL = "https://inventorychecker.timothyshea.workers.dev/availability";
const DEFAULT_ZIP = "10001";

type AvailStatus =
  | "in_stock"
  | "special_order"
  | "discontinued"
  | "unavailable"
  | "unknown";

function safeLower(v: any) {
  return String(v ?? "").toLowerCase();
}

function deriveStatus(payload: any): {
  status: AvailStatus;
  totalAvailable: number | null;
  label: string;
} {
  const apiStatus =
    payload?.status ||
    payload?.meta?.apiStatus ||
    payload?.meta?.status ||
    null;

  const errMsg = payload?.meta?.errorMessage || payload?.errorMessage || null;

  const total =
    typeof payload?.totalAvailable === "number"
      ? payload.totalAvailable
      : typeof payload?.total_available === "number"
        ? payload.total_available
        : null;

  const statusNorm = safeLower(apiStatus);
  const errNorm = safeLower(errMsg);

  // Direct API status first
  if (statusNorm === "in_stock") {
    return {
      status: "in_stock",
      totalAvailable: total,
      label:
        typeof total === "number" && total > 0
          ? `In Stock • ${total} Available`
          : "In Stock",
    };
  }

  if (statusNorm === "special_order") {
    return {
      status: "special_order",
      totalAvailable: total,
      label: "Special Order",
    };
  }

  if (statusNorm === "discontinued") {
    return {
      status: "discontinued",
      totalAvailable: total,
      label: "No Longer Available",
    };
  }

  if (statusNorm === "no_stock") {
    return {
      status: "special_order",
      totalAvailable: total,
      label: "Special Order",
    };
  }

  // Success + total means:
  // > 0 => in stock
  // 0 => special order
  if (errMsg === "Success" && total !== null) {
    if (total > 0) {
      return {
        status: "in_stock",
        totalAvailable: total,
        label: `In Stock • ${total} Available`,
      };
    }

    return {
      status: "special_order",
      totalAvailable: total,
      label: "Special Order",
    };
  }

  // Treat unavailable-ish messages as NLA for customer-facing UI
  if (
    errNorm.includes("no longer available") ||
    errNorm.includes("discontinued") ||
    errNorm.includes("invalid part") ||
    errNorm.includes("not available") ||
    errNorm.includes("obsolete") ||
    errNorm.includes("nla")
  ) {
    return {
      status: "unavailable",
      totalAvailable: total,
      label: "No Longer Available",
    };
  }

  // Fallback on totals if present
  if (total !== null) {
    if (total > 0) {
      return {
        status: "in_stock",
        totalAvailable: total,
        label: `In Stock • ${total} Available`,
      };
    }

    if (total === 0) {
      return {
        status: "special_order",
        totalAvailable: total,
        label: "Special Order",
      };
    }
  }

  return {
    status: "unknown",
    totalAvailable: total,
    label: "Availability unknown",
  };
}

export default function ReliableAvailabilityPill(props: {
  partNumber: string;
  qty?: number;
  hideWhenUnknown?: boolean;
}) {
  const { partNumber, qty = 1, hideWhenUnknown = false } = props;

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [payload, setPayload] = useState<any>(null);

  const abortRef = useRef<AbortController | null>(null);

  const zip = useMemo(() => {
    if (typeof window === "undefined") return DEFAULT_ZIP;
    return localStorage.getItem("user_zip") || DEFAULT_ZIP;
  }, []);

  useEffect(() => {
    const pn = String(partNumber || "").trim();
    if (!pn) return;

    if (abortRef.current) abortRef.current.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const res = await fetch(AVAIL_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: ctrl.signal,
          body: JSON.stringify({
            partNumber: pn,
            postalCode: zip,
            quantity: qty || 1,
          }),
        });

        if (!res.ok) throw new Error(`Availability HTTP ${res.status}`);
        const data = await res.json();
        setPayload(data);
      } catch (e: any) {
        if (e?.name === "AbortError") return;
        setErr(e?.message || "Availability request failed");
        setPayload(null);
      } finally {
        setLoading(false);
      }
    })();

    return () => ctrl.abort();
  }, [partNumber, qty, zip]);

  const derived = useMemo(() => deriveStatus(payload), [payload]);

  if (loading) {
    return (
      <span className="inline-flex items-center gap-2 rounded border border-gray-200 bg-gray-100 px-3 py-2 text-sm font-semibold text-gray-700">
        Checking availability…
      </span>
    );
  }

  if (err) {
    return (
      <span className="inline-flex items-center gap-2 rounded border border-gray-200 bg-gray-100 px-3 py-2 text-sm font-semibold text-gray-700">
        Availability unknown
      </span>
    );
  }

  if (!payload) return null;
  if (hideWhenUnknown && derived.status === "unknown") return null;

  const cls =
    derived.status === "in_stock"
      ? "bg-emerald-600 text-white border-emerald-700"
      : derived.status === "special_order"
        ? "bg-red-600 text-white border-red-700"
        : derived.status === "discontinued" || derived.status === "unavailable"
          ? "bg-black text-white border-black"
          : "bg-gray-100 text-gray-700 border-gray-200";

  return (
    <span
      className={`inline-flex items-center gap-2 rounded border px-3 py-2 text-sm font-semibold ${cls}`}
    >
      <span>{derived.label}</span>
      <span className="opacity-80 text-xs font-normal">ZIP {zip}</span>
    </span>
  );
}