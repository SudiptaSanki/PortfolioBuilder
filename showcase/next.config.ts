import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  // Cloudflare Pages serves from the 'out' directory
  trailingSlash: true,
};

export default nextConfig;
