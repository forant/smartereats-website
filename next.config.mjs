/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // 👈 THIS is the key

  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true, // required for static export
  },
}

export default nextConfig