export type PartRow = {
  kind?: "part";
  id?: string | number;
  mpn?: string | null;
  title?: string | null;
  title_display?: string | null;
  feed_title?: string | null;
  brand?: string | null;
  appliance_type?: string | null;
  part_type?: string | null;
  specific_part_type?: string | null;
  canonical_part_type?: string | null;
  price?: number | string | null;
  image_url?: string | null;
  stock_status?: string | null;
  stock_status_canon?: string | null;
  compatible_models?: string[] | string | null;
  compatible_brands?: string | null;
  replaces_previous_parts?: string[] | string | null;
  replaced_by?: string | null;
  alternatives_count?: number | null;
  refurb_count?: number | null;
  href?: string | null;
};

export type ModelRow = {
  kind?: "model";
  model_number?: string | null;
  brand?: string | null;
  appliance_type?: string | null;
  image_url?: string | null;
  brand_logo_url?: string | null;
  total_parts?: number | null;
  priced_parts?: number | null;
  href?: string | null;
};

export type OfferRow = {
  kind?: "offer";
  id?: string | number;
  mpn?: string | null;
  title?: string | null;
  title_display?: string | null;
  feed_title?: string | null;
  brand?: string | null;
  appliance_type?: string | null;
  part_type?: string | null;
  canonical_part_type?: string | null;
  price?: number | string | null;
  image_url?: string | null;
  compatible_brands?: string | null;
  inventory_total?: number | null;
  marketplace?: string | null;
  href?: string | null;
};

export type GridRow = PartRow | ModelRow | OfferRow;