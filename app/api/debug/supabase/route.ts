export const runtime = 'edge';

import { NextResponse } from "next/server";

export const dynamic = "force-dynamic"; // no caching

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

  return NextResponse.json({
    ok: true,
    url_set: !!url,
    url: url || null,
    anon_set: !!anon,
    anon_len: anon ? anon.length : 0,
    anon_prefix: anon ? anon.slice(0, 8) : null,
    anon_suffix: anon ? anon.slice(-8) : null,
    node_env: process.env.NODE_ENV,
    ts: new Date().toISOString(),
  });
}
