import { Skeleton } from '@/components/ui/Skeleton'

export default function RecipeDetailLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {/* Title */}
              <Skeleton className="mb-2 h-10 w-3/4 md:h-12" />
              {/* Description */}
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-5/6" />
            </div>
          </div>

          {/* Meta Info */}
          <div className="flex flex-wrap items-center gap-4">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-4 rounded-full" />
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-4 w-4 rounded-full" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>

          {/* Stats */}
          <div className="flex flex-wrap items-center gap-6">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-6 w-28" />
            <Skeleton className="h-6 w-24" />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>

        {/* Recipe Image */}
        <Skeleton className="h-64 w-full rounded-lg md:h-96" />

        {/* Ingredients */}
        <section>
          <Skeleton className="mb-4 h-8 w-16" />
          <ul className="space-y-2">
            {Array.from({ length: 6 }).map((_, index) => (
              <li key={index} className="flex items-center space-x-2">
                <Skeleton className="h-2 w-2 rounded-full" />
                <Skeleton className="h-5 w-48" />
              </li>
            ))}
          </ul>
        </section>

        {/* Steps */}
        <section>
          <Skeleton className="mb-4 h-8 w-16" />
          <ol className="space-y-6">
            {Array.from({ length: 4 }).map((_, index) => (
              <li key={index} className="flex space-x-4">
                <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-full" />
                  <Skeleton className="h-5 w-5/6" />
                  <Skeleton className="h-5 w-4/6" />
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* Category and Tags */}
        <div className="space-y-6">
          <section>
            <Skeleton className="mb-4 h-8 w-16" />
            <Skeleton className="h-8 w-24 rounded-full" />
          </section>
          <section>
            <Skeleton className="mb-4 h-8 w-16" />
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-8 w-20 rounded-full" />
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

