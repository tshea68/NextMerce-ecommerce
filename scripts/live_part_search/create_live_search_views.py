#!/usr/bin/env python3
import os
import psycopg

dsn = os.getenv("DATABASE_URL") or os.getenv("PG_DSN") or os.getenv("SUPABASE_DB_URL")
if not dsn:
    raise SystemExit("Missing DATABASE_URL / PG_DSN / SUPABASE_DB_URL")

sql = """
create or replace view public.live_part_search_mega_view as
select
  r.id as run_id,
  r.created_at as run_created_at,
  r.searched_mpn,
  r.searched_mpn_norm,
  r.run_source,

  c.id as candidate_id,
  c.seller_key,
  c.source_layer,

  c.matched_mpn,
  c.matched_mpn_norm,
  c.relationship,
  c.confidence_score,

  c.title,
  c.brand,
  c.part_type,

  c.price,
  c.currency,
  c.condition,
  c.stock_status,
  c.quantity,

  c.image_url,
  c.product_url,
  c.source_url,

  c.evidence,
  c.raw_candidate_json,
  c.is_best_candidate,

  c.created_at as candidate_created_at

from public.live_part_search_runs r
join public.live_part_search_candidates c
  on c.run_id = r.id;


create or replace view public.live_part_search_latest_runs as
select distinct on (searched_mpn_norm)
  id as run_id,
  searched_mpn,
  searched_mpn_norm,
  run_source,
  created_at as run_created_at
from public.live_part_search_runs
order by searched_mpn_norm, created_at desc, id desc;


create or replace view public.live_part_search_latest_best_candidates as
select
  mv.*
from public.live_part_search_mega_view mv
join public.live_part_search_latest_runs lr
  on lr.run_id = mv.run_id
where mv.is_best_candidate = true;


create or replace view public.live_part_search_source_health_latest as
select
  lr.run_id,
  lr.searched_mpn,
  lr.searched_mpn_norm,
  lr.run_created_at,
  sh.seller_key,
  sh.seller_name,
  sh.status,
  sh.candidate_count,
  sh.parts_count,
  sh.offers_count,
  sh.http_status,
  sh.fetch_ok,
  sh.fetch_size,
  sh.reason,
  sh.url,
  sh.raw_source_json
from public.live_part_search_latest_runs lr
join public.live_part_source_health sh
  on sh.run_id = lr.run_id;
"""

with psycopg.connect(dsn) as conn:
    with conn.cursor() as cur:
        cur.execute(sql)
    conn.commit()

print("created live search views")
