import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The parent folder holds a different app with its own lockfile; pin the
  // workspace root here so Turbopack doesn't guess.
  turbopack: { root: __dirname },
};

export default nextConfig;
