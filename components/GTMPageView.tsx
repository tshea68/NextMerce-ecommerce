"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

declare global {
  interface Window {
    dataLayer: Array<Record<string, unknown>>;
  }
}

export default function GTMPageView() {
  const pathname = usePathname();
  const lastPathRef = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname || lastPathRef.current === pathname) return;

    lastPathRef.current = pathname;

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