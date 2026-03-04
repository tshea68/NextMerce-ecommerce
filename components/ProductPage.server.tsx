import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import ProductPageClient, { type ProductVM, type ProductCardVM } from "./ProductPage.client";

type Kind = "parts" | "offers";

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

function asStrArr(v: any): string[] {
  if (!v) return [];
  if (Array.isArray(v)) return v.map((x) => String(x).trim()).filter(Boolean);
  if (typeof v === "string") {
    const s = v.trim();
    if (!s) return [];
    if (s.startsWith("[") && s.endsWith("]")) {
      try {
        const j = JSON.parse(s);
        if (Array.isArray(j)) return j.map((x) => String(x).trim()).filter(Boolean);
      } catch {
        /* ignore */
      }
    }
    return s.split(",").map((x) => x.trim()).filter(Boolean);
  }
  return [];
}

function firstModelFromCompatible(v: any) {
  const arr = asStrArr(v);
  return arr[0] ? String(arr[0]).trim() : "";
}

function getSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) return null;

  return createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function isMissingCol(err: any, col: string) {
  const msg = String(err?.message ?? "");
  return msg.toLowerCase().includes(col.toLowerCase()) && msg.toLowerCase().includes("does not exist");
}

const PARTS_COLS =
  "id,mpn,title,feed_title,price,image_url,brand,part_type,appliance_type,compatible_brands,stock_status_canon,availability_rank,replaced_by,replaces_previous_parts,compatible_models";

const OFFERS_COLS_WITH_COMPAT =
  "id,listing_id,mpn,title,feed_title,price,image_url,brand,part_type,appliance_type,inventory_total,compatible_models,compatible_brands";

const OFFERS_COLS_BASE =
  "id,listing_id,mpn,title,feed_title,price,image_url,brand,part_type,appliance_type,inventory_total,compatible_models";

async function selectOffersMaybe<T>(builderWith: () => Promise<any>, builderWithout: () => Promise<any>) {
  const r1 = await builderWith();
  if (r1?.error && isMissingCol(r1.error, "compatible_brands")) {
    return builderWithout();
  }
  return r1;
}

async function fetchPrimary(kind: Kind, slugRaw: string) {
  const supabase = getSupabase();
  if (!supabase) return null;

  const slug = normAlnum(slugRaw);
  const mpn_norm = normMpn(slug);
  if (!slug || !mpn_norm) return null;

  if (kind === "parts") {
    const { data } = await supabase.from("parts").select(PARTS_COLS).eq("mpn_normalized", mpn_norm).maybeSingle();
    if (!data) return null;
    return { source: "parts" as const, mpn_norm, row: data };
  }

  // offers (canonical: by mpn_norm)
  {
    const res = await selectOffersMaybe(
      () =>
        supabase
          .from("offers")
          .select(OFFERS_COLS_WITH_COMPAT)
          .eq("mpn_norm", mpn_norm)
          .order("inventory_total", { ascending: false, nullsFirst: false })
          .order("price", { ascending: false, nullsFirst: false })
          .limit(1)
          .maybeSingle(),
      () =>
        supabase
          .from("offers")
          .select(OFFERS_COLS_BASE)
          .eq("mpn_norm", mpn_norm)
          .order("inventory_total", { ascending: false, nullsFirst: false })
          .order("price", { ascending: false, nullsFirst: false })
          .limit(1)
          .maybeSingle()
    );

    if (res?.data) return { source: "offers" as const, mpn_norm, row: res.data };
  }

  // fallback: mpn text match (handles missing mpn_norm rows)
  {
    const like = `%${slug}%`;

    const res = await selectOffersMaybe(
      () =>
        supabase
          .from("offers")
          .select(OFFERS_COLS_WITH_COMPAT)
          .ilike("mpn", like)
          .order("inventory_total", { ascending: false, nullsFirst: false })
          .order("price", { ascending: false, nullsFirst: false })
          .limit(1)
          .maybeSingle(),
      () =>
        supabase
          .from("offers")
          .select(OFFERS_COLS_BASE)
          .ilike("mpn", like)
          .order("inventory_total", { ascending: false, nullsFirst: false })
          .order("price", { ascending: false, nullsFirst: false })
          .limit(1)
          .maybeSingle()
    );

    if (!res?.data) return null;
    return { source: "offers" as const, mpn_norm: normMpn(res.data?.mpn ?? slug), row: res.data };
  }
}

