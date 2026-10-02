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
      { protocol: "https", hostname: "thumb.wikimedia.org", pathname: "/wikipedia/commons/**" },
      { protocol: "https", hostname: "upload.wikimedia.org", pathname: "/wikipedia/commons/**" },
      { protocol: "https", hostname: "imageio.forbes.com", pathname: "/specials-images/**" },
      { protocol: "https", hostname: "asset.kompas.com", pathname: "/**" },
      { protocol: "https", hostname: "awsimages.detik.net.id", pathname: "/community/**" },
      { protocol: "https", hostname: "www.ey.com", pathname: "/content/**" },
      { protocol: "https", hostname: "storage.googleapis.com", pathname: "/swafiles/**" },
      { protocol: "https", hostname: "www.smart-tbk.com", pathname: "/wp-content/uploads/**" },
      { protocol: "https", hostname: "cdn.tatlerasia.com", pathname: "/tatlerasia/**" },
      { protocol: "https", hostname: "foto.wartaekonomi.co.id", pathname: "/files/**" },
      { protocol: "https", hostname: "images.bisnis.com", pathname: "/posts/**" },
    ],
  },
};

export default nextConfig;
