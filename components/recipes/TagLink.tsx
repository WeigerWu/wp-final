'use client'

import Link from 'next/link'
import { generateTagSlug } from '@/lib/utils/tags'
import { cn } from '@/lib/utils'

interface TagLinkProps {
  tag: string
  className?: string
  onClick?: (e: React.MouseEvent) => void
}

export function TagLink({ tag, className, onClick }: TagLinkProps) {
  const tagSlug = generateTagSlug(tag)
  const href = `/recipes/tag/${tagSlug}`

  return (
    <Link
      href={href}
      onClick={(e) => {
        // 如果提供了 onClick，先執行它（可能用於停止事件冒泡）
        if (onClick) {
          onClick(e)
        }
      }}
      className={cn(
        'inline-block rounded-full bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 transition-all duration-200 hover:bg-gray-200 hover:text-gray-900 hover:scale-105 active:scale-100 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 dark:hover:text-gray-100',
        className
      )}
    >
      #{tag}
    </Link>
  )
}

