"use client";

import Link from "next/link";

export type ProductCardVM = {
  source: "parts" | "offers";
  id: string;
  href: string;

  mpn: string | null;

  // raw + SEO title fields
  title: string | null;
  feed_title?: string | null;
  display_title?: string | null;

  price: any;
  image_url: string | null;

  brand: string | null;
  part_type: string | null;
  appliance_type: string | null;

  compatible_brands?: any;
  compatible_models?: any;

  in_stock: boolean;
  inventory_total: number | null;

  stock_status_canon?: string | null;
  availability_rank?: number | null;

  replaced_by?: string | null;
  replaces_previous_parts?: any;

  listing_id?: string | null;

  reliable_total_available?: number | null;
  reliable_snapshot_at?: any;
};

export type ProductVM = {
  kind: "parts" | "offers";
  slug: string;
  mpn_norm: string;

  primary: ProductCardVM;

  // opposing item candidates
  new_part: ProductCardVM | null; // for offers page
  refurb_offers: ProductCardVM[]; // for parts page (usually 0/1 because offers are netted)

  // sidebar gallery when no opposing item
  related_same_model: ProductCardVM[];
  gallery_model_hint?: string | null;
};

function money(v: any) {
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

function asStrArr(v: any): string[] {
  if (!v) return [];
  if (Array.isArray(v)) return v.map((x) => String(x).trim()).filter(Boolean);

  if (typeof v === "string") {
    const s = v.trim();
    if (!s) return [];
    if (s.startsWith("[") && s.endsWith("]")) {
      try {
        const j = JSON.parse(s);
        if (Array.isArray(j)) return j.map((x) => String(x).trim()).filter(Boolean);
      } catch {
        /* ignore */
      }
    }
    return s.split(/[\n,]+/).map((x) => x.trim()).filter(Boolean);
  }
  return [];
}

function firstNumber(v: any): number | null {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function safeImgSrc(src: string | null | undefined) {
  const s = String(src ?? "").trim();
  if (!s) return "/placeholder.png";
  return s;
}

function SmartImage(props: { src?: string | null; alt: string; className?: string }) {
  const { src, alt, className } = props;
  const finalSrc = safeImgSrc(src);
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={finalSrc}
      alt={alt}
      className={className}
      onError={(e) => {
        const img = e.currentTarget;
        if (!img.dataset.fallback) {
          img.dataset.fallback = "1";
          img.src = "/placeholder.png";
        }
      }}
    />
  );
}

function availabilityText(p: ProductCardVM) {
  if (p.source === "offers") {
    const n = Number(p.inventory_total ?? 0) || 0;
    return p.in_stock ? `In stock (${n})` : "Out of stock";
  }

  if (p.reliable_total_available != null) {
    const n = Number(p.reliable_total_available) || 0;
    return n > 0 ? `In stock (${n})` : "Out of stock";
  }

  return p.in_stock ? "In stock" : "Out of stock";
}

function displayTitle(p: ProductCardVM, fallback: string) {
  const t = String(p.display_title ?? p.feed_title ?? p.title ?? "").trim();
  return t || fallback;
}

function priceDelta(primary: ProductCardVM, other: ProductCardVM) {
  const a = firstNumber(primary.price);
  const b = firstNumber(other.price);
  if (a == null || b == null) return null;

  const diff = a - b;
  const abs = Math.abs(diff);
  const sign = diff === 0 ? 0 : diff > 0 ? 1 : -1;

  return { diff, abs, sign, a, b };
}

function MiniCard(props: { item: ProductCardVM; label: string }) {
  const { item, label } = props;
  const t = displayTitle(item, item.mpn ?? "Item");

  return (
    <Link href={item.href} className="block rounded-lg border p-3 hover:bg-gray-50">
      <div className="flex gap-3">
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md bg-gray-50">
          <SmartImage src={item.image_url} alt={t} className="h-full w-full object-contain" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="text-xs font-semibold text-gray-600">{label}</div>
          <div className="mt-1 line-clamp-2 text-sm font-semibold text-gray-900">{t}</div>
          <div className="mt-1 text-sm font-bold text-gray-900">{money(item.price)}</div>
          <div className="mt-1 text-xs text-gray-600">{availabilityText(item)}</div>
        </div>
      </div>
    </Link>
  );
}

export default function ProductPageClient({ vm }: { vm: ProductVM }) {
  const p = vm.primary;

  const fallbackTitle = p.mpn || vm.slug || "Product";
  const title = displayTitle(p, fallbackTitle);

  const compatibleModels = asStrArr(p.compatible_models);
  const replacesList = asStrArr(p.replaces_previous_parts);

  const opposing = p.source === "offers" ? vm.new_part : vm.refurb_offers?.[0] ?? null;

  const compatBrands = asStrArr(p.compatible_brands ?? opposing?.compatible_brands ?? null);

  const delta = opposing ? priceDelta(p, opposing) : null;

  const crumbLabel = p.mpn ?? vm.slug;
  const isOffer = p.source === "offers";

  const topBar = `${isOffer ? "Refurb" : "New"} - ${p.mpn ?? vm.slug} - ${availabilityText(p)}`;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      {/* Breadcrumb */}
      <div className="mb-4 text-sm text-gray-600">
        <Link className="hover:underline" href="/grid">
          Home
        </Link>
        <span className="mx-2">/</span>
        <Link className="hover:underline" href="/grid">
          Grid
        </Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900">{crumbLabel}</span>
      </div>

      {/* Layout: Image | Details | Sidebar
          IMPORTANT: Tailwind arbitrary grid cols must use underscores, NOT commas.
      */}
      <div className="grid gap-6 md:grid-cols-[320px_1fr] xl:grid-cols-[360px_1fr_320px]">
        {/* Image */}
        <div className="mx-auto w-full max-w-[360px] self-start md:mx-0 md:sticky md:top-6">
          <div className="rounded-xl border bg-white p-4">
            <div className="aspect-square w-full overflow-hidden rounded-lg bg-gray-50">
              <SmartImage src={p.image_url} alt={title} className="h-full w-full object-contain" />
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="rounded-xl border bg-white p-5">
          {/* Title bar */}
          <div className="-mx-5 -mt-5 mb-4 rounded-t-xl border-b bg-gray-50 px-5 py-3 text-sm font-semibold text-gray-800">
            {topBar}
          </div>

          <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>

          <div className="mt-3 text-3xl font-bold text-gray-900">{money(p.price)}</div>

          {/* Primary action: only show cross-link if available */}
          {opposing ? (
            <div className="mt-5">
              <Link
                href={opposing.href}
                className="inline-flex rounded-lg border px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50"
              >
                {isOffer ? "View new part" : "View refurbished offer"}
              </Link>
            </div>
          ) : null}

          {/* Compatible brands */}
          {compatBrands.length > 0 ? (
            <div className="mt-6 rounded-lg border bg-white p-4">
              <div className="text-sm font-semibold text-gray-900">Compatible brands</div>
              <div className="mt-3 flex flex-wrap gap-2">
                {compatBrands.slice(0, 50).map((b) => (
                  <span
                    key={b}
                    className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-800"
                  >
                    {b}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          {/* Replacement info (parts only) */}
          {!isOffer && (p.replaced_by || replacesList.length > 0) ? (
            <div className="mt-6 rounded-lg border bg-gray-50 p-4 text-sm">
              <div className="font-semibold text-gray-900">Replacement info</div>

              {p.replaced_by ? (
                <div className="mt-2">
                  <span className="font-medium">Replaced by:</span>{" "}
                  <span className="text-gray-900">{p.replaced_by}</span>
                </div>
              ) : null}

              {replacesList.length > 0 ? (
                <div className="mt-2">
                  <div className="font-medium">Replaces:</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {replacesList.slice(0, 30).map((x) => (
                      <span
                        key={x}
                        className="rounded-full bg-white px-3 py-1 text-xs font-medium text-gray-800 ring-1 ring-gray-200"
                      >
                        {x}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          {/* Compatible models */}
          {compatibleModels.length > 0 ? (
            <div className="mt-6 rounded-lg border bg-white p-4">
              <div className="text-sm font-semibold text-gray-900">Compatible models</div>
              <div className="mt-3 flex flex-wrap gap-2">
                {compatibleModels.slice(0, 50).map((m) => (
                  <span
                    key={m}
                    className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-800"
                  >
                    {m}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        {/* Sidebar */}
        <div className="w-full self-start">
          <div className="rounded-xl border bg-white p-5">
            {opposing ? (
              <>
                <div className="text-lg font-semibold text-gray-900">
                  {isOffer ? "Compare with new part" : "Compare with refurbished"}
                </div>

                <div className="mt-3 space-y-3">
                  <MiniCard item={opposing} label={isOffer ? "New part" : "Refurb offer"} />

                  {delta ? (
                    <div className="rounded-lg border bg-gray-50 p-3 text-sm">
                      <div className="font-semibold text-gray-900">Price difference</div>
                      <div className="mt-1 text-gray-800">
                        {delta.sign === 0
                          ? "Same price."
                          : isOffer
                            ? `New is ${money(delta.abs)} ${delta.sign > 0 ? "more" : "less"} than this refurb.`
                            : `This new part is ${money(delta.abs)} ${delta.sign > 0 ? "more" : "less"} than the refurb offer.`}
                      </div>

                      <div className="mt-2 text-xs text-gray-600">
                        New: {money(isOffer ? opposing.price : p.price)} • Refurb:{" "}
                        {money(isOffer ? p.price : opposing.price)}
                      </div>
                    </div>
                  ) : null}
                </div>
              </>
            ) : (
              <>
                <div className="text-lg font-semibold text-gray-900">
                  {vm.gallery_model_hint ? `Other items for model ${vm.gallery_model_hint}` : "Other items you may need"}
                </div>

                {vm.related_same_model?.length ? (
                  <div className="mt-3 space-y-2">
                    {vm.related_same_model.slice(0, 3).map((x) => (
                      <MiniCard
                        key={`${x.source}:${x.id}`}
                        item={x}
                        label={x.source === "offers" ? "Refurb offer" : "New part"}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="mt-2 text-sm text-gray-600">
                    No related items found yet (missing compatible model data is usually the cause).
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}