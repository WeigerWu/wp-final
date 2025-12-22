import { redirect } from 'next/navigation'
import { checkAdminAccess, getUserEvents, getEventStats, getActiveUsers } from '@/lib/actions/admin'
import { AdminEventsClient } from '@/components/admin/AdminEventsClient'

export const metadata = {
  title: '使用者行為追蹤 - 後台管理',
  description: '查看使用者行為數據和活動記錄',
}

export default async function AdminEventsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  // 檢查管理員權限
  const isAdmin = await checkAdminAccess()
  if (!isAdmin) {
    redirect('/')
  }

  // 解析查詢參數
  const page = parseInt(searchParams.page as string) || 1
  const limit = 50
  const offset = (page - 1) * limit
  const userId = searchParams.userId as string | undefined
  const eventType = searchParams.eventType as string | undefined
  const days = parseInt(searchParams.days as string) || 7

  // 取得數據
  const [eventsData, statsData, activeUsersData] = await Promise.all([
    getUserEvents({
      limit,
      offset,
      userId,
      eventType,
    }),
    getEventStats({
      days,
    }),
    getActiveUsers({
      days,
      limit: 20,
    }),
  ])

  return (
    <AdminEventsClient
      initialEvents={eventsData.data}
      initialCount={eventsData.count}
      initialStats={statsData}
      initialActiveUsers={activeUsersData}
      currentPage={page}
      currentUserId={userId}
      currentEventType={eventType}
      currentDays={days}
    />
  )
}

