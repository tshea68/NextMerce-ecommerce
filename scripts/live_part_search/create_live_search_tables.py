#!/usr/bin/env python3
import os
import psycopg

dsn = os.getenv("DATABASE_URL") or os.getenv("PG_DSN") or os.getenv("SUPABASE_DB_URL")
if not dsn:
    raise SystemExit("Missing DATABASE_URL / PG_DSN / SUPABASE_DB_URL")

sql = """
create table if not exists public.live_part_search_runs (
  id bigserial primary key,
  searched_mpn text not null,
  searched_mpn_norm text not null,
  run_source text default 'cli',
  created_at timestamptz default now()
);

create table if not exists public.live_part_source_health (
  id bigserial primary key,
  run_id bigint references public.live_part_search_runs(id) on delete cascade,
  seller_key text not null,
  seller_name text,
  status text,
  candidate_count integer,
  parts_count integer,
  offers_count integer,
  http_status text,
  fetch_ok boolean,
  fetch_size integer,
  reason text,
  url text,
  raw_source_json jsonb,
  created_at timestamptz default now()
);

create table if not exists public.live_part_search_candidates (
  id bigserial primary key,
  run_id bigint references public.live_part_search_runs(id) on delete cascade,

  seller_key text not null,
  source_layer text,

  searched_mpn text not null,
  searched_mpn_norm text not null,

  matched_mpn text,
  matched_mpn_norm text,

  relationship text,
  confidence_score integer,

  title text,
  brand text,
  part_type text,

  price numeric,
  currency text default 'USD',
  condition text,
  stock_status text,
  quantity integer,

  image_url text,
  product_url text,
  source_url text,

  evidence jsonb,
  raw_candidate_json jsonb,

  is_best_candidate boolean default false,

  created_at timestamptz default now()
);

create index if not exists idx_live_part_search_runs_mpn_norm
  on public.live_part_search_runs (searched_mpn_norm);

create index if not exists idx_live_part_search_candidates_run_id
  on public.live_part_search_candidates (run_id);

create index if not exists idx_live_part_search_candidates_searched_norm
  on public.live_part_search_candidates (searched_mpn_norm);

create index if not exists idx_live_part_search_candidates_matched_norm
  on public.live_part_search_candidates (matched_mpn_norm);

create index if not exists idx_live_part_search_candidates_seller
  on public.live_part_search_candidates (seller_key);

create index if not exists idx_live_part_source_health_run_id
  on public.live_part_source_health (run_id);
"""

with psycopg.connect(dsn) as conn:
    with conn.cursor() as cur:
        cur.execute(sql)
    conn.commit()

print("created live part search tables")
