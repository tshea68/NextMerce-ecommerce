export function makePartTitle(part: any, forcedMpn?: string): string {
  const mpn = (
    forcedMpn ??
    part?.mpn ??
    part?.part_number ??
    part?.manufacturer_part_number ??
    part?.sku ??
    part?.id ??
    ""
  )
    .toString()
    .trim();

  const brand = (part?.brand ?? part?.manufacturer ?? "").toString().trim();
  const appliance = (part?.appliance_type ?? "").toString().trim();
  const partType = (part?.specific_part_type ?? part?.part_type ?? "").toString().trim();

  const structured = [brand, mpn, appliance, partType].filter(Boolean).join(" ").replace(/\s+/g, " ").trim();

  if (structured) return structured;

  const fallbackName = (
    part?.name ??
    part?.part_name ??
    part?.title ??
    "Part"
  )
    .toString()
    .trim();

  const fallback = [brand, mpn, fallbackName].filter(Boolean).join(" – ").trim();
  return fallback || "Part";
}