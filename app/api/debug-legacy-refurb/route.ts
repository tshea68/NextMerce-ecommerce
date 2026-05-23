import { NextResponse } from "next/server";

const API_BASE = "https://api.appliancepartgeeks.com";

export const dynamic = "force-dynamic";

export async function GET() {
  const url =
    `${API_BASE}/api/legacy/refurb-redirect?path=21253&offer=` +
    encodeURIComponent("v1|205143632857|505859457688");

  const started = Date.now();

  try {
    const res = await fetch(url, {
      cache: "no-store",
    });

    const text = await res.text();

    return NextResponse.json({
      ok: res.ok,
      status: res.status,
      elapsed_ms: Date.now() - started,
      url,
      body: text.slice(0, 2000),
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        ok: false,
        elapsed_ms: Date.now() - started,
        url,
        error_name: err?.name,
        error_message: err?.message,
      },
      { status: 500 }
    );
  }
}
