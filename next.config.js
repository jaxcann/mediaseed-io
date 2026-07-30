/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      // DAILY REBUILD is a static microsite in public/rebuild/
      { source: "/rebuild", destination: "/rebuild/index.html" },
      { source: "/rebuild/", destination: "/rebuild/index.html" },
    ];
  },
};

module.exports = nextConfig;