async function fetchAlternates(mpn_norm: string) {
  const supabase = getSupabase();
  if (!supabase) return { newPart: null as any, refurbOffers: [] as any[] };

  const [newPartRes, offersRes] = await Promise.all([
    supabase.from("parts").select(PARTS_COLS).eq("mpn_normalized", mpn_norm).maybeSingle(),
    selectOffersMaybe(
      () =>
        supabase
          .from("offers")
          .select(OFFERS_COLS_WITH_COMPAT)
          .eq("mpn_norm", mpn_norm)
          .gt("price", 0)
          .order("inventory_total", { ascending: false, nullsFirst: false })
          .order("price", { ascending: false, nullsFirst: false })
          .limit(8),
      () =>
        supabase
          .from("offers")
          .select(OFFERS_COLS_BASE)
          .eq("mpn_norm", mpn_norm)
          .gt("price", 0)
          .order("inventory_total", { ascending: false, nullsFirst: false })
          .order("price", { ascending: false, nullsFirst: false })
          .limit(8)
    ),
  ]);

  return {
    newPart: newPartRes?.data ?? null,
    refurbOffers: Array.isArray(offersRes?.data) ? offersRes.data : [],
  };
}

async function fetchCompatibleBrandsFromParts(mpn_norm: string) {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data } = await supabase.from("parts").select("compatible_brands").eq("mpn_normalized", mpn_norm).maybeSingle();
  return data?.compatible_brands ?? null;
}

function mapToCard(row: any, source: "parts" | "offers"): ProductCardVM {
  const mpn = row?.mpn ? String(row.mpn) : "";
  return {
    source,
    id: String(row?.id),
    href: `/${source}/${encodeURIComponent(mpn || "")}`,
    mpn: mpn || null,

    title: row?.title ?? null,
    feed_title: row?.feed_title ?? null,

    price: row?.price ?? null,
    image_url: row?.image_url ?? null,

    brand: row?.brand ?? null,
    part_type: row?.part_type ?? null,
    appliance_type: row?.appliance_type ?? null,

    compatible_brands: row?.compatible_brands ?? null,
    compatible_models: row?.compatible_models ?? null,

    in_stock:
      source === "offers"
        ? (Number(row?.inventory_total ?? 0) || 0) > 0
        : isPartInStock(row?.stock_status_canon, row?.availability_rank),

    inventory_total: source === "offers" ? Number(row?.inventory_total ?? 0) || 0 : null,

    stock_status_canon: source === "parts" ? row?.stock_status_canon ?? null : null,
    availability_rank: source === "parts" ? row?.availability_rank ?? null : null,

    replaced_by: source === "parts" ? row?.replaced_by ?? null : null,
    replaces_previous_parts: source === "parts" ? row?.replaces_previous_parts ?? null : null,

    listing_id: source === "offers" ? (row?.listing_id != null ? String(row.listing_id) : null) : null,
  };
}

async function fetchSameModelGallery(args: {
  kind: Kind;
  excludeId: string;
  model: string;
  brand?: string | null;
  appliance_type?: string | null;
}) {
  const supabase = getSupabase();
  if (!supabase) return [] as ProductCardVM[];

  const { kind, excludeId, model } = args;

  if (model) {
    try {
      if (kind === "offers") {
        const cols = "id,listing_id,mpn,title,feed_title,price,image_url,brand,part_type,appliance_type,inventory_total,compatible_models";
        const { data, error } = await supabase
          .from("offers")
          .select(cols)
          .neq("id", excludeId)
          .contains("compatible_models", [model])
          .gt("price", 0)
          .order("inventory_total", { ascending: false, nullsFirst: false })
          .order("price", { ascending: false, nullsFirst: false })
          .limit(3);

        if (!error && Array.isArray(data) && data.length) return data.map((r) => mapToCard(r, "offers"));
      } else {
        const cols = "id,mpn,title,feed_title,price,image_url,brand,part_type,appliance_type,stock_status_canon,availability_rank,compatible_models";
        const { data, error } = await supabase
          .from("parts")
          .select(cols)
          .neq("id", excludeId)
          .contains("compatible_models", [model])
          .order("availability_rank", { ascending: true, nullsFirst: false })
          .order("price", { ascending: false, nullsFirst: false })
          .limit(3);

        if (!error && Array.isArray(data) && data.length) return data.map((r) => mapToCard(r, "parts"));
      }
    } catch {
      /* fall through */
    }
  }

  const brand = String(args.brand ?? "").trim();
  const appliance_type = String(args.appliance_type ?? "").trim();
  if (!brand && !appliance_type) return [];

  if (kind === "offers") {
    const cols = "id,listing_id,mpn,title,feed_title,price,image_url,brand,part_type,appliance_type,inventory_total,compatible_models";
    let q = supabase.from("offers").select(cols).neq("id", excludeId).gt("price", 0);

    if (brand) q = q.eq("brand", brand);
    if (appliance_type) q = q.eq("appliance_type", appliance_type);

    const { data } = await q
      .order("inventory_total", { ascending: false, nullsFirst: false })
      .order("price", { ascending: false, nullsFirst: false })
      .limit(3);

    return Array.isArray(data) ? data.map((r) => mapToCard(r, "offers")) : [];
  } else {
    const cols = "id,mpn,title,feed_title,price,image_url,brand,part_type,appliance_type,stock_status_canon,availability_rank,compatible_models";
    let q = supabase.from("parts").select(cols).neq("id", excludeId);

    if (brand) q = q.eq("brand", brand);
    if (appliance_type) q = q.eq("appliance_type", appliance_type);

    const { data } = await q
      .order("availability_rank", { ascending: true, nullsFirst: false })
      .order("price", { ascending: false, nullsFirst: false })
      .limit(3);

    return Array.isArray(data) ? data.map((r) => mapToCard(r, "parts")) : [];
  }
}

