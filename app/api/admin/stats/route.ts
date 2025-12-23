import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// 這個路由需要動態渲染
export const dynamic = 'force-dynamic'

// 建立基礎查詢的 helper 函數
function buildBaseQuery(
  supabase: any,
  timeFilterDate: Date | null,
  eventType: string | null,
  userId: string | null,
  selectFields: string = '*'
) {
  let query = supabase.from('user_events').select(selectFields)
  
  if (timeFilterDate) {
    query = query.gte('created_at', timeFilterDate.toISOString())
  }
  
  if (eventType && eventType !== 'all') {
    query = query.eq('event_type', eventType)
  }
  
  if (userId && userId.trim()) {
    query = query.eq('user_id', userId.trim())
  }
  
  return query
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const eventType = searchParams.get('eventType')
    const timeRange = searchParams.get('timeRange') || '7days'
    const userId = searchParams.get('userId')

    const supabase = await createServerSupabaseClient()

    // 計算時間範圍
    let timeFilterDate: Date | null = null
    switch (timeRange) {
      case '1day':
        timeFilterDate = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
        break
      case '7days':
        timeFilterDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        break
      case '30days':
        timeFilterDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        break
      case 'all':
      default:
        timeFilterDate = null
    }

    // 計算各種統計數據（使用篩選條件）
    const [
      totalEventsResult,
      uniqueUsersResult,
      uniqueSessionsResult,
      eventsByTypeResult,
      eventsByPageResult,
      recentEventsResult,
      topEventTypesResult,
    ] = await Promise.all([
      // 總事件數
      (async () => {
        let query = supabase.from('user_events').select('id', { count: 'exact', head: true })
        if (timeFilterDate) {
          query = query.gte('created_at', timeFilterDate.toISOString())
        }
        if (eventType && eventType !== 'all') {
          query = query.eq('event_type', eventType)
        }
        if (userId && userId.trim()) {
          query = query.eq('user_id', userId.trim())
        }
        const { count } = await query
        return { count: count || 0 }
      })(),

      // 獨立使用者數（有 user_id 的）
      (async () => {
        let query = buildBaseQuery(supabase, timeFilterDate, eventType, userId, 'user_id')
          .not('user_id', 'is', null)
        const { data } = await query
        if (!data) return { count: 0 }
        const uniqueUserIds = new Set(data.map((e: any) => e.user_id))
        return { count: uniqueUserIds.size }
      })(),

      // 獨立會話數（有 session_id 的）
      (async () => {
        let query = buildBaseQuery(supabase, timeFilterDate, eventType, userId, 'session_id')
          .not('session_id', 'is', null)
        const { data } = await query
        if (!data) return { count: 0 }
        const uniqueSessions = new Set(data.map((e: any) => e.session_id))
        return { count: uniqueSessions.size }
      })(),

      // 依事件類型分組（計算每種類型的數量和使用者數）
      (async () => {
        let query = buildBaseQuery(supabase, timeFilterDate, null, userId, 'event_type, user_id')
        const { data, error } = await query
        if (error || !data) return []
        const typeData: Record<string, { count: number; users: Set<string> }> = {}
        data.forEach((e: any) => {
          if (!typeData[e.event_type]) {
            typeData[e.event_type] = { count: 0, users: new Set() }
          }
          typeData[e.event_type].count++
          if (e.user_id) {
            typeData[e.event_type].users.add(e.user_id)
          }
        })
        return Object.entries(typeData).map(([type, data]) => ({
          type,
          count: data.count,
          userCount: data.users.size,
        }))
      })(),

      // 依頁面路徑分組（前 20 個）
      (async () => {
        let query = buildBaseQuery(supabase, timeFilterDate, eventType, userId, 'page_path')
        const { data, error } = await query
        if (error || !data) return []
        const counts: Record<string, number> = {}
        data.forEach((e: any) => {
          const path = e.page_path || 'unknown'
          counts[path] = (counts[path] || 0) + 1
        })
        return Object.entries(counts)
          .map(([path, count]) => ({ path, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 20)
      })(),

      // 最近事件（最多 50 個）
      (async () => {
        let query = buildBaseQuery(
          supabase,
          timeFilterDate,
          eventType,
          userId,
          'id, event_type, page_path, created_at, user_id, session_id'
        )
          .order('created_at', { ascending: false })
          .limit(50)
        const { data } = await query
        return data || []
      })(),

      // 熱門事件類型（前 10 個）
      (async () => {
        let query = buildBaseQuery(supabase, timeFilterDate, null, userId, 'event_type')
        const { data, error } = await query
        if (error || !data) return []
        const counts: Record<string, number> = {}
        data.forEach((e: any) => {
          counts[e.event_type] = (counts[e.event_type] || 0) + 1
        })
        return Object.entries(counts)
          .map(([type, count]) => ({ type, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10)
      })(),
    ])

    return NextResponse.json({
      totalEvents: totalEventsResult.count || 0,
      uniqueUsers: uniqueUsersResult,
      uniqueSessions: uniqueSessionsResult,
      eventsByType: eventsByTypeResult,
      eventsByPage: eventsByPageResult,
      recentEvents: recentEventsResult,
      topEventTypes: topEventTypesResult,
    })
  } catch (error) {
    console.error('[API /api/admin/stats] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    )
  }
}
