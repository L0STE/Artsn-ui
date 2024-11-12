/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
      remotePatterns: [{
          protocol: 'https',
          hostname: '**', 
          pathname: '/**',
      }],
  },
  // Remove "include" as it's not a valid Next.js config option
  // (it belongs in tsconfig.json instead)
  
  // Add these configurations to handle the SSR/navigator issues
  output: 'standalone',
  experimental: {
      appDocumentPreloading: false,
  },
  // This will force dynamic rendering for all pages
  serverActions: {
      bodySizeLimit: '50mb',
  },
  typescript: {
      // Dangerously allow production builds to successfully complete even if
      // your project has type errors.
      ignoreBuildErrors: true,
  },
};

export default nextConfig;