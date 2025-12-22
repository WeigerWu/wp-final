/**
 * Google Analytics 4 (GA4) 整合
 * 使用 Next.js third-parties 套件
 */

// GA4 事件類型定義
export type GA4EventType =
  | 'page_view'
  | 'view_recipe'
  | 'create_recipe'
  | 'edit_recipe'
  | 'delete_recipe'
  | 'favorite_recipe'
  | 'unfavorite_recipe'
  | 'rate_recipe'
  | 'add_comment'
  | 'edit_comment'
  | 'delete_comment'
  | 'search_recipes'
  | 'start_cooking_mode'
  | 'export_recipe'
  | 'view_profile'
  | 'follow_user'
  | 'unfollow_user'
  | 'login'
  | 'signup'

// GA4 事件參數介面
export interface GA4EventParams {
  [key: string]: string | number | boolean | undefined
}

// 檢查是否在瀏覽器環境
export const isBrowser = typeof window !== 'undefined'

/**
 * 初始化 GA4（在客戶端執行）
 */
export function initGA4(measurementId: string) {
  if (!isBrowser) return

  // 載入 gtag
  if (typeof window.gtag === 'undefined') {
    const script = document.createElement('script')
    script.async = true
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`
    document.head.appendChild(script)

    window.dataLayer = window.dataLayer || []
    function gtag(...args: any[]) {
      window.dataLayer.push(args)
    }
    window.gtag = gtag

    gtag('js', new Date())
    gtag('config', measurementId, {
      page_path: window.location.pathname,
    })
  }
}

/**
 * 追蹤頁面瀏覽
 */
export function trackPageView(path: string, title?: string) {
  if (!isBrowser || typeof window.gtag === 'undefined') return

  window.gtag('config', process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID!, {
    page_path: path,
    page_title: title || document.title,
  })
}

/**
 * 追蹤自訂事件
 */
export function trackEvent(
  eventName: GA4EventType,
  eventParams?: GA4EventParams
) {
  if (!isBrowser || typeof window.gtag === 'undefined') return

  window.gtag('event', eventName, {
    ...eventParams,
    timestamp: new Date().toISOString(),
  })
}

/**
 * 設定使用者 ID（用於登入使用者）
 */
export function setUserId(userId: string) {
  if (!isBrowser || typeof window.gtag === 'undefined') return

  window.gtag('config', process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID!, {
    user_id: userId,
  })
}

/**
 * 清除使用者 ID（用於登出）
 */
export function clearUserId() {
  if (!isBrowser || typeof window.gtag === 'undefined') return

  window.gtag('config', process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID!, {
    user_id: null,
  })
}

// 擴展 Window 介面
declare global {
  interface Window {
    dataLayer: any[]
    gtag: (...args: any[]) => void
  }
}

