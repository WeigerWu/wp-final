export interface Ingredient {
  name: string
  amount: string
  unit?: string
  note?: string // 備註：切碎、常溫、去皮等
  category?: string // 分類：醬料、調味料、主料等
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
  category_id?: string | null
  category?: {
    id: string
    name: string
    slug: string
    icon: string | null
  } | null
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
  parent_id?: string | null
  is_deleted?: boolean
  created_at: string
  updated_at: string
  user?: {
    username: string | null
    avatar_url: string | null
  }
  parent_user?: {
    username: string | null
    avatar_url: string | null
  } | null
  replies?: Comment[]
}

export interface Profile {
  id: string
  username: string | null
  avatar_url: string | null
  bio: string | null
  created_at: string
  updated_at: string
}


