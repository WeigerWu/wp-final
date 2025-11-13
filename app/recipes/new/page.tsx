import { RecipeForm } from '@/components/recipes/RecipeForm'
import { createSupabaseClient } from '@/lib/supabase/client'
import { redirect } from 'next/navigation'

export default async function NewRecipePage() {
  const supabase = createSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-8 text-3xl font-bold">建立新食譜</h1>
        <RecipeForm />
      </div>
    </div>
  )
}


