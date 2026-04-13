import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json(
      {
        ok: false,
        error: "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY/NEXT_PUBLIC_SUPABASE_ANON_KEY",
        items: [],
      },
      { status: 500 }
    );
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data, error } = await supabase
      .from("brand_logos")
      .select("brand, brand_long, image_url")
      .not("image_url", "is", null)
      .order("brand", { ascending: true });

    if (error) {
      return NextResponse.json(
        {
          ok: false,
          error: error.message,
          items: [],
        },
        { status: 500 }
      );
    }

    const items = (Array.isArray(data) ? data : [])
      .map((row: any) => ({
        name: row?.brand_long || row?.brand || "",
        src: row?.image_url || "",
      }))
      .filter((x) => x.src);

    return NextResponse.json(
      { ok: true, items },
      {
        headers: {
          "Cache-Control": "public, max-age=300, stale-while-revalidate=600",
        },
      }
    );
  } catch (e: any) {
    return NextResponse.json(
      {
        ok: false,
        error: String(e?.message || e || "Unknown error"),
        items: [],
      },
      { status: 500 }
    );
  }
}