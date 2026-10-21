import { allowedImageHosts } from "@pricepilot/contracts/taxonomy";
import type { NextConfig } from "next";

/**
 * Server-only. Where the Express API listens, as reachable from the Next.js
 * server. The browser never sees it: it calls same-origin /api/*, which the
 * rewrite below proxies, so cookies stay first-party and no CORS is needed.
 */
const apiUrl = process.env.API_INTERNAL_URL ?? "http://localhost:4000";

const nextConfig: NextConfig = {
  // E2E/perf runs build into their own folder so they never clobber `next dev` or a normal build.
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  experimental: {
    agentFeedback: true,
  },
  cacheComponents: true,
  partialPrefetching: true,
  // The shared contracts package ships TypeScript source.
  transpilePackages: ["@pricepilot/contracts"],
  images: {
    // Same allow-list the API validates image URLs against: every stored URL
    // renders, and the optimizer can't be pointed at arbitrary hosts.
    remotePatterns: allowedImageHosts.map((hostname) => ({ protocol: "https" as const, hostname })),
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // No one may frame the site (clickjacking).
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Content-Security-Policy", value: "frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
          // Browsers ignore HSTS over plain HTTP, so this is safe locally and active once served over HTTPS.
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
        ],
      },
    ];
  },
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${apiUrl}/api/:path*` }];
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
