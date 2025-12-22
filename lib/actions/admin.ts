/**
 * 後台管理相關的 Server Actions
 */

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { isAdmin } from '@/lib/utils/admin'

/**
 * 檢查使用者是否為管理員
 */
export async function checkAdminAccess(): Promise<boolean> {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return false
  }

  return isAdmin(user.id)
}

/**
 * 取得使用者事件列表（僅管理員）
 */
export async function getUserEvents(options: {
  limit?: number
  offset?: number
  userId?: string
  eventType?: string
  startDate?: string
  endDate?: string
}) {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || !isAdmin(user.id)) {
    throw new Error('Unauthorized: Admin access required')
  }

  // 使用 service role key 來繞過 RLS
  const { createClient } = await import('@supabase/supabase-js')
  const adminSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  let query = adminSupabase
    .from('user_events')
    .select('*, profiles:user_id(username, display_name)', { count: 'exact' })
    .order('created_at', { ascending: false })

  if (options.userId) {
    query = query.eq('user_id', options.userId)
  }

  if (options.eventType) {
    query = query.eq('event_type', options.eventType)
  }

  if (options.startDate) {
    query = query.gte('created_at', options.startDate)
  }

  if (options.endDate) {
    query = query.lte('created_at', options.endDate)
  }

  if (options.limit) {
    query = query.limit(options.limit)
  }

  if (options.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 50) - 1)
  }

  const { data, error, count } = await query

  if (error) {
    console.error('Error fetching user events:', error)
    throw error
  }

  return { data: data || [], count: count || 0 }
}

/**
 * 取得事件統計（僅管理員）
 */
export async function getEventStats(options: {
  days?: number
  eventType?: string
}) {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || !isAdmin(user.id)) {
    throw new Error('Unauthorized: Admin access required')
  }

  // 使用 service role key
  const { createClient } = await import('@supabase/supabase-js')
  const adminSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const days = options.days || 7
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  let query = adminSupabase
    .from('user_events')
    .select('event_type, created_at, user_id')
    .gte('created_at', startDate.toISOString())

  if (options.eventType) {
    query = query.eq('event_type', options.eventType)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching event stats:', error)
    throw error
  }

  // 統計各事件類型的數量
  const stats: Record<string, { count: number; uniqueUsers: number }> = {}
  const userSet = new Set<string>()

  data?.forEach((event: any) => {
    const eventType = event.event_type
    if (!stats[eventType]) {
      stats[eventType] = { count: 0, uniqueUsers: 0 }
    }
    stats[eventType].count++

    if (event.user_id) {
      userSet.add(event.user_id)
    }
  })

  // 計算各事件類型的唯一使用者數
  const eventUserMap = new Map<string, Set<string>>()
  data?.forEach((event: any) => {
    if (event.user_id) {
      const eventType = event.event_type
      if (!eventUserMap.has(eventType)) {
        eventUserMap.set(eventType, new Set())
      }
      eventUserMap.get(eventType)!.add(event.user_id)
    }
  })

  Object.keys(stats).forEach((eventType) => {
    stats[eventType].uniqueUsers = eventUserMap.get(eventType)?.size || 0
  })

  return {
    stats,
    totalEvents: data?.length || 0,
    totalUniqueUsers: userSet.size,
    period: { days, startDate: startDate.toISOString() },
  }
}

/**
 * 取得活躍使用者列表（僅管理員）
 */
export async function getActiveUsers(options: {
  days?: number
  limit?: number
}) {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || !isAdmin(user.id)) {
    throw new Error('Unauthorized: Admin access required')
  }

  // 使用 service role key
  const { createClient } = await import('@supabase/supabase-js')
  const adminSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const days = options.days || 7
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const { data, error } = await adminSupabase
    .from('user_events')
    .select('user_id, profiles:user_id(username, display_name, created_at)')
    .not('user_id', 'is', null)
    .gte('created_at', startDate.toISOString())
    .order('created_at', { ascending: false })
    .limit(options.limit || 100)

  if (error) {
    console.error('Error fetching active users:', error)
    throw error
  }

  // 統計每個使用者的活動次數
  const userActivityMap = new Map<string, { count: number; lastActivity: string; profile: any }>()

  data?.forEach((event: any) => {
    const userId = event.user_id
    if (!userActivityMap.has(userId)) {
      userActivityMap.set(userId, {
        count: 0,
        lastActivity: event.created_at,
        profile: event.profiles,
      })
    }
    const userData = userActivityMap.get(userId)!
    userData.count++
    if (new Date(event.created_at) > new Date(userData.lastActivity)) {
      userData.lastActivity = event.created_at
    }
  })

  return Array.from(userActivityMap.entries()).map(([userId, data]) => ({
    userId,
    ...data,
  }))
}

