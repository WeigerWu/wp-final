'use client'

import { useState, useEffect } from 'react'
import { Recipe } from '@/types/recipe'
import { getRecipesClient } from '@/lib/actions/recipes'
import { RecipeCard } from '@/components/recipes/RecipeCard'
import { ArrowUp } from 'lucide-react'

interface LoadMoreRecipesProps {
  initialRecipes: Recipe[]
  searchParams: {
    search?: string
    tags?: string
    difficulty?: string
    category?: string
  }
  limit?: number
}

export function LoadMoreRecipes({ 
  initialRecipes, 
  searchParams,
  limit = 12 
}: LoadMoreRecipesProps) {
  const [recipes, setRecipes] = useState<Recipe[]>(initialRecipes)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(initialRecipes.length === limit)
  const [showScrollTop, setShowScrollTop] = useState(false)

  // 當搜索條件改變時，重置狀態
  useEffect(() => {
    setRecipes(initialRecipes)
    setHasMore(initialRecipes.length === limit)
  }, [initialRecipes, limit])

  // 監聽滾動，顯示/隱藏回到頂部按鈕
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const loadMore = async () => {
    if (loading || !hasMore) return

    setLoading(true)
    try {
      const tags = searchParams.tags ? searchParams.tags.split(',') : undefined
      const newRecipes = await getRecipesClient({
        search: searchParams.search,
        tags,
        categoryId: searchParams.category,
        limit,
        offset: recipes.length,
      })

      if (newRecipes.length < limit) {
        setHasMore(false)
      }

      setRecipes((prev) => [...prev, ...newRecipes])
    } catch (error) {
      console.error('載入更多食譜時發生錯誤:', error)
    } finally {
      setLoading(false)
    }
  }

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <>
      {/* Recipes Grid */}
      {recipes.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {recipes.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-12 text-center dark:border-gray-700 dark:bg-gray-800">
          <p className="text-gray-600 dark:text-gray-400">找不到符合條件的食譜</p>
        </div>
      )}

      {/* Load More Button */}
      {hasMore && (
        <div className="mt-8 flex justify-center">
          <button
            onClick={loadMore}
            disabled={loading}
            className="rounded-md border border-gray-300 bg-white px-6 py-2 text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
          >
            {loading ? '載入中...' : '載入更多'}
          </button>
        </div>
      )}

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-24 right-8 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-primary-600 text-white shadow-lg transition-all hover:bg-primary-700 hover:scale-110 dark:bg-primary-500 dark:hover:bg-primary-600"
          aria-label="回到頂部"
        >
          <ArrowUp className="h-6 w-6" />
        </button>
      )}
    </>
  )
}

