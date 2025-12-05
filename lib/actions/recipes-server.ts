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
  
  // Handle tags filtering first if needed
  let recipeIds: string[] | null = null
  if (options.tags && options.tags.length > 0) {
    // For JSONB array field with Chinese characters, we need to use a different approach
    // The contains() method doesn't work properly with Chinese tags in Supabase
    // We'll use a workaround: fetch recipes and filter in memory
    const allRecipeIds = new Set<string>()
    
    // Get all recipes first (we'll filter by status/is_public in memory)
    // This is necessary because contains() doesn't work with Chinese characters
    const { data: allRecipes, error: fetchError } = await supabase
      .from('recipes')
      .select('id, tags, status, is_public')
    
    if (fetchError) {
      console.error('[getRecipes] 獲取食譜列表時發生錯誤:', fetchError)
    } else if (allRecipes) {
      console.log(`[getRecipes] 總共獲取到 ${allRecipes.length} 個已發布的食譜`)
      
      // Filter recipes that contain any of the selected tags
      for (const recipe of allRecipes) {
        const recipeData = recipe as any
        const recipeTags = (recipeData.tags as string[]) || []
        const hasMatchingTag = options.tags.some(tag => recipeTags.includes(tag))
        
        if (hasMatchingTag) {
          // Check if recipe is published and public (with default values)
          const isPublished = recipeData.status === 'published' || recipeData.status === null || recipeData.status === undefined
          const isPublic = recipeData.is_public === true || recipeData.is_public === null || recipeData.is_public === undefined
          
          if (isPublished && isPublic) {
            allRecipeIds.add(recipeData.id)
          }
        }
      }
      
      console.log(`[getRecipes] 找到 ${allRecipeIds.size} 個符合標籤條件的食譜`)
    }
    
    recipeIds = Array.from(allRecipeIds)
    if (recipeIds.length === 0) {
      // No recipes found with any of the tags, return empty result
      console.log('[getRecipes] 沒有找到符合標籤條件的食譜，返回空陣列')
      return []
    }
  }

  let query = supabase
    .from('recipes')
    .select('*')
    // 暫時不過濾 status 和 is_public，先確保標籤過濾能正常工作
    // 之後可以在應用層面過濾，或者確保所有食譜都有正確的 status/is_public 值
    .order('created_at', { ascending: false })

  if (options.userId) {
    query = query.eq('user_id', options.userId)
  }

  if (recipeIds) {
    query = query.in('id', recipeIds)
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


