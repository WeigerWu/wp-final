import { createServerSupabaseClient } from '@/lib/supabase/server'
import { isAdmin } from '@/lib/utils/admin'

export default async function AdminDebugPage() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const adminIds = process.env.ADMIN_USER_IDS?.split(',').map((id) => id.trim()) || []
  const isUserAdmin = user ? isAdmin(user.id) : false

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-4 text-2xl font-bold">管理員權限診斷</h1>
      
      <div className="space-y-4 rounded-lg border bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div>
          <h2 className="mb-2 font-semibold">1. 使用者登入狀態</h2>
          {user ? (
            <div className="text-green-600 dark:text-green-400">
              ✅ 已登入
            </div>
          ) : (
            <div className="text-red-600 dark:text-red-400">
              ❌ 未登入 - 請先登入
            </div>
          )}
        </div>

        <div>
          <h2 className="mb-2 font-semibold">2. 你的使用者 ID</h2>
          {user ? (
            <div className="rounded bg-gray-100 p-2 font-mono text-sm dark:bg-gray-900">
              {user.id}
            </div>
          ) : (
            <div className="text-gray-500">未登入</div>
          )}
        </div>

        <div>
          <h2 className="mb-2 font-semibold">3. 環境變數 ADMIN_USER_IDS</h2>
          {process.env.ADMIN_USER_IDS ? (
            <div>
              <div className="mb-2 text-green-600 dark:text-green-400">
                ✅ 已設定
              </div>
              <div className="rounded bg-gray-100 p-2 font-mono text-sm dark:bg-gray-900">
                {process.env.ADMIN_USER_IDS}
              </div>
            </div>
          ) : (
            <div className="text-red-600 dark:text-red-400">
              ❌ 未設定 - 請在 .env.local 中加入 ADMIN_USER_IDS=你的使用者ID
            </div>
          )}
        </div>

        <div>
          <h2 className="mb-2 font-semibold">4. 解析後的管理員 ID 列表</h2>
          {adminIds.length > 0 ? (
            <div>
              <div className="mb-2 text-sm text-gray-600 dark:text-gray-400">
                共 {adminIds.length} 個管理員 ID：
              </div>
              <div className="space-y-1">
                {adminIds.map((id, index) => (
                  <div
                    key={index}
                    className={`rounded p-2 font-mono text-sm ${
                      user && id === user.id
                        ? 'bg-green-100 dark:bg-green-900'
                        : 'bg-gray-100 dark:bg-gray-900'
                    }`}
                  >
                    {id}
                    {user && id === user.id && (
                      <span className="ml-2 text-green-600 dark:text-green-400">
                        ← 這是你的 ID
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-gray-500">無管理員 ID</div>
          )}
        </div>

        <div>
          <h2 className="mb-2 font-semibold">5. 權限檢查結果</h2>
          {isUserAdmin ? (
            <div className="rounded bg-green-100 p-4 text-green-800 dark:bg-green-900 dark:text-green-200">
              ✅ 你是管理員！可以訪問 /admin/events
            </div>
          ) : (
            <div className="rounded bg-red-100 p-4 text-red-800 dark:bg-red-900 dark:text-red-200">
              ❌ 你不是管理員
              {!user && ' - 請先登入'}
              {user && adminIds.length > 0 && ' - 你的 ID 不在管理員列表中'}
              {user && adminIds.length === 0 && ' - 環境變數未設定'}
            </div>
          )}
        </div>

        <div className="mt-6 rounded bg-blue-50 p-4 dark:bg-blue-900/20">
          <h3 className="mb-2 font-semibold">💡 如何修正：</h3>
          <ol className="list-decimal space-y-1 pl-5 text-sm">
            <li>確認你已登入（上方顯示 ✅ 已登入）</li>
            <li>複製「你的使用者 ID」（上方第 2 項）</li>
            <li>在專案根目錄的 <code className="rounded bg-gray-200 px-1 dark:bg-gray-700">.env.local</code> 檔案中加入：
              <pre className="mt-2 rounded bg-gray-800 p-2 text-white">
                ADMIN_USER_IDS=你的使用者ID
              </pre>
            </li>
            <li>重新啟動開發伺服器（Ctrl+C 然後 npm run dev）</li>
            <li>重新訪問 <code className="rounded bg-gray-200 px-1 dark:bg-gray-700">/admin/events</code></li>
          </ol>
        </div>
      </div>
    </div>
  )
}

