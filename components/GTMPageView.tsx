"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { shouldPushSpaPageView } from "@/lib/spaPageView";

export default function GTMPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastRouteRef = useRef<string | null>(null);
  const search = searchParams?.toString() ?? "";
  const route = search ? `${pathname}?${search}` : pathname;

  useEffect(() => {
    if (!route || lastRouteRef.current === route) return;

    const shouldPush = shouldPushSpaPageView(lastRouteRef.current, route);
    lastRouteRef.current = route;

    // The base Google tag owns the initial hard-load page_view. Only later
    // client-side route changes should trigger this SPA page_view.
    if (!shouldPush) return;

    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: "page_view",
      page_path: pathname,
      page_location: window.location.href,
      page_title: document.title,
    });

    console.log("GTM page_view pushed:", pathname);
  }, [pathname, route]);

  return null;
}
