/** @type {import('next').NextConfig} */
const nextConfig = {
  // Standard Next.js configuration
  reactStrictMode: true,
  swcMinify: true,
  
  // Configure for dynamic rendering
  // This helps with useSearchParams() errors by disabling static optimization
  staticPageGenerationTimeout: 1000,
  
  // Disable static exports
  output: process.env.NEXT_PUBLIC_EXPORT === 'true' ? 'export' : undefined,
}

module.exports = nextConfig
