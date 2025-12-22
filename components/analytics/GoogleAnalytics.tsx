'use client'

import { useEffect } from 'react'
import Script from 'next/script'
import { useAuth } from '@/components/providers/AuthProvider'
import { setUserId, clearUserId } from '@/lib/analytics/ga4'

/**
 * Google Analytics 4 元件
 * 需要在環境變數中設定 NEXT_PUBLIC_GA4_MEASUREMENT_ID
 */
export function GoogleAnalytics() {
  const { user } = useAuth()
  const measurementId = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID

  useEffect(() => {
    if (!measurementId) {
      console.warn('GA4 Measurement ID 未設定，請檢查環境變數 NEXT_PUBLIC_GA4_MEASUREMENT_ID')
      return
    }

    // 設定或清除使用者 ID（GA4 腳本載入後會自動初始化）
    // 使用 setTimeout 確保腳本已載入
    const timer = setTimeout(() => {
      if (user) {
        setUserId(user.id)
      } else {
        clearUserId()
      }
    }, 100)

    return () => clearTimeout(timer)
  }, [user, measurementId])

  if (!measurementId) {
    return null
  }

  return (
    <>
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
      />
      <Script
        id="google-analytics"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${measurementId}', {
              page_path: window.location.pathname,
            });
          `,
        }}
      />
    </>
  )
}
