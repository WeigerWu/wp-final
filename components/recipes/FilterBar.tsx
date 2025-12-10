'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { createSupabaseClient } from '@/lib/supabase/client'

interface Category {
  id: string
  name: string
  slug: string
}

export function FilterBar() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const selectedTags = searchParams.get('tags')?.split(',') || []
  const selectedDifficulty = searchParams.get('difficulty')
  const selectedCategory = searchParams.get('category')
  const [categories, setCategories] = useState<Category[]>([])
  const [loadingCategories, setLoadingCategories] = useState(true)

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const supabase = createSupabaseClient()
        const { data, error } = await supabase
          .from('categories')
          .select('id, name, slug')
          .order('sort_order', { ascending: true })
          .order('name', { ascending: true })
        
        if (error) {
          console.error('Error fetching categories:', error)
        } else {
          setCategories((data || []) as Category[])
        }
      } catch (err) {
        console.error('Error fetching categories:', err)
      } finally {
        setLoadingCategories(false)
      }
    }
    
    fetchCategories()
  }, [])

  const difficulties = [
    { value: 'easy', label: '簡單' },
    { value: 'medium', label: '中等' },
    { value: 'hard', label: '困難' },
  ]

  const popularTags = [
    '中式',
    '西式',
    '日式',
    '韓式',
    '甜點',
    '素食',
    '快速',
    '健康',
    '家常菜',
    '湯品',
    '早餐',
    '開胃菜',
    '主菜'
  ]

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
      {!loadingCategories && categories.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-semibold text-gray-700">分類</h3>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => handleCategoryClick(category.id)}
                className={`rounded-full px-4 py-2 text-sm transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Difficulty Filter */}
      <div>
        <h3 className="mb-2 text-sm font-semibold text-gray-700">難度</h3>
        <div className="flex flex-wrap gap-2">
          {difficulties.map((difficulty) => (
            <button
              key={difficulty.value}
              onClick={() => handleDifficultyClick(difficulty.value)}
              className={`rounded-full px-4 py-2 text-sm transition-colors ${
                selectedDifficulty === difficulty.value
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {difficulty.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tags Filter */}
      <div>
        <h3 className="mb-2 text-sm font-semibold text-gray-700">標籤</h3>
        <div className="flex flex-wrap gap-2">
          {popularTags.map((tag) => (
            <button
              key={tag}
              onClick={() => handleTagClick(tag)}
              className={`rounded-full px-4 py-2 text-sm transition-colors ${
                selectedTags.includes(tag)
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Active Filters */}
      {(selectedTags.length > 0 || selectedDifficulty || selectedCategory) && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">已選擇：</span>
          {selectedCategory && (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary-100 px-3 py-1 text-sm text-primary-800">
              {categories.find((c) => c.id === selectedCategory)?.name || '分類'}
              <button
                onClick={() => handleCategoryClick(selectedCategory)}
                className="ml-1 hover:text-primary-600"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {selectedDifficulty && (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary-100 px-3 py-1 text-sm text-primary-800">
              {difficulties.find((d) => d.value === selectedDifficulty)?.label}
              <button
                onClick={() => handleDifficultyClick(selectedDifficulty)}
                className="ml-1 hover:text-primary-600"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {selectedTags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded-full bg-primary-100 px-3 py-1 text-sm text-primary-800"
            >
              {tag}
              <button
                onClick={() => handleTagClick(tag)}
                className="ml-1 hover:text-primary-600"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          <button
            onClick={clearFilters}
            className="text-sm text-primary-600 hover:underline"
          >
            清除所有
          </button>
        </div>
      )}
    </div>
  )
}


