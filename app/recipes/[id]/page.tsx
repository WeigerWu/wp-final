import { notFound } from 'next/navigation'
import { getRecipe } from '@/lib/actions/recipes'
import { RecipeDetail } from '@/components/recipes/RecipeDetail'
import { CommentsSection } from '@/components/recipes/CommentsSection'
import { getComments } from '@/lib/actions/comments'

interface RecipePageProps {
  params: {
    id: string
  }
}

export default async function RecipePage({ params }: RecipePageProps) {
  const recipe = await getRecipe(params.id)
  const comments = recipe ? await getComments(recipe.id) : []

  if (!recipe) {
    notFound()
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <RecipeDetail recipe={recipe} />
      <CommentsSection recipeId={recipe.id} initialComments={comments} />
    </div>
  )
}


