import { Skeleton } from './Skeleton'

export function RecipeCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
      {/* Recipe Image */}
      <div className="relative h-48 w-full overflow-hidden">
        <Skeleton className="h-full w-full" />
      </div>

      {/* Recipe Info */}
      <div className="p-4">
        {/* Title */}
        <Skeleton className="mb-2 h-6 w-3/4" />
        <Skeleton className="mb-3 h-5 w-1/2" />

        {/* Description */}
        <Skeleton className="mb-2 h-4 w-full" />
        <Skeleton className="mb-3 h-4 w-5/6" />

        {/* Meta Info */}
        <div className="mb-3 space-y-2">
          <div className="flex items-center space-x-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="flex items-center space-x-4">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>

        {/* Category */}
        <Skeleton className="mb-3 h-6 w-20 rounded-full" />

        {/* Tags */}
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-5 w-14 rounded-full" />
        </div>
      </div>
    </div>
  )
}


