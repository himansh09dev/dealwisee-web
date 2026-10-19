import type { NextConfig } from "next";

/**
 * Server-only. Where the Express API listens, as reachable from the Next.js
 * server. The browser never sees it: it calls same-origin /api/*, which the
 * rewrite below proxies, so cookies stay first-party and no CORS is needed.
 */
const apiUrl = process.env.API_INTERNAL_URL ?? "http://localhost:4000";

const nextConfig: NextConfig = {
  experimental: {
    agentFeedback: true,
  },
  cacheComponents: true,
  partialPrefetching: true,
  // The shared contracts package ships TypeScript source.
  transpilePackages: ["@pricepilot/contracts"],
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
