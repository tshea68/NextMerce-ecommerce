#!/usr/bin/env python3
import argparse
import csv
import json
import os
import re
import subprocess
import sys
import tempfile
from decimal import Decimal
from pathlib import Path
from urllib.parse import quote

try:
    import psycopg
    from psycopg.rows import dict_row
except Exception:
    psycopg = None
    dict_row = None

ROOT = Path(__file__).resolve().parents[2]
SOURCES = ROOT / "scripts/live_part_search/seller_sources.csv"
EXTRACTOR = ROOT / "scripts/live_part_search/extract_shopify_candidates.py"

def norm_mpn(s: str) -> str:
    return re.sub(r"[^A-Z0-9]", "", (s or "").upper())

def load_sources():
    with SOURCES.open(newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))

def curl_to_file(url: str, out: Path):
    cmd = [
        "curl",
        "-L",
        "--max-time", "30",
        "-A", "Mozilla/5.0",
        url,
        "-o", str(out),
        "-w", "%{http_code}",
        "-sS",
    ]
    p = subprocess.run(cmd, capture_output=True, text=True)
    return {
        "http_status": p.stdout.strip()[-3:] if p.stdout.strip() else None,
        "stderr": p.stderr.strip(),
        "ok": p.returncode == 0 and out.exists() and out.stat().st_size > 1000,
        "size": out.stat().st_size if out.exists() else 0,
    }

def run_extractor(html_file: Path, mpn: str, seller_key: str, domain: str):
    cmd = [
        sys.executable,
        str(EXTRACTOR),
        str(html_file),
        mpn,
        seller_key,
        domain,
    ]
    p = subprocess.run(cmd, capture_output=True, text=True)
    if p.returncode != 0:
        return [], p.stderr.strip()
    try:
        return json.loads(p.stdout), None
    except Exception as e:
        return [], f"JSON parse failed: {e}"

def json_safe(v):
    if isinstance(v, Decimal):
        return float(v)
    return v

def clean_row(row: dict) -> dict:
    return {k: json_safe(v) for k, v in row.items()}

def apg_stock_status_from_offer(row: dict) -> str:
    qty = row.get("inventory_total")
    try:
        return "in_stock" if int(qty or 0) > 0 else "out_of_stock"
    except Exception:
        return "unknown"

def apg_part_url(kind: str, mpn: str) -> str:
    if kind == "offer":
        return f"https://appliancepartgeeks.com/offers/{quote(mpn or '')}"
    return f"https://appliancepartgeeks.com/parts/{quote(mpn or '')}"

def fetch_apg_internal(mpn: str):
    if psycopg is None:
        return {
            "source": {
                "seller_key": "apg_internal",
                "status": "skipped",
                "reason": "psycopg not installed",
            },
            "candidates": [],
        }

    import os

    dsn = os.getenv("DATABASE_URL") or os.getenv("PG_DSN") or os.getenv("SUPABASE_DB_URL")
    if not dsn:
        return {
            "source": {
                "seller_key": "apg_internal",
                "status": "skipped",
                "reason": "missing DATABASE_URL / PG_DSN / SUPABASE_DB_URL",
            },
            "candidates": [],
        }

    n = norm_mpn(mpn)
    candidates = []
    source = {
        "seller_key": "apg_internal",
        "seller_name": "APG Internal",
        "status": "ok",
    }

    with psycopg.connect(dsn, row_factory=dict_row) as conn:
        with conn.cursor() as cur:
            cur.execute("set statement_timeout = '10s'")

            # New / canonical parts
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
            part_rows = [clean_row(dict(r)) for r in cur.fetchall()]

            for r in part_rows:
                matched = r.get("mpn")
                candidates.append({
                    "seller_key": "apg_internal",
                    "source_layer": "postgres_parts",
                    "searched_mpn": mpn,
                    "matched_mpn": matched,
                    "relationship": "exact_match",
                    "confidence_score": 100,
                    "title": r.get("display_title"),
                    "brand": r.get("brand"),
                    "type": r.get("canonical_part_type") or r.get("part_type"),
                    "price": r.get("price"),
                    "currency": "USD",
                    "condition": "new",
                    "stock_status": r.get("stock_status_canon") or r.get("stock_status"),
                    "quantity": r.get("reliable_total_available"),
                    "image_url": r.get("image_url"),
                    "product_url": apg_part_url("part", matched),
                    "evidence": ["exact normalized MPN in APG public.parts"],
                    "raw": r,
                })

            # Refurb / marketplace offers
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
            offer_rows = [clean_row(dict(r)) for r in cur.fetchall()]

            for r in offer_rows:
                matched = r.get("mpn_canonical") or r.get("mpn")
                candidates.append({
                    "seller_key": "apg_internal",
                    "source_layer": "postgres_offers",
                    "searched_mpn": mpn,
                    "matched_mpn": matched,
                    "relationship": "exact_match",
                    "confidence_score": 100,
                    "title": r.get("display_title"),
                    "brand": r.get("brand"),
                    "type": r.get("canonical_part_type") or r.get("part_type"),
                    "price": r.get("price"),
                    "currency": "USD",
                    "condition": "refurbished",
                    "stock_status": apg_stock_status_from_offer(r),
                    "quantity": r.get("inventory_total"),
                    "image_url": r.get("image_url"),
                    "product_url": apg_part_url("offer", matched),
                    "source_url": r.get("ebay_url"),
                    "evidence": ["exact normalized MPN in APG public.offers"],
                    "raw": r,
                })

            source["parts_count"] = len(part_rows)
            source["offers_count"] = len(offer_rows)
            source["candidate_count"] = len(candidates)

    return {
        "source": source,
        "candidates": candidates,
    }

