update parts p
set canonical_part_type =
    case
        when m.action = 'exclude' then null
        when m.action in ('map', 'docs') then m.canonical_part_type
        else p.canonical_part_type
    end
from part_taxonomy_map m
where m.source_field = 'specific_part_type'
  and coalesce(nullif(trim(p.specific_part_type), ''), '<<null>>') = m.source_value
  and p.availability_rank in (1,2)
  and p.canonical_part_type = 'Other';
