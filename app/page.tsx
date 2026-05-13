import { Suspense } from "react";
import PartsExplorer from "@/app/grid/PartsExplorer.client";
import HomeHeroRebuild from "@/components/home/HomeHeroRebuild";
import { getHeroLogos } from "@/lib/home/getHeroLogos";

export const metadata = {
  title: "Appliance Part Geeks",
  description:
    "The largest selection of new and refurbished OEM appliance parts anywhere.",
};

export default async function HomePage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = (await searchParams) ?? {};
  const heroLogos = await getHeroLogos();

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <main className="flex-grow">
        <HomeHeroRebuild heroLogos={heroLogos} />

        <section className="bg-white py-6">
          <div className="mx-auto w-[96%] max-w-[1500px] rounded-[2rem] border border-slate-200 bg-slate-50/80 p-4 shadow-sm">
            <Suspense fallback={null}>
              <PartsExplorer
                initial={{
                  condition:
                    typeof sp.condition === "string" ? sp.condition : "refurb",
                  availability:
                    typeof sp.availability === "string"
                      ? sp.availability
                      : "all",
                  q: typeof sp.q === "string" ? sp.q : "",
                  applianceType:
                    typeof sp.appliance_type === "string"
                      ? sp.appliance_type
                      : "",
                  brands: [],
                  partTypes: [],
                  page: 1,
                  perPage: 30,
                }}
              />
            </Suspense>
          </div>
        </section>
      </main>
    </div>
  );
}
