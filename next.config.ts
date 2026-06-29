import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // ESLint is configured/run separately (Phase 8); don't block production builds on it.
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  experimental: {
    // Server Actions are enabled by default in Next 15; keep body size generous for image data URLs.
    serverActions: {
      bodySizeLimit: "8mb",
    },
  },
};

export default nextConfig;
