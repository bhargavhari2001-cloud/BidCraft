import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,

  // Prevent Next.js from bundling Node.js-only packages into the edge runtime.
  // mammoth uses Node.js Buffer APIs; keep it server-side only.
  serverExternalPackages: ["mammoth"],

};

export default nextConfig;
