'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'
import { X, ChevronDown, ChevronUp, Tag, Layers, Gauge, Filter, ChevronLeft } from 'lucide-react'
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
  const selectedDifficulties = searchParams.get('difficulty')?.split(',') || []
  const selectedCategories = searchParams.get('category')?.split(',') || []
  const [categories, setCategories] = useState<Category[]>([])
  const [difficulties, setDifficulties] = useState<Difficulty[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [allFiltersExpanded, setAllFiltersExpanded] = useState(true)
  const [tagsShowAll, setTagsShowAll] = useState(false)
  const [tagsScrolled, setTagsScrolled] = useState(false)
  const tagsScrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchFilterData = async () => {
      console.log('[FilterBar] Starting to fetch filter data...')
      try {
        // 每次挂载时都创建新的客户端实例，避免缓存问题
        const supabase = createSupabaseClient()

        // 並行獲取所有資料
        const [categoriesResult, difficultiesResult, tagsResult] = await Promise.all([
          // 獲取有食譜的分類
          (async () => {
            console.log('[FilterBar] Fetching categories...')
            const { data: recipes, error: recipesError } = await supabase
              .from('recipes')
              .select('category_id')
              .eq('status', 'published')
              .eq('is_public', true)
              .not('category_id', 'is', null)
            console.log('[FilterBar] Categories recipes fetched:', recipes?.length || 0)
            
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

            console.log('[FilterBar] Categories data fetched:', categoriesData?.length || 0)

            if (categoriesError || !categoriesData) {
              return []
            }

            // 合併分類資訊和數量，並按數量排序
            const result = categoriesData.map((category: any) => ({
              ...category,
              recipe_count: categoryCounts.get(category.id) || 0,
            })).sort((a: any, b: any) => b.recipe_count - a.recipe_count)

            console.log('[FilterBar] Categories result:', result.length)
            return result
          })(),

          // 獲取實際存在的難度
          (async () => {
            console.log('[FilterBar] Fetching difficulties...')
            const { data: recipes, error } = await supabase
              .from('recipes')
              .select('difficulty')
              .eq('status', 'published')
              .eq('is_public', true)
              .not('difficulty', 'is', null)
            console.log('[FilterBar] Difficulties recipes fetched:', recipes?.length || 0)
            
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

            // 難度順序（用於排序）
            const difficultyOrder: Record<'easy' | 'medium' | 'hard', number> = {
              easy: 1,
              medium: 2,
              hard: 3,
            }

            // 轉換為選項並按難度順序排序（簡單 → 中等 → 困難）
            const result = Array.from(difficultyCounts.entries())
              .map(([value, count]) => ({
                value,
                label: difficultyLabels[value],
                count,
              }))
              .sort((a, b) => difficultyOrder[a.value] - difficultyOrder[b.value])

            console.log('[FilterBar] Difficulties result:', result.length)
            return result
          })(),

          // 獲取實際存在的標籤（從 tags 表）
          (async () => {
            try {
              console.log('[FilterBar] Fetching tags from tags table...')
              // 從 tags 表獲取所有標籤，按 usage_count 排序
              const { data: tagsData, error: tagsError } = await supabase
                .from('tags')
                .select('id, name, usage_count')
                .order('usage_count', { ascending: false })

              console.log('[FilterBar] Tags query completed, data:', tagsData?.length || 0, 'error:', tagsError)

              if (tagsError) {
                console.error('[FilterBar] Error fetching tags:', tagsError)
                return []
              }

              if (!tagsData || tagsData.length === 0) {
                console.warn('[FilterBar] No tags found in database')
                return []
              }

              console.log(`[FilterBar] Successfully fetched ${tagsData.length} tags`)

              // 轉換為選項格式
              return tagsData.map((tag: any) => ({
                name: tag.name,
                count: tag.usage_count || 0,
              })).filter((tag: any) => tag.count > 0) // 只顯示有使用的標籤
            } catch (error) {
              console.error('[FilterBar] Exception while fetching tags:', error)
              return []
            }
          })(),
        ])
        
        console.log('[FilterBar] Fetch results:', {
          categories: categoriesResult.length,
          difficulties: difficultiesResult.length,
          tags: tagsResult.length
        })

        setCategories(categoriesResult as Category[])
        setDifficulties(difficultiesResult as Difficulty[])
        setTags(tagsResult as Tag[])

        console.log('[FilterBar] Filter data updated successfully')
      } catch (err) {
        console.error('[FilterBar] Error fetching filter data:', err)
        // 確保即使出錯也設置為空陣列，而不是 undefined
        setCategories([])
        setDifficulties([])
        setTags([])
      } finally {
        setLoading(false)
        console.log('[FilterBar] Finished fetching filter data')
      }
    }

    console.log('[FilterBar] Component mounted, will fetch filter data')
    fetchFilterData()
  }, [])

  // 監聽標籤區域滾動狀態
  useEffect(() => {
    const scrollElement = tagsScrollRef.current
    if (!scrollElement) return

    const checkScroll = () => {
      setTagsScrolled(scrollElement.scrollLeft > 0)
    }

    scrollElement.addEventListener('scroll', checkScroll)
    // 初始檢查
    checkScroll()

    return () => {
      scrollElement.removeEventListener('scroll', checkScroll)
    }
  }, [tagsShowAll])

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
    const currentDifficulties = params.get('difficulty')?.split(',') || []
    
    if (currentDifficulties.includes(difficulty)) {
      const newDifficulties = currentDifficulties.filter((d) => d !== difficulty)
      if (newDifficulties.length > 0) {
        params.set('difficulty', newDifficulties.join(','))
      } else {
        params.delete('difficulty')
      }
    } else {
      params.set('difficulty', [...currentDifficulties, difficulty].join(','))
    }
    params.set('page', '1')
    router.push(`/recipes?${params.toString()}`)
  }

  const handleCategoryClick = (categoryId: string) => {
    const params = new URLSearchParams(searchParams.toString())
    const currentCategories = params.get('category')?.split(',') || []
    
    if (currentCategories.includes(categoryId)) {
      const newCategories = currentCategories.filter((c) => c !== categoryId)
      if (newCategories.length > 0) {
        params.set('category', newCategories.join(','))
      } else {
        params.delete('category')
      }
    } else {
      params.set('category', [...currentCategories, categoryId].join(','))
    }
    params.set('page', '1')
    router.push(`/recipes?${params.toString()}`)
  }

  const clearFilters = () => {
    const params = new URLSearchParams(searchParams.toString())
    // 只清除篩選條件，保留搜尋關鍵字
    params.delete('category')
    params.delete('difficulty')
    params.delete('tags')
    params.set('page', '1')
    router.push(`/recipes?${params.toString()}`)
  }

  const handleShowAllTags = () => {
    setTagsShowAll(true)
    setTagsScrolled(false)
    // 確保標籤區域可以滾動
    if (tagsScrollRef.current) {
      tagsScrollRef.current.scrollLeft = 0
    }
  }

  const handleBackToStart = () => {
    if (tagsScrollRef.current) {
      tagsScrollRef.current.scrollTo({
        left: 0,
        behavior: 'smooth'
      })
      // 等待滾動動畫完成後收起
      setTimeout(() => {
        setTagsShowAll(false)
        setTagsScrolled(false)
      }, 300)
    } else {
      setTagsShowAll(false)
      setTagsScrolled(false)
    }
  }

  const hasActiveFilters = selectedTags.length > 0 || selectedDifficulties.length > 0 || selectedCategories.length > 0

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <button
          onClick={() => setAllFiltersExpanded(!allFiltersExpanded)}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          {allFiltersExpanded ? (
            <ChevronUp className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          )}
          <Filter className="h-4 w-4 text-primary-600 dark:text-primary-400" />
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">條件篩選</h3>
        </button>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 transition-colors flex items-center gap-1"
          >
            <X className="h-3 w-3" />
            清除所有
          </button>
        )}
      </div>

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="px-4 py-3 bg-primary-50/50 dark:bg-primary-900/10 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap gap-2">
            {selectedCategories.map((categoryId) => {
              const category = categories.find((c) => c.id === categoryId)
              return (
                <span
                  key={categoryId}
                  className="inline-flex items-center gap-1 rounded-full bg-primary-600 px-2.5 py-1 text-xs font-medium text-white"
                >
                  {category?.name || '分類'}
                  <button
                    onClick={() => handleCategoryClick(categoryId)}
                    className="hover:bg-primary-700 rounded-full p-0.5 transition-colors"
                    aria-label="移除分類"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )
            })}
            {selectedDifficulties.map((difficulty) => {
              const difficultyLabel = difficulties.find((d) => d.value === difficulty)?.label || 
               (difficulty === 'easy' ? '簡單' : difficulty === 'medium' ? '中等' : '困難')
              return (
                <span
                  key={difficulty}
                  className="inline-flex items-center gap-1 rounded-full bg-primary-600 px-2.5 py-1 text-xs font-medium text-white"
                >
                  {difficultyLabel}
                  <button
                    onClick={() => handleDifficultyClick(difficulty)}
                    className="hover:bg-primary-700 rounded-full p-0.5 transition-colors"
                    aria-label="移除難度"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )
            })}
            {selectedTags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 rounded-full bg-primary-600 px-2.5 py-1 text-xs font-medium text-white"
              >
                {tag}
                <button
                  onClick={() => handleTagClick(tag)}
                  className="hover:bg-primary-700 rounded-full p-0.5 transition-colors"
                  aria-label="移除標籤"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Filter Rows - Horizontal Layout */}
      {allFiltersExpanded && (
        <div className="px-4 py-3">
          <div className="flex flex-col gap-4">
            {/* Category Row */}
            {!loading && categories.length > 0 && (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 flex-shrink-0 w-20">
                  <Layers className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">分類</span>
                </div>
                <div className="flex-1 flex flex-wrap gap-2">
                  {categories.map((category) => {
                    const isSelected = selectedCategories.includes(category.id)
                    return (
                      <label
                        key={category.id}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-300 dark:border-primary-700 text-primary-700 dark:text-primary-300'
                            : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleCategoryClick(category.id)}
                          className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                        />
                        <span className="text-sm whitespace-nowrap">{category.name}</span>
                      </label>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Difficulty Row */}
            {!loading && difficulties.length > 0 && (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 flex-shrink-0 w-20">
                  <Gauge className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">難度</span>
                </div>
                <div className="flex-1 flex flex-wrap gap-2">
                  {difficulties.map((difficulty) => {
                    const isSelected = selectedDifficulties.includes(difficulty.value)
                    const difficultyColors = {
                      easy: 'text-green-600 dark:text-green-400',
                      medium: 'text-yellow-600 dark:text-yellow-400',
                      hard: 'text-red-600 dark:text-red-400',
                    }
                    return (
                      <label
                        key={difficulty.value}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-300 dark:border-primary-700'
                            : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleDifficultyClick(difficulty.value)}
                          className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                        />
                        <span className={`text-sm whitespace-nowrap ${isSelected ? difficultyColors[difficulty.value] + ' font-medium' : 'text-gray-700 dark:text-gray-300'}`}>
                          {difficulty.label}
                        </span>
                      </label>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Tags Row */}
            {!loading && tags.length > 0 && (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 flex-shrink-0 w-20">
                  <Tag className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">標籤</span>
                </div>
                <div className="flex-1 flex items-center gap-2 min-w-0 relative">
                  {/* Left Arrow Button - Show when scrolled */}
                  {tagsShowAll && tagsScrolled && (
                    <button
                      onClick={handleBackToStart}
                      className="flex-shrink-0 z-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md p-1.5 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      aria-label="回到最左邊並收起"
                    >
                      <ChevronLeft className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                    </button>
                  )}
                  <div
                    ref={tagsScrollRef}
                    className={`flex-1 min-w-0 ${tagsShowAll ? 'overflow-x-auto scrollbar-hide' : 'overflow-x-hidden'}`}
                    style={{
                      scrollbarWidth: 'none',
                      msOverflowStyle: 'none',
                      WebkitOverflowScrolling: 'touch',
                      touchAction: 'pan-x',
                    }}
                  >
                    <div className="flex gap-2" style={{ width: tagsShowAll ? 'max-content' : '100%' }}>
                      {(tagsShowAll ? tags : tags.slice(0, 20)).map((tag) => {
                        const isSelected = selectedTags.includes(tag.name)
                        return (
                          <label
                            key={tag.name}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border cursor-pointer transition-colors flex-shrink-0 ${
                              isSelected
                                ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-300 dark:border-primary-700 text-primary-700 dark:text-primary-300'
                                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleTagClick(tag.name)}
                              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 pointer-events-auto"
                            />
                            <span className="text-sm whitespace-nowrap">{tag.name}</span>
                          </label>
                        )
                      })}
                    </div>
                  </div>
                  {!tagsShowAll && tags.length > 20 && (
                    <button
                      onClick={handleShowAllTags}
                      className="flex-shrink-0 text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium px-3 py-1.5 rounded-md border border-primary-300 dark:border-primary-700 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                    >
                      查看全部 {tags.length} 個標籤
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Loading State */}
            {loading && (
              <div className="space-y-2">
                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
