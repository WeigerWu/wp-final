import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Recipe } from '@/types/recipe'

interface GetRecipesOptions {
  limit?: number
  offset?: number
  userId?: string
  tags?: string[]
  search?: string
}

export async function getRecipes(options: GetRecipesOptions = {}): Promise<Recipe[]> {
  const supabase = await createServerSupabaseClient()
  let query = supabase
    .from('recipes')
    .select('*')
    .order('created_at', { ascending: false })

  if (options.userId) {
    query = query.eq('user_id', options.userId)
  }

  if (options.tags && options.tags.length > 0) {
    // Use textSearch or filter for tags
    query = query.contains('tags', options.tags)
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

  const { data, error } = await query

  if (error) {
    console.error('Error fetching recipes:', error)
    // 檢查是否為 HTML 回應（通常是 URL 錯誤）
    if (error.message && error.message.includes('<!DOCTYPE html>')) {
      console.error('⚠️ Supabase URL 可能設定錯誤！')
      console.error('請檢查 .env 中的 NEXT_PUBLIC_SUPABASE_URL')
      console.error('正確格式應該是: https://your-project-id.supabase.co')
    }
    return []
  }

  if (!data || data.length === 0) {
    return []
  }

  // Fetch user profiles for all recipes
  const userIds = Array.from(new Set(data.map((recipe: any) => recipe.user_id)))
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, username, avatar_url')
    .in('id', userIds)

  const profilesMap = new Map(
    (profiles || []).map((profile: any) => [profile.id, profile])
  )

  // Fetch ratings and favorites for each recipe
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

  return recipesWithStats
}

export async function getRecipe(id: string): Promise<Recipe | null> {
  if (!id) {
    console.error('getRecipe: No ID provided')
    return null
  }

  // 使用服務器端客戶端以確保正確的 RLS 政策
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('recipes')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching recipe:', {
      id,
      error: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    })
    return null
  }

  if (!data) {
    console.error(`Recipe not found in database: ${id}`)
    return null
  }

  const recipeData = data as any

  // Fetch user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, username, avatar_url')
    .eq('id', recipeData.user_id)
    .single()

  // Fetch ratings
  const { data: ratings } = await supabase
    .from('recipe_ratings')
    .select('rating')
    .eq('recipe_id', id)

  // Fetch favorites
  const { data: favorites } = await supabase
    .from('recipe_favorites')
    .select('id')
    .eq('recipe_id', id)

  // Check if current user has favorited
  const {
    data: { user },
  } = await supabase.auth.getUser()
  let isFavorited = false
  let userRating = 0

  if (user) {
    const { data: favorite } = await supabase
      .from('recipe_favorites')
      .select('id')
      .eq('recipe_id', id)
      .eq('user_id', user.id)
      .single()

    isFavorited = !!favorite

    const { data: rating } = await supabase
      .from('recipe_ratings')
      .select('rating')
      .eq('recipe_id', id)
      .eq('user_id', user.id)
      .single()

    userRating = (rating as any)?.rating || 0
  }

  const averageRating =
    ratings && ratings.length > 0
      ? ratings.reduce((sum: number, r: any) => sum + r.rating, 0) / ratings.length
      : 0

  return {
    ...recipeData,
    user: profile || { username: 'Unknown', avatar_url: null },
    average_rating: averageRating,
    rating_count: ratings?.length || 0,
    favorite_count: favorites?.length || 0,
    is_favorited: isFavorited,
    user_rating: userRating,
  } as Recipe
}

