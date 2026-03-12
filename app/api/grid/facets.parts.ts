// app/api/grid/facets.parts.ts
export type FacetRow = { value: string; count: number };
export type Facets = {
  brands?: FacetRow[];
  parts?: FacetRow[];
  appliances?: FacetRow[];
};

export type Availability = "in_stock" | "orderable" | "all";

export type PartsFacetArgs = {
  q?: string | null;
  availability?: Availability;
  appliance_type?: string | null;
  brands?: string[];
  part_types?: string[];
  facet_limit?: number; // optional, default handled in SQL
};

function uniq(arr: string[] | undefined | null) {
  return Array.from(new Set((arr || []).map((s) => String(s || "").trim()).filter(Boolean)));
}

function toFacetRows(v: any): FacetRow[] {
  if (!Array.isArray(v)) return [];
  return v
    .map((x) => ({
      value: String(x?.value ?? "").trim(),
      count: Number(x?.count ?? 0),
    }))
    .filter((x) => x.value && Number.isFinite(x.count));
}

/**
 * Requires a Supabase SQL function:
 *   public.grid_facets_parts(p_q text, p_availability text, p_appliance_type text, p_brands text[], p_part_types text[], p_facet_limit int)
 * returning jsonb with keys: brands, parts, appliances
 *
 * NOTE:
 * p_part_types should now apply against canonical_part_type on the SQL side.
 */
export async function fetchPartsFacets(sb: any, args: PartsFacetArgs): Promise<Facets> {
  const payload = {
    p_q: (args.q || "").trim() || null,
    p_availability: args.availability || "all",
    p_appliance_type: (args.appliance_type || "").trim() || null,
    p_brands: uniq(args.brands),
    p_part_types: uniq(args.part_types),
    p_facet_limit: Number.isFinite(Number(args.facet_limit)) ? Number(args.facet_limit) : 20,
  };

  const r = await sb.rpc("grid_facets_parts", payload);
  if (r?.error) return {};

  const data = r?.data || {};
  return {
    brands: toFacetRows(data.brands),
    parts: toFacetRows(data.parts),
    appliances: toFacetRows(data.appliances),
  };
}

export async function fetchPartsTotalCount(sb: any, args: PartsFacetArgs): Promise<number | null> {
  // Count parts under the SAME filter semantics (best-effort match to the SQL function).
  let q = sb.from("parts").select("id", { count: "exact", head: true });

  const appliance_type = (args.appliance_type || "").trim();
  if (appliance_type) q = q.eq("appliance_type", appliance_type);

  const brands = uniq(args.brands);
  if (brands.length) q = q.in("brand", brands);

  const partTypes = uniq(args.part_types);
  if (partTypes.length) q = q.in("canonical_part_type", partTypes);

  const term = (args.q || "").trim();
  if (term) {
    const t = term.replace(/[%]/g, ""); // avoid wildcard injection; keep it simple
    // PostgREST OR syntax
    q = q.or(
      [
        `mpn.ilike.%${t}%`,
        `mpn_display.ilike.%${t}%`,
        `mpn_normalized.ilike.%${t}%`,
        `name.ilike.%${t}%`,
        `title.ilike.%${t}%`,
        `model_number.ilike.%${t}%`,
      ].join(",")
    );
  }

  // Availability is messy for parts (OEM) depending on your schema.
  // If you DO have stock_status_canon, this is a reasonable first pass.
  const availability = args.availability || "all";
  if (availability !== "all") {
    if (availability === "in_stock") {
      q = q.ilike("stock_status_canon", "%in stock%");
    } else if (availability === "orderable") {
      // “orderable” = not obviously NLA-ish (very conservative)
      q = q.not("stock_status_canon", "ilike", "%nla%").not("stock_status_canon", "ilike", "%discontinu%");
    }
  }

  const r = await q;
  if (r?.error) return null;
  const c = (r as any)?.count;
  return Number.isFinite(Number(c)) ? Number(c) : null;
}

export function mergeFacets(a?: Facets | null, b?: Facets | null): Facets {
  const out: Facets = {};

  function mergeKey(key: keyof Facets) {
    const map = new Map<string, number>();

    const add = (rows?: FacetRow[]) => {
      for (const r of rows || []) {
        const k = String(r.value || "").trim();
        if (!k) continue;
        const n = Number(r.count || 0);
        map.set(k, (map.get(k) || 0) + (Number.isFinite(n) ? n : 0));
      }
    };

    add(a?.[key] as any);
    add(b?.[key] as any);

    const rows = Array.from(map.entries())
      .map(([value, count]) => ({ value, count }))
      .sort((x, y) => (y.count === x.count ? x.value.localeCompare(y.value) : y.count - x.count));

    (out as any)[key] = rows;
  }

  mergeKey("brands");
  mergeKey("parts");
  mergeKey("appliances");

  return out;
}