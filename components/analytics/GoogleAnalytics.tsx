'use client'

import { GoogleAnalytics as NextGoogleAnalytics } from '@next/third-parties/google'
import { useEffect } from 'react'
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

    // 設定或清除使用者 ID
    if (user) {
      setUserId(user.id)
    } else {
      clearUserId()
    }
  }, [user, measurementId])

  if (!measurementId) {
    return null
  }

  return <NextGoogleAnalytics gaId={measurementId} />
}

