import Link from "next/link";

export const metadata = {
  title: "Contact Appliance Part Geeks | Appliance Parts Support",
  description:
    "Contact Appliance Part Geeks for help with new and refurbished OEM appliance replacement parts, shipping, returns, and rare part requests.",
};

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <section className="border-b border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950">
        <div className="mx-auto max-w-5xl px-4 py-14">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-amber-300">
            Contact Appliance Part Geeks
          </p>

          <h1 className="max-w-4xl text-4xl font-bold tracking-tight text-white md:text-5xl">
            Need help finding or ordering an appliance part?
          </h1>

          <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">
            Contact us for help with new and refurbished OEM appliance replacement
            parts, order questions, shipping, returns, or hard-to-find part requests.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-12">
        <div className="grid gap-8 md:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
              <h2 className="text-2xl font-semibold text-white">Customer support</h2>

              <div className="mt-5 space-y-4 text-sm leading-7 text-slate-300">
                <p>
                  <span className="font-semibold text-slate-100">Email:</span>{" "}
                  <a
                    href="mailto:support@appliancepartgeeks.com"
                    className="text-amber-300 hover:text-amber-200"
                  >
                    support@appliancepartgeeks.com
                  </a>
                </p>

                <p>
                  <span className="font-semibold text-slate-100">Phone:</span>{" "}
                  <a href="tel:2028821699" className="text-amber-300 hover:text-amber-200">
                    202-882-1699
                  </a>
                </p>

                <p>
                  <span className="font-semibold text-slate-100">Support address:</span>{" "}
                  6101 Blair Rd NW Suite C, Washington, DC 20011
                </p>

                <p>
                  <span className="font-semibold text-slate-100">Support hours:</span>{" "}
                  Monday through Friday, 9:00 AM to 5:00 PM Eastern Time
                </p>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
              <h2 className="text-2xl font-semibold text-white">Before you contact us</h2>

              <div className="mt-4 space-y-4 text-sm leading-7 text-slate-300">
                <p>
                  For the fastest help, please include the manufacturer part number,
                  appliance model number, brand, and a short description of the issue or
                  part you are trying to replace.
                </p>

                <p>
                  If you are contacting us about an order, include your order number and
                  the email address used at checkout.
                </p>
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
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
                  Submit Rare Part Request
                </Link>
              </div>
            </section>
          </div>

          <aside className="space-y-4">
            <div className="rounded-2xl border border-amber-400/30 bg-amber-400/10 p-5">
              <h2 className="text-lg font-semibold text-amber-200">What we sell</h2>
              <p className="mt-3 text-sm leading-7 text-slate-200">
                Appliance Part Geeks sells new and refurbished OEM appliance replacement
                parts. Product condition is clearly labeled before purchase.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
              <h2 className="text-lg font-semibold text-white">Helpful links</h2>
              <ul className="mt-4 space-y-3 text-sm">
                <li>
                  <Link href="/shipping" className="text-slate-300 hover:text-amber-300">
                    Shipping Policy
                  </Link>
                </li>
                <li>
                  <Link href="/returns" className="text-slate-300 hover:text-amber-300">
                    Return & Refund Policy
                  </Link>
                </li>
                <li>
                  <Link href="/cancel" className="text-slate-300 hover:text-amber-300">
                    Cancellation Policy
                  </Link>
                </li>
                <li>
                  <Link href="/find-model-number" className="text-slate-300 hover:text-amber-300">
                    How to Find Your Model Number
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="text-slate-300 hover:text-amber-300">
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
              <h2 className="text-lg font-semibold text-white">
                Independent seller disclosure
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                Manufacturer names, brand names, model numbers, and part numbers are used
                only for identification and compatibility. Appliance Part Geeks is an
                independent seller and is not affiliated with, sponsored by, or endorsed
                by the listed appliance manufacturers.
              </p>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
