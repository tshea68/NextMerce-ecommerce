import React from "react";
import Link from "next/link";

type InfoPageLayoutProps = {
  title: string;
  children: React.ReactNode;
};

export default function InfoPageLayout({
  title,
  children,
}: InfoPageLayoutProps) {
  return (
    <main className="w-full bg-white text-slate-900">
      <div className="mx-auto max-w-4xl px-6 pt-8 pb-3 md:px-8 md:pt-10 md:pb-4">
        <div className="mb-4">
          <Link
            href="/grid"
            className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            ← Back to Search Grid
          </Link>
        </div>

        <h1 className="mb-4 text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
          {title}
        </h1>

        <div className="max-h-[500px] overflow-y-auto pr-3 pb-1">
          <div className="max-w-none text-slate-900 [&_h2]:mt-6 [&_h2]:mb-2 [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:text-slate-900 [&_p]:mb-3 [&_p]:leading-7 [&_p]:text-slate-800 [&_ul]:mb-3 [&_ul]:list-disc [&_ul]:pl-6 [&_li]:mb-1 [&_li]:text-slate-800 [&_a]:text-blue-700 [&_a]:underline">
            {children}
          </div>
        </div>
      </div>
    </main>
  );
}