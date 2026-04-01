import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import ProductPageClient, { type ProductVM } from "./ProductPage.client";
import { resolveKeyPartFields } from "@/lib/product-detail-fields";

type Kind = "parts" | "offers";

type BrandMeta = {
  image_url: string | null;
  label: string | null;
};

function normAlnum(s: string) {
  return String(s ?? "").trim().replace(/[^A-Za-z0-9._-]+/g, "");
}

function normMpn(s: string) {
  return normAlnum(s).toLowerCase().replace(/[^a-z0-9]/g, "");
}

function isPartInStock(stock_status_canon: any, availability_rank: any) {
  const r = Number(availability_rank);
  if (Number.isFinite(r)) return r === 1 || r === 2;

  const s = String(stock_status_canon ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");

  if (!s) return true;
  return s === "in_stock" || s === "available" || s === "instock";
}

function looksLikeListingId(s: string) {
  const x = String(s ?? "").trim();
  if (!x) return false;
  return /^\d{8,20}$/.test(x);
}

function cleanStr(v: any) {
  return String(v ?? "").trim();
}

function brandNorm(v: any) {
  return cleanStr(v).toLowerCase();
}

function normalizeArray(v: any): string[] {
  if (v == null) return [];

  if (Array.isArray(v)) {
    return Array.from(new Set(v.map((x) => cleanStr(x)).filter(Boolean)));
  }

  const s = cleanStr(v);
  if (!s) return [];

  if (s.startsWith("[") && s.endsWith("]")) {
    try {
      const parsed = JSON.parse(s);
      if (Array.isArray(parsed)) {
        return Array.from(new Set(parsed.map((x) => cleanStr(x)).filter(Boolean)));
      }
    } catch {}
  }

  return Array.from(
    new Set(
      s
        .split(/[,|\n]+/)
        .map((x) => x.trim())
        .filter(Boolean)
    )
  );
}

function toTitleCase(s: string) {
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

async function fetchPrimary(kind: Kind, slugRaw: string) {
  const supabase = getSupabase();
  if (!supabase) return null;

  const slug = normAlnum(slugRaw);
  const mpn_norm = normMpn(slug);

  if (!slug || !mpn_norm) return null;

  if (kind === "parts") {
    const cols =
      "id,mpn,title,title_display,feed_title,price,image_url,brand,part_type,specific_part_type,canonical_part_type,appliance_type,stock_status_canon,availability_rank,replaced_by,replaces_previous_parts,compatible_models,compatible_brands";

    const { data } = await supabase
      .from("parts")
      .select(cols)
      .eq("mpn_normalized", mpn_norm)
      .maybeSingle();

    if (!data) return null;

    return {
      source: "parts" as const,
      mpn_norm,
      row: data,
    };
  }

  const cols =
    "id,listing_id,mpn,title,price,image_url,brand,part_type,appliance_type,inventory_total,compatible_models,compatible_brands";

  if (looksLikeListingId(slug)) {
    const { data } = await supabase
      .from("offers")
      .select(cols)
      .eq("listing_id", slug)
      .maybeSingle();

    if (data) {
      return {
        source: "offers" as const,
        mpn_norm: normMpn(data?.mpn ?? slug),
        row: data,
      };
    }
  }

  const { data } = await supabase
    .from("offers")
    .select(cols)
    .eq("mpn_norm", mpn_norm)
    .order("inventory_total", { ascending: false, nullsFirst: false })
    .order("price", { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle();

  if (!data) return null;

  return {
    source: "offers" as const,
    mpn_norm,
    row: data,
  };
}

async function fetchAlternates(mpn_norm: string) {
  const supabase = getSupabase();
  if (!supabase) return { newPart: null as any, refurbOffers: [] as any[] };

  const partCols =
    "id,mpn,title,title_display,feed_title,price,image_url,brand,part_type,specific_part_type,canonical_part_type,appliance_type,stock_status_canon,availability_rank,replaced_by,replaces_previous_parts,compatible_models,compatible_brands";
  const offerCols =
    "id,listing_id,mpn,title,price,image_url,brand,part_type,appliance_type,inventory_total,compatible_models,compatible_brands";

  const [newPartRes, offersRes] = await Promise.all([
    supabase
      .from("parts")
      .select(partCols)
      .eq("mpn_normalized", mpn_norm)
      .maybeSingle(),
    supabase
      .from("offers")
      .select(offerCols)
      .eq("mpn_norm", mpn_norm)
      .gt("price", 0)
      .order("inventory_total", { ascending: false, nullsFirst: false })
      .order("price", { ascending: false, nullsFirst: false })
      .limit(8),
  ]);

  return {
    newPart: newPartRes?.data ?? null,
    refurbOffers: Array.isArray(offersRes?.data) ? offersRes.data : [],
  };
}

async function fetchBrandMetaMap(brands: string[]) {
  const supabase = getSupabase();
  if (!supabase) return new Map<string, BrandMeta>();

  const norms = Array.from(new Set(brands.map((b) => brandNorm(b)).filter(Boolean)));
  if (!norms.length) return new Map<string, BrandMeta>();

  const { data } = await supabase
    .from("brand_logos")
    .select("brand_norm,brand,brand_long,image_url")
    .in("brand_norm", norms);

  const map = new Map<string, BrandMeta>();
  for (const row of data || []) {
    const k = cleanStr(row?.brand_norm).toLowerCase();
    if (!k) continue;

    const image_url = cleanStr(row?.image_url) || null;
    const label =
      cleanStr((row as any)?.brand_long) ||
      cleanStr((row as any)?.brand) ||
      (k ? toTitleCase(k) : null);

    map.set(k, { image_url, label: label || null });
  }

  return map;
}

export default async function ProductPageServer(props: { kind: Kind; slug: string }) {
  const primary = await fetchPrimary(props.kind, props.slug);
  if (!primary) notFound();

  const { newPart, refurbOffers } = await fetchAlternates(primary.mpn_norm);
  const primaryRow = primary.row;

  const brandCandidates = [
    primaryRow?.brand,
    newPart?.brand,
    ...((refurbOffers || []).map((o: any) => o?.brand)),
    ...normalizeArray(newPart?.compatible_brands),
    ...normalizeArray(primaryRow?.compatible_brands),
  ]
    .map((x) => cleanStr(x))
    .filter(Boolean);

  const brandMetaMap = await fetchBrandMetaMap(brandCandidates);

  const getBrandLogoUrl = (brand: any) => {
    const norm = brandNorm(brand);
    return norm ? brandMetaMap.get(norm)?.image_url ?? null : null;
  };

  const toDisplayBrand = (brand: any) => {
    const raw = cleanStr(brand);
    if (!raw) return null;

    const norm = brandNorm(raw);
    const mapped = norm ? brandMetaMap.get(norm)?.label ?? null : null;
    if (mapped) return mapped;

    return toTitleCase(raw);
  };

  const effectiveOffer = primary.source === "offers" ? primaryRow : null;
  const effectivePart = primary.source === "parts" ? primaryRow : newPart;

  const detailFields = resolveKeyPartFields({
    kind: primary.source === "offers" ? "offer" : "part",
    primary: primaryRow,
    matchedPart: effectivePart ?? null,
  });

  // Identity: always the route/primary record first.
  const displayMpn =
    cleanStr(primaryRow?.mpn) ||
    cleanStr(props.slug);

  // Enrichment only.
  const brand =
    cleanStr(primaryRow?.brand) ||
    cleanStr(effectivePart?.brand) ||
    null;

  const applianceType =
    cleanStr(primaryRow?.appliance_type) ||
    cleanStr(effectivePart?.appliance_type) ||
    null;

  const specificPartType =
    cleanStr(effectivePart?.specific_part_type) ||
    null;

  const partType =
    cleanStr(
      primary.source === "offers"
        ? effectivePart?.part_type ??
            effectivePart?.canonical_part_type ??
            primaryRow?.part_type
        : primaryRow?.part_type ??
            primaryRow?.canonical_part_type ??
            effectivePart?.part_type ??
            effectivePart?.canonical_part_type
    ) || null;

  const rawCompatibleBrands = normalizeArray(
    effectivePart?.compatible_brands ?? primaryRow?.compatible_brands
  );

  const compatibleBrands = Array.from(
    new Set(
      rawCompatibleBrands
        .map((b) => toDisplayBrand(b))
        .filter((b): b is string => Boolean(b))
    )
  );

  // Simple breadcrumb: Home / MPN
  const breadcrumb_items = [
    { label: "Home", href: "/" },
    ...(displayMpn ? [{ label: displayMpn }] : []),
  ];

  const vm: ProductVM = {
    mpn: displayMpn || null,
    part_number: displayMpn || null,

    // For offers: do NOT pass parts-table title_display/feed_title through.
    // Let the client helper build a clean title from the offer identity + enrichment.
    title:
      primary.source === "offers"
        ? null
        : cleanStr(primaryRow?.title) || null,

    title_display:
      primary.source === "parts"
        ? cleanStr(primaryRow?.title_display) || null
        : null,

    feed_title:
      primary.source === "parts"
        ? cleanStr(primaryRow?.feed_title) || null
        : null,

    description: null,

    brand,
    brand_logo_url: getBrandLogoUrl(brand),
    appliance_type: applianceType,
    specific_part_type: specificPartType,
    part_type: partType,

    image_url:
      cleanStr(primaryRow?.image_url) ||
      cleanStr(effectivePart?.image_url) ||
      null,

    price:
      primary.source === "offers"
        ? effectiveOffer?.price ?? effectivePart?.price ?? null
        : primaryRow?.price ?? effectiveOffer?.price ?? null,

    is_refurb: primary.source === "offers",
    condition: primary.source === "offers" ? "Refurbished" : "Genuine OEM",

    stock_status_canon: effectivePart?.stock_status_canon ?? null,
    availability_rank: effectivePart?.availability_rank ?? null,
    inventory_total:
      primary.source === "offers"
        ? Number(effectiveOffer?.inventory_total ?? 0) || 0
        : null,

    compatible_models: detailFields.compatible_models,
    compatible_models_count: detailFields.compatible_models.length,
    compatible_brands: compatibleBrands,

    replaces_previous_parts: detailFields.replaces_previous_parts,
    replaced_by: detailFields.replaced_by,

    weight: null,
    dimensions: null,
    alternate_numbers: [],

    breadcrumb_items,

    reliable: null,
  };

  return <ProductPageClient vm={vm} />;
}