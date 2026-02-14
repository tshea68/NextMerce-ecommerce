"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function TopLoader() {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    setLoading(true);
    setProgress(0);

    let value = 0;
    const interval = setInterval(() => {
      value += 10;
      if (value >= 90) clearInterval(interval);
      setProgress(value);
    }, 100);

    return () => clearInterval(interval);
  }, [pathname]);

  useEffect(() => {
    if (progress >= 90) {
      const timeout = setTimeout(() => {
        setProgress(100);
        setTimeout(() => setLoading(false), 200);
      }, 150);

      return () => clearTimeout(timeout);
    }
  }, [progress]);

  if (!loading) return null;

  return (
    <div className="fixed top-0 left-0 w-full z-99999">
      <div
        className="h-2 bg-blue-700 transition-all duration-300"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
