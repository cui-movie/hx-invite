import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ensure Node built-ins / native stay on server
  serverExternalPackages: [],
};

export default nextConfig;
