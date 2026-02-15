import { Suspense } from "react";
import PartsExplorer from "./PartsExplorer.client";

export default function GridPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm opacity-70">Loading…</div>}>
      <div className="p-6 font-bold">GRID DEBUG: GridPage renders</div>
      <PartsExplorer />
    </Suspense>
  );
}
