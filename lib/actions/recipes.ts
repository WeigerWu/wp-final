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

