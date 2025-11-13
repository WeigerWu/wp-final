import Link from 'next/link'
import Image from 'next/image'
import { Recipe } from '@/types/recipe'
import { Star, Clock, Users } from 'lucide-react'
import { formatTime, truncate } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface RecipeCardProps {
  recipe: Recipe
  className?: string
}

export function RecipeCard({ recipe, className }: RecipeCardProps) {
  const difficultyColors = {
    easy: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    hard: 'bg-red-100 text-red-800',
  }

  const difficultyLabels = {
    easy: '簡單',
    medium: '中等',
    hard: '困難',
  }

  return (
    <Link href={`/recipes/${recipe.id}`} className={cn('block', className)}>
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md">
        {/* Recipe Image */}
        <div className="relative h-48 w-full overflow-hidden bg-gray-200">
          {recipe.image_url ? (
            <Image
              src={recipe.image_url}
              alt={recipe.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-gray-400">
              <span>無圖片</span>
            </div>
          )}
          {recipe.difficulty && (
            <div
              className={cn(
                'absolute right-2 top-2 rounded-full px-2 py-1 text-xs font-semibold',
                difficultyColors[recipe.difficulty]
              )}
            >
              {difficultyLabels[recipe.difficulty]}
            </div>
          )}
        </div>

        {/* Recipe Info */}
        <div className="p-4">
          <h3 className="mb-2 text-lg font-semibold text-gray-900 line-clamp-2">
            {recipe.title}
          </h3>
          {recipe.description && (
            <p className="mb-3 text-sm text-gray-600 line-clamp-2">
              {truncate(recipe.description, 100)}
            </p>
          )}

          {/* Recipe Meta */}
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center space-x-4">
              {recipe.average_rating && recipe.average_rating > 0 && (
                <div className="flex items-center space-x-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span>{recipe.average_rating.toFixed(1)}</span>
                  <span className="text-gray-400">
                    ({recipe.rating_count || 0})
                  </span>
                </div>
              )}
              {recipe.prep_time && (
                <div className="flex items-center space-x-1">
                  <Clock className="h-4 w-4" />
                  <span>{recipe.prep_time} 分鐘</span>
                </div>
              )}
              {recipe.servings && (
                <div className="flex items-center space-x-1">
                  <Users className="h-4 w-4" />
                  <span>{recipe.servings} 人份</span>
                </div>
              )}
            </div>
          </div>

          {/* Tags */}
          {recipe.tags && recipe.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {recipe.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Author */}
          {recipe.user && (
            <div className="mt-3 flex items-center space-x-2 border-t pt-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-xs text-gray-600">
                {recipe.user.username?.[0]?.toUpperCase() || 'U'}
              </div>
              <span className="text-xs text-gray-600">
                {recipe.user.username || '匿名用戶'}
              </span>
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}


