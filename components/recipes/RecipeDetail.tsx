'use client'

import Image from 'next/image'
import { Recipe } from '@/types/recipe'
import { Star, Clock, Users, Heart, ChefHat, Edit, Trash2, Download, FileText, File } from 'lucide-react'
import { formatDate, formatTime } from '@/lib/utils'
import { useState, useEffect } from 'react'
import { createSupabaseClient } from '@/lib/supabase/client'
import { favoriteRecipe, unfavoriteRecipe, deleteRecipe } from '@/lib/actions/recipes'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import Link from 'next/link'
import { CookingMode } from './CookingMode'
import { TagLink } from './TagLink'
import { CategoryLink } from './CategoryLink'
import { exportRecipeToTextFile, exportRecipeToJSONFile, exportRecipeToPDF } from '@/lib/utils/recipe-export'

interface RecipeDetailProps {
  recipe: Recipe
}

export function RecipeDetail({ recipe: initialRecipe }: RecipeDetailProps) {
  const [recipe, setRecipe] = useState(initialRecipe)
  const [isCookingMode, setIsCookingMode] = useState(false)
  const [isFavorited, setIsFavorited] = useState(recipe.is_favorited || false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
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
    easy: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    hard: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
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

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true)
  }

  const handleDeleteConfirm = async () => {
    setShowDeleteConfirm(false)
    setIsDeleting(true)
    try {
      await deleteRecipe(recipe.id)
      router.push('/recipes')
    } catch (error) {
      console.error('Error deleting recipe:', error)
      alert('刪除失敗，請稍後再試')
      setIsDeleting(false)
    }
  }

  const [showExportMenu, setShowExportMenu] = useState(false)

  const handleExportText = () => {
    exportRecipeToTextFile(recipe)
    setShowExportMenu(false)
  }

  const handleExportJSON = () => {
    exportRecipeToJSONFile(recipe)
    setShowExportMenu(false)
  }

  const handleExportPDF = async () => {
    try {
      await exportRecipeToPDF(recipe)
      setShowExportMenu(false)
    } catch (error) {
      console.error('Error exporting PDF:', error)
      alert('PDF 匯出失敗，請稍後再試')
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
            <h1 className="mb-2 text-3xl font-bold md:text-4xl dark:text-gray-100">{recipe.title}</h1>
            {recipe.description && (
              <p className="text-lg text-gray-600 dark:text-gray-400">{recipe.description}</p>
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
              <Button variant="outline" size="sm" onClick={handleDeleteClick} disabled={isDeleting}>
                <Trash2 className="mr-2 h-4 w-4" />
                刪除
              </Button>
            </div>
          )}
        </div>

        {/* Meta Info */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
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
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-sm text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                  {recipe.user.username?.[0]?.toUpperCase() || 'U'}
                </div>
              )}
              <span>{recipe.user.username || '匿名用戶'}</span>
            </Link>
          )}
          <span className="dark:text-gray-500">•</span>
          <span>{formatDate(recipe.created_at)}</span>
          {recipe.difficulty && (
            <>
              <span className="dark:text-gray-500">•</span>
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
        <div className="flex flex-wrap items-center gap-6 dark:text-gray-300">
          {recipe.rating_count && recipe.rating_count > 0 ? (
            <div className="flex items-center space-x-1">
              <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
              <span className="font-semibold">{recipe.average_rating?.toFixed(1) || '0.0'}</span>
              <span className="text-gray-500 dark:text-gray-400">({recipe.rating_count}人評分)</span>
            </div>
          ) : (
            <div className="flex items-center space-x-1">
              <Star className="h-5 w-5 text-gray-300 dark:text-gray-600" />
              <span className="text-gray-500 dark:text-gray-400">0人評分</span>
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
                isFavorited ? 'fill-red-500 text-red-500' : 'text-gray-400 dark:text-gray-500'
              }`}
            />
          </button>
          {/* Cooking Mode */}
          <Button onClick={() => setIsCookingMode(true)}>
            <ChefHat className="mr-2 h-4 w-4" />
            烹飪模式
          </Button>
          {/* Export Menu */}
          <div className="relative">
            <Button
              variant="outline"
              onClick={() => setShowExportMenu(!showExportMenu)}
            >
              <Download className="mr-2 h-4 w-4" />
              匯出
            </Button>
            {showExportMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowExportMenu(false)}
                />
                <div className="absolute right-0 top-full mt-2 w-48 rounded-md border border-gray-200 bg-white shadow-lg z-20 dark:border-gray-700 dark:bg-gray-800">
                  <button
                    onClick={handleExportPDF}
                    className="flex w-full items-center space-x-2 px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-100 transition-colors border-b border-gray-100 dark:text-gray-200 dark:hover:bg-gray-700 dark:border-gray-700"
                  >
                    <File className="h-4 w-4 text-red-500" />
                    <span>匯出為 PDF (.pdf)</span>
                  </button>
                  <button
                    onClick={handleExportText}
                    className="flex w-full items-center space-x-2 px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-100 transition-colors dark:text-gray-200 dark:hover:bg-gray-700"
                  >
                    <FileText className="h-4 w-4 dark:text-gray-400" />
                    <span>匯出為文字檔 (.txt)</span>
                  </button>
                  <button
                    onClick={handleExportJSON}
                    className="flex w-full items-center space-x-2 px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-100 transition-colors dark:text-gray-200 dark:hover:bg-gray-700"
                  >
                    <FileText className="h-4 w-4 dark:text-gray-400" />
                    <span>匯出為 JSON (.json)</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Recipe Image */}
      {recipe.image_url && (
        <div className="relative h-96 w-full overflow-hidden rounded-lg bg-gray-200 dark:bg-gray-700">
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
        <h2 className="mb-4 text-2xl font-bold dark:text-gray-100">食材</h2>
        <ul className="space-y-2">
          {recipe.ingredients.map((ingredient, index) => (
            <li key={index} className="flex items-center space-x-2 dark:text-gray-300">
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
        <h2 className="mb-4 text-2xl font-bold dark:text-gray-100">步驟</h2>
        <ol className="space-y-6">
          {recipe.steps.map((step, index) => (
            <li key={index} className="flex space-x-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-600 text-white font-semibold">
                {step.step_number || index + 1}
              </div>
              <div className="flex-1">
                <p className="text-gray-700 dark:text-gray-300">{step.instruction}</p>
                {step.image_url && (
                  <div className="mt-2 relative h-48 w-full max-w-md overflow-hidden rounded-lg bg-gray-200 dark:bg-gray-700">
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
                  <div className="mt-2 flex items-center space-x-1 text-sm text-gray-500 dark:text-gray-400">
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
          <h2 className="mb-4 text-2xl font-bold dark:text-gray-100">分類</h2>
          <div className="flex flex-wrap gap-2">
            <CategoryLink category={recipe.category} />
          </div>
        </section>
      )}

      {/* Tags */}
      {recipe.tags && recipe.tags.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-4 text-2xl font-bold dark:text-gray-100">標籤</h2>
          <div className="flex flex-wrap gap-2">
            {recipe.tags.map((tag) => (
              <TagLink key={tag} tag={tag} />
            ))}
          </div>
        </section>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteConfirm}
        title="刪除食譜"
        message="確定要刪除此食譜嗎？刪除後將無法復原。"
        confirmText="刪除"
        cancelText="取消"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  )
}

