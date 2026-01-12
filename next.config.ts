import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  
  // Performance Optimizations
  compress: true, // Enable gzip compression
  poweredByHeader: false, // Remove X-Powered-By header for security
  
  // TypeScript
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  
  // Image Optimization
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'https',
        hostname: '**',
      }
    ],
    formats: ['image/avif', 'image/webp'], // Modern formats
    minimumCacheTTL: 60 * 60 * 24 * 30, // Cache for 30 days
    deviceSizes: [640, 750, 828, 1080, 1200, 1920], // Optimized sizes
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  
  // Experimental Features for Performance
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  
  // Production optimizations
  productionBrowserSourceMaps: false, // Disable source maps in production
  
  // Turbopack configuration (Next.js 16+)
  turbopack: {
    // Enable optimizations
    resolveAlias: {
      // Add any path aliases here if needed
    },
  },
};

export default nextConfig;
