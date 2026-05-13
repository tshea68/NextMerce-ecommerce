#!/usr/bin/env python3
import os
import psycopg

dsn = os.getenv("DATABASE_URL") or os.getenv("PG_DSN") or os.getenv("SUPABASE_DB_URL")
if not dsn:
    raise SystemExit("Missing DATABASE_URL / PG_DSN / SUPABASE_DB_URL")

sql = """
create or replace view public.live_part_search_latest_display as
select
  *,
  case relationship
    when 'exact_match' then 10
    when 'exact_sku_but_catalog_conflict' then 20
    when 'variant_suffix_match' then 30
    when 'title_match_sku_conflict' then 40
    when 'replacement_match' then 50
    when 'superseded_match' then 60
    when 'related_match' then 70
    when 'partial_match' then 80
    else 99
  end as relationship_rank,

  case seller_key
    when 'apg_internal' then 10
    when 'genuinereplacementparts' then 20
    when 'samsungparts' then 30
    when 'lgparts' then 40
    else 90
  end as seller_rank,

  case
    when condition = 'refurbished' and stock_status = 'in_stock' then 'APG refurbished in stock'
    when relationship = 'exact_match' then 'External exact match'
    when relationship = 'exact_sku_but_catalog_conflict' then 'Exact SKU, catalog conflict'
    when relationship = 'variant_suffix_match' then 'Suffix variant / possible alternate'
    when relationship = 'title_match_sku_conflict' then 'Title match, SKU conflict'
    else relationship
  end as display_bucket

from public.live_part_search_latest_best_candidates;
"""

with psycopg.connect(dsn) as conn:
    with conn.cursor() as cur:
        cur.execute(sql)
    conn.commit()

print("created live_part_search_latest_display")
