/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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
