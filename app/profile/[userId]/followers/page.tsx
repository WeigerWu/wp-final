import { createServerSupabaseClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { getFollowers } from '@/lib/actions/follows'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Users } from 'lucide-react'

interface FollowersPageProps {
  params: {
    userId: string
  }
}

export default async function FollowersPage({ params }: FollowersPageProps) {
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

  // Get followers
  const followers = await getFollowers(userId, 100)

  const displayName = profile.display_name || profile.username || '用戶'

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
          {displayName} 的追蹤者
        </h1>
        <p className="mt-2 text-gray-600">
          共 {followers.length} 位追蹤者
        </p>
      </div>

      {/* Followers List */}
      {followers.length > 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white">
          <div className="divide-y divide-gray-200">
            {followers.map((follower: any) => {
              const followerDisplayName = follower.display_name || follower.username || '用戶'
              const followerHandle = follower.username ? `@${follower.username}` : '@user'
              
              return (
                <Link
                  key={follower.id}
                  href={`/profile/${follower.id}`}
                  className="flex items-center space-x-4 p-4 hover:bg-gray-50 transition-colors"
                >
                  {/* Avatar */}
                  <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-full border-2 border-gray-200 bg-gray-100">
                    {follower.avatar_url ? (
                      <Image
                        src={follower.avatar_url}
                        alt={followerDisplayName}
                        fill
                        className="object-cover"
                        sizes="48px"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xl font-bold text-gray-400">
                        {followerDisplayName[0]?.toUpperCase() || 'U'}
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {followerDisplayName}
                    </h3>
                    <p className="text-sm text-gray-600 truncate">
                      {followerHandle}
                    </p>
                    {follower.bio && (
                      <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                        {follower.bio}
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
          <p className="mt-4 text-gray-600">尚無追蹤者</p>
        </div>
      )}
    </div>
  )
}

