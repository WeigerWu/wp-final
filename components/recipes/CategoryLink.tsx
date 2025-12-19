'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'

interface CategoryLinkProps {
  category: {
    id: string
    name: string
    slug: string
  }
  className?: string
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void
}

export function CategoryLink({ category, className, onClick }: CategoryLinkProps) {
  const categorySlug = encodeURIComponent(category.slug)
  return (
    <Link
      href={`/recipes/category/${categorySlug}`}
      onClick={onClick}
      className={cn(
        "inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 transition-colors hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:hover:bg-blue-800",
        className
      )}
    >
      {category.name}
    </Link>
  )
}




