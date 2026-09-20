"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { shouldPushSpaPageView } from "@/lib/spaPageView";

export default function GTMPageView() {
  const pathname = usePathname();
  const lastPathRef = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname || lastPathRef.current === pathname) return;

    const shouldPush = shouldPushSpaPageView(lastPathRef.current, pathname);
    lastPathRef.current = pathname;

    // The base Google tag owns the initial hard-load page_view. Only later
    // client-side pathname changes should trigger this SPA page_view.
    if (!shouldPush) return;

    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: "page_view",
      page_path: pathname,
      page_location: window.location.href,
      page_title: document.title,
    });

    console.log("GTM page_view pushed:", pathname);
  }, [pathname]);

  return null;
}
