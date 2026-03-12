update parts
set canonical_part_type =
case
  when lower(coalesce(specific_part_type,'')) like '%switch%' then 'Switch'
  when lower(coalesce(specific_part_type,'')) like '%control%' then 'Control Panel'
  when lower(coalesce(specific_part_type,'')) like '%module%' then 'Control Board'
  when lower(coalesce(specific_part_type,'')) like '%bearing%' then 'Mechanical / Drive Component'
  when lower(coalesce(specific_part_type,'')) like '%roller%' then 'Mechanical / Drive Component'
  when lower(coalesce(specific_part_type,'')) like '%gear%' then 'Mechanical / Drive Component'
  when lower(coalesce(specific_part_type,'')) like '%pipe%' then 'Hose / Tube / Fitting'
  when lower(coalesce(specific_part_type,'')) like '%connector%' then 'Wire Harness'
  when lower(coalesce(specific_part_type,'')) like '%adapter%' then 'Hardware'
  else canonical_part_type
end
where availability_rank in (1,2)
  and canonical_part_type = 'Other';
