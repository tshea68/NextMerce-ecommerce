import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function asBool(v: string | null) {
  if (!v) return false;
  const s = v.toLowerCase().trim();
  return s === "1" || s === "true" || s === "yes";
}

function safeIdent(s: string) {
  // allow snake_case-ish column/table names only
  return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(s);
}

type CountMode = "none" | "exact" | "planned" | "estimated";

function parseCountMode(v: string | null, defaultMode: CountMode): CountMode {
  if (!v) return defaultMode;
  const s = v.toLowerCase().trim();
  if (s === "none" || s === "0" || s === "false") return "none";
  if (s === "exact") return "exact";
  if (s === "planned") return "planned";
  if (s === "estimated") return "estimated";
  return defaultMode;
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);

    const table = url.searchParams.get("table") ?? "parts";
    if (!safeIdent(table)) {
      return NextResponse.json(
        { ok: false, error: `Invalid table name: ${table}` },
        { status: 400 }
      );
    }

    const sample = asBool(url.searchParams.get("sample"));
    const priced = asBool(url.searchParams.get("priced"));
    const hasImage = asBool(url.searchParams.get("has_image"));

    const limitParam = url.searchParams.get("limit");
    const limit = Math.min(
      Math.max(parseInt(limitParam ?? "1", 10) || 1, 1),
      50
    ); // 1..50

    const colsParam = (url.searchParams.get("cols") ?? "").trim();
    const colsList = colsParam
      ? colsParam
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : [];

    for (const c of colsList) {
      if (!safeIdent(c)) {
        return NextResponse.json(
          { ok: false, error: `Invalid column name in cols=: ${c}` },
          { status: 400 }
        );
      }
    }

    const orderBy = (url.searchParams.get("order_by") ?? "").trim();
    if (orderBy && !safeIdent(orderBy)) {
      return NextResponse.json(
        { ok: false, error: `Invalid order_by column: ${orderBy}` },
        { status: 400 }
      );
    }

    const orderDirRaw = (url.searchParams.get("order_dir") ?? "asc")
      .toLowerCase()
      .trim();
    const ascending = orderDirRaw !== "desc";

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey =
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Missing NEXT_PUBLIC_SUPABASE_URL and (ANON_KEY or PUBLISHABLE_KEY)",
        },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // -------- COUNT ONLY (fast-ish; supports count modes) --------
    if (!sample) {
      const countMode = parseCountMode(url.searchParams.get("count"), "exact");

      // For count-only, keep the payload small: select("id") with head=true.
      // If countMode=none, don't request a count at all.
      const opts =
        countMode === "none"
          ? ({ head: true } as const)
          : ({ head: true, count: countMode } as const);

      let q = supabase.from(table).select("id", opts);

      if (priced) q = q.not("price", "is", null);
      if (hasImage) q = q.not("image_url", "is", null);

      const { error, count } = await q;

      return NextResponse.json({
        ok: !error,
        table,
        count: countMode === "none" ? null : count ?? null,
        count_mode: countMode,
        filters: { priced, has_image: hasImage },
        error: error?.message ?? null,
      });
    }

    // -------- SAMPLE ROWS (count OPTIONAL to avoid timeouts) --------
    // Default for samples is count=none. If you want it:
    //   &count=exact  (or planned/estimated)
    const countMode = parseCountMode(url.searchParams.get("count"), "none");

    const selectCols = colsList.length ? colsList.join(",") : "*";

    let q =
      countMode === "none"
        ? supabase.from(table).select(selectCols)
        : supabase.from(table).select(selectCols, { count: countMode });

    if (priced) q = q.not("price", "is", null);
    if (hasImage) q = q.not("image_url", "is", null);

    if (orderBy) {
      q = q.order(orderBy, { ascending });
    }

    q = q.limit(limit);

    const { data, error, count } = await q;

    return NextResponse.json({
      ok: !error,
      table,
      count: countMode === "none" ? null : count ?? null,
      count_mode: countMode,
      limit,
      cols: colsList.length ? colsList : null,
      order_by: orderBy || null,
      order_dir: orderBy ? (ascending ? "asc" : "desc") : null,
      filters: { priced, has_image: hasImage },
      sample: data ?? null,
      error: error?.message ?? null,
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? String(e) },
      { status: 500 }
    );
  }
}
