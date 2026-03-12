export function makePartTitle(part: any): string {
  const mpn =
    part?.mpn ??
    part?.part_number ??
    part?.manufacturer_part_number ??
    part?.sku ??
    part?.id ??
    "";

  const name = part?.name ?? part?.title ?? part?.part_name ?? "";
  const brand = part?.brand ?? part?.manufacturer ?? "";

  const bits = [brand, mpn, name].map((x) => (x ?? "").toString().trim()).filter(Boolean);
  return bits.length ? bits.join(" – ") : "Part";
}