def candidate_sort_key(c: dict):
    relationship_rank = {
        "exact_match": 0,
        "exact_sku_but_catalog_conflict": 1,
        "replacement_match": 2,
        "superseded_match": 3,
        "variant_suffix_match": 4,
        "title_match_sku_conflict": 5,
        "related_match": 6,
        "partial_match": 6,
        "no_match": 9,
    }.get(c.get("relationship"), 8)

    # Prefer our own APG result for APG; otherwise prefer clean exact external rows.
    seller_rank = 0 if c.get("seller_key") == "apg_internal" else 1

    return (
        seller_rank,
        relationship_rank,
        -(c.get("confidence_score") or 0),
        c.get("price") is None,
        c.get("price") or 999999,
    )

def build_best_candidates(candidates: list[dict]) -> list[dict]:
    """
    User-facing view:
    - Keep raw candidates intact in candidates.
    - Collapse duplicate seller rows for display.
    - Prefer clean exact matches over catalog-conflict rows from the same seller/MPN/price.
    """
    grouped = {}

    # If a seller has a clean exact match for the same matched MPN + price,
    # don't show lower-quality conflict rows for that same seller/MPN/price.
    clean_exact_keys = set()
    for c in candidates:
        if c.get("relationship") == "exact_match":
            clean_exact_keys.add((
                c.get("seller_key"),
                c.get("condition") or "unknown_condition",
                norm_mpn(c.get("matched_mpn") or ""),
                c.get("price"),
            ))

    for c in candidates:
        exact_suppression_key = (
            c.get("seller_key"),
            c.get("condition") or "unknown_condition",
            norm_mpn(c.get("matched_mpn") or ""),
            c.get("price"),
        )

        if (
            c.get("relationship") in ("exact_sku_but_catalog_conflict", "title_match_sku_conflict")
            and exact_suppression_key in clean_exact_keys
        ):
            continue

        key = (
            c.get("seller_key"),
            c.get("condition") or "unknown_condition",
            norm_mpn(c.get("matched_mpn") or ""),
            c.get("relationship"),
            c.get("price"),
        )

        existing = grouped.get(key)
        if existing is None or candidate_sort_key(c) < candidate_sort_key(existing):
            grouped[key] = c

    best = sorted(grouped.values(), key=candidate_sort_key)

    seen_exact = set()
    display = []
    for c in best:
        exactish = c.get("relationship") in ("exact_match", "exact_sku_but_catalog_conflict")
        if exactish:
            marker = (
                c.get("seller_key"),
                c.get("condition") or "unknown_condition",
                norm_mpn(c.get("matched_mpn") or ""),
            )
            if marker in seen_exact:
                continue
            seen_exact.add(marker)

        display.append(c)

    return display

