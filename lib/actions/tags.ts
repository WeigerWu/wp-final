import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Recipe } from '@/types/recipe'
import { Tag } from '@/types/tag'

/**
 * 根據標籤 slug 獲取標籤資訊
 */
export async function getTagBySlug(slug: string): Promise<Tag | null> {
  const supabase = await createServerSupabaseClient()
  
  const { data, error } = await supabase
    .from('tags')
    .select('id, name, slug, description, usage_count')
    .eq('slug', slug)
    .maybeSingle()

  if (error) {
    console.error('Error fetching tag:', error)
    return null
  }

  return data
}

/**
 * 根據標籤 ID 獲取標籤資訊
 */
export async function getTagById(tagId: string): Promise<Tag | null> {
  const supabase = await createServerSupabaseClient()
  
  const { data, error } = await supabase
    .from('tags')
    .select('id, name, slug, description, usage_count')
    .eq('id', tagId)
    .maybeSingle()

  if (error) {
    console.error('Error fetching tag:', error)
    return null
  }

  return data
}

/**
 * 根據標籤名稱獲取標籤資訊（用於從舊的 tags JSONB 陣列遷移）
 */
export async function getTagByName(tagName: string): Promise<Tag | null> {
  const supabase = await createServerSupabaseClient()
  
  const { data, error } = await supabase
    .from('tags')
    .select('id, name, slug, description, usage_count')
    .ilike('name', tagName.trim())
    .maybeSingle()

  if (error) {
    // 如果找不到，返回 null（不會拋出錯誤）
    return null
  }

  return data
}

/**
 * 根據標籤 slug 獲取使用該標籤的所有食譜
 */
export async function getRecipesByTagSlug(
  tagSlug: string,
  options: { limit?: number; offset?: number } = {}
): Promise<{ recipes: Recipe[]; tag: Tag | null; total: number }> {
  const supabase = await createServerSupabaseClient()

  // 首先獲取標籤資訊
  const tag = await getTagBySlug(tagSlug)
  if (!tag) {
    return { recipes: [], tag: null, total: 0 }
  }

  // 使用 recipe_tags 關聯表查詢食譜
  const limit = options.limit || 12
  const offset = options.offset || 0

  // 先獲取總數
  const { count: total } = await supabase
    .from('recipe_tags')
    .select('*', { count: 'exact', head: true })
    .eq('tag_id', tag.id)

  // 獲取食譜 ID 列表
  const { data: recipeTags, error: recipeTagsError } = await supabase
    .from('recipe_tags')
    .select('recipe_id')
    .eq('tag_id', tag.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (recipeTagsError || !recipeTags || recipeTags.length === 0) {
    return { recipes: [], tag, total: total || 0 }
  }

  const recipeIds = (recipeTags as { recipe_id: string }[]).map((rt) => rt.recipe_id)

  // 獲取食譜資料
  const { data: recipes, error: recipesError } = await supabase
    .from('recipes')
    .select('*')
    .in('id', recipeIds)
    .eq('status', 'published')
    .eq('is_public', true)
    .order('created_at', { ascending: false })

  if (recipesError || !recipes) {
    console.error('Error fetching recipes:', recipesError)
    return { recipes: [], tag, total: total || 0 }
  }

  // 獲取用戶資料
  const userIds = Array.from(new Set(recipes.map((r: any) => r.user_id)))
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, username, avatar_url')
    .in('id', userIds)

  const profilesMap = new Map(
    (profiles || []).map((profile: any) => [profile.id, profile])
  )

  // 獲取評分和收藏資料
  const recipesWithStats = await Promise.all(
    recipes.map(async (recipe: any) => {
      const { data: ratings } = await supabase
        .from('recipe_ratings')
        .select('rating')
        .eq('recipe_id', recipe.id)

      const { data: favorites } = await supabase
        .from('recipe_favorites')
        .select('id')
        .eq('recipe_id', recipe.id)

      const averageRating =
        ratings && ratings.length > 0
          ? ratings.reduce((sum: number, r: any) => sum + r.rating, 0) / ratings.length
          : 0

      return {
        ...recipe,
        user: profilesMap.get(recipe.user_id) || { username: 'Unknown', avatar_url: null },
        average_rating: averageRating,
        rating_count: ratings?.length || 0,
        favorite_count: favorites?.length || 0,
      } as Recipe
    })
  )

  return {
    recipes: recipesWithStats,
    tag,
    total: total || 0,
  }
}

/**
 * 根據標籤名稱獲取食譜（用於向後兼容，從舊的 tags JSONB 陣列）
 */
export async function getRecipesByTagName(
  tagName: string,
  options: { limit?: number; offset?: number } = {}
): Promise<{ recipes: Recipe[]; tag: Tag | null; total: number }> {
  // 先嘗試從 tags 表格中獲取標籤
  const tag = await getTagByName(tagName)
  
  if (tag) {
    // 如果找到了標籤，使用 slug 查詢
    return getRecipesByTagSlug(tag.slug, options)
  }

  // 如果找不到，回退到使用舊的 JSONB 欄位查詢
  const supabase = await createServerSupabaseClient()
  const limit = options.limit || 12
  const offset = options.offset || 0

  const { data: recipes, error } = await supabase
    .from('recipes')
    .select('*')
    .contains('tags', [tagName])
    .eq('status', 'published')
    .eq('is_public', true)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error || !recipes) {
    console.error('Error fetching recipes by tag name:', error)
    return { recipes: [], tag: null, total: 0 }
  }

  // 獲取總數
  const { count: total } = await supabase
    .from('recipes')
    .select('*', { count: 'exact', head: true })
    .contains('tags', [tagName])
    .eq('status', 'published')
    .eq('is_public', true)

  // 獲取用戶資料和統計（與上面相同）
  const userIds = Array.from(new Set(recipes.map((r: any) => r.user_id)))
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, username, avatar_url')
    .in('id', userIds)

  const profilesMap = new Map(
    (profiles || []).map((profile: any) => [profile.id, profile])
  )

  const recipesWithStats = await Promise.all(
    recipes.map(async (recipe: any) => {
      const { data: ratings } = await supabase
        .from('recipe_ratings')
        .select('rating')
        .eq('recipe_id', recipe.id)

      const { data: favorites } = await supabase
        .from('recipe_favorites')
        .select('id')
        .eq('recipe_id', recipe.id)

      const averageRating =
        ratings && ratings.length > 0
          ? ratings.reduce((sum: number, r: any) => sum + r.rating, 0) / ratings.length
          : 0

      return {
        ...recipe,
        user: profilesMap.get(recipe.user_id) || { username: 'Unknown', avatar_url: null },
        average_rating: averageRating,
        rating_count: ratings?.length || 0,
        favorite_count: favorites?.length || 0,
      } as Recipe
    })
  )

  return {
    recipes: recipesWithStats,
    tag: {
      id: '',
      name: tagName,
      slug: tagName.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-'),
      description: null,
      usage_count: total || 0,
    },
    total: total || 0,
  }
}

