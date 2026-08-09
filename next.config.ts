import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "s3-symbol-logo.tradingview.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "storage.invezgo.com",
        pathname: "/icon/**",
      },
    ],
  },
};

export default nextConfig;
