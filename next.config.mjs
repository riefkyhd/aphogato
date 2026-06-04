/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Avoid stale project list / detail after uploads when navigating back.
    staleTimes: {
      dynamic: 0,
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
};

export default nextConfig;
