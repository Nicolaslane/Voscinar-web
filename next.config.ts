import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["three"],
  // samostatný projekt – nemiešať s aplikáciou Jarvis v nadradenom priečinku
  turbopack: { root: __dirname },
  outputFileTracingRoot: __dirname,
};

export default nextConfig;
