import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Recipe } from '@/types/recipe'

export interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  icon: string | null
  parent_id: string | null
  sort_order: number
  created_at: string
}

interface GetRecipesOptions {
  limit?: number
  offset?: number
  userId?: string
  tags?: string[]
  search?: string
}

/**
 * 獲取所有分類（支持階層結構）
 */
export async function getCategories(): Promise<Category[]> {
  const supabase = await createServerSupabaseClient()
  
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true })
  
  if (error) {
    console.error('Error fetching categories:', error)
    return []
  }
  
  return (data || []) as Category[]
}

/**
 * 根據 slug 獲取分類
 */
export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const supabase = await createServerSupabaseClient()
  
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('slug', slug)
    .single()
  
  if (error) {
    console.error('Error fetching category by slug:', error)
    return null
  }
  
  return data as Category | null
}

/**
 * 根據分類 ID 獲取分類
 */
export async function getCategoryById(id: string): Promise<Category | null> {
  const supabase = await createServerSupabaseClient()
  
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) {
    console.error('Error fetching category by id:', error)
    return null
  }
  
  return data as Category | null
}

/**
 * 獲取分類的階層結構（父分類和子分類）
 */
export async function getCategoryHierarchy(categoryId: string): Promise<{
  category: Category | null
  parent: Category | null
  children: Category[]
}> {
  const supabase = await createServerSupabaseClient()
  
  // 獲取當前分類
  const category = await getCategoryById(categoryId)
  
  if (!category) {
    return { category: null, parent: null, children: [] }
  }
  
  // 獲取父分類
  let parent: Category | null = null
  if (category.parent_id) {
    parent = await getCategoryById(category.parent_id)
  }
  
  // 獲取子分類
  const { data: children } = await supabase
    .from('categories')
    .select('*')
    .eq('parent_id', categoryId)
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true })
  
  return {
    category,
    parent,
    children: (children || []) as Category[],
  }
}

/**
 * 根據分類獲取食譜
 */
export async function getRecipesByCategory(
  categoryId: string,
  options: GetRecipesOptions = {}
): Promise<{ category: Category | null; recipes: Recipe[]; totalCount: number }> {
  const supabase = await createServerSupabaseClient()
  
  // 獲取分類資訊
  const category = await getCategoryById(categoryId)
  
  if (!category) {
    return { category: null, recipes: [], totalCount: 0 }
  }
  
  // 構建查詢
  let query = supabase
    .from('recipes')
    .select('*', { count: 'exact' })
    .eq('category_id', categoryId)
    .eq('status', 'published')
    .eq('is_public', true)
    .order('created_at', { ascending: false })
  
  if (options.userId) {
    query = query.eq('user_id', options.userId)
  }
  
  if (options.search) {
    query = query.or(`title.ilike.%${options.search}%,description.ilike.%${options.search}%`)
  }
  
  if (options.limit) {
    query = query.limit(options.limit)
  }
  
  if (options.offset !== undefined) {
    const end = options.offset + (options.limit || 10) - 1
    query = query.range(options.offset, end)
  }
  
  const { data, error, count } = await query
  
  if (error) {
    console.error('Error fetching recipes by category:', error)
    return { category, recipes: [], totalCount: 0 }
  }
  
  if (!data || data.length === 0) {
    return { category, recipes: [], totalCount: count || 0 }
  }
  
  // 獲取用戶資料
  const userIds = Array.from(new Set(data.map((recipe: any) => recipe.user_id)))
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, username, avatar_url')
    .in('id', userIds)
  
  const profilesMap = new Map(
    (profiles || []).map((profile: any) => [profile.id, profile])
  )
  
  // 獲取評分和收藏數據
  const recipesWithStats = await Promise.all(
    data.map(async (recipe: any) => {
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
    category,
    recipes: recipesWithStats,
    totalCount: count || 0,
  }
}

/**
 * 根據分類 slug 獲取食譜
 */
export async function getRecipesByCategorySlug(
  categorySlug: string,
  options: GetRecipesOptions = {}
): Promise<{ category: Category | null; recipes: Recipe[]; totalCount: number }> {
  const category = await getCategoryBySlug(categorySlug)
  
  if (!category) {
    return { category: null, recipes: [], totalCount: 0 }
  }
  
  return getRecipesByCategory(category.id, options)
}

/**
 * 獲取有食譜的分類（按食譜數量排序）
 */
export async function getCategoriesWithRecipes(): Promise<(Category & { recipe_count: number })[]> {
  const supabase = await createServerSupabaseClient()
  
  // 查詢有食譜的分類，並計算每個分類的食譜數量
  const { data, error } = await supabase
    .from('recipes')
    .select('category_id')
    .eq('status', 'published')
    .eq('is_public', true)
    .not('category_id', 'is', null)
  
  if (error) {
    console.error('Error fetching categories with recipes:', error)
    return []
  }
  
  if (!data || data.length === 0) {
    return []
  }
  
  // 計算每個分類的食譜數量
  const categoryCounts = new Map<string, number>()
  for (const recipe of data) {
    const categoryId = (recipe as any).category_id
    if (categoryId) {
      categoryCounts.set(categoryId, (categoryCounts.get(categoryId) || 0) + 1)
    }
  }
  
  // 獲取分類詳細資訊
  const categoryIds = Array.from(categoryCounts.keys())
  const { data: categories, error: categoriesError } = await supabase
    .from('categories')
    .select('*')
    .in('id', categoryIds)
  
  if (categoriesError || !categories) {
    console.error('Error fetching categories:', categoriesError)
    return []
  }
  
  // 合併分類資訊和數量，並按數量排序
  const categoriesWithCounts = categories.map((category: any) => ({
    ...category,
    recipe_count: categoryCounts.get(category.id) || 0,
  })) as (Category & { recipe_count: number })[]
  
  // 按數量降序排序
  return categoriesWithCounts.sort((a, b) => b.recipe_count - a.recipe_count)
}


