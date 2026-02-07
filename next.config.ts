import type { NextConfig } from "next";

// Bundle analyzer
const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig: NextConfig = {
  /* config options here */
  output: "export",
  trailingSlash: true,
  distDir: "out",
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Performance optimizations
  compress: true,
  productionBrowserSourceMaps: false,

  // Disable problematic build tracing on Windows
  generateBuildId: async () => {
    return "build-" + Date.now();
  },

  // Image optimization
  images: {
    formats: ["image/webp", "image/avif"],
    minimumCacheTTL: 86400,
    unoptimized: true, // Required for static export
  },

  // Experimental optimizations
  experimental: {
    scrollRestoration: true,
  },

  // Bundle optimization
  webpack: (config, { dev, isServer }) => {
    // Enable tree shaking
    if (!dev && !isServer) {
      config.optimization.usedExports = true;
      config.optimization.sideEffects = false;

      // Optimize chunk splitting
      config.optimization.splitChunks = {
        chunks: "all",
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: "vendors",
            chunks: "all",
          },
        },
      };
    }

    return config;
  },
};

export default withBundleAnalyzer(nextConfig);