def save_run_to_db(run: dict):
    import os
    if psycopg is None:
        raise RuntimeError("psycopg is not installed")

    dsn = os.getenv("DATABASE_URL") or os.getenv("PG_DSN") or os.getenv("SUPABASE_DB_URL")
    if not dsn:
        raise RuntimeError("Missing DATABASE_URL / PG_DSN / SUPABASE_DB_URL")

    def to_jsonable(obj):
        return json.loads(json.dumps(obj, default=str))

    def norm_or_none(v):
        return norm_mpn(v) if v else None

    best_ids = set()
    for c in run.get("best_candidates", []):
        best_ids.add((
            c.get("seller_key"),
            c.get("source_layer"),
            c.get("matched_mpn"),
            c.get("relationship"),
            c.get("price"),
            c.get("product_url"),
        ))

    with psycopg.connect(dsn) as conn:
        with conn.cursor() as cur:
            cur.execute("""
                insert into public.live_part_search_runs
                  (searched_mpn, searched_mpn_norm, run_source)
                values (%s, %s, %s)
                returning id
            """, (
                run.get("searched_mpn"),
                run.get("searched_mpn_norm"),
                "cli",
            ))
            run_id = cur.fetchone()[0]

            for src in run.get("sources", []):
                fetch = src.get("fetch") or {}
                cur.execute("""
                    insert into public.live_part_source_health
                      (
                        run_id,
                        seller_key,
                        seller_name,
                        status,
                        candidate_count,
                        parts_count,
                        offers_count,
                        http_status,
                        fetch_ok,
                        fetch_size,
                        reason,
                        url,
                        raw_source_json
                      )
                    values
                      (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s::jsonb)
                """, (
                    run_id,
                    src.get("seller_key"),
                    src.get("seller_name"),
                    src.get("status"),
                    src.get("candidate_count"),
                    src.get("parts_count"),
                    src.get("offers_count"),
                    fetch.get("http_status"),
                    fetch.get("ok"),
                    fetch.get("size"),
                    src.get("reason"),
                    src.get("url"),
                    json.dumps(to_jsonable(src)),
                ))

            for c in run.get("candidates", []):
                marker = (
                    c.get("seller_key"),
                    c.get("source_layer"),
                    c.get("matched_mpn"),
                    c.get("relationship"),
                    c.get("price"),
                    c.get("product_url"),
                )

                cur.execute("""
                    insert into public.live_part_search_candidates
                      (
                        run_id,
                        seller_key,
                        source_layer,
                        searched_mpn,
                        searched_mpn_norm,
                        matched_mpn,
                        matched_mpn_norm,
                        relationship,
                        confidence_score,
                        title,
                        brand,
                        part_type,
                        price,
                        currency,
                        condition,
                        stock_status,
                        quantity,
                        image_url,
                        product_url,
                        source_url,
                        evidence,
                        raw_candidate_json,
                        is_best_candidate
                      )
                    values
                      (
                        %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
                        %s, %s, %s, %s, %s, %s, %s, %s, %s::jsonb, %s::jsonb, %s
                      )
                """, (
                    run_id,
                    c.get("seller_key"),
                    c.get("source_layer"),
                    c.get("searched_mpn"),
                    run.get("searched_mpn_norm"),
                    c.get("matched_mpn"),
                    norm_or_none(c.get("matched_mpn")),
                    c.get("relationship"),
                    c.get("confidence_score"),
                    c.get("title"),
                    c.get("brand"),
                    c.get("type"),
                    c.get("price"),
                    c.get("currency") or "USD",
                    c.get("condition"),
                    c.get("stock_status"),
                    c.get("quantity"),
                    c.get("image_url"),
                    c.get("product_url"),
                    c.get("source_url"),
                    json.dumps(to_jsonable(c.get("evidence") or [])),
                    json.dumps(to_jsonable(c)),
                    marker in best_ids,
                ))

        conn.commit()

    run["saved_run_id"] = run_id
    return run_id

def main():
    parser = argparse.ArgumentParser(description="Live part search comparison CLI")
    parser.add_argument("mpn", help="MPN to search")
    parser.add_argument("--save", action="store_true", help="Save run/source/candidates to Postgres")
    args = parser.parse_args()

    mpn = args.mpn.strip()
    if not mpn:
        print("MPN required", file=sys.stderr)
        sys.exit(1)

    run = {
        "searched_mpn": mpn,
        "searched_mpn_norm": norm_mpn(mpn),
        "sources": [],
        "candidates": [],
    }

    # APG internal inventory/offers first.
    apg_result = fetch_apg_internal(mpn)
    run["sources"].append(apg_result["source"])
    run["candidates"].extend(apg_result["candidates"])

    with tempfile.TemporaryDirectory() as td:
        td = Path(td)

        for src in load_sources():
            if str(src.get("enabled", "")).lower() != "true":
                continue

            if src.get("adapter_type") != "shopify_search":
                run["sources"].append({
                    "seller_key": src["seller_key"],
                    "status": "skipped",
                    "reason": f"adapter_type {src.get('adapter_type')} not implemented in CLI yet",
                })
                continue

            template = src.get("search_url_template") or ""
            if not template:
                run["sources"].append({
                    "seller_key": src["seller_key"],
                    "status": "skipped",
                    "reason": "missing search_url_template",
                })
                continue

            url = template.replace("{mpn}", quote(mpn))
            html_file = td / f"{src['seller_key']}_{norm_mpn(mpn)}.html"

            fetch = curl_to_file(url, html_file)

            source_report = {
                "seller_key": src["seller_key"],
                "seller_name": src["seller_name"],
                "url": url,
                "fetch": fetch,
            }

            if not fetch["ok"]:
                source_report["status"] = "fetch_failed_or_too_small"
                run["sources"].append(source_report)
                continue

            candidates, err = run_extractor(html_file, mpn, src["seller_key"], src["domain"])
            if err:
                source_report["status"] = "extract_failed"
                source_report["error"] = err
                run["sources"].append(source_report)
                continue

            source_report["status"] = "ok"
            source_report["candidate_count"] = len(candidates)
            run["sources"].append(source_report)

            for c in candidates:
                if (c.get("confidence_score") or 0) > 0:
                    run["candidates"].append(c)

    run["candidates"] = sorted(
        run["candidates"],
        key=lambda x: (-(x.get("confidence_score") or 0), x.get("price") is None, x.get("price") or 999999)
    )

    run["best_candidates"] = build_best_candidates(run["candidates"])

    if args.save:
        save_run_to_db(run)

    print(json.dumps(run, indent=2))

if __name__ == "__main__":
    main()
