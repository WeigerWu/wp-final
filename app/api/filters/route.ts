import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// 這個路由需要動態渲染，因為它使用了 cookies
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()
    
    // 並行獲取所有資料，使用更高效的查詢
    const [categoriesResult, difficultiesResult, tagsResult] = await Promise.all([
      // 獲取有食譜的分類
      (async () => {
        const { data: recipes, error: recipesError } = await supabase
          .from('recipes')
          .select('category_id')
          .eq('status', 'published')
          .eq('is_public', true)
          .not('category_id', 'is', null)
          .limit(10000)
        
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
          .limit(10000)
        
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
      
      // 獲取實際存在的標籤
      (async () => {
        const { data: recipes, error } = await supabase
          .from('recipes')
          .select('tags')
          .eq('status', 'published')
          .eq('is_public', true)
          .limit(10000)
        
        if (error || !recipes) {
          return []
        }
        
        // 收集所有標籤並計算數量
        const tagCounts = new Map<string, number>()
        for (const recipe of recipes) {
          const tags = (recipe as any).tags as string[] | null
          if (tags && Array.isArray(tags)) {
            for (const tag of tags) {
              if (tag && typeof tag === 'string' && tag.trim()) {
                const trimmedTag = tag.trim()
                tagCounts.set(trimmedTag, (tagCounts.get(trimmedTag) || 0) + 1)
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
    
    return NextResponse.json({
      categories: categoriesResult,
      difficulties: difficultiesResult,
      tags: tagsResult,
    })
  } catch (error) {
    console.error('[API /api/filters] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch filter data' },
      { status: 500 }
    )
  }
}



