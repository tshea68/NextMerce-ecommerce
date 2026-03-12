BEGIN;

UPDATE parts
SET canonical_part_type =
CASE

WHEN lower(coalesce(specific_part_type, part_type,'')) LIKE '%pcb%'
  OR lower(coalesce(specific_part_type, part_type,'')) LIKE '%control board%'
  OR lower(coalesce(specific_part_type, part_type,'')) LIKE '%main board%'
  OR lower(coalesce(specific_part_type, part_type,'')) LIKE '%electronic control board%'
THEN 'Control Board'

WHEN lower(coalesce(specific_part_type, part_type,'')) LIKE '%wire harness%'
  OR lower(coalesce(specific_part_type, part_type,'')) LIKE '%wiring harness%'
  OR lower(coalesce(specific_part_type, part_type,'')) LIKE '%cable harness%'
  OR lower(coalesce(specific_part_type, part_type,'')) LIKE '%harness%'
THEN 'Wire Harness'

WHEN lower(coalesce(specific_part_type, part_type,'')) LIKE '%knob%'
THEN 'Knob'

WHEN lower(coalesce(specific_part_type, part_type,'')) LIKE '%door gasket%'
  OR lower(coalesce(specific_part_type, part_type,'')) LIKE '%seal%'
THEN 'Gasket / Seal'

WHEN lower(coalesce(specific_part_type, part_type,'')) LIKE '%panel%'
THEN 'Panel'

WHEN lower(coalesce(specific_part_type, part_type,'')) LIKE '%cover%'
THEN 'Cover'

WHEN lower(coalesce(specific_part_type, part_type,'')) LIKE '%handle%'
THEN 'Handle'

WHEN lower(coalesce(specific_part_type, part_type,'')) LIKE '%motor%'
THEN 'Motor'

WHEN lower(coalesce(specific_part_type, part_type,'')) LIKE '%compressor%'
THEN 'Compressor'

WHEN lower(coalesce(specific_part_type, part_type,'')) LIKE '%valve%'
THEN 'Valve'

WHEN lower(coalesce(specific_part_type, part_type,'')) LIKE '%heater%'
  OR lower(coalesce(specific_part_type, part_type,'')) LIKE '%element%'
THEN 'Heating Element'

WHEN lower(coalesce(specific_part_type, part_type,'')) LIKE '%thermostat%'
  OR lower(coalesce(specific_part_type, part_type,'')) LIKE '%sensor%'
THEN 'Sensor / Thermostat'

WHEN lower(coalesce(specific_part_type, part_type,'')) LIKE '%screw%'
  OR lower(coalesce(specific_part_type, part_type,'')) LIKE '%nut%'
  OR lower(coalesce(specific_part_type, part_type,'')) LIKE '%bolt%'
THEN 'Hardware'

ELSE 'Other'

END;

COMMIT;