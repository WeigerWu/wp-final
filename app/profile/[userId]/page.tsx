import { createServerSupabaseClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { ProfileContent } from '@/components/profile/ProfileContent'
import { getRecipes, getRecipeCount } from '@/lib/actions/recipes-server'

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

  // Get profile, recipes, and recipe count in parallel
  const [profileResult, recipes, recipeCount] = await Promise.all([
    supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single(),
    getRecipes({ userId, limit: 20 }),
    getRecipeCount(userId),
  ])

  const { data: profile, error: profileError } = profileResult

  if (profileError || !profile) {
    notFound()
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <ProfileContent 
        userId={userId} 
        initialRecipes={recipes}
        currentUserId={currentUser?.id || null}
        initialProfile={profile}
        totalRecipeCount={recipeCount}
      />
    </div>
  )
}




