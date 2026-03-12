update parts
set canonical_part_type =
case
when lower(coalesce(specific_part_type,'')) like '%plate%' then 'Panel'
when lower(coalesce(specific_part_type,'')) like '%insulation%' then 'Insulation'
when lower(coalesce(specific_part_type,'')) like '%insulator%' then 'Insulation'
when lower(coalesce(specific_part_type,'')) like '%damper%' then 'Damper'
when lower(coalesce(specific_part_type,'')) like '%resistor%' then 'Electrical Component'
when lower(coalesce(specific_part_type,'')) like '%speaker%' then 'Electrical Component'
when lower(coalesce(specific_part_type,'')) like '%magnetron%' then 'Electrical Component'
when lower(coalesce(specific_part_type,'')) like '%nozzle%' then 'Hose / Tube / Fitting'
when lower(coalesce(specific_part_type,'')) like '%vent%' then 'Vent / Air Flow'
when lower(coalesce(specific_part_type,'')) like '%latch%' then 'Latch'
when lower(coalesce(specific_part_type,'')) like '%ring%' then 'Mechanical / Drive Component'
when lower(coalesce(specific_part_type,'')) like '%blade%' then 'Fan / Blade'
when lower(coalesce(specific_part_type,'')) like '%baffle%' then 'Vent / Air Flow'
when lower(coalesce(specific_part_type,'')) like '%escutcheon%' then 'Panel'
when lower(coalesce(specific_part_type,'')) like '%water tank%' then 'Reservoir / Tank'
else canonical_part_type
end
where availability_rank in (1,2)
and canonical_part_type = 'Other';
