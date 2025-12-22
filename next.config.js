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
  // 優化構建性能，減少構建追蹤的負擔
  experimental: {
    optimizePackageImports: ['lucide-react', '@supabase/supabase-js'],
  },
  // 排除不需要在構建追蹤中的目錄，避免堆疊溢出錯誤
  // 注意：包含空格的目錄名稱使用 .vercelignore 處理
  outputFileTracingExcludes: {
    '*': [
      'node_modules/@swc/core-linux-x64-gnu/**',
      'node_modules/@swc/core-linux-x64-musl/**',
      'node_modules/@esbuild/linux-x64/**',
      'scripts/**',
      'supabase/**',
      'docs/**',
    ],
  },
  webpack: (config, { isServer, dev }) => {
    // html2pdf.js 是純客戶端庫，不應該在服務器端打包
    if (isServer) {
      config.externals = config.externals || []
      config.externals.push('html2pdf.js')
    }
    // 在生產構建中禁用緩存以減少內存使用（可能幫助避免堆疊溢出）
    if (!dev) {
      config.cache = false
    }
    return config
  },
}

module.exports = nextConfig


