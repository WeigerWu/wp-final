import { searchUsers } from '@/lib/actions/users'
import { UserCard } from '@/components/users/UserCard'
import { Search } from 'lucide-react'

// 强制动态渲染，禁用缓存
export const dynamic = 'force-dynamic'

interface SearchUsersPageProps {
  searchParams: {
    search?: string
    page?: string
  }
}

export default async function SearchUsersPage({ searchParams }: SearchUsersPageProps) {
  const page = parseInt(searchParams.page || '1')
  const limit = 20
  const offset = (page - 1) * limit

  const users = await searchUsers({
    search: searchParams.search,
    limit,
    offset,
  })

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="mb-4 text-3xl font-bold text-gray-900 dark:text-gray-100">搜尋用戶</h1>
        {searchParams.search && (
          <p className="text-gray-600 dark:text-gray-400">
            搜尋「{searchParams.search}」的結果
          </p>
        )}
      </div>

      {/* Search Form */}
      <div className="mb-8">
        <form action="/users/search" method="get" className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              name="search"
              defaultValue={searchParams.search || ''}
              placeholder="搜尋用戶名稱..."
              className="w-full rounded-md border border-gray-300 py-2 pl-10 pr-4 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            />
          </div>
          <button
            type="submit"
            className="rounded-md bg-primary-600 px-4 py-2 text-white transition-colors hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            搜尋
          </button>
        </form>
      </div>

      {/* Results */}
      {users.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {users.map((user) => (
            <UserCard key={user.id} user={user} />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-12 text-center dark:border-gray-700 dark:bg-gray-800">
          <p className="text-gray-600 dark:text-gray-400">
            {searchParams.search
              ? `找不到符合「${searchParams.search}」的用戶`
              : '請輸入關鍵字來搜尋用戶'}
          </p>
        </div>
      )}
    </div>
  )
}


