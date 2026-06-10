import Link from "next/link";
import type { ReactNode } from "react";

type PolicySection = {
  title: string;
  body: ReactNode;
};

type PolicyPageProps = {
  eyebrow?: string;
  title: string;
  intro: string;
  summary?: string[];
  sections: PolicySection[];
  updated?: string;
};

export default function PolicyPage({
  eyebrow,
  title,
  intro,
  summary = [],
  sections,
  updated,
}: PolicyPageProps) {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-12">
          {eyebrow ? (
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-orange-600">
              {eyebrow}
            </p>
          ) : null}

          <h1 className="text-4xl font-bold tracking-tight text-slate-950 md:text-5xl">
            {title}
          </h1>

          <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-700">
            {intro}
          </p>

          {updated ? (
            <p className="mt-4 text-sm text-slate-500">Last updated: {updated}</p>
          ) : null}
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-10">
        {summary.length ? (
          <div className="mb-8 rounded-2xl border border-orange-200 bg-orange-50 p-6">
            <h2 className="text-lg font-semibold text-slate-950">Quick summary</h2>
            <ul className="mt-4 grid gap-3 text-sm leading-6 text-slate-700 md:grid-cols-2">
              {summary.map((item) => (
                <li key={item} className="flex gap-3">
                  <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-orange-500" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="grid gap-5">
          {sections.map((section) => (
            <section
              key={section.title}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <h2 className="text-xl font-semibold text-slate-950">
                {section.title}
              </h2>
              <div className="mt-3 text-sm leading-7 text-slate-700">
                {section.body}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-950 p-6 text-white">
          <h2 className="text-xl font-semibold">Still have questions?</h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
            Contact Appliance Part Geeks before ordering if you need help with
            shipping, pickup availability, part identification, or compatibility.
          </p>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/contact"
              className="rounded-lg bg-orange-400 px-4 py-2 text-center text-sm font-semibold text-slate-950 hover:bg-orange-300"
            >
              Contact Us
            </Link>
            <Link
              href="/returns"
              className="rounded-lg border border-white/20 px-4 py-2 text-center text-sm font-semibold text-white hover:border-orange-300 hover:text-orange-200"
            >
              Return Policy
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
