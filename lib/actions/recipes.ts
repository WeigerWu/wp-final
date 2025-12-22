import { createSupabaseClient } from '@/lib/supabase/client'
import { Recipe } from '@/types/recipe'
import { Database } from '@/lib/supabase/types'

type RecipeRow = Database['public']['Tables']['recipes']['Row']

export async function createRecipe(recipeData: {
  title: string
  description?: string
  image_url?: string | null
  servings?: number
  prep_time?: number
  cook_time?: number
  difficulty?: 'easy' | 'medium' | 'hard'
  tags?: string[]
  ingredients: any[]
  steps: any[]
}): Promise<Recipe | null> {
  const supabase = createSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('User not authenticated')
  }

  const { data, error } = await (supabase
    .from('recipes') as any)
    .insert({
      ...recipeData,
      user_id: user.id,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating recipe:', error)
    throw error
  }

  return data as Recipe
}

export async function updateRecipe(
  id: string,
  recipeData: Partial<{
    title: string
    description: string
    image_url: string | null
    servings: number
    prep_time: number
    cook_time: number
    difficulty: 'easy' | 'medium' | 'hard'
    tags: string[]
    ingredients: any[]
    steps: any[]
  }>
): Promise<Recipe | null> {
  const supabase = createSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('User not authenticated')
  }

  const { data, error } = await (supabase
    .from('recipes') as any)
    .update(recipeData)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) {
    console.error('Error updating recipe:', error)
    throw error
  }

  return data as Recipe
}

export async function deleteRecipe(id: string): Promise<boolean> {
  const supabase = createSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('User not authenticated')
  }

  const { error } = await supabase
    .from('recipes')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    console.error('Error deleting recipe:', error)
    throw error
  }

  return true
}

export async function getUserRating(recipeId: string): Promise<number | null> {
  const supabase = createSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const { data, error } = await supabase
    .from('recipe_ratings')
    .select('rating')
    .eq('recipe_id', recipeId)
    .eq('user_id', user.id)
    .single()

  if (error || !data) {
    return null
  }

  return (data as { rating: number }).rating
}

export async function rateRecipe(recipeId: string, rating: number): Promise<boolean> {
  const supabase = createSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('User not authenticated')
  }

  const { error } = await (supabase
    .from('recipe_ratings') as any)
    .upsert(
      {
        recipe_id: recipeId,
        user_id: user.id,
        rating,
      },
      {
        onConflict: 'recipe_id,user_id',
      }
    )

  if (error) {
    console.error('Error rating recipe:', error)
    throw error
  }

  return true
}

export async function favoriteRecipe(recipeId: string): Promise<boolean> {
  const supabase = createSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('User not authenticated')
  }

  const { error } = await (supabase.from('recipe_favorites') as any).insert({
    recipe_id: recipeId,
    user_id: user.id,
  })

  if (error) {
    // If already favorited, try to unfavorite
    if (error.code === '23505') {
      const { error: deleteError } = await (supabase
        .from('recipe_favorites') as any)
        .delete()
        .eq('recipe_id', recipeId)
        .eq('user_id', user.id)

      if (deleteError) {
        console.error('Error unfavoriting recipe:', deleteError)
        throw deleteError
      }
      return false
    }
    console.error('Error favoriting recipe:', error)
    throw error
  }

  return true
}

export async function unfavoriteRecipe(recipeId: string): Promise<boolean> {
  const supabase = createSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('User not authenticated')
  }

  const { error } = await (supabase
    .from('recipe_favorites') as any)
    .delete()
    .eq('recipe_id', recipeId)
    .eq('user_id', user.id)

  if (error) {
    console.error('Error unfavoriting recipe:', error)
    throw error
  }

  return true
}

