'use client'

import { useState, useEffect } from 'react'
import { createSupabaseClient } from '@/lib/supabase/client'
import { Recipe } from '@/types/recipe'
import { RecipeCard } from '@/components/recipes/RecipeCard'
import { Button } from '@/components/ui/Button'
import { Edit2 } from 'lucide-react'
import { Database } from '@/lib/supabase/types'

type ProfileRow = Database['public']['Tables']['profiles']['Row']

interface ProfileContentProps {
  userId: string
  initialRecipes: Recipe[]
}

export function ProfileContent({ userId, initialRecipes }: ProfileContentProps) {
  const [profile, setProfile] = useState<ProfileRow | null>(null)
  const [recipes, setRecipes] = useState(initialRecipes)
  const [isEditing, setIsEditing] = useState(false)
  const [username, setUsername] = useState('')
  const [bio, setBio] = useState('')
  const [currentUser, setCurrentUser] = useState<any>(null)

  useEffect(() => {
    const supabase = createSupabaseClient()
    
    supabase.auth.getUser().then(({ data }) => {
      setCurrentUser(data.user)
    })

    // Fetch profile
    supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
      .then((result) => {
        if (result.error) {
          console.error('Error fetching profile:', result.error)
          return
        }
        const data = result.data as ProfileRow | null
        if (data) {
          setProfile(data)
          setUsername(data.username || '')
          setBio(data.bio || '')
        }
      })
  }, [userId])

  const isOwner = currentUser?.id === userId

  const handleUpdateProfile = async () => {
    try {
      const supabase = createSupabaseClient()
      const updateData: Database['public']['Tables']['profiles']['Update'] = {
        username,
        bio,
      }
      const { error } = await (supabase
        .from('profiles') as any)
        .update(updateData)
        .eq('id', userId)

      if (error) throw error

      if (profile) {
        setProfile({ ...profile, username, bio })
      }
      setIsEditing(false)
    } catch (error) {
      console.error('Error updating profile:', error)
      alert('更新失敗，請稍後再試')
    }
  }

  return (
    <div className="space-y-8">
      {/* Profile Header */}
      <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
        <div className="flex items-start space-x-6">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gray-200 text-2xl font-bold text-gray-600">
            {profile?.username?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1">
            {isEditing && isOwner ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    使用者名稱
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    個人簡介
                  </label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={3}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                </div>
                <div className="flex space-x-2">
                  <Button onClick={handleUpdateProfile}>儲存</Button>
                  <Button variant="outline" onClick={() => setIsEditing(false)}>
                    取消
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center space-x-2">
                  <h1 className="text-2xl font-bold">{profile?.username || '用戶'}</h1>
                  {isOwner && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
                {profile?.bio && (
                  <p className="mt-2 text-gray-600">{profile.bio}</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* User's Recipes */}
      <div>
        <h2 className="mb-4 text-2xl font-bold">我的食譜</h2>
        {recipes.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {recipes.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-12 text-center">
            <p className="text-gray-600">尚無食譜</p>
          </div>
        )}
      </div>
    </div>
  )
}
