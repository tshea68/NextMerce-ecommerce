import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function money(v: any) {
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

export default async function ShopPage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold">Shop</h1>
        <p className="mt-2 text-red-600">
          Missing NEXT_PUBLIC_SUPABASE_URL and (ANON_KEY or PUBLISHABLE_KEY)
        </p>
      </div>
    );
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Start simple + fast: priced items, order by price desc, no count.
  const { data, error } = await supabase
    .from("parts")
    .select("id, mpn, mpn_normalized, title, price, image_url, stock_status_canon, reliable_total_available")
    .not("price", "is", null)
    .order("price", { ascending: false })
    .limit(48);

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold">Shop</h1>
        <p className="mt-2 text-red-600">Supabase error: {error.message}</p>
      </div>
    );
  }

  const rows = data ?? [];

  return (
    <div className="p-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Your Parts</h1>
          <p className="text-sm text-gray-500 mt-1">
            Showing {rows.length} priced items (ordered by price desc)
          </p>
        </div>
        <Link className="text-sm underline" href="/api/supabase-test?table=parts">
          debug: count parts
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {rows.map((p: any) => {
          const slug = (p.mpn_normalized || p.mpn || "").toString();
          return (
            <Link
              key={p.id}
              href={`/product/${encodeURIComponent(slug)}`}
              className="rounded-lg border p-4 hover:shadow-sm transition"
            >
              <div className="aspect-square w-full bg-gray-50 rounded-md overflow-hidden flex items-center justify-center">
                {p.image_url ? (
                  // use <img> to avoid next/image remote domain config right now
                  <img src={p.image_url} alt={p.title ?? p.mpn ?? "Part"} className="h-full w-full object-contain" />
                ) : (
                  <div className="text-xs text-gray-400">No image</div>
                )}
              </div>

              <div className="mt-3">
                <div className="text-xs text-gray-500">MPN: {p.mpn ?? "—"}</div>
                <div className="font-medium leading-snug line-clamp-2 mt-1">
                  {p.title ?? p.mpn ?? p.mpn_normalized ?? "Untitled"}
                </div>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <div className="font-semibold">{money(p.price)}</div>
                  <div className="text-xs text-gray-500">
                    {p.stock_status_canon ?? "—"}
                  </div>
                </div>
                <div className="mt-1 text-xs text-gray-500">
                  avail: {p.reliable_total_available ?? "—"}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
