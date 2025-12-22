import { createServerSupabaseClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { getFollowing } from '@/lib/actions/follows'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Users } from 'lucide-react'

// 強制動態渲染（因為使用了 cookies）
export const dynamic = 'force-dynamic'

interface FollowingPageProps {
  params: {
    userId: string
  }
}

export default async function FollowingPage({ params }: FollowingPageProps) {
  const supabase = await createServerSupabaseClient()
  const { userId } = params

  // Get profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('username, display_name')
    .eq('id', userId)
    .single()

  if (profileError || !profile) {
    notFound()
  }

  // Type assertion for profile
  const profileData = profile as { username?: string; display_name?: string }

  // Get following
  const following = await getFollowing(userId, 100)

  const displayName = profileData.display_name || profileData.username || '用戶'

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <Link
          href={`/profile/${userId}`}
          className="mb-4 inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>返回個人資料</span>
        </Link>
        <h1 className="text-3xl font-bold">
          {displayName} 追蹤的用戶
        </h1>
        <p className="mt-2 text-gray-600">
          共追蹤 {following.length} 位用戶
        </p>
      </div>

      {/* Following List */}
      {following.length > 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white">
          <div className="divide-y divide-gray-200">
            {following.map((user: any) => {
              const userDisplayName = user.display_name || user.username || '用戶'
              const userHandle = user.username ? `@${user.username}` : '@user'
              
              return (
                <Link
                  key={user.id}
                  href={`/profile/${user.id}`}
                  className="flex items-center space-x-4 p-4 hover:bg-gray-50 transition-colors"
                >
                  {/* Avatar */}
                  <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-full border-2 border-gray-200 bg-gray-100">
                    {user.avatar_url ? (
                      <Image
                        src={user.avatar_url}
                        alt={userDisplayName}
                        fill
                        className="object-cover"
                        sizes="48px"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xl font-bold text-gray-400">
                        {userDisplayName[0]?.toUpperCase() || 'U'}
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {userDisplayName}
                    </h3>
                    <p className="text-sm text-gray-600 truncate">
                      {userHandle}
                    </p>
                    {user.bio && (
                      <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                        {user.bio}
                      </p>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-12 text-center">
          <Users className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-4 text-gray-600">尚未追蹤任何用戶</p>
        </div>
      )}
    </div>
  )
}


