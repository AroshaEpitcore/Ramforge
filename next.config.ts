import type { NextConfig } from "next";

/**
 * Content-Security-Policy — this is a sane *starting point*, not a final policy.
 * Tighten per environment once the video provider and analytics vendors are
 * chosen. `'unsafe-eval'` is only needed by the dev/React refresh runtime.
 */
const isDev = process.env.NODE_ENV !== "production";

const csp = [
  `default-src 'self'`,
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://js.stripe.com`,
  `style-src 'self' 'unsafe-inline'`,
  `img-src 'self' blob: data: https:`,
  `media-src 'self' blob: https:`,
  `font-src 'self' data:`,
  `connect-src 'self' https://api.stripe.com https:${isDev ? " ws:" : ""}`,
  `frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://www.youtube-nocookie.com https://www.youtube.com`,
  `frame-ancestors 'none'`,
  `base-uri 'self'`,
  `form-action 'self'`,
  `object-src 'none'`,
  `upgrade-insecure-requests`,
]
  .join("; ")
  .trim();

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const nextConfig: NextConfig = {
  // NOTE: the experimental `cacheComponents` / `partialPrefetching` flags were
  // removed — their PPR build output was not being served correctly on Vercel
  // (every route, including static assets, 404'd). Standard rendering deploys
  // reliably. Re-enable once the platform fully supports them.
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  images: {
    // Provider is undecided; allow common CDNs used by mocks and likely hosts.
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "*.alphacoders.com" },
      { protocol: "https", hostname: "*.peakpx.com" },
      { protocol: "https", hostname: "4kwallpapers.com" },
      { protocol: "https", hostname: "image.mux.com" },
      { protocol: "https", hostname: "*.b-cdn.net" },
      { protocol: "https", hostname: "*.r2.cloudflarestorage.com" },
      { protocol: "https", hostname: "customer-*.cloudflarestream.com" },
      { protocol: "https", hostname: "i.ytimg.com" },
    ],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
