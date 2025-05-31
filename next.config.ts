import type { NextConfig } from "next";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
const nextConfig: NextConfig = {
  basePath,
  assetPrefix: basePath,
   images: {
    domains: ['clips-presenters.d-id.com'], // <-- Add this line
  },
};

export default nextConfig;
