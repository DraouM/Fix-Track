import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: "export",
  trailingSlash: true,
  distDir: "out",
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
