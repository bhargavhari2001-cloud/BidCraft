import type { NextConfig } from "next";

const securityHeaders = [
  // Prevent clickjacking
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  // Block MIME-type sniffing
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Limit referrer data sent to third parties
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Restrict browser features not used by the app
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  // Enable browser XSS filter (legacy but harmless)
  { key: "X-XSS-Protection", value: "1; mode=block" },
];

const nextConfig: NextConfig = {
  reactCompiler: true,

  // Prevent Next.js from bundling Node.js-only packages into the edge runtime.
  // mammoth uses Node.js Buffer APIs; keep it server-side only.
  serverExternalPackages: ["mammoth"],

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
