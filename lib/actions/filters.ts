import { createServerSupabaseClient } from '@/lib/supabase/server'

export interface DifficultyOption {
  value: 'easy' | 'medium' | 'hard'
  label: string
  count: number
}

export interface TagOption {
  name: string
  count: number
}

/**
 * 獲取實際存在的難度選項（按數量排序）
 */
export async function getAvailableDifficulties(): Promise<DifficultyOption[]> {
  const supabase = await createServerSupabaseClient()
  
  // 查詢所有已發布且公開的食譜的難度
  const { data, error } = await supabase
    .from('recipes')
    .select('difficulty')
    .eq('status', 'published')
    .eq('is_public', true)
    .not('difficulty', 'is', null)
  
  if (error) {
    console.error('Error fetching difficulties:', error)
    return []
  }
  
  if (!data || data.length === 0) {
    return []
  }
  
  // 計算每個難度的數量
  const difficultyCounts = new Map<'easy' | 'medium' | 'hard', number>()
  for (const recipe of data) {
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
  const difficulties: DifficultyOption[] = Array.from(difficultyCounts.entries())
    .map(([value, count]) => ({
      value,
      label: difficultyLabels[value],
      count,
    }))
    .sort((a, b) => b.count - a.count)
  
  return difficulties
}

/**
 * 獲取實際存在的標籤（按數量排序）
 */
export async function getAvailableTags(): Promise<TagOption[]> {
  const supabase = await createServerSupabaseClient()
  
  // 查詢所有已發布且公開的食譜的標籤
  const { data, error } = await supabase
    .from('recipes')
    .select('tags')
    .eq('status', 'published')
    .eq('is_public', true)
  
  if (error) {
    console.error('Error fetching tags:', error)
    return []
  }
  
  if (!data || data.length === 0) {
    return []
  }
  
  // 收集所有標籤並計算數量
  const tagCounts = new Map<string, number>()
  for (const recipe of data) {
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
  const tags: TagOption[] = Array.from(tagCounts.entries())
    .map(([name, count]) => ({
      name,
      count,
    }))
    .sort((a, b) => b.count - a.count)
  
  return tags
}

