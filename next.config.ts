import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: { unoptimized: true },

  trailingSlash: false,

  typescript: {
    ignoreBuildErrors: true,
  },

  async redirects() {
    return [
      {
        source: "/refurb/:mpn",
        destination: "/offers/:mpn",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;