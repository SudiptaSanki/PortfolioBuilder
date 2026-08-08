import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  // Cloudflare Pages serves from the 'out' directory
  trailingSlash: true,
};

export default nextConfig;
