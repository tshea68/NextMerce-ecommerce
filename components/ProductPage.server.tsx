import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import ProductPageClient, { type ProductVM } from "./ProductPage.client";

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

function getSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // IMPORTANT: server lookups must bypass RLS
  if (!supabaseUrl) {
    throw new Error("Missing env: NEXT_PUBLIC_SUPABASE_URL");
  }
  if (!serviceKey) {
    throw new Error(
      "Missing env: SUPABASE_SERVICE_ROLE_KEY (required for server-side product lookups). " +
        "Add it to .env.local and restart `npm run dev`."
    );
  }

  return createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function fetchPrimary(kind: Kind, slugRaw: string) {
  const supabase = getSupabase();

  const slug = normAlnum(slugRaw);
  const mpn_norm = normMpn(slug);
  if (!slug || !mpn_norm) return null;

  if (kind === "parts") {
    const cols =
      "id,mpn,title,price,image_url,brand,part_type,appliance_type,stock_status_canon,availability_rank,replaced_by,replaces_previous_parts,compatible_models";

    const { data, error } = await supabase
      .from("parts")
      .select(cols)
      .eq("mpn_normalized", mpn_norm)
      .maybeSingle();

    if (error) console.error("[ProductPageServer] parts lookup error", { slug, mpn_norm, error });
    if (!data) return null;

    return { source: "parts" as const, mpn_norm, row: data };
  }

  // OFFERS: canonical lookup is mpn_norm only (no listing_id required)
  const cols =
    "id,listing_id,mpn,title,price,image_url,brand,part_type,appliance_type,inventory_total,compatible_models";

  {
    const { data, error } = await supabase
      .from("offers")
      .select(cols)
      .eq("mpn_norm", mpn_norm)
      .order("inventory_total", { ascending: false, nullsFirst: false })
      .order("price", { ascending: false, nullsFirst: false })
      .limit(1)
      .maybeSingle();

    if (error) console.error("[ProductPageServer] offers mpn_norm lookup error", { slug, mpn_norm, error });
    if (data) return { source: "offers" as const, mpn_norm, row: data };
  }

  // Last-resort fallback for dirty rows: match mpn text
  {
    const like = `%${slug}%`;
    const { data, error } = await supabase
      .from("offers")
      .select(cols)
      .ilike("mpn", like)
      .order("inventory_total", { ascending: false, nullsFirst: false })
      .order("price", { ascending: false, nullsFirst: false })
      .limit(1)
      .maybeSingle();

    if (error) console.error("[ProductPageServer] offers ilike(mpn) lookup error", { slug, mpn_norm, error });
    if (!data) return null;

    return {
      source: "offers" as const,
      mpn_norm: normMpn(data?.mpn ?? slug),
      row: data,
    };
  }
}

async function fetchAlternates(mpn_norm: string) {
  const supabase = getSupabase();

  const partCols =
    "id,mpn,title,price,image_url,brand,part_type,appliance_type,stock_status_canon,availability_rank,replaced_by,replaces_previous_parts";
  const offerCols =
    "id,listing_id,mpn,title,price,image_url,brand,part_type,appliance_type,inventory_total";

  const [newPartRes, offersRes] = await Promise.all([
    supabase.from("parts").select(partCols).eq("mpn_normalized", mpn_norm).maybeSingle(),
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

export default async function ProductPageServer(props: { kind: Kind; slug: string }) {
  const primary = await fetchPrimary(props.kind, props.slug);
  if (!primary) notFound();

  const { newPart, refurbOffers } = await fetchAlternates(primary.mpn_norm);

  const vm: ProductVM = {
    kind: props.kind,
    mpn_norm: primary.mpn_norm,
    slug: props.slug,
    primary:
      primary.source === "parts"
        ? {
            source: "parts",
            id: String(primary.row.id),
            href: `/parts/${encodeURIComponent(primary.row.mpn ?? props.slug)}`,
            mpn: primary.row.mpn ?? null,
            title: primary.row.title ?? null,
            price: primary.row.price ?? null,
            image_url: primary.row.image_url ?? null,
            brand: primary.row.brand ?? null,
            part_type: primary.row.part_type ?? null,
            appliance_type: primary.row.appliance_type ?? null,
            in_stock: isPartInStock(primary.row.stock_status_canon, primary.row.availability_rank),
            inventory_total: null,
            stock_status_canon: primary.row.stock_status_canon ?? null,
            availability_rank: primary.row.availability_rank ?? null,
            replaced_by: primary.row.replaced_by ?? null,
            replaces_previous_parts: primary.row.replaces_previous_parts ?? null,
            compatible_models: primary.row.compatible_models ?? null,
          }
        : {
            source: "offers",
            id: String(primary.row.id),
            href: `/offers/${encodeURIComponent(primary.row.mpn ?? props.slug)}`,
            mpn: primary.row.mpn ?? null,
            title: primary.row.title ?? null,
            price: primary.row.price ?? null,
            image_url: primary.row.image_url ?? null,
            brand: primary.row.brand ?? null,
            part_type: primary.row.part_type ?? null,
            appliance_type: primary.row.appliance_type ?? null,
            in_stock: (Number(primary.row.inventory_total ?? 0) || 0) > 0,
            inventory_total: Number(primary.row.inventory_total ?? 0) || 0,
            stock_status_canon: null,
            availability_rank: null,
            replaced_by: null,
            replaces_previous_parts: null,
            compatible_models: primary.row.compatible_models ?? null,
            listing_id: primary.row.listing_id != null ? String(primary.row.listing_id) : null,
          },
    new_part: newPart
      ? {
          source: "parts",
          id: String(newPart.id),
          href: `/parts/${encodeURIComponent(newPart.mpn ?? props.slug)}`,
          mpn: newPart.mpn ?? null,
          title: newPart.title ?? null,
          price: newPart.price ?? null,
          image_url: newPart.image_url ?? null,
          brand: newPart.brand ?? null,
          part_type: newPart.part_type ?? null,
          appliance_type: newPart.appliance_type ?? null,
          in_stock: isPartInStock(newPart.stock_status_canon, newPart.availability_rank),
          inventory_total: null,
          stock_status_canon: newPart.stock_status_canon ?? null,
          availability_rank: newPart.availability_rank ?? null,
          replaced_by: newPart.replaced_by ?? null,
          replaces_previous_parts: newPart.replaces_previous_parts ?? null,
          compatible_models: null,
        }
      : null,
    refurb_offers: refurbOffers.map((o: any) => ({
      source: "offers",
      id: String(o.id),
      href: `/offers/${encodeURIComponent(o.mpn ?? props.slug)}`,
      mpn: o.mpn ?? null,
      title: o.title ?? null,
      price: o.price ?? null,
      image_url: o.image_url ?? null,
      brand: o.brand ?? null,
      part_type: o.part_type ?? null,
      appliance_type: o.appliance_type ?? null,
      in_stock: (Number(o.inventory_total ?? 0) || 0) > 0,
      inventory_total: Number(o.inventory_total ?? 0) || 0,
      stock_status_canon: null,
      availability_rank: null,
      replaced_by: null,
      replaces_previous_parts: null,
      compatible_models: null,
      listing_id: o.listing_id != null ? String(o.listing_id) : null,
    })),
  };

  return <ProductPageClient vm={vm} />;
}