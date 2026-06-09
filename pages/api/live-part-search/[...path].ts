import type { NextApiRequest, NextApiResponse } from "next";

function getApiBase() {
  const base =
    process.env.NEXT_PUBLIC_API_BASE ||
    process.env.API_BASE ||
    "https://api.appliancepartgeeks.com";

  return base.replace(/\/+$/, "");
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const rawPath = req.query.path;

  const pathParts = Array.isArray(rawPath)
    ? rawPath
    : rawPath
      ? [rawPath]
      : [];

  if (!pathParts.length) {
    return res.status(400).json({ detail: "Missing live-part-search path" });
  }

  const apiBase = getApiBase();

  const upstreamUrl = `${apiBase}/api/live-part-search/${pathParts
    .map((part) => encodeURIComponent(part))
    .join("/")}`;

  try {
    const upstream = await fetch(upstreamUrl, {
      method: req.method,
      headers: {
        "content-type": req.headers["content-type"] || "application/json",
      },
      body:
        req.method === "GET" || req.method === "HEAD"
          ? undefined
          : JSON.stringify(req.body ?? {}),
      cache: "no-store",
    });

    const text = await upstream.text();

    res.status(upstream.status);
    res.setHeader("content-type", upstream.headers.get("content-type") || "application/json");
    res.setHeader("cache-control", "no-store");
    res.setHeader("x-upstream-url", upstreamUrl);
    return res.send(text || JSON.stringify({ upstream_url: upstreamUrl, status: upstream.status }));
  } catch (err) {
    return res.status(502).json({
      detail: err instanceof Error ? err.message : "Next pages/api proxy failed",
      upstream_url: upstreamUrl,
    });
  }
}
