import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function looksLikeMpn(value: string): boolean {
  const cleaned = value.trim();
  return /^[a-z0-9][a-z0-9._-]{2,}$/i.test(cleaned);
}

function copyTrackingParams(from: URLSearchParams, to: URLSearchParams) {
  for (const [key, value] of from.entries()) {
    const k = key.toLowerCase();

    if (
      k === "gclid" ||
      k === "gbraid" ||
      k === "wbraid" ||
      k.startsWith("utm_")
    ) {
      to.set(key, value);
    }
  }
}

export function GET(req: NextRequest) {
  const raw =
    req.nextUrl.searchParams.get("q") ||
    req.nextUrl.searchParams.get("query") ||
    req.nextUrl.searchParams.get("search") ||
    req.nextUrl.searchParams.get("mpn") ||
    "";

  const q = raw.trim();

  if (q && looksLikeMpn(q)) {
    const target = new URL(`/offers/${encodeURIComponent(q)}`, req.url);
    copyTrackingParams(req.nextUrl.searchParams, target.searchParams);
    return NextResponse.redirect(target, 307);
  }

  const target = new URL("/grid", req.url);

  if (q) {
    target.searchParams.set("q", q);
    target.searchParams.set("search", q);
    target.searchParams.set("mpn", q);
    target.searchParams.set("condition", "refurb");
  }

  copyTrackingParams(req.nextUrl.searchParams, target.searchParams);

  return NextResponse.redirect(target, 307);
}
