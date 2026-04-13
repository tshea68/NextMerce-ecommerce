begin;

alter table public.models
  add column if not exists in_stock_parts integer not null default 0,
  add column if not exists orderable_parts integer not null default 0;

with per_model as (
  select
    mpl.model_number,
    count(distinct mpl.mpn) as total_links_calc,
    count(distinct case
      when p.price is not null and p.price > 0 then mpl.mpn
      else null
    end) as priced_parts_calc,
    count(distinct case
      when p.availability_rank = 1 then mpl.mpn
      else null
    end) as in_stock_parts_calc,
    count(distinct case
      when p.availability_rank = 2 then mpl.mpn
      else null
    end) as orderable_parts_calc
  from public.model_part_links mpl
  left join public.parts p
    on p.mpn = mpl.mpn
  where mpl.model_number is not null
    and mpl.model_number <> ''
    and mpl.mpn is not null
    and mpl.mpn <> ''
  group by mpl.model_number
)
update public.models m
set
  total_links = coalesce(pm.total_links_calc, 0),
  priced_parts = coalesce(pm.priced_parts_calc, 0),
  in_stock_parts = coalesce(pm.in_stock_parts_calc, 0),
  orderable_parts = coalesce(pm.orderable_parts_calc, 0),
  new_count = coalesce(pm.total_links_calc, 0),
  available_count = coalesce(pm.in_stock_parts_calc, 0) + coalesce(pm.orderable_parts_calc, 0)
from per_model pm
where m.model_number = pm.model_number;

commit;
