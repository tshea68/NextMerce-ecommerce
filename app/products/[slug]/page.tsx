export const runtime = "edge";

import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function norm(s: string) {
  return s.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}

function money(v: any) {
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

type PageParams = { slug: string };
type Props = { params: Promise<PageParams> };

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;

  const slugRaw = (() => {
    try {
      return decodeURIComponent(slug ?? "").trim();
    } catch {
      return String(slug ?? "").trim();
    }
  })();

  if (!slugRaw) return notFound();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold">Product</h1>
        <p className="mt-2 text-red-600">
          Missing NEXT_PUBLIC_SUPABASE_URL and (ANON_KEY or PUBLISHABLE_KEY)
        </p>
      </div>
    );
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  let part: any = null;

  // Try exact mpn first
  {
    const { data } = await supabase
      .from("parts")
      .select(
        "id, mpn, mpn_normalized, title, description, price, image_url, stock_status_canon, reliable_total_available, reliable_part_url, brand_code, brand"
      )
      .eq("mpn", slugRaw)
      .limit(1);

    if (data?.length) part = data[0];
  }

  // Fallback to mpn_normalized
  if (!part) {
    const key = norm(slugRaw);
    const { data } = await supabase
      .from("parts")
      .select(
        "id, mpn, mpn_normalized, title, description, price, image_url, stock_status_canon, reliable_total_available, reliable_part_url, brand_code, brand"
      )
      .eq("mpn_normalized", key)
      .limit(1);

    if (data?.length) part = data[0];
  }

  if (!part) return notFound();

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between gap-4">
        <Link href="/shop" className="text-sm underline">
          ← Back to shop
        </Link>
        <Link
          href={`/api/supabase-test?table=parts&sample=1&limit=1&cols=id,mpn,title,price`}
          className="text-sm underline"
        >
          debug
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-lg border p-4 bg-white">
          <div className="aspect-square w-full bg-gray-50 rounded-md overflow-hidden flex items-center justify-center">
            {part.image_url ? (
              <img
                src={part.image_url}
                alt={part.title ?? part.mpn ?? "Part"}
                className="h-full w-full object-contain"
              />
            ) : (
              <div className="text-xs text-gray-400">No image</div>
            )}
          </div>
        </div>

        <div className="rounded-lg border p-4 bg-white">
          <div className="text-sm text-gray-500">
            {part.brand_code ? `Brand code: ${part.brand_code}` : null}
          </div>

          <h1 className="text-2xl font-semibold mt-2">
            {part.title ?? part.mpn ?? part.mpn_normalized}
          </h1>

          <div className="mt-2 text-sm text-gray-600">
            MPN: <span className="font-mono">{part.mpn ?? "—"}</span>
            {part.mpn_normalized ? (
              <>
                {" "}
                • norm: <span className="font-mono">{part.mpn_normalized}</span>
              </>
            ) : null}
          </div>

          <div className="mt-4 flex items-center justify-between gap-3">
            <div className="text-2xl font-bold">{money(part.price)}</div>
            <div className="text-sm text-gray-600">{part.stock_status_canon ?? "—"}</div>
          </div>

          <div className="mt-2 text-sm text-gray-600">
            reliable_total_available: {part.reliable_total_available ?? "—"}
          </div>

          {part.description ? (
            <div className="mt-4">
              <div className="text-sm font-semibold">Description</div>
              <p className="mt-1 text-sm text-gray-700 whitespace-pre-line">
                {part.description}
              </p>
            </div>
          ) : null}

          {part.reliable_part_url ? (
            <div className="mt-4">
              <a className="text-sm underline" href={part.reliable_part_url} target="_blank" rel="noreferrer">
                Source link
              </a>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
