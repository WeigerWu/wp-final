'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase/client'
import { Recipe } from '@/types/recipe'
import { RecipeCard } from '@/components/recipes/RecipeCard'
import { Button } from '@/components/ui/Button'
import { Edit2, Calendar, Heart, UserPlus, UserMinus, Users, Upload } from 'lucide-react'
import { getUserFavoriteRecipes } from '@/lib/actions/recipes'
import { followUser, unfollowUser } from '@/lib/actions/follows'
import { isFollowingClient } from '@/lib/actions/follows-client'
import { Database } from '@/lib/supabase/types'
import { formatDate } from '@/lib/utils'
import { uploadImage } from '@/lib/cloudinary'
import { smartCompressImage } from '@/lib/image-utils'

type ProfileRow = Database['public']['Tables']['profiles']['Row']

interface ProfileContentProps {
  userId: string
  initialRecipes: Recipe[]
  currentUserId?: string | null
  initialProfile?: ProfileRow | null
  totalRecipeCount?: number
}

type TabType = 'recipes' | 'favorites'

export function ProfileContent({ userId, initialRecipes, currentUserId, initialProfile, totalRecipeCount }: ProfileContentProps) {
  const [profile, setProfile] = useState<ProfileRow | null>(initialProfile || null)
  const [recipes, setRecipes] = useState(initialRecipes)
  const [favoriteRecipes, setFavoriteRecipes] = useState<Recipe[]>([])
  const [favoriteCount, setFavoriteCount] = useState<number>(0)
  const [activeTab, setActiveTab] = useState<TabType>('recipes')
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isFollowing, setIsFollowing] = useState(false)
  const [isFollowLoading, setIsFollowLoading] = useState(false)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [recipeCount, setRecipeCount] = useState(totalRecipeCount || initialRecipes.length)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const supabase = createSupabaseClient()
    
    if (!currentUserId) {
      supabase.auth.getUser().then(({ data }) => {
        setCurrentUser(data.user)
      })
    } else {
      setCurrentUser({ id: currentUserId })
    }

    // Only fetch profile if not provided initially
    if (!initialProfile) {
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
    } else {
      // Use initial profile data
      setProfile(initialProfile)
      setUsername(initialProfile.username || '')
      setDisplayName(initialProfile.display_name || initialProfile.username || '')
      setBio(initialProfile.bio || '')
      setAvatarUrl(initialProfile.avatar_url || '')
    }

    // 監聽 profiles 表的變化（即時更新追蹤者數量）
    const channel = supabase
      .channel(`profile:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${userId}`,
        },
        (payload) => {
          console.log('Profile updated via Realtime:', payload.new)
          const updatedProfile = payload.new as ProfileRow
          setProfile(updatedProfile)
          // 同時更新表單中的值（如果正在編輯）
          if (updatedProfile.username) setUsername(updatedProfile.username)
          if (updatedProfile.display_name) setDisplayName(updatedProfile.display_name)
          if (updatedProfile.bio !== undefined) setBio(updatedProfile.bio || '')
          if (updatedProfile.avatar_url !== undefined) setAvatarUrl(updatedProfile.avatar_url || '')
        }
      )
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Realtime subscription active for profile:', userId)
        }
        if (status === 'CHANNEL_ERROR') {
          console.error('❌ Realtime subscription error:', err)
        }
        if (status === 'TIMED_OUT') {
          console.error('⏱️ Realtime subscription timed out')
        }
      })

    // 清理函數：取消訂閱
    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, currentUserId, initialProfile])

  const isOwner = (currentUserId || currentUser?.id) === userId

  // Load favorite count on mount (only for owner)
  useEffect(() => {
    const checkIsOwner = (currentUserId || currentUser?.id) === userId
    if (checkIsOwner) {
      const supabase = createSupabaseClient()
      supabase
        .from('recipe_favorites')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .then(({ count, error }) => {
          if (!error && count !== null) {
            setFavoriteCount(count)
          }
        })
    }
  }, [userId, currentUserId, currentUser?.id])

  // Check if current user is following this user
  useEffect(() => {
    if (!isOwner && currentUser?.id) {
      isFollowingClient(userId).then(setIsFollowing)
    }
  }, [userId, currentUser?.id, isOwner])

  const loadFavoriteRecipes = useCallback(async () => {
    if (!isOwner) return
    setIsLoading(true)
    try {
      const favorites = await getUserFavoriteRecipes(userId, { limit: 50 })
      setFavoriteRecipes(favorites)
      setFavoriteCount(favorites.length) // Update count when loading full list
    } catch (error) {
      console.error('Error loading favorite recipes:', error)
    } finally {
      setIsLoading(false)
    }
  }, [isOwner, userId])

  const loadMoreRecipes = useCallback(async () => {
    if (isLoadingMore || recipes.length >= recipeCount) return

    setIsLoadingMore(true)
    try {
      const supabase = createSupabaseClient()
      const limit = 20
      const offset = recipes.length

      // Fetch more recipes
      let query = supabase
        .from('recipes')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      const { data: moreRecipes, error } = await query

      if (error) {
        console.error('Error loading more recipes:', error)
        return
      }

      if (moreRecipes && moreRecipes.length > 0) {
        // Fetch user profiles for new recipes
        const userIds = Array.from(new Set(moreRecipes.map((recipe: any) => recipe.user_id)))
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, username, avatar_url')
          .in('id', userIds)

        const profilesMap = new Map(
          (profiles || []).map((profile: any) => [profile.id, profile])
        )

        // Fetch ratings and favorites for each recipe
        const recipesWithStats = await Promise.all(
          moreRecipes.map(async (recipe: any) => {
            const { data: ratings } = await supabase
              .from('recipe_ratings')
              .select('rating')
              .eq('recipe_id', recipe.id)

            const { data: favorites } = await supabase
              .from('recipe_favorites')
              .select('id')
              .eq('recipe_id', recipe.id)

            const averageRating =
              ratings && ratings.length > 0
                ? ratings.reduce((sum: number, r: any) => sum + r.rating, 0) / ratings.length
                : 0

            return {
              ...recipe,
              user: profilesMap.get(recipe.user_id) || { username: 'Unknown', avatar_url: null },
              average_rating: averageRating,
              rating_count: ratings?.length || 0,
              favorite_count: favorites?.length || 0,
            } as Recipe
          })
        )

        setRecipes((prev) => [...prev, ...recipesWithStats])
      }
    } catch (error) {
      console.error('Error loading more recipes:', error)
    } finally {
      setIsLoadingMore(false)
    }
  }, [userId, recipes.length, recipeCount, isLoadingMore])

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

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 驗證文件類型
    if (!file.type.startsWith('image/')) {
      alert('請選擇圖片檔案')
      return
    }

    // 驗證文件大小（限制為 10MB）
    if (file.size > 10 * 1024 * 1024) {
      alert('圖片檔案大小不能超過 10MB')
      return
    }

    setAvatarFile(file)

    // 創建預覽
    const reader = new FileReader()
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleUpdateProfile = async () => {
    try {
      setIsUploadingAvatar(true)
      let finalAvatarUrl: string | null | undefined = undefined

      // 如果有新上傳的圖片，先上傳到 Cloudinary
      if (avatarFile) {
        try {
          // 壓縮圖片
          const compressedFile = await smartCompressImage(avatarFile)
          
          // 上傳到 Cloudinary
          const uploadedUrl = await uploadImage(compressedFile, 'avatars')
          finalAvatarUrl = uploadedUrl
        } catch (error) {
          console.error('Error uploading avatar:', error)
          alert('大頭貼上傳失敗，請稍後再試')
          setIsUploadingAvatar(false)
          return
        }
      }
      // 如果沒有選擇新文件，保持現有的 avatar_url 不變（不傳入該欄位）

      const supabase = createSupabaseClient()
      const updateData: Database['public']['Tables']['profiles']['Update'] = {
        username,
        display_name: displayName,
        bio,
        ...(finalAvatarUrl !== undefined && { avatar_url: finalAvatarUrl }),
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
        const profileData = updatedProfile as ProfileRow
        setProfile(profileData)
        setIsEditing(false)
        // 重置上傳相關狀態
        setAvatarFile(null)
        setAvatarPreview(null)
        setAvatarUrl(profileData.avatar_url || '')
      }
      setIsUploadingAvatar(false)
    } catch (error) {
      console.error('Error updating profile:', error)
      alert('更新失敗，請稍後再試')
      setIsUploadingAvatar(false)
    }
  }

  const handleFollow = async () => {
    if (!currentUser?.id) {
      router.push('/auth/login')
      return
    }

    setIsFollowLoading(true)
    try {
      if (isFollowing) {
        await unfollowUser(userId)
        setIsFollowing(false)
      } else {
        await followUser(userId)
        setIsFollowing(true)
      }

      // Realtime subscription 會自動更新 profile
      // 如果 Realtime 沒有立即觸發，作為備用方案等待 1 秒後手動刷新
      setTimeout(async () => {
        const supabase = createSupabaseClient()
        const { data: updatedProfile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single()

        if (updatedProfile && !error) {
          console.log('Backup refresh: updating profile manually')
          setProfile(updatedProfile as ProfileRow)
        }
      }, 1000)
    } catch (error) {
      console.error('Error toggling follow:', error)
      alert('操作失敗，請稍後再試')
    } finally {
      setIsFollowLoading(false)
    }
  }

  if (!profile) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-gray-600 dark:text-gray-400">載入中...</p>
      </div>
    )
  }

  const displayNameToShow = profile.display_name || profile.username || '用戶'
  const handle = profile.username ? `@${profile.username}` : '@user'
  const joinDate = formatDate(profile.created_at)

  return (
    <div className="space-y-8">
      {/* Profile Header */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-8 shadow-sm">
        <div className="flex flex-col space-y-6 md:flex-row md:items-start md:space-x-6 md:space-y-0">
          {/* Avatar */}
          <div className="flex-shrink-0">
            {isEditing && isOwner ? (
              <div className="space-y-2">
                <div className="relative h-32 w-32 overflow-hidden rounded-full border-4 border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-700">
                  {avatarPreview ? (
                    <Image
                      src={avatarPreview}
                      alt={displayNameToShow}
                      fill
                      className="object-cover"
                      sizes="128px"
                    />
                  ) : profile.avatar_url ? (
                    <Image
                      src={profile.avatar_url}
                      alt={displayNameToShow}
                      fill
                      className="object-cover"
                      sizes="128px"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-4xl font-bold text-gray-400 dark:text-gray-500">
                      {displayNameToShow[0]?.toUpperCase() || 'U'}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    上傳大頭貼
                  </label>
                  <div className="space-y-2">
                    <label className="flex cursor-pointer items-center justify-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
                      <Upload className="mr-2 h-4 w-4" />
                      <span>選擇圖片</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarFileChange}
                        className="hidden"
                      />
                    </label>
                    {avatarFile && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        已選擇: {avatarFile.name}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      支援 JPG、PNG 等圖片格式，檔案大小不超過 10MB
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="relative h-32 w-32 overflow-hidden rounded-full border-4 border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-700">
                {profile.avatar_url ? (
                  <Image
                    src={profile.avatar_url}
                    alt={displayNameToShow}
                    fill
                    className="object-cover"
                    sizes="128px"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-4xl font-bold text-gray-400 dark:text-gray-500">
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    顯示名稱
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 focus:border-primary-500 dark:focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:focus:ring-primary-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    使用者名稱 (Handle)
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 focus:border-primary-500 dark:focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:focus:ring-primary-400"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">將顯示為 @{username}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    個人簡介
                  </label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={4}
                    className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 focus:border-primary-500 dark:focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:focus:ring-primary-400"
                  />
                </div>
                <div className="flex space-x-2">
                  <Button 
                    onClick={handleUpdateProfile}
                    isLoading={isUploadingAvatar}
                  >
                    {isUploadingAvatar ? '上傳中...' : '儲存'}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setIsEditing(false)
                      // Reset to original values
                      setDisplayName(profile.display_name || profile.username || '')
                      setUsername(profile.username || '')
                      setBio(profile.bio || '')
                      setAvatarFile(null)
                      setAvatarPreview(null)
                    }}
                    disabled={isUploadingAvatar}
                  >
                    取消
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                      {displayNameToShow}
                    </h1>
                    <p className="mt-1 text-lg text-gray-600 dark:text-gray-400">{handle}</p>
                  </div>
                  {isOwner ? (
                    <Button
                      onClick={() => setIsEditing(true)}
                      className="flex items-center space-x-2"
                    >
                      <Edit2 className="h-4 w-4" />
                      <span>編輯個人資料</span>
                    </Button>
                  ) : (
                    <Button
                      onClick={handleFollow}
                      isLoading={isFollowLoading}
                      variant={isFollowing ? 'outline' : 'default'}
                      className="flex items-center space-x-2"
                    >
                      {isFollowing ? (
                        <>
                          <UserMinus className="h-4 w-4" />
                          <span>取消追蹤</span>
                        </>
                      ) : (
                        <>
                          <UserPlus className="h-4 w-4" />
                          <span>追蹤</span>
                        </>
                      )}
                    </Button>
                  )}
                </div>
                
                {profile.bio && (
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{profile.bio}</p>
                )}

                <div className="flex items-center space-x-6 text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>加入時間：{joinDate}</span>
                  </div>
                  <Link
                    href={`/profile/${userId}/followers`}
                    className="flex items-center space-x-1 hover:text-primary-600 dark:hover:text-primary-400 transition-colors cursor-pointer"
                  >
                    <Users className="h-4 w-4" />
                    <span>{(profile as any).follower_count || 0} 位追蹤者</span>
                  </Link>
                  <Link
                    href={`/profile/${userId}/following`}
                    className="flex items-center space-x-1 hover:text-primary-600 dark:hover:text-primary-400 transition-colors cursor-pointer"
                  >
                    <Users className="h-4 w-4" />
                    <span>追蹤 {(profile as any).following_count || 0} 位用戶</span>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => handleTabChange('recipes')}
            className={`whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium transition-colors ${
              activeTab === 'recipes'
                ? 'border-primary-500 dark:border-primary-400 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            食譜 ({recipeCount})
          </button>
          {isOwner && (
            <button
              onClick={() => handleTabChange('favorites')}
              className={`whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium transition-colors flex items-center space-x-1 ${
                activeTab === 'favorites'
                  ? 'border-primary-500 dark:border-primary-400 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <Heart className="h-4 w-4" />
              <span>收藏 ({isLoading ? '...' : favoriteCount})</span>
            </button>
          )}
        </nav>
      </div>

      {/* Content */}
      <div>
        {activeTab === 'recipes' ? (
          <>
            {recipes.length > 0 ? (
              <>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {recipes.map((recipe) => (
                    <RecipeCard key={recipe.id} recipe={recipe} />
                  ))}
                </div>
                {recipes.length < recipeCount && (
                  <div className="mt-8 flex justify-center">
                    <Button
                      onClick={loadMoreRecipes}
                      isLoading={isLoadingMore}
                      variant="outline"
                      className="min-w-[120px]"
                    >
                      {isLoadingMore ? '載入中...' : `載入更多 (${recipeCount - recipes.length} 個)`}
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-12 text-center">
                <p className="text-gray-600 dark:text-gray-400">
                  {isOwner ? '您尚未上傳任何食譜' : '此用戶尚未上傳任何食譜'}
                </p>
              </div>
            )}
          </>
        ) : (
          <>
            {isLoading ? (
              <div className="flex min-h-[200px] items-center justify-center">
                <p className="text-gray-600 dark:text-gray-400">載入中...</p>
              </div>
            ) : favoriteRecipes.length > 0 ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {favoriteRecipes.map((recipe) => (
                  <RecipeCard key={recipe.id} recipe={recipe} />
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-12 text-center">
                <Heart className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
                <p className="mt-4 text-gray-600 dark:text-gray-400">尚未收藏任何食譜</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
