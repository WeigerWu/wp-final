import { RecipeForm } from '@/components/recipes/RecipeForm'
import { getRecipe } from '@/lib/actions/recipes'
import { createSupabaseClient } from '@/lib/supabase/client'
import { redirect, notFound } from 'next/navigation'

interface EditRecipePageProps {
  params: {
    id: string
  }
}

export default async function EditRecipePage({ params }: EditRecipePageProps) {
  const supabase = createSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const recipe = await getRecipe(params.id)

  if (!recipe) {
    notFound()
  }

  if (recipe.user_id !== user.id) {
    redirect('/recipes')
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-8 text-3xl font-bold">編輯食譜</h1>
        <RecipeForm recipe={recipe} mode="edit" />
      </div>
    </div>
  )
}


