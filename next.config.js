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
  // 關閉 Output File Tracing 以解決堆疊溢出錯誤
  outputFileTracing: false,
  // 優化套件導入
  experimental: {
    optimizePackageImports: ['lucide-react', '@supabase/supabase-js'],
  },
  webpack: (config, { isServer }) => {
    // html2pdf.js 僅在客戶端使用
    if (isServer) {
      config.externals = config.externals || []
      config.externals.push('html2pdf.js')
    }
    return config
  },
}

module.exports = nextConfig


