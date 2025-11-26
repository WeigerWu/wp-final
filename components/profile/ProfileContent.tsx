'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { createSupabaseClient } from '@/lib/supabase/client'
import { Recipe } from '@/types/recipe'
import { RecipeCard } from '@/components/recipes/RecipeCard'
import { Button } from '@/components/ui/Button'
import { Edit2, Calendar, Heart } from 'lucide-react'
import { getUserFavoriteRecipes } from '@/lib/actions/recipes'
import { Database } from '@/lib/supabase/types'
import { formatDate } from '@/lib/utils'

type ProfileRow = Database['public']['Tables']['profiles']['Row']

interface ProfileContentProps {
  userId: string
  initialRecipes: Recipe[]
  currentUserId?: string | null
}

type TabType = 'recipes' | 'favorites'

export function ProfileContent({ userId, initialRecipes, currentUserId }: ProfileContentProps) {
  const [profile, setProfile] = useState<ProfileRow | null>(null)
  const [recipes, setRecipes] = useState(initialRecipes)
  const [favoriteRecipes, setFavoriteRecipes] = useState<Recipe[]>([])
  const [activeTab, setActiveTab] = useState<TabType>('recipes')
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [currentUser, setCurrentUser] = useState<any>(null)

  useEffect(() => {
    const supabase = createSupabaseClient()
    
    if (!currentUserId) {
      supabase.auth.getUser().then(({ data }) => {
        setCurrentUser(data.user)
      })
    } else {
      setCurrentUser({ id: currentUserId })
    }

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
          setDisplayName(data.display_name || data.username || '')
          setBio(data.bio || '')
          setAvatarUrl(data.avatar_url || '')
        }
      })
  }, [userId, currentUserId])

  const isOwner = (currentUserId || currentUser?.id) === userId

  const loadFavoriteRecipes = useCallback(async () => {
    if (!isOwner) return
    setIsLoading(true)
    try {
      const favorites = await getUserFavoriteRecipes(userId, { limit: 50 })
      setFavoriteRecipes(favorites)
    } catch (error) {
      console.error('Error loading favorite recipes:', error)
    } finally {
      setIsLoading(false)
    }
  }, [isOwner, userId])

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab)
    if (tab === 'favorites' && favoriteRecipes.length === 0 && isOwner) {
      loadFavoriteRecipes()
    }
  }

  useEffect(() => {
    if (activeTab === 'favorites' && isOwner && favoriteRecipes.length === 0) {
      loadFavoriteRecipes()
    }
  }, [activeTab, isOwner, favoriteRecipes.length, loadFavoriteRecipes])

  const handleUpdateProfile = async () => {
    try {
      const supabase = createSupabaseClient()
      const updateData: Database['public']['Tables']['profiles']['Update'] = {
        username,
        display_name: displayName,
        bio,
        avatar_url: avatarUrl || null,
      }
      const { error } = await (supabase
        .from('profiles') as any)
        .update(updateData)
        .eq('id', userId)

      if (error) throw error

      // Reload profile
      const { data: updatedProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (updatedProfile) {
        setProfile(updatedProfile as ProfileRow)
        setIsEditing(false)
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      alert('更新失敗，請稍後再試')
    }
  }

  if (!profile) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-gray-600">載入中...</p>
      </div>
    )
  }

  const displayNameToShow = profile.display_name || profile.username || '用戶'
  const handle = profile.username ? `@${profile.username}` : '@user'
  const joinDate = formatDate(profile.created_at)

  return (
    <div className="space-y-8">
      {/* Profile Header */}
      <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col space-y-6 md:flex-row md:items-start md:space-x-6 md:space-y-0">
          {/* Avatar */}
          <div className="flex-shrink-0">
            {isEditing && isOwner ? (
              <div className="space-y-2">
                <div className="relative h-32 w-32 overflow-hidden rounded-full border-4 border-gray-200 bg-gray-100">
                  {avatarUrl ? (
                    <Image
                      src={avatarUrl}
                      alt={displayNameToShow}
                      fill
                      className="object-cover"
                      sizes="128px"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-4xl font-bold text-gray-400">
                      {displayNameToShow[0]?.toUpperCase() || 'U'}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    大頭貼 URL
                  </label>
                  <input
                    type="url"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    placeholder="https://..."
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                </div>
              </div>
            ) : (
              <div className="relative h-32 w-32 overflow-hidden rounded-full border-4 border-gray-200 bg-gray-100">
                {profile.avatar_url ? (
                  <Image
                    src={profile.avatar_url}
                    alt={displayNameToShow}
                    fill
                    className="object-cover"
                    sizes="128px"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-4xl font-bold text-gray-400">
                    {displayNameToShow[0]?.toUpperCase() || 'U'}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Profile Info */}
          <div className="flex-1">
            {isEditing && isOwner ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    顯示名稱
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    使用者名稱 (Handle)
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                  <p className="mt-1 text-xs text-gray-500">將顯示為 @{username}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    個人簡介
                  </label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={4}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                </div>
                <div className="flex space-x-2">
                  <Button onClick={handleUpdateProfile}>儲存</Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setIsEditing(false)
                      // Reset to original values
                      setDisplayName(profile.display_name || profile.username || '')
                      setUsername(profile.username || '')
                      setBio(profile.bio || '')
                      setAvatarUrl(profile.avatar_url || '')
                    }}
                  >
                    取消
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">
                      {displayNameToShow}
                    </h1>
                    <p className="mt-1 text-lg text-gray-600">{handle}</p>
                  </div>
                  {isOwner && (
                    <Button
                      onClick={() => setIsEditing(true)}
                      className="flex items-center space-x-2"
                    >
                      <Edit2 className="h-4 w-4" />
                      <span>編輯個人資料</span>
                    </Button>
                  )}
                </div>
                
                {profile.bio && (
                  <p className="text-gray-700 whitespace-pre-wrap">{profile.bio}</p>
                )}

                <div className="flex items-center space-x-6 text-sm text-gray-500">
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>加入時間：{joinDate}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => handleTabChange('recipes')}
            className={`whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium transition-colors ${
              activeTab === 'recipes'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            }`}
          >
            食譜 ({recipes.length})
          </button>
          {isOwner && (
            <button
              onClick={() => handleTabChange('favorites')}
              className={`whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium transition-colors flex items-center space-x-1 ${
                activeTab === 'favorites'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              <Heart className="h-4 w-4" />
              <span>收藏 ({isLoading ? '...' : favoriteRecipes.length})</span>
            </button>
          )}
        </nav>
      </div>

      {/* Content */}
      <div>
        {activeTab === 'recipes' ? (
          <>
            {recipes.length > 0 ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {recipes.map((recipe) => (
                  <RecipeCard key={recipe.id} recipe={recipe} />
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-12 text-center">
                <p className="text-gray-600">
                  {isOwner ? '您尚未上傳任何食譜' : '此用戶尚未上傳任何食譜'}
                </p>
              </div>
            )}
          </>
        ) : (
          <>
            {isLoading ? (
              <div className="flex min-h-[200px] items-center justify-center">
                <p className="text-gray-600">載入中...</p>
              </div>
            ) : favoriteRecipes.length > 0 ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {favoriteRecipes.map((recipe) => (
                  <RecipeCard key={recipe.id} recipe={recipe} />
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-12 text-center">
                <Heart className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-4 text-gray-600">尚未收藏任何食譜</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
