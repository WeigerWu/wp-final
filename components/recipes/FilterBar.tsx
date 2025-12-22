'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { createSupabaseClient } from '@/lib/supabase/client'

interface Category {
  id: string
  name: string
  slug: string
  recipe_count?: number
}

interface Difficulty {
  value: 'easy' | 'medium' | 'hard'
  label: string
  count: number
}

interface Tag {
  name: string
  count: number
}

export function FilterBar() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const selectedTags = searchParams.get('tags')?.split(',') || []
  const selectedDifficulty = searchParams.get('difficulty')
  const selectedCategory = searchParams.get('category')
  const [categories, setCategories] = useState<Category[]>([])
  const [difficulties, setDifficulties] = useState<Difficulty[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchFilterData = async () => {
      try {
        const supabase = createSupabaseClient()
        
        // 並行獲取所有資料
        const [categoriesResult, difficultiesResult, tagsResult] = await Promise.all([
          // 獲取有食譜的分類
          (async () => {
            const { data: recipes, error: recipesError } = await supabase
              .from('recipes')
              .select('category_id')
              .eq('status', 'published')
              .eq('is_public', true)
              .not('category_id', 'is', null)
            
            if (recipesError || !recipes) {
              return []
            }
            
            // 計算每個分類的食譜數量
            const categoryCounts = new Map<string, number>()
            for (const recipe of recipes) {
              const categoryId = (recipe as any).category_id
              if (categoryId) {
                categoryCounts.set(categoryId, (categoryCounts.get(categoryId) || 0) + 1)
              }
            }
            
            // 獲取分類詳細資訊
            const categoryIds = Array.from(categoryCounts.keys())
            if (categoryIds.length === 0) {
              return []
            }
            
            const { data: categoriesData, error: categoriesError } = await supabase
              .from('categories')
              .select('id, name, slug')
              .in('id', categoryIds)
            
            if (categoriesError || !categoriesData) {
              return []
            }
            
            // 合併分類資訊和數量，並按數量排序
            return categoriesData.map((category: any) => ({
              ...category,
              recipe_count: categoryCounts.get(category.id) || 0,
            })).sort((a: any, b: any) => b.recipe_count - a.recipe_count)
          })(),
          
          // 獲取實際存在的難度
          (async () => {
            const { data: recipes, error } = await supabase
              .from('recipes')
              .select('difficulty')
              .eq('status', 'published')
              .eq('is_public', true)
              .not('difficulty', 'is', null)
            
            if (error || !recipes) {
              return []
            }
            
            // 計算每個難度的數量
            const difficultyCounts = new Map<'easy' | 'medium' | 'hard', number>()
            for (const recipe of recipes) {
              const difficulty = (recipe as any).difficulty as 'easy' | 'medium' | 'hard'
              if (difficulty) {
                difficultyCounts.set(difficulty, (difficultyCounts.get(difficulty) || 0) + 1)
              }
            }
            
            // 難度標籤映射
            const difficultyLabels: Record<'easy' | 'medium' | 'hard', string> = {
              easy: '簡單',
              medium: '中等',
              hard: '困難',
            }
            
            // 轉換為選項並按數量排序
            return Array.from(difficultyCounts.entries())
              .map(([value, count]) => ({
                value,
                label: difficultyLabels[value],
                count,
              }))
              .sort((a, b) => b.count - a.count)
          })(),
          
          // 獲取實際存在的標籤（排除分類名稱）
          (async () => {
            // 先獲取所有分類名稱，用於過濾
            const { data: allCategories, error: categoriesError } = await supabase
              .from('categories')
              .select('name')
            
            const categoryNames = new Set<string>()
            if (allCategories && !categoriesError) {
              for (const category of allCategories as Array<{ name: string }>) {
                if (category.name) {
                  categoryNames.add(category.name.trim())
                }
              }
            }
            
            const { data: recipes, error } = await supabase
              .from('recipes')
              .select('tags')
              .eq('status', 'published')
              .eq('is_public', true)
            
            if (error || !recipes) {
              return []
            }
            
            // 收集所有標籤並計算數量（排除分類名稱）
            const tagCounts = new Map<string, number>()
            for (const recipe of recipes) {
              const tags = (recipe as any).tags as string[] | null
              if (tags && Array.isArray(tags)) {
                for (const tag of tags) {
                  if (tag && typeof tag === 'string' && tag.trim()) {
                    const trimmedTag = tag.trim()
                    // 過濾掉分類名稱
                    if (!categoryNames.has(trimmedTag)) {
                      tagCounts.set(trimmedTag, (tagCounts.get(trimmedTag) || 0) + 1)
                    }
                  }
                }
              }
            }
            
            // 轉換為選項並按數量排序
            return Array.from(tagCounts.entries())
              .map(([name, count]) => ({
                name,
                count,
              }))
              .sort((a, b) => b.count - a.count)
          })(),
        ])
        
        setCategories(categoriesResult as Category[])
        setDifficulties(difficultiesResult as Difficulty[])
        setTags(tagsResult as Tag[])
      } catch (err) {
        console.error('Error fetching filter data:', err)
      } finally {
        setLoading(false)
      }
    }
    
    fetchFilterData()
  }, [])

  const handleTagClick = (tag: string) => {
    const params = new URLSearchParams(searchParams.toString())
    const currentTags = params.get('tags')?.split(',') || []
    
    if (currentTags.includes(tag)) {
      const newTags = currentTags.filter((t) => t !== tag)
      if (newTags.length > 0) {
        params.set('tags', newTags.join(','))
      } else {
        params.delete('tags')
      }
    } else {
      params.set('tags', [...currentTags, tag].join(','))
    }
    params.set('page', '1')
    router.push(`/recipes?${params.toString()}`)
  }

  const handleDifficultyClick = (difficulty: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (selectedDifficulty === difficulty) {
      params.delete('difficulty')
    } else {
      params.set('difficulty', difficulty)
    }
    params.set('page', '1')
    router.push(`/recipes?${params.toString()}`)
  }

  const handleCategoryClick = (categoryId: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (selectedCategory === categoryId) {
      params.delete('category')
    } else {
      params.set('category', categoryId)
    }
    params.set('page', '1')
    router.push(`/recipes?${params.toString()}`)
  }

  const clearFilters = () => {
    router.push('/recipes')
  }

  return (
    <div className="space-y-4">
      {/* Category Filter */}
      {!loading && categories.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">分類</h3>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => handleCategoryClick(category.id)}
                className={`rounded-full px-4 py-2 text-sm transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Difficulty Filter */}
      {!loading && difficulties.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">難度</h3>
          <div className="flex flex-wrap gap-2">
            {difficulties.map((difficulty) => (
              <button
                key={difficulty.value}
                onClick={() => handleDifficultyClick(difficulty.value)}
                className={`rounded-full px-4 py-2 text-sm transition-colors ${
                  selectedDifficulty === difficulty.value
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {difficulty.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tags Filter */}
      {!loading && tags.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">標籤</h3>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <button
                key={tag.name}
                onClick={() => handleTagClick(tag.name)}
                className={`rounded-full px-4 py-2 text-sm transition-colors ${
                  selectedTags.includes(tag.name)
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {tag.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Active Filters */}
      {(selectedTags.length > 0 || selectedDifficulty || selectedCategory) && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">已選擇：</span>
          {selectedCategory && (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary-100 px-3 py-1 text-sm text-primary-800 dark:bg-primary-900 dark:text-primary-200">
              {categories.find((c) => c.id === selectedCategory)?.name || '分類'}
              <button
                onClick={() => handleCategoryClick(selectedCategory)}
                className="ml-1 hover:text-primary-600 dark:hover:text-primary-400"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {selectedDifficulty && (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary-100 px-3 py-1 text-sm text-primary-800 dark:bg-primary-900 dark:text-primary-200">
              {difficulties.find((d) => d.value === selectedDifficulty)?.label || 
               (selectedDifficulty === 'easy' ? '簡單' : selectedDifficulty === 'medium' ? '中等' : '困難')}
              <button
                onClick={() => handleDifficultyClick(selectedDifficulty)}
                className="ml-1 hover:text-primary-600 dark:hover:text-primary-400"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {selectedTags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded-full bg-primary-100 px-3 py-1 text-sm text-primary-800 dark:bg-primary-900 dark:text-primary-200"
            >
              {tag}
              <button
                onClick={() => handleTagClick(tag)}
                className="ml-1 hover:text-primary-600 dark:hover:text-primary-400"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          <button
            onClick={clearFilters}
            className="text-sm text-primary-600 hover:underline dark:text-primary-400"
          >
            清除所有
          </button>
        </div>
      )}
    </div>
  )
}


