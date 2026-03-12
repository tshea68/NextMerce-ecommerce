export function parseMaybeJsonArray(value: unknown): string[] {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value
      .map((v) => String(v ?? "").trim())
      .filter(Boolean);
  }

  if (typeof value === "string") {
    const s = value.trim();
    if (!s) return [];

    try {
      const parsed = JSON.parse(s);
      if (Array.isArray(parsed)) {
        return parsed.map((v) => String(v ?? "").trim()).filter(Boolean);
      }
    } catch {
      return s
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean);
    }
  }

  return [];
}

export function parseDelimitedList(
  value: string | null | undefined,
  pattern: RegExp = /[|,]/
): string[] {
  const s = String(value ?? "").trim();
  if (!s) return [];

  return s
    .split(pattern)
    .map((v) => v.trim())
    .filter(Boolean);
}