import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div 
      className={cn(
        "animate-pulse bg-gray-200 rounded dark:bg-gray-700",
        className
      )}
      aria-label="載入中"
    />
  )
}

