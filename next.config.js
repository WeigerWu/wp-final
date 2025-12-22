/** @type {import('next').NextConfig} */
const nextConfig = {
  // 使用 standalone 輸出模式可以避免構建追蹤階段的堆疊溢出問題
  output: 'standalone',
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
  // 優化構建性能
  experimental: {
    // 減少構建追蹤的深度
    optimizePackageImports: ['lucide-react'],
  },
  webpack: (config, { isServer }) => {
    // html2pdf.js 是純客戶端庫，不應該在服務器端打包
    if (isServer) {
      config.externals = config.externals || []
      config.externals.push('html2pdf.js')
    }
    return config
  },
}

module.exports = nextConfig


