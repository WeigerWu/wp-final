'use client'

import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { trackPageView, trackEventClient } from '@/lib/analytics/tracking'
import { trackPageView as trackGA4PageView } from '@/lib/analytics/ga4'

/**
 * 頁面瀏覽追蹤元件
 * 自動追蹤所有頁面瀏覽事件
 */
export function PageViewTracker() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    // 組合完整路徑（包含查詢參數）
    const fullPath = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '')

    // 追蹤到自建系統
    trackPageView(fullPath, document.title)

    // 追蹤到 GA4
    trackGA4PageView(fullPath, document.title)
  }, [pathname, searchParams])

  return null
}
