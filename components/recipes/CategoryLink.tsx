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
        "inline-flex items-center rounded-full bg-primary-100 px-3 py-1.5 text-xs font-medium text-primary-800 transition-all duration-200 hover:bg-primary-200 hover:scale-105 active:scale-100 dark:bg-primary-900/30 dark:text-primary-300 dark:hover:bg-primary-900/50",
        className
      )}
    >
      {category.name}
    </Link>
  )
}






