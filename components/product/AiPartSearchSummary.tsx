"use client";

import { useMemo, useState } from "react";
import type {
  LivePartResult,
  SourceHealthResponse,
} from "@/types/live-part-search";
import { money, isOemDistributor, isUsedLike, sourceCount } from "@/lib/live-part-search";

type Props = {
  mpn: string;
  results: LivePartResult[];
  sources: SourceHealthResponse | null;
};

function normMpn(value: string | null | undefined) {
  return (value || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function buildReadout(mpn: string, results: LivePartResult[], sources: SourceHealthResponse | null) {
  const mpnNorm = normMpn(mpn);

  const apgRows = results.filter((row) => row.seller_key === "apg_internal");
  const oemRows = results.filter((row) => isOemDistributor(row));
  const ebayRows = results.filter((row) => row.seller_key === "ebay");
  const marketplaceRefurbRows = ebayRows.filter((row) => isUsedLike(row));

  const exactRows = results.filter((row) => {
    return row.relationship === "exact_match" || normMpn(row.matched_mpn) === mpnNorm;
  });

  const replacementRows = results.filter((row) => {
    return (
      row.relationship === "replacement_match" ||
      (row.display_bucket || "").toLowerCase().includes("replacement")
    );
  });

  const bestApg = [...apgRows].sort((a, b) => (a.price ?? 999999999) - (b.price ?? 999999999))[0] || null;
  const bestOem = [...oemRows].sort((a, b) => (a.price ?? 999999999) - (b.price ?? 999999999))[0] || null;
  const bestRefurb = [...marketplaceRefurbRows].sort((a, b) => (a.price ?? 999999999) - (b.price ?? 999999999))[0] || null;

  const ebayCandidateCount = sourceCount(sources, "ebay");

  let headline = "Not enough evidence to make a strong availability call.";
  let confidence: "high" | "medium" | "low" = "low";

  if (bestApg && bestOem) {
    headline = "APG has this MPN, and a monitored new/OEM source also appears to have it.";
    confidence = "high";
  } else if (bestApg && bestRefurb) {
    headline = "APG/refurbished supply looks available; new/OEM was not found in the displayed rows.";
    confidence = "medium";
  } else if (bestOem) {
    headline = "A monitored new/OEM source appears to have this MPN.";
    confidence = "high";
  } else if (bestRefurb) {
    headline = "Marketplace/refurb supply was found, but APG/OEM supply is limited.";
    confidence = "medium";
  }

  const relationshipSentence = replacementRows.length && !exactRows.length
    ? `The strongest relationship signal for ${mpn} appears to be a known replacement match, not a clean same-MPN result.`
    : exactRows.length
      ? `The relationship data includes an exact-MPN signal for ${mpn}.`
      : `The relationship data did not produce a strong exact-MPN signal for ${mpn}.`;

  const apgSentence = bestApg
    ? `APG shows an internal result at ${money(bestApg.price, bestApg.currency || "USD")}${
        bestApg.quantity !== null && bestApg.quantity !== undefined
          ? ` with quantity ${bestApg.quantity}`
          : ""
      }.`
    : "APG did not show an internal result in the displayed rows.";

  const oemSentence = bestOem
    ? `A monitored new/OEM source returned an exact result at ${money(bestOem.price, bestOem.currency || "USD")}.`
    : "The displayed monitored new/OEM rows did not show an exact available source.";

  const refurbSentence = bestRefurb
    ? `Refurbished marketplace supply was detected${
        ebayCandidateCount ? ` with ${ebayCandidateCount} eBay candidates reviewed` : ""
      }; the best observed refurb price was ${money(bestRefurb.price, bestRefurb.currency || "USD")}.`
    : "Refurbished marketplace supply was not clearly detected in the displayed rows.";

  return {
    headline,
    confidence,
    message: `${relationshipSentence} ${apgSentence} ${oemSentence} ${refurbSentence} This does not prove the part is or is not available everywhere; it only summarizes APG's displayed monitored-source result.`,
    cautions: [
      "Confirm the full model number from the appliance tag before ordering.",
      "If possible, confirm the printed number on the old part.",
    ],
  };
}

export default function AiPartSearchSummary({ mpn, results, sources }: Props) {
  const [open, setOpen] = useState(false);

  const readout = useMemo(() => {
    return buildReadout(mpn, results, sources);
  }, [mpn, results, sources]);

  return (
    <section className="rounded-lg border border-orange-200 bg-orange-50 px-3 py-3">
      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-sm font-black uppercase tracking-wide text-slate-900">
            Parts Geek AI Readout
          </h2>
          <p className="mt-1 text-xs text-slate-700">
            Summarizes the verified APG, OEM, replacement, and marketplace signals from this run.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="rounded-md bg-slate-950 px-3 py-2 text-xs font-black uppercase tracking-wide text-white hover:bg-orange-600"
        >
          {open ? "Hide Readout" : "Generate Readout"}
        </button>
      </div>

      {open ? (
        <div className="mt-3 rounded-md border border-orange-200 bg-white px-3 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="text-sm font-black text-slate-950">{readout.headline}</div>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-black uppercase text-slate-600">
              {readout.confidence} confidence
            </span>
          </div>

          <p className="mt-2 text-sm leading-6 text-slate-700">
            {readout.message}
          </p>

          <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-slate-600">
            {readout.cautions.map((caution) => (
              <li key={caution}>{caution}</li>
            ))}
          </ul>

          <div className="mt-3 rounded-md bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700">
            Next step: Use the fit check to confirm this MPN against the appliance model before ordering.
          </div>
        </div>
      ) : null}
    </section>
  );
}
