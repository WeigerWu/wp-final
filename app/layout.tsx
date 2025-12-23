import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Suspense } from 'react'
import './globals.css'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { AuthProvider } from '@/components/providers/AuthProvider'
import { Chatbot } from '@/components/chatbot/Chatbot'
import { GoogleAnalytics } from '@/components/analytics/GoogleAnalytics'
import { PageViewTracker } from '@/components/analytics/PageViewTracker'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: "I'm cooked - 探索、分享、烹飪",
  description: "一個可供使用者上傳、探索與分享食譜的網站平台，結合社群互動與智慧推薦機制，形成一個活躍的烹飪社群",
  icons: {
    icon: [
      { url: '/imcook_icon.png', sizes: 'any' },
      { url: '/imcook_icon.png', type: 'image/png' },
    ],
    apple: '/imcook_icon.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-TW">
      <body className={inter.className}>
        <AuthProvider>
          <Suspense fallback={null}>
            <PageViewTracker />
          </Suspense>
          <div className="flex min-h-screen flex-col">
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
          <Chatbot />
        </AuthProvider>
        {process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID && (
          <GoogleAnalytics />
        )}
      </body>
    </html>
  )
}
