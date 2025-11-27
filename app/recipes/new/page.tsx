import { RecipeUploadForm } from '@/components/recipes/RecipeUploadForm'
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

  return <RecipeUploadForm mode="create" />
}


