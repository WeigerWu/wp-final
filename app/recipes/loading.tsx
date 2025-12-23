import { RecipeCardSkeleton } from '@/components/ui/RecipeCardSkeleton'

export default function RecipesLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="h-9 w-48 bg-gray-200 animate-pulse rounded dark:bg-gray-700 mb-4" />
        <div className="h-6 w-64 bg-gray-200 animate-pulse rounded dark:bg-gray-700" />
      </div>

      {/* Search and Filter */}
      <div className="mb-8 space-y-4">
        <div className="h-10 w-full bg-gray-200 animate-pulse rounded dark:bg-gray-700" />
        <div className="h-10 w-full bg-gray-200 animate-pulse rounded dark:bg-gray-700" />
      </div>

      {/* Recipes Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 12 }).map((_, index) => (
          <RecipeCardSkeleton key={index} />
        ))}
      </div>
    </div>
  )
}


