#!/usr/bin/env python3
import os
import re
import psycopg
from psycopg.rows import dict_row

def norm(s):
    return re.sub(r"[^A-Z0-9]", "", (s or "").upper())

dsn = os.getenv("DATABASE_URL") or os.getenv("PG_DSN") or os.getenv("SUPABASE_DB_URL")
if not dsn:
    raise SystemExit("Missing DATABASE_URL / PG_DSN / SUPABASE_DB_URL")

mpns = ["DA92-00486A", "EBR81182789"]

with psycopg.connect(dsn, row_factory=dict_row) as conn:
    with conn.cursor() as cur:
        cur.execute("set statement_timeout = '10s'")

        for mpn in mpns:
            n = norm(mpn)
            print()
            print("=" * 100)
            print("MPN:", mpn, "NORMALIZED:", n)

            print()
            print("PARTS")
            cur.execute("""
                select
                  id,
                  mpn,
                  mpn_normalized,
                  brand,
                  appliance_type,
                  part_type,
                  canonical_part_type,
                  coalesce(title_display, feed_title, title) as display_title,
                  price,
                  stock_status,
                  stock_status_canon,
                  availability_rank,
                  reliable_total_available,
                  image_url,
                  reliable_part_url,
                  replaces_previous_parts,
                  replaced_by
                from public.parts
                where mpn_normalized = %s
                order by availability_rank nulls last, price nulls last
                limit 10
            """, (n,))
            rows = cur.fetchall()
            print("rows:", len(rows))
            for r in rows:
                print(dict(r))

            print()
            print("OFFERS")
            cur.execute("""
                select
                  id,
                  mpn,
                  mpn_norm,
                  mpn_canonical,
                  mpn_canonical_norm,
                  mpn_repair_status,
                  brand,
                  appliance_type,
                  part_type,
                  canonical_part_type,
                  coalesce(title_display, feed_title, title) as display_title,
                  price,
                  inventory_total,
                  image_url,
                  ebay_url,
                  marketplace,
                  az_inventory_number,
                  az_location_code,
                  az_reference_codes
                from public.offers
                where mpn_canonical_norm = %s
                   or mpn_norm = %s
                order by inventory_total desc nulls last, price nulls last
                limit 10
            """, (n, n))
            rows = cur.fetchall()
            print("rows:", len(rows))
            for r in rows:
                print(dict(r))
