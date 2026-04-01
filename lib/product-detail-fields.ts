export type KeyFieldSource = "part" | "matched_part" | "offer" | "none";

export type ResolvedKeyPartFields = {
  replaced_by: string | null;
  replaces_previous_parts: string[];
  compatible_models: string[];
  field_source: KeyFieldSource;
};

type ResolveKeyPartFieldsArgs = {
  kind: "part" | "offer";
  primary: any;
  matchedPart?: any | null;
};

function normalizeString(value: unknown): string | null {
  const s = String(value ?? "").trim();
  if (!s) return null;
  if (s.toLowerCase() === "null" || s.toLowerCase() === "n/a") return null;
  return s;
}

function tryParseJsonArrayString(s: string): string[] | null {
  try {
    const parsed = JSON.parse(s);
    if (Array.isArray(parsed)) {
      return parsed
        .map((v) => normalizeString(v))
        .filter((v): v is string => Boolean(v));
    }
  } catch {
    // ignore
  }
  return null;
}

function dedupeStrings(values: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const v of values) {
    const trimmed = v.trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(trimmed);
  }
  return out;
}

function normalizeStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return dedupeStrings(
      value
        .map((v) => normalizeString(v))
        .filter((v): v is string => Boolean(v))
    );
  }

  if (typeof value === "string") {
    const s = value.trim();
    if (!s) return [];

    const parsedJson = tryParseJsonArrayString(s);
    if (parsedJson) return dedupeStrings(parsedJson);

    if (s.includes("|")) {
      return dedupeStrings(
        s.split("|")
          .map((v) => normalizeString(v))
          .filter((v): v is string => Boolean(v))
      );
    }

    if (s.includes(",")) {
      return dedupeStrings(
        s.split(",")
          .map((v) => normalizeString(v))
          .filter((v): v is string => Boolean(v))
      );
    }

    return [s];
  }

  return [];
}

function chooseAuthorityRow(
  args: ResolveKeyPartFieldsArgs
): { authority: any | null; field_source: KeyFieldSource } {
  const { kind, primary, matchedPart } = args;

  if (kind === "part") {
    return {
      authority: primary ?? null,
      field_source: primary ? "part" : "none",
    };
  }

  if (matchedPart) {
    return {
      authority: matchedPart,
      field_source: "matched_part",
    };
  }

  if (primary) {
    return {
      authority: primary,
      field_source: "offer",
    };
  }

  return {
    authority: null,
    field_source: "none",
  };
}

export function resolveKeyPartFields(
  args: ResolveKeyPartFieldsArgs
): ResolvedKeyPartFields {
  const { authority, field_source } = chooseAuthorityRow(args);

  if (!authority) {
    return {
      replaced_by: null,
      replaces_previous_parts: [],
      compatible_models: [],
      field_source: "none",
    };
  }

  return {
    replaced_by: normalizeString(authority.replaced_by),
    replaces_previous_parts: normalizeStringArray(
      authority.replaces_previous_parts
    ),
    compatible_models: normalizeStringArray(authority.compatible_models),
    field_source,
  };
}
