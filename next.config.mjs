/** @type {import('next').NextConfig} */
const nextConfig = {
  // standalone — минимальный production-образ для Docker (next start не нужен)
  output: 'standalone',
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
