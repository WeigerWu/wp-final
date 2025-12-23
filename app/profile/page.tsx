import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ProfileContent } from '@/components/profile/ProfileContent'
import { getRecipes, getRecipeCount } from '@/lib/actions/recipes-server'

// 强制动态渲染，禁用缓存
export const dynamic = 'force-dynamic'

export default async function ProfilePage() {
  const supabase = await createServerSupabaseClient()
  
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/auth/login')
  }

  // Get profile, recipes, and recipe count in parallel
  const [profileResult, recipes, recipeCount] = await Promise.all([
    supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single(),
    getRecipes({ userId: user.id, limit: 20 }),
    getRecipeCount(user.id),
  ])

  const profile = profileResult.data

  return (
    <div className="container mx-auto px-4 py-8">
      <ProfileContent 
        userId={user.id} 
        initialRecipes={recipes} 
        currentUserId={user.id}
        initialProfile={profile}
        totalRecipeCount={recipeCount}
      />
    </div>
  )
}


