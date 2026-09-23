export type SearchIdentity = {
  kind: "part" | "model";
  identifier: string;
  title?: string;
  brand?: string;
  appliance_type?: string;
  part_type?: string;
  image_url?: string;
  source: string;
  source_url?: string;
};
export type SearchPhase = "local" | "found" | "internet" | "unverified" | "error" | "browse";
export type SearchEvent =
  | { type: "phase"; phase: SearchPhase }
  | { type: "identity"; identity: SearchIdentity }
  | { type: "models" | "parts" | "refurb" | "completions"; rows: Record<string, any>[] | string[] };

export function plausibleIdentifier(value: string) {
  const raw = value.trim();
  const key = raw.replace(/[^a-z0-9]/gi, "");
  return /^[a-z0-9][a-z0-9 ./_-]{3,39}$/i.test(raw) && key.length >= 5 && key.length <= 32 && /[0-9]/.test(raw)
    && (!/^\d+$/.test(key) || (key.length >= 6 && key.length <= 12 && Number(key) !== 0));
}

function pause(ms: number, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal.aborted) return reject(new DOMException("Aborted", "AbortError"));
    const abort = () => { clearTimeout(timer); reject(new DOMException("Aborted", "AbortError")); };
    const timer = setTimeout(() => { signal.removeEventListener("abort", abort); resolve(); }, ms);
    signal.addEventListener("abort", abort, { once: true });
  });
}

/** Independent local identity and commercial lanes; nothing waits on a seller to render. */
export async function searchAPG(query: string, base: string, signal: AbortSignal, emit: (event: SearchEvent) => void) {
  const send = (event: SearchEvent) => { if (!signal.aborted) emit(event); };
  const read = async (path: string) => {
    const response = await fetch(`${base}${path}?q=${encodeURIComponent(query)}`, { cache: "no-store", signal });
    if (!response.ok) throw new Error(`Search returned ${response.status}`);
    return response.json();
  };
  const identifier = plausibleIdentifier(query);
  send({ type: "phase", phase: identifier ? "local" : "browse" });
  const primary = async () => {
    if (!identifier) return;
    try {
      let result = await read("/api/search-identity");
      if (result.status === "miss") {
        send({ type: "phase", phase: "internet" });
        // Avoid external work for intermediate keystrokes. Cleanup aborts this delay.
        await pause(600, signal);
        const deadline = Date.now() + 60000;
        do {
          result = await read("/api/search-identity/external");
          if (result.status !== "searching") break;
          await pause(1000, signal);
        } while (Date.now() < deadline);
      }
      if (result.status === "found" && result.identity) {
        send({ type: "identity", identity: result.identity });
        send({ type: "phase", phase: "found" });
      } else send({ type: "phase", phase: "unverified" });
    } catch {
      if (!signal.aborted) send({ type: "phase", phase: "error" });
    }
  };
  const secondary = async (type: "models" | "parts" | "refurb" | "completions", path: string) => {
    try {
      const data = await read(path);
      const rows = type === "models" ? (Array.isArray(data) ? data : [...(data.with_priced_parts || []), ...(data.without_priced_parts || []), ...(data.refurb_only_models || [])])
        : type === "completions" ? [...new Set<string>((Array.isArray(data) ? data : data.matches || []).filter((s: string) => s.length > query.length && s.toLowerCase().startsWith(query.toLowerCase())))]
        : Array.isArray(data) ? data : [];
      send({ type, rows });
    } catch { /* A secondary error never clears a primary identity or another lane. */ }
  };
  // allSettled controls lifecycle only; every lane publishes as soon as it finishes.
  await Promise.allSettled([primary(), secondary("models", "/api/suggest"),
    secondary("parts", "/api/suggest/parts"), secondary("refurb", "/api/suggest/refurb"),
    ...(/^[a-z0-9-]+$/i.test(query) ? [secondary("completions", "/api/suggest/part-completions")] : [])]);
}

export function identityTitle(identity: SearchIdentity) {
  const appliance = ({ refrigerators: "Refrigerator", washers: "Washer", dryers: "Dryer", dishwashers: "Dishwasher" } as Record<string, string>)[identity.appliance_type || ""] || identity.appliance_type;
  let title = identity.title || identity.part_type || "";
  for (const prefix of [identity.brand, identity.identifier]) {
    if (prefix && title.toLowerCase().startsWith(prefix.toLowerCase() + " ")) title = title.slice(prefix.length).trim();
  }
  return [identity.brand, identity.identifier, appliance, title].filter(Boolean).join(" ");
}
