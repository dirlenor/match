/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  basePath: process.env.NODE_ENV === 'production' ? '/match' : '',
  assetPrefix: process.env.NODE_ENV === 'production' ? '/match/' : '',
}

module.exports = nextConfig 