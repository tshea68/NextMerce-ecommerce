"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

const AVAIL_URL = "https://inventorychecker.timothyshea.workers.dev/availability";
const DEFAULT_ZIP = "10001";

type AvailStatus = "in_stock" | "special_order" | "discontinued" | "unavailable" | "unknown";

function safeLower(v: any) {
  return String(v ?? "").toLowerCase();
}

function deriveStatus(payload: any): { status: AvailStatus; totalAvailable: number | null; label: string } {
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

  // Direct API status first
  if (apiStatus === "in_stock") return { status: "in_stock", totalAvailable: total, label: "In Stock" };
  if (apiStatus === "special_order") return { status: "special_order", totalAvailable: total, label: "Backorder / Special Order" };
  if (apiStatus === "discontinued") return { status: "discontinued", totalAvailable: total, label: "Discontinued" };
  if (apiStatus === "no_stock") return { status: "unavailable", totalAvailable: total, label: "Unavailable" };

  // Your React logic: Success + 0 means BACKORDER
  if (errMsg === "Success" && total !== null) {
    if (total > 0) return { status: "in_stock", totalAvailable: total, label: `In Stock` };
    return { status: "special_order", totalAvailable: total, label: "Backorder / Special Order" };
  }

  const em = safeLower(errMsg);
  if (em.includes("no longer available") || em.includes("invalid part") || em.includes("not available")) {
    return { status: "unavailable", totalAvailable: total, label: "Unavailable" };
  }

  // Fallback on totals if present
  if (total !== null) {
    if (total > 0) return { status: "in_stock", totalAvailable: total, label: "In Stock" };
    if (total === 0) return { status: "unavailable", totalAvailable: total, label: "Unavailable" };
  }

  return { status: "unknown", totalAvailable: total, label: "Availability unknown" };
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
      <span className="inline-flex items-center gap-2 text-[11px] font-semibold px-2 py-1 rounded bg-gray-100 text-gray-700 border border-gray-200">
        Checking availability…
      </span>
    );
  }

  if (err) {
    return (
      <span className="inline-flex items-center gap-2 text-[11px] font-semibold px-2 py-1 rounded bg-red-50 text-red-700 border border-red-200">
        Inventory unavailable
      </span>
    );
  }

  if (!payload) return null;

  if (hideWhenUnknown && derived.status === "unknown") return null;

  const cls =
    derived.status === "in_stock"
      ? "bg-green-600 text-white border-green-700"
      : derived.status === "special_order"
        ? "bg-red-700 text-white border-red-800"
        : derived.status === "discontinued" || derived.status === "unavailable"
          ? "bg-black text-white border-black"
          : "bg-gray-100 text-gray-700 border-gray-200";

  return (
    <span className={`inline-flex items-center gap-2 text-[11px] font-semibold px-2 py-1 rounded border ${cls}`}>
      <span>{derived.label}</span>
      {typeof derived.totalAvailable === "number" && (
        <span className="bg-white/15 px-2 py-0.5 rounded font-mono">
          {derived.totalAvailable}
        </span>
      )}
      <span className="opacity-80 font-normal">ZIP {zip}</span>
    </span>
  );
}