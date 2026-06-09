export type LivePartResult = {
  run_id: number;
  run_created_at: string;
  searched_mpn: string;
  searched_mpn_norm: string;
  display_bucket: string | null;
  seller_key: string;
  relationship: string;
  relationship_rank: number | null;
  seller_rank: number | null;
  confidence_score: number | null;
  condition: string | null;
  stock_status: string | null;
  quantity: number | null;
  price: number | null;
  currency: string | null;
  matched_mpn: string | null;
  matched_mpn_norm: string | null;
  title: string | null;
  brand: string | null;
  part_type: string | null;
  image_url: string | null;
  product_url: string | null;
  source_url: string | null;
  evidence: string[] | null;
};

export type SourceHealth = {
  run_id: number;
  searched_mpn: string;
  searched_mpn_norm: string;
  run_created_at: string;
  seller_key: string;
  seller_name: string | null;
  status: string | null;
  candidate_count: number | null;
  parts_count: number | null;
  offers_count: number | null;
  http_status: string | null;
  fetch_ok: boolean | null;
  fetch_size: number | null;
  reason: string | null;
  url: string | null;
};

export type LivePartResponse = {
  searched_mpn: string;
  searched_mpn_norm: string;
  saved_run_id?: number;
  result_count: number;
  source_count?: number;
  results: LivePartResult[];
  sources?: SourceHealth[];
};

export type SourceHealthResponse = {
  searched_mpn: string;
  searched_mpn_norm: string;
  source_count: number;
  sources: SourceHealth[];
};

export type AiPartSummary = {
  headline: string;
  verdict:
    | "apg_in_stock"
    | "new_available"
    | "new_not_found_refurb_available"
    | "marketplace_supply_only"
    | "not_enough_evidence"
    | "source_issue";
  customer_message: string;
  confidence: "high" | "medium" | "low";
  cautions: string[];
  suggested_next_step: string;
};
