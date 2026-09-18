"use client";

import { useCallback, useEffect, useRef } from "react";
import { trackEvent } from "@/lib/ga4";
import type { AttemptedSeller } from "./attempted-sellers";
import { delivered, sellerHref } from "./seller-comparison";
import { sellerPolicies } from "./seller-policies";

const SOURCE = "part_sherpa_market_check";

export function useMarketCheckAnalytics(mpn: string, sellers: AttemptedSeller[], loading: boolean, metadata: Record<string, unknown>) {
  const blockRef = useRef<HTMLElement>(null);
  const state = useRef({ mpn, viewed: false, engaged: false, impressions: new Set<string>(), belowFold: new Set<string>(), initialGroups: new Set<string>() });
  // A new MPN starts a new view; refreshes and Strict Mode effect replay do not.
  if (state.current.mpn !== mpn) state.current = { mpn, viewed: false, engaged: false, impressions: new Set(), belowFold: new Set(), initialGroups: new Set() };

  const engage = useCallback((group?: string) => {
    if (state.current.engaged) return;
    state.current.engaged = true;
    trackEvent("part_sherpa_market_check_engaged", { mpn, seller_group: group });
  }, [mpn]);

  const sellerParams = useCallback((seller: AttemptedSeller) => {
    const offer = seller.offer;
    const policies = sellerPolicies(seller, metadata);
    const shipping = policies.shippingCost;
    return {
      mpn, seller_key: seller.key, seller_name: seller.name,
      condition: offer?.condition || "unknown", availability: seller.state,
      price: offer?.price, shipping_cost: shipping,
      delivered_cost: offer && shipping != null && offer.price != null ? offer.price + shipping : offer ? delivered(offer) : undefined,
      seller_position: sellers.filter(row => row.group === seller.group).findIndex(row => row.key === seller.key) + 1,
      seller_group: seller.group,
      shipping_type: policies.shipping === "Free Shipping" ? "free" : policies.shipping === "Calculated Shipping" ? "calculated" : shipping != null ? "fixed" : "unknown",
    };
  }, [mpn, sellers, metadata]);

  useEffect(() => {
    const block = blockRef.current;
    // Wait for the check to settle so impressions describe the visible results,
    // rather than an empty loading roster. IntersectionObserver clips to both
    // the viewport and each independently scrolling ancestor.
    if (!block || loading) return;
    const captureInitialRows = () => {
      for (const group of ["new", "refurb"]) {
        if (state.current.initialGroups.has(group)) continue;
        const rows = [...block.querySelectorAll<HTMLElement>("[data-seller-key]")].filter(row => sellers.find(seller => seller.key === row.dataset.sellerKey)?.group === group);
        const scroller = rows[0]?.parentElement;
        if (!scroller || !scroller.getBoundingClientRect().height) continue;
        state.current.initialGroups.add(group);
        for (const row of rows) if (row.getBoundingClientRect().top >= scroller.getBoundingClientRect().bottom) state.current.belowFold.add(row.dataset.sellerKey!);
      }
    };
    const observer = new IntersectionObserver(entries => {
      if (document.visibilityState !== "visible") return;
      captureInitialRows();
      for (const entry of entries) {
        if (!entry.isIntersecting || entry.intersectionRatio < (entry.target === block ? 0.1 : 0.5)) continue;
        if (entry.target === block) {
          if (state.current.viewed) continue;
          state.current.viewed = true;
          const count = (status: string) => sellers.filter(row => row.state === status).length;
          trackEvent("part_sherpa_market_check_view", {
            mpn, page_type: "test_part_page", seller_count_total: sellers.length,
            seller_count_in_stock: count("stock"), seller_count_backorder: count("backorder"),
            seller_count_not_available: count("unavailable"), seller_count_inconclusive: count("inconclusive"),
            new_oem_count: sellers.filter(row => row.group === "new").length,
            refurb_used_count: sellers.filter(row => row.group === "refurb").length,
          });
        } else {
          const key = (entry.target as HTMLElement).dataset.sellerKey;
          const seller = sellers.find(row => row.key === key);
          if (!seller || state.current.impressions.has(seller.key)) continue;
          state.current.impressions.add(seller.key);
          trackEvent("seller_offer_impression", { ...sellerParams(seller), source: SOURCE });
          if (state.current.belowFold.has(seller.key)) engage(seller.group);
        }
        observer.unobserve(entry.target);
      }
    }, { threshold: [0, 0.1, 0.5] });
    const observe = () => {
      captureInitialRows();
      if (!state.current.viewed) observer.observe(block);
      block.querySelectorAll<HTMLElement>("[data-seller-key]").forEach(row => {
        const key = row.dataset.sellerKey!;
        if (!state.current.impressions.has(key)) observer.observe(row);
      });
    };
    observe();
    // Recheck when a background tab becomes visible, even without a scroll.
    const onVisibility = () => { if (document.visibilityState === "visible") { observer.disconnect(); observe(); } };
    document.addEventListener("visibilitychange", onVisibility);
    return () => { observer.disconnect(); document.removeEventListener("visibilitychange", onVisibility); };
  }, [mpn, sellers, loading, sellerParams, engage]);

  const scrollStarts = useRef(new WeakMap<HTMLElement, number>());
  const onScroll = (element: HTMLElement, group: string) => {
    const start = scrollStarts.current.get(element) ?? 0;
    if (!scrollStarts.current.has(element)) scrollStarts.current.set(element, start);
    if (Math.abs(element.scrollTop - start) >= 48) engage(group);
  };
  const outbound = (seller: AttemptedSeller) => {
    const href = seller.offer && sellerHref(seller.offer);
    if (!href) return;
    const params = sellerParams(seller);
    delete (params as Partial<typeof params>).shipping_type;
    trackEvent("seller_outbound_click", { ...params, destination_domain: new URL(href, window.location.href).hostname, click_location: SOURCE });
    engage(seller.group);
  };
  const brandClick = (linkType: "text" | "logo") => trackEvent("part_sherpa_click", { mpn, click_location: "market_check_banner", destination_domain: "part-sherpa.com", link_type: linkType });
  const refreshClick = () => trackEvent("part_sherpa_market_check_refresh", { mpn, seller_count_total: sellers.length });
  return { blockRef, engage, onScroll, outbound, brandClick, refreshClick };
}
