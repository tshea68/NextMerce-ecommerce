#!/usr/bin/env python3
import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SEARCH = ROOT / "scripts/live_part_search/search_live_part.py"

def main():
    if len(sys.argv) < 2:
        print("Usage: print_live_part_summary.py <MPN>", file=sys.stderr)
        sys.exit(1)

    mpn = sys.argv[1]

    p = subprocess.run(
        [sys.executable, str(SEARCH), mpn],
        capture_output=True,
        text=True,
    )

    if p.returncode != 0:
        print(p.stderr)
        sys.exit(p.returncode)

    data = json.loads(p.stdout)

    print()
    print(f"Live part search: {data['searched_mpn']} ({data['searched_mpn_norm']})")
    print("=" * 140)

    print()
    print("Sources")
    print("-" * 140)
    for s in data.get("sources", []):
        print(
            f"{s.get('seller_key',''):<28} "
            f"status={s.get('status',''):<28} "
            f"candidates={str(s.get('candidate_count','')):<5} "
            f"parts={str(s.get('parts_count','')):<5} "
            f"offers={str(s.get('offers_count','')):<5} "
            f"reason={s.get('reason','')}"
        )

    print()
    print("Best candidates")
    print("-" * 140)
    print(
        f"{'seller':<28} {'rel':<34} {'cond':<13} {'stock':<10} "
        f"{'qty':>6} {'price':>10} {'mpn':<18} title"
    )
    print("-" * 140)

    for c in data.get("best_candidates", []):
        price = c.get("price")
        price_s = f"${price:,.2f}" if isinstance(price, (int, float)) else ""
        qty = c.get("quantity")
        qty_s = "" if qty is None else str(qty)

        print(
            f"{c.get('seller_key',''):<28} "
            f"{c.get('relationship',''):<34} "
            f"{(c.get('condition') or ''):<13} "
            f"{(c.get('stock_status') or ''):<10} "
            f"{qty_s:>6} "
            f"{price_s:>10} "
            f"{(c.get('matched_mpn') or ''):<18} "
            f"{c.get('title') or ''}"
        )

    print()
    print(f"raw candidates: {len(data.get('candidates', []))}")
    print(f"best candidates: {len(data.get('best_candidates', []))}")

if __name__ == "__main__":
    main()
