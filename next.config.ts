import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/api/pdf": ["./node_modules/geist/dist/fonts/**/*.ttf"],
  },
};

export default nextConfig;
