'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Profile } from '@/types/recipe'
import { User, Calendar } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface UserCardProps {
  user: Profile
  className?: string
}

export function UserCard({ user, className }: UserCardProps) {
  const displayName = user.username || '未命名用戶'
  const avatarInitial = displayName.charAt(0).toUpperCase()

  return (
    <Link href={`/profile/${user.id}`}>
      <div
        className={cn(
          'overflow-hidden rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800',
          className
        )}
      >
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            {user.avatar_url ? (
              <div className="relative h-16 w-16 overflow-hidden rounded-full">
                <Image
                  src={user.avatar_url}
                  alt={displayName}
                  fill
                  className="object-cover"
                  sizes="64px"
                />
              </div>
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-100 text-xl font-semibold text-primary-600 dark:bg-primary-900 dark:text-primary-300">
                {avatarInitial}
              </div>
            )}
          </div>

          {/* User Info */}
          <div className="flex-1 min-w-0">
            <div className="mb-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
                {displayName}
              </h3>
            </div>

            {/* Bio */}
            {user.bio && (
              <p className="mb-3 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                {user.bio}
              </p>
            )}

            {/* Created Date */}
            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-500">
              <Calendar className="h-3 w-3" />
              <span>加入於 {formatDate(user.created_at)}</span>
            </div>
          </div>

          {/* User Icon */}
          <div className="flex-shrink-0 text-gray-400 dark:text-gray-600">
            <User className="h-5 w-5" />
          </div>
        </div>
      </div>
    </Link>
  )
}


