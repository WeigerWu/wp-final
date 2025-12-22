'use client'

/**
 * 自建使用者行為追蹤系統（純前端版本）
 * 記錄使用者活動到 Supabase user_events 資料表
 *
 * 注意：
 * - 本檔案僅能在 Client Component / 瀏覽器環境使用
 * - 不可在 Server Component 或 Route Handler 中匯入
 */

import { createSupabaseClient } from '@/lib/supabase/client'

// 事件類型定義
export type EventType =
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
  | 'update_profile'

// 事件資料介面
export interface EventData {
  [key: string]: any
}

/**
 * 產生唯一的 session ID（用於匿名訪客追蹤）
 */
export function generateSessionId(): string {
  if (typeof window === 'undefined') {
    return `server-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  // 從 localStorage 取得或建立新的 session ID
  const storageKey = 'analytics_session_id'
  let sessionId = localStorage.getItem(storageKey)

  if (!sessionId) {
    sessionId = `client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    localStorage.setItem(storageKey, sessionId)
  }

  return sessionId
}

/**
 * 客戶端追蹤事件（用於 Client Components）
 */
export async function trackEventClient(
  eventType: EventType,
  eventData?: EventData,
  options?: {
    pagePath?: string
    pageTitle?: string
  }
) {
  try {
    const supabase = createSupabaseClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const userId = user?.id || null
    const sessionId = userId ? null : generateSessionId()
    const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : null

    const { error } = await (supabase.from('user_events') as any).insert({
      user_id: userId,
      session_id: sessionId,
      event_type: eventType,
      event_data: eventData || {},
      page_path: options?.pagePath || window.location.pathname,
      page_title: options?.pageTitle || document.title,
      user_agent: userAgent,
      ip_address: null, // 客戶端不記錄 IP（隱私考量）
    })

    if (error) {
      console.error('Error tracking event:', error)
    }
  } catch (error) {
    console.error('Error in trackEventClient:', error)
  }
}

/**
 * 追蹤頁面瀏覽（僅前端）
 */
export async function trackPageView(path: string, title?: string) {
  await trackEventClient('page_view', {}, { pagePath: path, pageTitle: title })
}

