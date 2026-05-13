#!/usr/bin/env python3
import json
import re
import sys
from pathlib import Path
from html import unescape

def norm_mpn(s: str) -> str:
    return re.sub(r"[^A-Z0-9]", "", (s or "").upper())

def money_from_cents(v):
    try:
        return round(int(v) / 100, 2)
    except Exception:
        return None


def find_mpn_like_tokens(s: str) -> list[str]:
    """
    Finds appliance-part-looking tokens from individual tokens only.
    Do NOT combine brand words with part numbers, e.g. "Samsung DA92-00486A"
    must yield DA9200486A, not SAMSUNGDA9200486A.
    """
    text = (s or "").upper()

    # Individual token candidates only. Allows internal dashes but not spaces.
    raw = re.findall(r"\b[A-Z0-9]+(?:-[A-Z0-9]+)*\b", text)

    out = []
    for t in raw:
        n = norm_mpn(t)
        has_letter = bool(re.search(r"[A-Z]", n))
        has_digit = bool(re.search(r"\d", n))

        # Real appliance MPNs almost always have letters + digits and length >= 6.
        if len(n) >= 6 and has_letter and has_digit and n not in out:
            out.append(n)

    return out

def score_candidate(searched_mpn: str, matched_mpn: str | None, title: str | None):
    searched_norm = norm_mpn(searched_mpn)
    matched_norm = norm_mpn(matched_mpn)
    title_norm = norm_mpn(title)
    title_tokens = find_mpn_like_tokens(title or "")

    evidence = []
    relationship = "no_match"
    score = 0

    sku_exact = bool(matched_norm and matched_norm == searched_norm)
    title_exact = bool(searched_norm and searched_norm in title_norm)

    conflicting_title_tokens = [
        t for t in title_tokens
        if t != searched_norm and t != matched_norm and len(t) >= 6
    ]

    if sku_exact and not conflicting_title_tokens:
        relationship = "exact_match"
        score = 100
        evidence.append("exact normalized MPN in Shopify variant SKU")
    elif sku_exact and conflicting_title_tokens:
        relationship = "exact_sku_but_catalog_conflict"
        score = 92
        evidence.append("exact normalized MPN in Shopify variant SKU")
        evidence.append(f"title contains other MPN-like token(s): {', '.join(conflicting_title_tokens[:5])}")
    elif matched_norm and searched_norm and matched_norm.startswith(searched_norm) and matched_norm != searched_norm:
        suffix = matched_norm[len(searched_norm):]
        relationship = "variant_suffix_match"
        score = 85
        evidence.append(f"Shopify variant SKU starts with searched MPN plus suffix: {suffix}")
    elif title_exact and matched_norm and matched_norm != searched_norm:
        relationship = "title_match_sku_conflict"
        score = 80
        evidence.append("exact normalized MPN in product/variant title but Shopify variant SKU differs")
    elif title_exact:
        relationship = "related_match"
        score = 75
        evidence.append("exact normalized MPN in product/variant title")
    elif matched_norm and (searched_norm in matched_norm or matched_norm in searched_norm):
        relationship = "partial_match"
        score = 40
        evidence.append("partial normalized MPN match in Shopify variant SKU")

    return relationship, score, evidence

def extract_json_objects_from_products(html: str):
    """
    Pulls product JSON blobs commonly embedded in Shopify collection/search pages.
    This is intentionally forgiving: first pass is regex over product-ish objects.
    """
    objects = []

    # Pattern catches product objects that include id/handle/variants in raw JS.
    pattern = re.compile(r'(\{"id":\d+,"handle":"[^"]+","variants":\[.*?\],"variants_quantity":\[.*?\].*?\})', re.S)

    for m in pattern.finditer(html):
        raw = m.group(1)
        # Try to trim to balanced braces.
        depth = 0
        end = None
        for i, ch in enumerate(raw):
            if ch == "{":
                depth += 1
            elif ch == "}":
                depth -= 1
                if depth == 0:
                    end = i + 1
                    break
        if not end:
            continue

        raw_obj = raw[:end]
        try:
            objects.append(json.loads(raw_obj))
        except Exception:
            continue

    return objects

