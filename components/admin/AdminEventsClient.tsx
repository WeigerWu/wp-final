'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { formatDate, formatDateTime } from '@/lib/utils'
import { Calendar, User, Activity, TrendingUp, Users, Filter, Search, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface UserEvent {
  id: string
  user_id: string | null
  session_id: string | null
  event_type: string
  event_data: any
  page_path: string | null
  page_title: string | null
  user_agent: string | null
  ip_address: string | null
  created_at: string
  profiles?: {
    username: string
    display_name: string | null
  } | null
}

interface EventStats {
  stats: Record<string, { count: number; uniqueUsers: number }>
  totalEvents: number
  totalUniqueUsers: number
  period: { days: number; startDate: string }
}

interface ActiveUser {
  userId: string
  count: number
  lastActivity: string
  profile: {
    username: string
    display_name: string | null
    created_at: string
  } | null
}

interface AdminEventsClientProps {
  initialEvents: UserEvent[]
  initialCount: number
  initialStats: EventStats
  initialActiveUsers: ActiveUser[]
  currentPage: number
  currentUserId?: string
  currentEventType?: string
  currentDays: number
}

export function AdminEventsClient({
  initialEvents,
  initialCount,
  initialStats,
  initialActiveUsers,
  currentPage,
  currentUserId,
  currentEventType,
  currentDays,
}: AdminEventsClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [events, setEvents] = useState(initialEvents)
  const [count, setCount] = useState(initialCount)
  const [stats, setStats] = useState(initialStats)
  const [activeUsers, setActiveUsers] = useState(initialActiveUsers)
  const [loading, setLoading] = useState(false)

  const [filters, setFilters] = useState({
    userId: currentUserId || '',
    eventType: currentEventType || '',
    days: currentDays,
  })

  const totalPages = Math.ceil(count / 50)

  const updateFilters = (newFilters: Partial<typeof filters>) => {
    const updated = { ...filters, ...newFilters }
    setFilters(updated)

    const params = new URLSearchParams()
    if (updated.userId) params.set('userId', updated.userId)
    if (updated.eventType) params.set('eventType', updated.eventType)
    if (updated.days !== 7) params.set('days', updated.days.toString())
    if (currentPage > 1) params.set('page', currentPage.toString())

    router.push(`/admin/events?${params.toString()}`)
  }

  const clearFilters = () => {
    setFilters({ userId: '', eventType: '', days: 7 })
    router.push('/admin/events')
  }

  const eventTypeOptions = [
    'page_view',
    'view_recipe',
    'create_recipe',
    'edit_recipe',
    'delete_recipe',
    'favorite_recipe',
    'unfavorite_recipe',
    'rate_recipe',
    'add_comment',
    'search_recipes',
    'start_cooking_mode',
    'export_recipe',
    'view_profile',
    'follow_user',
    'unfollow_user',
    'login',
    'signup',
  ]

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold dark:text-gray-100">使用者行為追蹤</h1>
        <p className="text-gray-600 dark:text-gray-400">
          查看和分析使用者在平台上的活動記錄
        </p>
      </div>

      {/* 統計卡片 */}
      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-lg border bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">總事件數</p>
              <p className="mt-1 text-2xl font-bold dark:text-gray-100">
                {stats.totalEvents.toLocaleString()}
              </p>
            </div>
            <Activity className="h-8 w-8 text-blue-500" />
          </div>
          <p className="mt-2 text-xs text-gray-500">
            過去 {stats.period.days} 天
          </p>
        </div>

        <div className="rounded-lg border bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">活躍使用者</p>
              <p className="mt-1 text-2xl font-bold dark:text-gray-100">
                {stats.totalUniqueUsers.toLocaleString()}
              </p>
            </div>
            <Users className="h-8 w-8 text-green-500" />
          </div>
          <p className="mt-2 text-xs text-gray-500">
            過去 {stats.period.days} 天
          </p>
        </div>

        <div className="rounded-lg border bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">事件類型</p>
              <p className="mt-1 text-2xl font-bold dark:text-gray-100">
                {Object.keys(stats.stats).length}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-purple-500" />
          </div>
          <p className="mt-2 text-xs text-gray-500">不同類型</p>
        </div>

        <div className="rounded-lg border bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">活躍使用者</p>
              <p className="mt-1 text-2xl font-bold dark:text-gray-100">
                {activeUsers.length}
              </p>
            </div>
            <User className="h-8 w-8 text-orange-500" />
          </div>
          <p className="mt-2 text-xs text-gray-500">前 20 名</p>
        </div>
      </div>

      {/* 篩選器 */}
      <div className="mb-6 rounded-lg border bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="mb-4 flex items-center gap-2">
          <Filter className="h-5 w-5 text-gray-500" />
          <h2 className="text-lg font-semibold dark:text-gray-100">篩選條件</h2>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              使用者 ID
            </label>
            <input
              type="text"
              value={filters.userId}
              onChange={(e) => setFilters({ ...filters, userId: e.target.value })}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  updateFilters({ userId: filters.userId })
                }
              }}
              placeholder="輸入使用者 ID"
              className="w-full rounded-md border px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              事件類型
            </label>
            <select
              value={filters.eventType}
              onChange={(e) => updateFilters({ eventType: e.target.value })}
              className="w-full rounded-md border px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
            >
              <option value="">全部</option>
              {eventTypeOptions.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              時間範圍
            </label>
            <select
              value={filters.days}
              onChange={(e) => updateFilters({ days: parseInt(e.target.value) })}
              className="w-full rounded-md border px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
            >
              <option value="1">過去 1 天</option>
              <option value="7">過去 7 天</option>
              <option value="30">過去 30 天</option>
              <option value="90">過去 90 天</option>
            </select>
          </div>
          <div className="flex items-end gap-2">
            <Button onClick={() => updateFilters(filters)} className="flex-1">
              套用篩選
            </Button>
            {(filters.userId || filters.eventType || filters.days !== 7) && (
              <Button variant="outline" onClick={clearFilters}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* 事件類型統計 */}
      <div className="mb-6 rounded-lg border bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <h2 className="mb-4 text-lg font-semibold dark:text-gray-100">事件類型統計</h2>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
          {Object.entries(stats.stats)
            .sort((a, b) => b[1].count - a[1].count)
            .map(([eventType, data]) => (
              <div
                key={eventType}
                className="rounded-md border p-3 dark:border-gray-700"
                onClick={() => updateFilters({ eventType })}
                style={{ cursor: 'pointer' }}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium dark:text-gray-100">{eventType}</span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {data.count} 次
                  </span>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  {data.uniqueUsers} 位使用者
                </p>
              </div>
            ))}
        </div>
      </div>

      {/* 事件列表 */}
      <div className="rounded-lg border bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="border-b p-4 dark:border-gray-700">
          <h2 className="text-lg font-semibold dark:text-gray-100">
            事件記錄 ({count.toLocaleString()})
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                  時間
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                  使用者
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                  事件類型
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                  頁面
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                  詳細資料
                </th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-gray-700">
              {events.map((event) => (
                <tr key={event.id} className="hover:bg-gray-50 dark:hover:bg-gray-900">
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    <div>{formatDate(event.created_at)}</div>
                    <div className="text-xs text-gray-500">{formatDateTime(event.created_at)}</div>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {event.profiles ? (
                      <div>
                        <div className="font-medium dark:text-gray-100">
                          {event.profiles.display_name || event.profiles.username}
                        </div>
                        <div className="text-xs text-gray-500">{event.user_id?.slice(0, 8)}...</div>
                      </div>
                    ) : event.user_id ? (
                      <div className="text-gray-600 dark:text-gray-400">
                        {event.user_id.slice(0, 8)}...
                      </div>
                    ) : (
                      <div className="text-gray-400">匿名</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      {event.event_type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    {event.page_path ? (
                      <div>
                        <div className="truncate max-w-xs">{event.page_path}</div>
                        {event.page_title && (
                          <div className="text-xs text-gray-500">{event.page_title}</div>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {event.event_data && Object.keys(event.event_data).length > 0 ? (
                      <details className="cursor-pointer">
                        <summary className="text-blue-600 hover:text-blue-800 dark:text-blue-400">
                          查看
                        </summary>
                        <pre className="mt-2 max-h-32 overflow-auto rounded bg-gray-100 p-2 text-xs dark:bg-gray-900">
                          {JSON.stringify(event.event_data, null, 2)}
                        </pre>
                      </details>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 分頁 */}
        {totalPages > 1 && (
          <div className="border-t p-4 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                第 {currentPage} 頁，共 {totalPages} 頁
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  disabled={currentPage === 1}
                  onClick={() => {
                    const params = new URLSearchParams(searchParams.toString())
                    params.set('page', (currentPage - 1).toString())
                    router.push(`/admin/events?${params.toString()}`)
                  }}
                >
                  上一頁
                </Button>
                <Button
                  variant="outline"
                  disabled={currentPage === totalPages}
                  onClick={() => {
                    const params = new URLSearchParams(searchParams.toString())
                    params.set('page', (currentPage + 1).toString())
                    router.push(`/admin/events?${params.toString()}`)
                  }}
                >
                  下一頁
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

