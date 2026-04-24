import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const result: any = {
    hasSupabaseUrl: !!supabaseUrl,
    hasSupabaseAnonKey: !!supabaseKey,
    offersCount: null,
    offersSample: null,
    offersError: null,
  };

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json(result);
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false },
  });

  const { count, error: countError } = await supabase
    .from("offers")
    .select("*", { count: "exact", head: true })
    .gt("price", 0)
    .gt("inventory_total", 0)
    .not("mpn_norm", "is", null);

  result.offersCount = count;
  result.offersError = countError
    ? {
        message: countError.message,
        details: countError.details,
        hint: countError.hint,
        code: countError.code,
      }
    : null;

  const { data, error: sampleError } = await supabase
    .from("offers")
    .select("mpn, mpn_norm, price, inventory_total")
    .gt("price", 0)
    .gt("inventory_total", 0)
    .not("mpn_norm", "is", null)
    .limit(5);

  result.offersSample = data;
  result.sampleError = sampleError
    ? {
        message: sampleError.message,
        details: sampleError.details,
        hint: sampleError.hint,
        code: sampleError.code,
      }
    : null;

  return NextResponse.json(result);
}
