import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "raw.githubusercontent.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
    ],
  },
  experimental: {
    // Uploads are base64-inflated; allow room for reasonably sized media.
    serverActions: { bodySizeLimit: "50mb" },
  },
};

export default nextConfig;
