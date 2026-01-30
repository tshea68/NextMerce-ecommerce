import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ✅ makes `next build` generate a static site in /out
  output: "export",

  // ✅ Cloudflare Pages + static export + next/image
  images: { unoptimized: true },

  // ✅ avoids edge cases on some static hosts (safe on Pages)
  trailingSlash: true,
};

export default nextConfig;
