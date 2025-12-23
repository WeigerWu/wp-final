'use client'

import { useEffect, useState } from 'react'
import { Activity, Users, BarChart3, Filter, TrendingUp } from 'lucide-react'

interface StatsData {
  totalEvents: number
  uniqueUsers: { count: number }
  uniqueSessions: { count: number }
  eventsByType: Array<{ type: string; count: number; userCount: number }>
  eventsByPage: Array<{ path: string; count: number }>
  recentEvents: Array<{
    id: string
    event_type: string
    page_path: string
    created_at: string
    user_id: string | null
    session_id: string | null
  }>
  topEventTypes: Array<{ type: string; count: number }>
}

const eventTypeLabels: Record<string, string> = {
  page_view: '頁面瀏覽',
  view_recipe: '查看食譜',
  create_recipe: '建立食譜',
  edit_recipe: '編輯食譜',
  delete_recipe: '刪除食譜',
  favorite_recipe: '收藏食譜',
  unfavorite_recipe: '取消收藏',
  rate_recipe: '評分食譜',
  add_comment: '新增留言',
  edit_comment: '編輯留言',
  delete_comment: '刪除留言',
  search_recipes: '搜尋食譜',
  start_cooking_mode: '開始烹飪模式',
  export_recipe: '匯出食譜',
  view_profile: '查看個人資料',
  follow_user: '追蹤用戶',
  unfollow_user: '取消追蹤',
  login: '登入',
  signup: '註冊',
  update_profile: '更新個人資料',
}

