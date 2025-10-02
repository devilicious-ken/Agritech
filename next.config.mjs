/** @type {import('next').NextConfig} */

const nextConfig = {
    reactStrictMode: false,
    eslint: { ignoreDuringBuilds: true },
    typescript: { ignoreBuildErrors: true },
    devIndicators: {
      buildActivity: false,
    },
  }

export default nextConfig;
