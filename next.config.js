/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      // Fairways lives in public/fairways as a static game; this serves it at
      // the clean path (public files themselves win before this rewrite runs)
      { source: "/fairways", destination: "/fairways/index.html" },
    ];
  },
  async redirects() {
    return [
      // the game moved home: old mediaseed links follow it
      {
        source: "/rebuild/:path*",
        has: [{ type: "host", value: "www.mediaseed.io" }],
        destination: "https://dailyrebuild.app/:path*",
        permanent: true,
      },
      {
        source: "/rebuild/:path*",
        has: [{ type: "host", value: "mediaseed.io" }],
        destination: "https://dailyrebuild.app/:path*",
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