export function AdminDashboard() {
  const [stats, setStats] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // 篩選狀態
  const [eventType, setEventType] = useState<string>('all')
  const [timeRange, setTimeRange] = useState<string>('7days')
  const [userId, setUserId] = useState<string>('')

  useEffect(() => {
    fetchStats()
  }, [eventType, timeRange, userId])

  const fetchStats = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (eventType !== 'all') params.set('eventType', eventType)
      params.set('timeRange', timeRange)
      if (userId.trim()) params.set('userId', userId.trim())

      const response = await fetch(`/api/admin/stats?${params.toString()}`)
      if (!response.ok) {
        throw new Error('無法載入統計數據')
      }
      const data = await response.json()
      setStats(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : '載入失敗')
      console.error('Error fetching stats:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleApplyFilter = () => {
    fetchStats()
  }

  // 獲取所有可用的事件類型（用於下拉選單）
  const allEventTypes = stats?.eventsByType.map((e) => e.type) || []

  if (loading && !stats) {
    return <DashboardSkeleton />
  }

  if (error && !stats) {
    return (
      <div className="rounded-lg bg-red-900/20 border border-red-500/50 p-6 text-red-200">
        <p className="font-semibold">錯誤：{error}</p>
        <button
          onClick={fetchStats}
          className="mt-4 rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700"
        >
          重新載入
        </button>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="rounded-lg bg-gray-800 p-6 text-gray-400">
        沒有數據
      </div>
    )
  }

  const timeRangeLabels: Record<string, string> = {
    '1day': '過去1天',
    '7days': '過去7天',
    '30days': '過去30天',
    'all': '全部',
  }

  return (
    <div className="space-y-6">
      {/* 統計卡片 */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="總事件數"
          value={stats.totalEvents.toLocaleString()}
          subtitle={timeRangeLabels[timeRange]}
          icon={<Activity className="h-6 w-6" />}
          color="blue"
        />
        <StatCard
          title="活躍使用者"
          value={stats.uniqueUsers.count.toLocaleString()}
          subtitle={timeRangeLabels[timeRange]}
          icon={<Users className="h-6 w-6" />}
          color="green"
        />
        <StatCard
          title="事件類型"
          value={stats.eventsByType.length.toString()}
          subtitle="不同類型"
          icon={<BarChart3 className="h-6 w-6" />}
          color="purple"
        />
        <StatCard
          title="不重複頁面"
          value={stats.eventsByPage.length.toString()}
          subtitle="熱門頁面"
          icon={<TrendingUp className="h-6 w-6" />}
          color="orange"
        />
      </div>

      {/* 篩選條件 */}
      <div className="rounded-lg bg-gray-800 border border-gray-700 p-6">
        <div className="flex items-center mb-4">
          <Filter className="h-5 w-5 text-gray-400 mr-2" />
          <h2 className="text-xl font-semibold text-white">篩選條件</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              使用者 ID
            </label>
            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="輸入使用者 ID"
              className="w-full rounded-lg bg-gray-700 border border-gray-600 px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              事件類型
            </label>
            <select
              value={eventType}
              onChange={(e) => setEventType(e.target.value)}
              className="w-full rounded-lg bg-gray-700 border border-gray-600 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">全部</option>
              {allEventTypes.map((type) => (
                <option key={type} value={type}>
                  {eventTypeLabels[type] || type}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              時間範圍
            </label>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="w-full rounded-lg bg-gray-700 border border-gray-600 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="1day">過去1天</option>
              <option value="7days">過去7天</option>
              <option value="30days">過去30天</option>
              <option value="all">全部</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={handleApplyFilter}
              className="w-full rounded-lg bg-red-600 hover:bg-red-700 px-4 py-2 text-white font-medium transition-colors"
            >
              套用篩選
            </button>
          </div>
        </div>
      </div>

      {/* 事件類型統計 */}
      <div className="rounded-lg bg-gray-800 border border-gray-700 p-6">
        <h2 className="text-xl font-semibold text-white mb-4">事件類型統計</h2>
        <div className="space-y-3">
          {stats.eventsByType.map((item) => (
            <div
              key={item.type}
              className="flex items-center justify-between p-3 rounded-lg bg-gray-700/50 hover:bg-gray-700"
            >
              <div>
                <div className="text-white font-medium">
                  {eventTypeLabels[item.type] || item.type}
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <div className="text-white font-semibold">{item.count}</div>
                  <div className="text-xs text-gray-400">次</div>
                </div>
                <div className="text-right">
                  <div className="text-white font-semibold">{item.userCount}</div>
                  <div className="text-xs text-gray-400">位使用者</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 事件記錄 */}
      <div className="rounded-lg bg-gray-800 border border-gray-700 p-6">
        <h2 className="text-xl font-semibold text-white mb-4">
          事件記錄 ({stats.recentEvents.length})
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-gray-400 font-medium">時間</th>
                <th className="px-4 py-3 text-left text-gray-400 font-medium">事件類型</th>
                <th className="px-4 py-3 text-left text-gray-400 font-medium">頁面</th>
                <th className="px-4 py-3 text-left text-gray-400 font-medium">使用者</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentEvents.length > 0 ? (
                stats.recentEvents.map((event) => (
                  <tr key={event.id} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                    <td className="px-4 py-3 text-gray-300">
                      {new Date(event.created_at).toLocaleString('zh-TW')}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded bg-blue-600/20 text-blue-300 px-2 py-1 text-xs">
                        {eventTypeLabels[event.event_type] || event.event_type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-300">{event.page_path || '-'}</td>
                    <td className="px-4 py-3 text-gray-300">
                      {event.user_id ? (
                        <span className="text-xs">使用者</span>
                      ) : (
                        <span className="text-xs text-gray-500">匿名</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                    尚無事件記錄
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 熱門頁面（保留） */}
      <div className="rounded-lg bg-gray-800 border border-gray-700 p-6">
        <h2 className="text-xl font-semibold text-white mb-4">熱門頁面</h2>
        <div className="space-y-2">
          {stats.eventsByPage.slice(0, 10).map((item) => (
            <div
              key={item.path}
              className="flex items-center justify-between rounded-lg bg-gray-700/50 p-3 hover:bg-gray-700"
            >
              <span className="text-sm text-gray-300">{item.path || '(未知)'}</span>
              <span className="text-sm font-semibold text-white">
                {item.count.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

interface StatCardProps {
  title: string
  value: string
  subtitle: string
  icon: React.ReactNode
  color: 'blue' | 'green' | 'purple' | 'orange'
}

function StatCard({ title, value, subtitle, icon, color }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-500 text-white',
    green: 'bg-green-500 text-white',
    purple: 'bg-purple-500 text-white',
    orange: 'bg-orange-500 text-white',
  }

  return (
    <div className="rounded-lg bg-gray-800 border border-gray-700 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-400">{title}</p>
          <p className="mt-2 text-3xl font-bold text-white">{value}</p>
          <p className="mt-1 text-xs text-gray-500">{subtitle}</p>
        </div>
        <div className={`rounded-lg p-3 ${colorClasses[color]}`}>{icon}</div>
      </div>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-lg bg-gray-800 border border-gray-700 p-6">
            <div className="h-4 w-24 animate-pulse bg-gray-700"></div>
            <div className="mt-4 h-8 w-16 animate-pulse bg-gray-700"></div>
          </div>
        ))}
      </div>
      <div className="rounded-lg bg-gray-800 border border-gray-700 p-6">
        <div className="h-6 w-48 animate-pulse bg-gray-700"></div>
        <div className="mt-4 h-64 w-full animate-pulse bg-gray-700"></div>
      </div>
    </div>
  )
}
