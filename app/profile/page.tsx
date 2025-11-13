import { createSupabaseClient } from '@/lib/supabase/client'
import { redirect } from 'next/navigation'
import { ProfileContent } from '@/components/profile/ProfileContent'
import { getRecipes } from '@/lib/actions/recipes'

export default async function ProfilePage() {
  const supabase = createSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Get user's recipes
  const recipes = await getRecipes({ userId: user.id, limit: 20 })

  return (
    <div className="container mx-auto px-4 py-8">
      <ProfileContent userId={user.id} initialRecipes={recipes} />
    </div>
  )
}


