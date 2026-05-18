import type { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";

type Kind = "parts" | "offers";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  "https://www.appliancepartgeeks.com";

function clean(v: unknown): string {
  return String(v ?? "").trim();
}

function normAlnum(s: string) {
  return String(s ?? "").trim().replace(/[^A-Za-z0-9._-]+/g, "");
}

function normMpn(s: string) {
  return normAlnum(s).toLowerCase().replace(/[^a-z0-9]/g, "");
}

function titleCase(s: string) {
  return s
    .split(/\s+/)
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : w))
    .join(" ");
}

function getSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) return null;

  return createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function buildProductTitle(row: any, kind: Kind, fallbackMpn: string) {
  const mpn = clean(row?.mpn) || fallbackMpn;
  const brand = clean(row?.brand);
  const appliance = clean(row?.appliance_type);
  const partType = clean(row?.canonical_part_type) || clean(row?.part_type) || clean(row?.specific_part_type);

  const existing =
    clean(row?.title_display) ||
    clean(row?.feed_title) ||
    clean(row?.title);

  if (existing && existing.toLowerCase().includes(mpn.toLowerCase())) {
    return existing;
  }

  const pieces = [mpn, brand, appliance, partType].filter(Boolean);
  const base = pieces.length ? pieces.join(" ") : existing || mpn || "Appliance Part";

  return kind === "offers"
    ? `${base} | Refurbished OEM Appliance Part`
    : `${base} | Genuine OEM Appliance Part`;
}

function buildDescription(row: any, kind: Kind, productTitle: string) {
  const mpn = clean(row?.mpn);
  const brand = clean(row?.brand);
  const appliance = clean(row?.appliance_type);
  const partType = clean(row?.canonical_part_type) || clean(row?.part_type) || clean(row?.specific_part_type);

  const condition = kind === "offers" ? "refurbished OEM" : "genuine OEM";
  const bits = [mpn, brand, appliance, partType].filter(Boolean).join(" ");

  const base = bits || productTitle;

  if (kind === "offers") {
    return `Shop ${base}. Refurbished OEM appliance part with current price, availability, compatible model details, and replacement references.`;
  }

  return `Shop ${base}. Genuine OEM appliance part with current price, availability, compatible model details, and replacement references.`;
}

async function fetchProductForMetadata(kind: Kind, slugRaw: string) {
  const supabase = getSupabase();
  if (!supabase) return null;

  const slug = normAlnum(slugRaw);
  const mpn_norm = normMpn(slug);

  if (!slug || !mpn_norm) return null;

  if (kind === "parts") {
    const { data } = await supabase
      .from("parts")
      .select(
        "id,mpn,title,title_display,feed_title,price,image_url,brand,part_type,specific_part_type,canonical_part_type,appliance_type,stock_status_canon,availability_rank"
      )
      .eq("mpn_normalized", mpn_norm)
      .maybeSingle();

    return data ?? null;
  }

  const { data } = await supabase
    .from("offers")
    .select(
      "id,listing_id,mpn,title,title_display,feed_title,price,image_url,brand,part_type,canonical_part_type,appliance_type,inventory_total,mpn_norm"
    )
    .eq("mpn_norm", mpn_norm)
    .order("inventory_total", { ascending: false, nullsFirst: false })
    .order("price", { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle();

  return data ?? null;
}

export async function generateProductMetadata(kind: Kind, slugRaw: string): Promise<Metadata> {
  const row = await fetchProductForMetadata(kind, slugRaw);

  const fallbackMpn = decodeURIComponent(slugRaw || "").trim();
  const mpn = clean(row?.mpn) || fallbackMpn;
  const encodedMpn = encodeURIComponent(mpn);
  const path = kind === "offers" ? `/offers/${encodedMpn}` : `/parts/${encodedMpn}`;
  const canonicalUrl = `${SITE_URL.replace(/\/+$/, "")}${path}`;

  if (!row) {
    const fallbackTitle = `${fallbackMpn || titleCase(kind)} | Appliance Part Geeks`;

    return {
      title: fallbackTitle,
      description: `Shop ${fallbackMpn || "appliance parts"} at Appliance Part Geeks.`,
      alternates: { canonical: canonicalUrl },
      openGraph: {
        title: fallbackTitle,
        description: `Shop ${fallbackMpn || "appliance parts"} at Appliance Part Geeks.`,
        url: canonicalUrl,
        type: "website",
      },
    };
  }

  const productTitle = buildProductTitle(row, kind, mpn);
  const title = `${productTitle} | Appliance Part Geeks`;
  const description = buildDescription(row, kind, productTitle);
  const image = clean(row?.image_url);

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: "website",
      images: image ? [{ url: image, alt: productTitle }] : undefined,
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description,
      images: image ? [image] : undefined,
    },
  };
}
