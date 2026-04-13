BEGIN;

WITH per_model AS (
  SELECT
    mpl.model_number,

    -- One true links count for the model
    COUNT(DISTINCT mpl.mpn) AS links_calc,

    -- priced parts (linked parts with price > 0)
    COUNT(DISTINCT CASE
      WHEN p.price IS NOT NULL AND p.price > 0 THEN mpl.mpn
      ELSE NULL END
    ) AS priced_parts_calc,

    -- in stock (rank 1) -> available_count
    COUNT(DISTINCT CASE
      WHEN p.availability_rank = 1 THEN mpl.mpn
      ELSE NULL END
    ) AS in_stock_calc,

    -- orderable (rank 2) -> orderable_count
    COUNT(DISTINCT CASE
      WHEN p.availability_rank = 2 THEN mpl.mpn
      ELSE NULL END
    ) AS orderable_calc

  FROM public.model_part_links mpl
  LEFT JOIN public.parts p
    ON lower(p.mpn) = lower(mpl.mpn)
  WHERE mpl.model_number IS NOT NULL AND btrim(mpl.model_number) <> ''
    AND mpl.mpn IS NOT NULL AND btrim(mpl.mpn) <> ''
  GROUP BY mpl.model_number
)

UPDATE public.models m
SET
  all_known_parts = pm.links_calc,
  total_links     = pm.links_calc,          -- keep equal for compatibility
  priced_parts    = pm.priced_parts_calc,
  available_count = pm.in_stock_calc,       -- rank 1
  orderable_count = pm.orderable_calc       -- rank 2
FROM per_model pm
WHERE lower(btrim(m.model_number)) = lower(btrim(pm.model_number));

COMMIT;