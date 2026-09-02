/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // A candidate near the 2x need of the 1200px feature card, and no 3840 rung.
    deviceSizes: [640, 750, 828, 1080, 1200, 1600, 1920, 2400],
  },
  reactStrictMode: true,
  async rewrites() {
    return [
      // Fairways lives in public/fairways as a static game; this serves it at
      // the clean path (public files themselves win before this rewrite runs)
      { source: "/fairways", destination: "/fairways/index.html" },
      // BACKYARD, same arrangement — the game is static ES modules and runs
      // fully offline (practice, story, kickball); its online mode politely
      // grays itself out when there is no match server behind the path
      { source: "/ctf", destination: "/ctf/index.html" },
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
