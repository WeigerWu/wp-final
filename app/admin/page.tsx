import { Suspense } from 'react'
import { AdminDashboard } from '@/components/admin/AdminDashboard'

export const metadata = {
  title: '數據分析後台 - I\'m cooked',
  description: '網站數據統計與分析',
}

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white">使用者行為追蹤</h1>
          <p className="mt-2 text-gray-400">查看和分析使用者在平台上的活動記錄</p>
        </div>
        <Suspense fallback={<AdminDashboardSkeleton />}>
          <AdminDashboard />
        </Suspense>
      </div>
    </div>
  )
}

function AdminDashboardSkeleton() {
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

