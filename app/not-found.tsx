import { Suspense } from "react";
import PartsExplorer from "@/app/grid/PartsExplorer.client";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <main className="flex-grow">
        <section className="relative">
          <div className="h-6" />

          <div className="mx-auto w-[90%] max-w-[1200px]">
            <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-black shadow-sm">
              <div className="text-sm font-semibold text-amber-800">
                This page no longer exists.
              </div>
              <div className="mt-1 text-sm text-black/70">
                Try using our search tool below to find the part or model you need.
              </div>
            </div>

            <div className="border-t border-white/10 mb-4" />

            <Suspense fallback={null}>
              <PartsExplorer
                initial={{
                  condition: "refurb",
                  availability: "all",
                  q: "",
                  applianceType: "",
                  brands: [],
                  partTypes: [],
                  page: 1,
                  perPage: 30,
                }}
              />
            </Suspense>
          </div>

          <div className="pb-10" />
        </section>
      </main>
    </div>
  );
}
