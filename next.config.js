/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return {
      beforeFiles: [
        // dailyrebuild.app serves the game from the domain root
        {
          source: "/:path((?!rebuild|_next).*)",
          has: [{ type: "host", value: "dailyrebuild.app" }],
          destination: "/rebuild/:path",
        },
        {
          source: "/:path((?!rebuild|_next).*)",
          has: [{ type: "host", value: "www.dailyrebuild.app" }],
          destination: "/rebuild/:path",
        },
      ],
      afterFiles: [
        // DAILY REBUILD is a static microsite in public/rebuild/
        { source: "/rebuild", destination: "/rebuild/index.html" },
        { source: "/rebuild/", destination: "/rebuild/index.html" },
      ],
    };
  },
  async redirects() {
    return [
      // the game moved home: old mediaseed links follow it
      {
        source: "/rebuild/:path*",
        has: [{ type: "host", value: "www.mediaseed.io" }],
        destination: "https://dailyrebuild.app/:path*",
        permanent: false,
      },
      {
        source: "/rebuild/:path*",
        has: [{ type: "host", value: "mediaseed.io" }],
        destination: "https://dailyrebuild.app/:path*",
        permanent: false,
      },
    ];
  },
};

module.exports = nextConfig;
