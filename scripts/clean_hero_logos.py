import os
import re
import json
import urllib.request
from io import BytesIO
from pathlib import Path

from PIL import Image

ROOT = Path.cwd()
OUT_DIR = ROOT / "public" / "hero-logos-clean"
OUT_DIR.mkdir(parents=True, exist_ok=True)

def load_env_file(path: Path):
    if not path.exists():
        return
    for line in path.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, v = line.split("=", 1)
        os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))

load_env_file(ROOT / ".env.local")
load_env_file(ROOT / ".env")

SUPABASE_URL = (
    os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
    or os.environ.get("SUPABASE_URL")
    or "https://djvyjctjcehjyglwjniv.supabase.co"
)

SUPABASE_KEY = (
    os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    or os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")
    or os.environ.get("SUPABASE_ANON_KEY")
)

if not SUPABASE_KEY:
    raise SystemExit("No Supabase key found in .env.local/.env")

def slugify(value: str) -> str:
    value = (value or "logo").lower().strip()
    value = re.sub(r"[^a-z0-9]+", "-", value)
    return value.strip("-") or "logo"

def fetch_json(url: str):
    req = urllib.request.Request(
        url,
        headers={
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
        },
    )
    with urllib.request.urlopen(req, timeout=30) as res:
        return json.loads(res.read().decode("utf-8"))

url = (
    f"{SUPABASE_URL}/rest/v1/brand_logos"
    "?select=id,brand,brand_long,brand_code,brand_norm,image_url,hero_enabled,hero_priority"
    "&hero_enabled=eq.true"
    "&image_url=not.is.null"
    "&order=hero_priority.asc.nullslast,brand.asc"
    "&limit=50"
)

rows = fetch_json(url)
manifest = []

for row in rows:
    image_url = row.get("image_url")
    brand = row.get("brand") or row.get("brand_long") or row.get("brand_code") or f"logo-{row.get('id')}"
    slug = slugify(row.get("brand_norm") or brand)
    out_path = OUT_DIR / f"{slug}.png"

    try:
        with urllib.request.urlopen(image_url, timeout=30) as res:
            raw = res.read()

        img = Image.open(BytesIO(raw)).convert("RGBA")
        pixels = img.load()
        w, h = img.size

        # Remove white / near-white backgrounds.
        # Threshold can be adjusted: lower = stricter, higher = more aggressive.
        threshold = 238

        for y in range(h):
            for x in range(w):
                r, g, b, a = pixels[x, y]
                if a == 0:
                    continue

                # If pixel is close to white, make it transparent.
                if r >= threshold and g >= threshold and b >= threshold:
                    pixels[x, y] = (255, 255, 255, 0)

        # Trim transparent whitespace.
        bbox = img.getbbox()
        if bbox:
            img = img.crop(bbox)

        img.save(out_path, "PNG", optimize=True)

        manifest.append({
            **row,
            "clean_image_url": f"/hero-logos-clean/{out_path.name}",
        })

        print(f"cleaned: {brand} -> {out_path}")

    except Exception as e:
        print(f"FAILED: {brand} {image_url} => {e}")

(OUT_DIR / "manifest.json").write_text(json.dumps(manifest, indent=2))
print(f"\nWrote {len(manifest)} cleaned logos to {OUT_DIR}")
print("Manifest: public/hero-logos-clean/manifest.json")
