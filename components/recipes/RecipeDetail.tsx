'use client'

import Image from 'next/image'
import { Recipe } from '@/types/recipe'
import { Star, Clock, Users, Heart, ChefHat, Edit, Trash2 } from 'lucide-react'
import { formatDate, formatTime } from '@/lib/utils'
import { useState, useEffect } from 'react'
import { createSupabaseClient } from '@/lib/supabase/client'
import { favoriteRecipe, unfavoriteRecipe, deleteRecipe } from '@/lib/actions/recipes'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'
import { CookingMode } from './CookingMode'
import { TagLink } from './TagLink'
import { CategoryLink } from './CategoryLink'

interface RecipeDetailProps {
  recipe: Recipe
}

export function RecipeDetail({ recipe: initialRecipe }: RecipeDetailProps) {
  const [recipe, setRecipe] = useState(initialRecipe)
  const [isCookingMode, setIsCookingMode] = useState(false)
  const [isFavorited, setIsFavorited] = useState(recipe.is_favorited || false)
  const router = useRouter()
  const supabase = createSupabaseClient()
  const [currentUser, setCurrentUser] = useState<any>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setCurrentUser(data.user)
    })
  }, [])

  const isOwner = currentUser?.id === recipe.user_id

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

  const handleFavorite = async () => {
    try {
      if (isFavorited) {
        await unfavoriteRecipe(recipe.id)
        setIsFavorited(false)
      } else {
        await favoriteRecipe(recipe.id)
        setIsFavorited(true)
      }
    } catch (error) {
      console.error('Error favoriting recipe:', error)
    }
  }

  const handleDelete = async () => {
    if (!confirm('確定要刪除此食譜嗎？')) return
    try {
      await deleteRecipe(recipe.id)
      router.push('/recipes')
    } catch (error) {
      console.error('Error deleting recipe:', error)
      alert('刪除失敗，請稍後再試')
    }
  }

  if (isCookingMode) {
    return <CookingMode recipe={recipe} onExit={() => setIsCookingMode(false)} />
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="mb-2 text-3xl font-bold md:text-4xl">{recipe.title}</h1>
            {recipe.description && (
              <p className="text-lg text-gray-600">{recipe.description}</p>
            )}
          </div>
          {isOwner && (
            <div className="ml-4 flex gap-2">
              <Link href={`/recipes/${recipe.id}/edit`}>
                <Button variant="outline" size="sm">
                  <Edit className="mr-2 h-4 w-4" />
                  編輯
                </Button>
              </Link>
              <Button variant="outline" size="sm" onClick={handleDelete}>
                <Trash2 className="mr-2 h-4 w-4" />
                刪除
              </Button>
            </div>
          )}
        </div>

        {/* Meta Info */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
          {recipe.user && (
            <Link 
              href={`/profile/${recipe.user_id}`}
              className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
            >
              {recipe.user.avatar_url ? (
                <div className="relative h-8 w-8 overflow-hidden rounded-full">
                  <Image
                    src={recipe.user.avatar_url}
                    alt={recipe.user.username || '用戶'}
                    fill
                    className="object-cover"
                    sizes="32px"
                  />
                </div>
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-sm text-gray-600">
                  {recipe.user.username?.[0]?.toUpperCase() || 'U'}
                </div>
              )}
              <span>{recipe.user.username || '匿名用戶'}</span>
            </Link>
          )}
          <span>•</span>
          <span>{formatDate(recipe.created_at)}</span>
          {recipe.difficulty && (
            <>
              <span>•</span>
              <span
                className={`rounded-full px-2 py-1 text-xs font-semibold ${
                  difficultyColors[recipe.difficulty]
                }`}
              >
                {difficultyLabels[recipe.difficulty]}
              </span>
            </>
          )}
        </div>

        {/* Stats */}
        <div className="flex flex-wrap items-center gap-6">
          {recipe.rating_count && recipe.rating_count > 0 ? (
            <div className="flex items-center space-x-1">
              <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
              <span className="font-semibold">{recipe.average_rating?.toFixed(1) || '0.0'}</span>
              <span className="text-gray-500">({recipe.rating_count}人評分)</span>
            </div>
          ) : (
            <div className="flex items-center space-x-1">
              <Star className="h-5 w-5 text-gray-300" />
              <span className="text-gray-500">0人評分</span>
            </div>
          )}
          {recipe.prep_time && (
            <div className="flex items-center space-x-1">
              <Clock className="h-5 w-5" />
              <span>準備時間：{formatTime(recipe.prep_time)}</span>
            </div>
          )}
          {recipe.cook_time && (
            <div className="flex items-center space-x-1">
              <Clock className="h-5 w-5" />
              <span>烹飪時間：{formatTime(recipe.cook_time)}</span>
            </div>
          )}
          {recipe.servings && (
            <div className="flex items-center space-x-1">
              <Users className="h-5 w-5" />
              <span>{recipe.servings} 人份</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4">
          {/* Favorite */}
          <button
            onClick={handleFavorite}
            disabled={!currentUser}
            className="disabled:opacity-50"
          >
            <Heart
              className={`h-5 w-5 ${
                isFavorited ? 'fill-red-500 text-red-500' : 'text-gray-400'
              }`}
            />
          </button>
          {/* Cooking Mode */}
          <Button onClick={() => setIsCookingMode(true)}>
            <ChefHat className="mr-2 h-4 w-4" />
            烹飪模式
          </Button>
        </div>
      </div>

      {/* Recipe Image */}
      {recipe.image_url && (
        <div className="relative h-96 w-full overflow-hidden rounded-lg bg-gray-200">
          <Image
            src={recipe.image_url}
            alt={recipe.title}
            fill
            className="object-cover"
            sizes="100vw"
            priority
          />
        </div>
      )}

      {/* Ingredients */}
      <section>
        <h2 className="mb-4 text-2xl font-bold">食材</h2>
        <ul className="space-y-2">
          {recipe.ingredients.map((ingredient, index) => (
            <li key={index} className="flex items-center space-x-2">
              <span className="h-2 w-2 rounded-full bg-primary-600"></span>
              <span>
                {ingredient.amount} {ingredient.unit || ''} {ingredient.name}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* Steps */}
      <section>
        <h2 className="mb-4 text-2xl font-bold">步驟</h2>
        <ol className="space-y-6">
          {recipe.steps.map((step, index) => (
            <li key={index} className="flex space-x-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-600 text-white font-semibold">
                {step.step_number || index + 1}
              </div>
              <div className="flex-1">
                <p className="text-gray-700">{step.instruction}</p>
                {step.image_url && (
                  <div className="mt-2 relative h-48 w-full max-w-md overflow-hidden rounded-lg bg-gray-200">
                    <Image
                      src={step.image_url}
                      alt={`步驟 ${step.step_number || index + 1}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  </div>
                )}
                {step.timer_minutes && (
                  <div className="mt-2 flex items-center space-x-1 text-sm text-gray-500">
                    <Clock className="h-4 w-4" />
                    <span>計時 {step.timer_minutes} 分鐘</span>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Category */}
      {recipe.category && (
        <section className="mt-12">
          <h2 className="mb-4 text-2xl font-bold">分類</h2>
          <div className="flex flex-wrap gap-2">
            <CategoryLink category={recipe.category} />
          </div>
        </section>
      )}

      {/* Tags */}
      {recipe.tags && recipe.tags.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-4 text-2xl font-bold">標籤</h2>
          <div className="flex flex-wrap gap-2">
            {recipe.tags.map((tag) => (
              <TagLink key={tag} tag={tag} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

