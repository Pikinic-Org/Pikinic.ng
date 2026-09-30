import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

// Non-nonce CSP: simpler and keeps pages statically rendered (a nonce-based
// policy forces every page into dynamic rendering). Revisit if this site
// starts loading third-party scripts (analytics, chat widgets, etc.) — their
// domains need to be added to script-src/connect-src or they'll be blocked.
const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""};
  style-src 'self' 'unsafe-inline';
  img-src 'self' blob: data: https://res.cloudinary.com;
  font-src 'self';
  connect-src 'self';
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  upgrade-insecure-requests;
`;

const securityHeaders = [
  { key: "Content-Security-Policy", value: cspHeader.replace(/\n/g, "") },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];

const nextConfig: NextConfig = {
  images: {
    // 90 is for the full-bleed hero photo, which shows compression at 75.
    qualities: [75, 90],
  },
  // Temporary (307), not permanent: browsers cache 308s for good, which would
  // make it hard to bring any of these paths back later.
  async redirects() {
    return [
      // The first programme's page. Old links and flyers land on the new one.
      { source: "/travel-consultancy/:path*", destination: "/travel-consultant", permanent: false },
      // Both sign-up tables now live under Forms in the dashboard.
      { source: "/admin/consultants", destination: "/admin/forms/travel-consultant", permanent: false },
      { source: "/admin/consultants/:id", destination: "/admin/forms/travel-consultant/:id", permanent: false },
      { source: "/admin/guide-leads", destination: "/admin/forms/growth-conference", permanent: false },
    ];
  },
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