/**
 * Used by:
 * - app/offers/[mpn]/page.tsx generateMetadata()
 * - app/parts/[mpn]/page.tsx generateMetadata()
 */
export async function getProductSeo(kind: Kind, slug: string): Promise<{ title: string; description: string } | null> {
  const primary = await fetchPrimary(kind, slug);
  if (!primary) return null;

  const row: any = primary.row;
  const mpn = String(row?.mpn ?? slug ?? "").trim();
  const brand = String(row?.brand ?? "").trim();
  const appliance = String(row?.appliance_type ?? "").trim();
  const partType = String(row?.part_type ?? "").trim();
  const priceNum = Number(row?.price);

  const conditionLabel = kind === "offers" ? "Refurbished" : "New";

  const builtTitle = String(row?.feed_title ?? "").trim();
  const rawTitle = String(row?.title ?? "").trim();

  const title = builtTitle || rawTitle || [conditionLabel, mpn, brand, appliance, partType].filter(Boolean).join(" – ");

  const priceBit = Number.isFinite(priceNum) && priceNum > 0 ? ` Priced at $${priceNum.toFixed(2)}.` : "";
  const descCore = partType || "appliance part";
  const forBrand = brand ? ` for ${brand}` : "";
  const forAppl = appliance ? ` ${appliance}` : "";
  const description = `${conditionLabel} ${descCore}${forBrand}${forAppl}. OEM replacement part details, fit help, and availability.${priceBit}`;

  return { title, description };
}

export default async function ProductPageServer(props: { kind: Kind; slug: string }) {
  const primary = await fetchPrimary(props.kind, props.slug);
  if (!primary) notFound();

  const { newPart, refurbOffers } = await fetchAlternates(primary.mpn_norm);

  const hasOpposing = props.kind === "offers" ? !!newPart : (refurbOffers?.length ?? 0) > 0;

  const modelForGallery =
    firstModelFromCompatible(primary.row?.compatible_models) ||
    firstModelFromCompatible(newPart?.compatible_models) ||
    firstModelFromCompatible(refurbOffers?.[0]?.compatible_models);

  const related_same_model = hasOpposing
    ? []
    : await fetchSameModelGallery({
        kind: props.kind,
        excludeId: String(primary.row.id),
        model: modelForGallery,
        brand: primary.row?.brand ?? null,
        appliance_type: primary.row?.appliance_type ?? null,
      });

  let primaryCard =
    primary.source === "parts" ? mapToCard(primary.row, "parts") : mapToCard(primary.row, "offers");

  // If offers table isn't populated yet (or missing), fall back to parts compatible_brands.
  if (primaryCard.source === "offers") {
    const have = asStrArr(primaryCard.compatible_brands).length > 0;
    if (!have) {
      const fromNewPart = newPart?.compatible_brands ?? null;
      const fromParts = fromNewPart ?? (await fetchCompatibleBrandsFromParts(primary.mpn_norm));
      if (fromParts) primaryCard = { ...primaryCard, compatible_brands: fromParts };
    }
  }

  const vm: ProductVM = {
    kind: props.kind,
    mpn_norm: primary.mpn_norm,
    slug: props.slug,
    primary: primaryCard,
    new_part: newPart ? mapToCard(newPart, "parts") : null,
    refurb_offers: Array.isArray(refurbOffers) ? refurbOffers.map((o: any) => mapToCard(o, "offers")) : [],
    related_same_model,
  };

  return <ProductPageClient vm={vm} />;
}