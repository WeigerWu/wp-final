export interface Ingredient {
  name: string
  amount: string
  unit?: string
}

export interface RecipeStep {
  step_number: number
  instruction: string
  image_url?: string
  timer_minutes?: number
}

export interface Recipe {
  id: string
  user_id: string
  title: string
  description: string | null
  image_url: string | null
  servings: number | null
  prep_time: number | null
  cook_time: number | null
  difficulty: 'easy' | 'medium' | 'hard' | null
  tags: string[]
  ingredients: Ingredient[]
  steps: RecipeStep[]
  created_at: string
  updated_at: string
  user?: {
    username: string | null
    avatar_url: string | null
  }
  average_rating?: number
  rating_count?: number
  favorite_count?: number
  is_favorited?: boolean
  user_rating?: number
}

export interface RecipeRating {
  id: string
  recipe_id: string
  user_id: string
  rating: number
  created_at: string
  updated_at: string
}

export interface RecipeFavorite {
  id: string
  recipe_id: string
  user_id: string
  created_at: string
}

export interface Comment {
  id: string
  recipe_id: string
  user_id: string
  content: string
  created_at: string
  updated_at: string
  user?: {
    username: string | null
    avatar_url: string | null
  }
}

export interface Profile {
  id: string
  username: string | null
  avatar_url: string | null
  bio: string | null
  created_at: string
  updated_at: string
}


