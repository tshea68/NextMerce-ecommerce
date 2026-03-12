create or replace view public.grid_all as
select
    'p:' || p.id::text as rid,
    'parts'::text as source,
    false as is_refurb,
    null::text as listing_id,
    p.mpn,
    p.title as title,
    p.price,
    p.image_url,
    p.brand,
    p.canonical_part_type,
    p.appliance_type,
    p.stock_status_canon,
    null::integer as inventory_total,
    p.compatible_models::text as compatible_models,
    case
        when p.availability_rank in (1,2) then true
        else false
    end as in_stock
from public.parts p
where p.price is not null

union all

select
    'o:' || o.id::text as rid,
    'offers'::text as source,
    true as is_refurb,
    o.listing_id::text as listing_id,
    o.mpn,
    o.title,
    o.price,
    o.image_url,
    o.brand,
    o.canonical_part_type,
    o.appliance_type,
    null::text as stock_status_canon,
    coalesce(o.inventory_total, 0)::integer as inventory_total,
    o.compatible_models::text as compatible_models,
    coalesce(o.inventory_total, 0) > 0 as in_stock
from public.offers o
where o.price is not null;

create or replace function public.grid_facets_v1(
    p_condition text default 'both',
    p_q text default null,
    p_appliance_type text default null,
    p_brands text[] default null,
    p_part_types text[] default null,
    p_in_stock_only boolean default false,
    p_model text default null,
    p_limit integer default 300
)
returns jsonb
language sql
stable
as $$
with filtered as (
    select *
    from public.grid_all g
    where
        (
            p_condition = 'both'
            or (p_condition = 'new' and g.is_refurb = false)
            or (p_condition = 'refurb' and g.is_refurb = true)
        )
        and (
            not p_in_stock_only
            or g.in_stock = true
        )
        and (
            p_appliance_type is null
            or g.appliance_type = p_appliance_type
        )
        and (
            p_brands is null
            or cardinality(p_brands) = 0
            or g.brand = any(p_brands)
        )
        and (
            p_part_types is null
            or cardinality(p_part_types) = 0
            or g.canonical_part_type = any(p_part_types)
        )
        and (
            p_model is null
            or coalesce(g.compatible_models, '') ilike '%' || p_model || '%'
        )
        and (
            p_q is null
            or p_q = ''
            or g.mpn ilike '%' || p_q || '%'
            or coalesce(g.title, '') ilike '%' || p_q || '%'
            or coalesce(g.compatible_models, '') ilike '%' || p_q || '%'
            or coalesce(g.brand, '') ilike '%' || p_q || '%'
        )
),
brand_counts as (
    select
        brand as value,
        count(*)::int as count
    from filtered
    where brand is not null and trim(brand) <> ''
    group by brand
    order by count desc, brand
    limit p_limit
),
part_counts as (
    select
        coalesce(nullif(trim(canonical_part_type), ''), 'Other') as value,
        count(*)::int as count
    from filtered
    group by 1
    order by count desc, 1
    limit p_limit
),
appliance_counts as (
    select
        appliance_type as value,
        count(*)::int as count
    from filtered
    where appliance_type is not null and trim(appliance_type) <> ''
    group by appliance_type
    order by count desc, appliance_type
    limit p_limit
),
tot as (
    select count(*)::int as total_count from filtered
)
select jsonb_build_object(
    'brands', coalesce((select jsonb_agg(to_jsonb(brand_counts)) from brand_counts), '[]'::jsonb),
    'parts', coalesce((select jsonb_agg(to_jsonb(part_counts)) from part_counts), '[]'::jsonb),
    'appliances', coalesce((select jsonb_agg(to_jsonb(appliance_counts)) from appliance_counts), '[]'::jsonb),
    'total_count', (select total_count from tot)
);
$$;

create or replace function public.grid_facets(
    p_condition text default 'both',
    p_q text default null,
    p_appliance_type text default null,
    p_brands text[] default null,
    p_part_types text[] default null,
    p_in_stock_only boolean default false,
    p_model text default null
)
returns jsonb
language sql
stable
as $$
    select public.grid_facets_v1(
        p_condition := p_condition,
        p_q := p_q,
        p_appliance_type := p_appliance_type,
        p_brands := p_brands,
        p_part_types := p_part_types,
        p_in_stock_only := p_in_stock_only,
        p_model := p_model,
        p_limit := 300
    );
$$;

create or replace function public.grid_facets_parts(
    p_q text default null,
    p_availability text default 'all',
    p_appliance_type text default null,
    p_brands text[] default null,
    p_part_types text[] default null,
    p_facet_limit integer default 300
)
returns jsonb
language sql
stable
as $$
with filtered as (
    select *
    from public.parts p
    where
        (
            p_appliance_type is null
            or p.appliance_type = p_appliance_type
        )
        and (
            p_brands is null
            or cardinality(p_brands) = 0
            or p.brand = any(p_brands)
        )
        and (
            p_part_types is null
            or cardinality(p_part_types) = 0
            or p.canonical_part_type = any(p_part_types)
        )
        and (
            p_q is null
            or p_q = ''
            or p.mpn ilike '%' || p_q || '%'
            or coalesce(p.title, '') ilike '%' || p_q || '%'
        )
        and (
            p_availability = 'all'
            or (
                p_availability = 'in_stock'
                and p.availability_rank in (1,2)
            )
            or (
                p_availability = 'orderable'
                and p.availability_rank in (1,2)
            )
        )
),
brand_counts as (
    select
        brand as value,
        count(*)::int as count
    from filtered
    where brand is not null and trim(brand) <> ''
    group by brand
    order by count desc, brand
    limit p_facet_limit
),
part_counts as (
    select
        coalesce(nullif(trim(canonical_part_type), ''), 'Other') as value,
        count(*)::int as count
    from filtered
    group by 1
    order by count desc, 1
    limit p_facet_limit
),
appliance_counts as (
    select
        appliance_type as value,
        count(*)::int as count
    from filtered
    where appliance_type is not null and trim(appliance_type) <> ''
    group by appliance_type
    order by count desc, appliance_type
    limit p_facet_limit
)
select jsonb_build_object(
    'brands', coalesce((select jsonb_agg(to_jsonb(brand_counts)) from brand_counts), '[]'::jsonb),
    'parts', coalesce((select jsonb_agg(to_jsonb(part_counts)) from part_counts), '[]'::jsonb),
    'appliances', coalesce((select jsonb_agg(to_jsonb(appliance_counts)) from appliance_counts), '[]'::jsonb)
);
$$;

create index if not exists idx_parts_canonical_part_type
    on public.parts (canonical_part_type);

create index if not exists idx_offers_canonical_part_type
    on public.offers (canonical_part_type);

create index if not exists idx_parts_availability_canonical
    on public.parts (availability_rank, canonical_part_type);

create index if not exists idx_offers_inventory_canonical
    on public.offers (inventory_total, canonical_part_type);
