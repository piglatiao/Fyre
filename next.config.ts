import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // 兼容官网路径：保持地址栏不变地映射到现有动态页面
  async rewrites() {
    return [
      { source: "/archive", destination: "/archives" },
      { source: "/about", destination: "/page/about" },
    ];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