def extract_meta_products(html: str):
    """
    Extracts `var meta = {...};` product/search metadata if present.
    """
    m = re.search(r"var meta = (\{.*?\});", html, re.S)
    if not m:
        return []

    raw = m.group(1)
    try:
        meta = json.loads(raw)
    except Exception:
        return []

    if "products" in meta and isinstance(meta["products"], list):
        return meta["products"]

    if "product" in meta and isinstance(meta["product"], dict):
        return [meta["product"]]

    return []

def product_url(domain: str, handle: str) -> str | None:
    if not handle:
        return None
    return f"{domain.rstrip('/')}/products/{handle}"

def extract_candidates(html: str, searched_mpn: str, seller_key: str, domain: str):
    searched_norm = norm_mpn(searched_mpn)
    candidates = []

    # Source 1: cleaner Shopify meta object
    for p in extract_meta_products(html):
        handle = p.get("handle")
        vendor = p.get("vendor")
        ptype = p.get("type")
        variants = p.get("variants") or []

        for v in variants:
            sku = v.get("sku")
            title = v.get("name") or p.get("title")
            price = money_from_cents(v.get("price"))
            relationship, score, evidence = score_candidate(searched_mpn, sku, title)

            candidates.append({
                "seller_key": seller_key,
                "source_layer": "shopify_meta",
                "searched_mpn": searched_mpn,
                "matched_mpn": sku,
                "relationship": relationship,
                "confidence_score": score,
                "title": title,
                "brand": vendor,
                "type": ptype,
                "price": price,
                "currency": "USD",
                "product_url": product_url(domain, handle),
                "evidence": evidence,
            })

    # Source 2: raw product JSON blobs with availability/quantity/images
    for p in extract_json_objects_from_products(html):
        handle = p.get("handle")
        variants = p.get("variants") or []
        quantities = {}
        for q in p.get("variants_quantity") or []:
            try:
                quantities[str(q.get("id"))] = int(q.get("quantity"))
            except Exception:
                pass

        images = p.get("images") or []
        image_url = None
        if images and isinstance(images[0], dict):
            src = images[0].get("src")
            if src:
                image_url = "https:" + src if src.startswith("//") else src

        for v in variants:
            sku = v.get("sku")
            title = v.get("name")
            price = money_from_cents(v.get("price"))
            available = v.get("available")
            variant_id = str(v.get("id"))
            qty = quantities.get(variant_id)

            relationship, score, evidence = score_candidate(searched_mpn, sku, title)

            stock_status = "in_stock" if available is True else ("out_of_stock" if available is False else None)

            candidates.append({
                "seller_key": seller_key,
                "source_layer": "shopify_product_json",
                "searched_mpn": searched_mpn,
                "matched_mpn": sku,
                "relationship": relationship,
                "confidence_score": score,
                "title": title,
                "price": price,
                "currency": "USD",
                "stock_status": stock_status,
                "quantity": qty,
                "image_url": image_url,
                "product_url": product_url(domain, handle),
                "evidence": evidence,
            })

    # De-dupe rough: seller + matched_mpn + product_url + price
    seen = set()
    clean = []
    for c in candidates:
        key = (
            c.get("seller_key"),
            norm_mpn(c.get("matched_mpn")),
            c.get("product_url"),
            c.get("price"),
            c.get("source_layer"),
        )
        if key in seen:
            continue
        seen.add(key)
        clean.append(c)

    return sorted(clean, key=lambda x: (-(x.get("confidence_score") or 0), x.get("price") is None, x.get("price") or 999999))

def main():
    if len(sys.argv) < 5:
        print("Usage: extract_shopify_candidates.py <html_file> <searched_mpn> <seller_key> <domain>", file=sys.stderr)
        sys.exit(1)

    html_file, searched_mpn, seller_key, domain = sys.argv[1:5]
    html = Path(html_file).read_text(errors="ignore")
    html = unescape(html)

    candidates = extract_candidates(html, searched_mpn, seller_key, domain)
    print(json.dumps(candidates, indent=2))

if __name__ == "__main__":
    main()
