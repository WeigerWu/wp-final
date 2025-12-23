/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['res.cloudinary.com', 'images.unsplash.com', 'img.spoonacular.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'img.spoonacular.com',
      },
    ],
  },
  webpack: (config, { isServer }) => {
    // html2pdf.js 是純客戶端庫，不應該在服務器端打包
    if (isServer) {
      config.externals = config.externals || []
      config.externals.push('html2pdf.js')
    }
    return config
  },
  // 添加缓存控制头，防止浏览器过度缓存
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
        ],
      },
      {
        // 静态资源可以缓存，但设置较短的过期时间
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig


