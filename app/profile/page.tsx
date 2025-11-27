import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ProfileContent } from '@/components/profile/ProfileContent'
import { getRecipes } from '@/lib/actions/recipes'

export default async function ProfilePage() {
  const supabase = await createServerSupabaseClient()
  
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/auth/login')
  }

  // Get profile and recipes in parallel
  const [profileResult, recipes] = await Promise.all([
    supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single(),
    getRecipes({ userId: user.id, limit: 20 }),
  ])

  const profile = profileResult.data

  return (
    <div className="container mx-auto px-4 py-8">
      <ProfileContent 
        userId={user.id} 
        initialRecipes={recipes} 
        currentUserId={user.id}
        initialProfile={profile}
      />
    </div>
  )
}


