/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  images: {
    unoptimized: true,
  },
  transpilePackages: ["@infraup/db"],
};

export default nextConfig;
