import { Skeleton } from '@/components/ui/Skeleton'
import { RecipeCardSkeleton } from '@/components/ui/RecipeCardSkeleton'

export default function ProfileLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-8">
        {/* Profile Header */}
        <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="flex flex-col space-y-6 md:flex-row md:items-start md:space-x-6 md:space-y-0">
            {/* Avatar */}
            <div className="flex-shrink-0">
              <Skeleton className="h-32 w-32 rounded-full" />
            </div>

            {/* Profile Info */}
            <div className="flex-1 space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  {/* Display Name */}
                  <Skeleton className="h-9 w-48" />
                  {/* Username */}
                  <Skeleton className="h-6 w-32" />
                </div>
                <Skeleton className="h-10 w-32" />
              </div>

              {/* Bio */}
              <div className="space-y-2">
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-5/6" />
                <Skeleton className="h-5 w-4/6" />
              </div>

              {/* Stats */}
              <div className="flex items-center space-x-6">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-5 w-32" />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <div className="flex space-x-8">
            <Skeleton className="h-12 w-24" />
            <Skeleton className="h-12 w-24" />
          </div>
        </div>

        {/* Content - Recipe Cards */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <RecipeCardSkeleton key={index} />
          ))}
        </div>
      </div>
    </div>
  )
}

