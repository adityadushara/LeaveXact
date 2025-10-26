/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Expose BACKEND_URL to the client side
  env: {
    NEXT_PUBLIC_BACKEND_URL: process.env.BACKEND_URL,
  },
  // Performance optimizations
  experimental: {
    // optimizeCss: true, // Disabled due to critters dependency issue
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },
  // Enable compression
  compress: true,
  // Optimize bundle
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      // Enable tree shaking
      config.optimization.usedExports = true
      config.optimization.sideEffects = false
    }
    return config
  },
  // Enable static optimization
  output: 'standalone',
  // Optimize fonts (removed - not supported in this version)
}

export default nextConfig
