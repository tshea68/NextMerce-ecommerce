import Link from "next/link";

export const metadata = {
  title: "About Appliance Part Geeks | New & Refurbished OEM Appliance Parts",
  description:
    "Learn about Appliance Part Geeks, an independent seller of new and refurbished OEM appliance replacement parts.",
};

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <section className="border-b border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950">
        <div className="mx-auto max-w-5xl px-4 py-14">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-amber-300">
            About Appliance Part Geeks
          </p>

          <h1 className="max-w-4xl text-4xl font-bold tracking-tight text-white md:text-5xl">
            Helping customers find the right appliance part without replacing the whole machine.
          </h1>

          <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">
            Appliance Part Geeks sells new and refurbished OEM appliance replacement
            parts for refrigerators, washers, dryers, dishwashers, ranges, and other
            home appliances. Customers can shop by model number, manufacturer part
            number, brand, appliance type, or part type.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-12">
        <div className="grid gap-8 md:grid-cols-[1.4fr_0.9fr]">
          <div className="space-y-8">
            <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
              <h2 className="text-2xl font-semibold text-white">
                Built from the parts counter up
              </h2>

              <div className="mt-4 space-y-4 text-sm leading-7 text-slate-300">
                <p>
                  Our founder, Derek Gould, has been in the appliance repair and parts
                  business since landing his first job at a large appliance repair store
                  and service center in the Washington, D.C. area at the age of 14.
                </p>

                <p>
                  Over the years, Derek saw household appliances become increasingly
                  electronic and expensive to repair. As more machines began relying on
                  control boards, user interfaces, sensors, switches, and other electronic
                  components, he recognized that many appliances could be saved if the
                  right OEM part could be found at a reasonable price.
                </p>

                <p>
                  Derek began recovering valuable electronic components from appliances
                  that would otherwise be discarded, testing and reselling usable OEM
                  parts to help customers avoid unnecessary appliance replacement. That
                  practical, hands-on parts experience grew into multiple appliance-parts
                  businesses focused on hard-to-find, used, and refurbished OEM replacement
                  parts.
                </p>

                <p>
                  Today, Derek&apos;s companies operate one of the largest online inventories
                  of refurbished appliance parts, helping homeowners, repair professionals,
                  and resellers keep more appliances running and more usable parts out of
                  the scrap pile.
                </p>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
              <h2 className="text-2xl font-semibold text-white">
                New and refurbished OEM parts
              </h2>

              <div className="mt-4 space-y-4 text-sm leading-7 text-slate-300">
                <p>
                  Our catalog includes new parts sourced through established parts
                  suppliers and refurbished or used OEM parts sourced through
                  appliance-parts resale partners. Product condition is clearly labeled
                  so shoppers can understand whether they are viewing a new part or a
                  refurbished/used OEM part before they buy.
                </p>

                <p>
                  Some customers want a new OEM replacement part. Others need a
                  refurbished OEM option because the new part is expensive, hard to find,
                  or no longer readily available. Appliance Part Geeks makes those options
                  easier to compare before ordering.
                </p>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
              <h2 className="text-2xl font-semibold text-white">
                Independent seller disclosure
              </h2>

              <div className="mt-4 space-y-4 text-sm leading-7 text-slate-300">
                <p>
                  Appliance Part Geeks is an independent seller of appliance replacement
                  parts. Manufacturer names, brand names, model numbers, and part numbers
                  are used only for identification and compatibility.
                </p>

                <p>
                  Appliance Part Geeks is not affiliated with, sponsored by, or endorsed
                  by the listed appliance manufacturers.
                </p>
              </div>
            </section>
          </div>

          <aside className="space-y-4">
            <div className="rounded-2xl border border-amber-400/30 bg-amber-400/10 p-5">
              <h2 className="text-lg font-semibold text-amber-200">Our mission</h2>
              <p className="mt-3 text-sm leading-7 text-slate-200">
                Make appliance repairs more accessible and affordable by helping
                customers find the right replacement part at the right price.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
              <h2 className="text-lg font-semibold text-white">What we sell</h2>
              <ul className="mt-3 space-y-2 text-sm text-slate-300">
                <li>New OEM appliance replacement parts</li>
                <li>Refurbished and used OEM appliance parts</li>
                <li>Hard-to-find electronic appliance components</li>
                <li>Parts searchable by MPN and model number</li>
              </ul>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
              <h2 className="text-lg font-semibold text-white">Need help?</h2>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                Search by part number or model number, or send us a rare part request
                if you cannot find what you need.
              </p>

              <div className="mt-5 flex flex-col gap-3">
                <Link
                  href="/grid"
                  className="rounded-lg bg-amber-400 px-4 py-2 text-center text-sm font-semibold text-slate-950 hover:bg-amber-300"
                >
                  Browse Parts
                </Link>
                <Link
                  href="/rare-part-request"
                  className="rounded-lg border border-slate-700 px-4 py-2 text-center text-sm font-semibold text-slate-100 hover:border-amber-300 hover:text-amber-200"
                >
                  Rare Part Request
                </Link>
                <Link
                  href="/contact"
                  className="rounded-lg border border-slate-700 px-4 py-2 text-center text-sm font-semibold text-slate-100 hover:border-amber-300 hover:text-amber-200"
                >
                  Contact Us
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