// Get user's favorite recipes
export async function getUserFavoriteRecipes(userId: string, options: { limit?: number; offset?: number } = {}): Promise<Recipe[]> {
  const supabase = createSupabaseClient()

  // Get favorite recipe IDs
  let favoritesQuery = supabase
    .from('recipe_favorites')
    .select('recipe_id')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (options.limit) {
    favoritesQuery = favoritesQuery.limit(options.limit)
  }

  if (options.offset !== undefined) {
    const end = options.offset + (options.limit || 10) - 1
    favoritesQuery = favoritesQuery.range(options.offset, end)
  }

  const { data: favorites, error: favoritesError } = await favoritesQuery

  if (favoritesError || !favorites || favorites.length === 0) {
    return []
  }

  const recipeIds = favorites.map((f: any) => f.recipe_id)

  // Get recipes
  const { data: recipes, error: recipesError } = await supabase
    .from('recipes')
    .select('*')
    .in('id', recipeIds)
    .order('created_at', { ascending: false })

  if (recipesError || !recipes || recipes.length === 0) {
    return []
  }

  // Fetch user profiles for all recipes
  const userIds = Array.from(new Set(recipes.map((recipe: any) => recipe.user_id)))
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, username, avatar_url')
    .in('id', userIds)

  const profilesMap = new Map(
    (profiles || []).map((profile: any) => [profile.id, profile])
  )

  // Fetch ratings and favorites for each recipe
  const recipesWithStats = await Promise.all(
    recipes.map(async (recipe: any) => {
      const { data: ratings } = await supabase
        .from('recipe_ratings')
        .select('rating')
        .eq('recipe_id', recipe.id)

      const { data: recipeFavorites } = await supabase
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
        favorite_count: recipeFavorites?.length || 0,
      } as Recipe
    })
  )

  return recipesWithStats
}

// Client-side function to get recipes
export async function getRecipesClient(options: {
  limit?: number
  offset?: number
  userId?: string
  tags?: string[]
  search?: string
  categoryId?: string | string[]
  difficulty?: 'easy' | 'medium' | 'hard' | ('easy' | 'medium' | 'hard')[]
} = {}): Promise<Recipe[]> {
  const supabase = createSupabaseClient()
  
  // Handle tags filtering first if needed
  let recipeIds: string[] | null = null
  if (options.tags && options.tags.length > 0) {
    const allRecipeIds = new Set<string>()
    
    const { data: allRecipes, error: fetchError } = await supabase
      .from('recipes')
      .select('id, tags, status, is_public')
    
    if (fetchError) {
      console.error('[getRecipesClient] 獲取食譜列表時發生錯誤:', fetchError)
    } else if (allRecipes) {
      for (const recipe of allRecipes) {
        const recipeData = recipe as any
        const recipeTags = (recipeData.tags as string[]) || []
        const hasMatchingTag = options.tags!.some(tag => recipeTags.includes(tag))
        
        if (hasMatchingTag) {
          const isPublished = recipeData.status === 'published' || recipeData.status === null || recipeData.status === undefined
          const isPublic = recipeData.is_public === true || recipeData.is_public === null || recipeData.is_public === undefined
          
          if (isPublished && isPublic) {
            allRecipeIds.add(recipeData.id)
          }
        }
      }
    }
    
    recipeIds = Array.from(allRecipeIds)
    if (recipeIds.length === 0) {
      return []
    }
  }

  let query = supabase
    .from('recipes')
    .select('*')
    .order('created_at', { ascending: false })

  if (options.userId) {
    query = query.eq('user_id', options.userId)
  }

  if (options.categoryId) {
    if (Array.isArray(options.categoryId)) {
      if (options.categoryId.length > 0) {
        query = query.in('category_id', options.categoryId)
      }
    } else {
      query = query.eq('category_id', options.categoryId)
    }
  }

  if (recipeIds) {
    query = query.in('id', recipeIds)
  }

  if (options.search) {
    query = query.or(`title.ilike.%${options.search}%,description.ilike.%${options.search}%`)
  }

  if (options.difficulty) {
    if (Array.isArray(options.difficulty)) {
      if (options.difficulty.length > 0) {
        query = query.in('difficulty', options.difficulty)
      }
    } else {
      query = query.eq('difficulty', options.difficulty)
    }
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

  // Fetch categories for all recipes
  const categoryIds = Array.from(new Set(data.map((recipe: any) => recipe.category_id).filter(Boolean)))
  const { data: categories } = categoryIds.length > 0 ? await supabase
    .from('categories')
    .select('id, name, slug, icon')
    .in('id', categoryIds) : { data: [] }

  const categoriesMap = new Map(
    (categories || []).map((category: any) => [category.id, category])
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
        category: recipe.category_id ? categoriesMap.get(recipe.category_id) || null : null,
        average_rating: averageRating,
        rating_count: ratings?.length || 0,
        favorite_count: favorites?.length || 0,
      } as Recipe
    })
  )

  return recipesWithStats
}

