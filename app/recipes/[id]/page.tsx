import { notFound } from 'next/navigation'
import { getRecipe } from '@/lib/actions/recipes-server'
import { RecipeDetail } from '@/components/recipes/RecipeDetail'
import { CommentsSection } from '@/components/recipes/CommentsSection'
import { getComments } from '@/lib/actions/comments'

// 強制動態渲染（因為使用了 cookies）
export const dynamic = 'force-dynamic'

interface RecipePageProps {
  params: {
    id: string
  }
}

export default async function RecipePage({ params }: RecipePageProps) {
  const recipeId = params.id
  
  if (!recipeId) {
    notFound()
  }

  const recipe = await getRecipe(recipeId)
  const comments = recipe ? await getComments(recipe.id) : []

  if (!recipe) {
    console.error(`Recipe not found: ${recipeId}`)
    notFound()
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <RecipeDetail recipe={recipe} />
      <CommentsSection recipeId={recipe.id} initialComments={comments} />
    </div>
  )
}


