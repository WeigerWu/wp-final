import { createServerSupabaseClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { ProfileContent } from '@/components/profile/ProfileContent'
import { getRecipes } from '@/lib/actions/recipes'

interface ProfilePageProps {
  params: {
    userId: string
  }
}

export default async function UserProfilePage({ params }: ProfilePageProps) {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser()

  const { userId } = params

  // Get profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (profileError || !profile) {
    notFound()
  }

  // Get user's recipes
  const recipes = await getRecipes({ userId, limit: 20 })

  return (
    <div className="container mx-auto px-4 py-8">
      <ProfileContent 
        userId={userId} 
        initialRecipes={recipes}
        currentUserId={currentUser?.id || null}
        initialProfile={profile}
      />
    </div>
  )
}




