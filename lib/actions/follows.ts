'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'

/**
 * 關注用戶
 */
export async function followUser(followingId: string): Promise<boolean> {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('User not authenticated')
  }

  if (user.id === followingId) {
    throw new Error('Cannot follow yourself')
  }

  const { error } = await supabase
    .from('follows')
    .insert({
      follower_id: user.id,
      following_id: followingId,
    } as any)

  if (error) {
    // 如果已經關注過，忽略錯誤
    if (error.code === '23505') {
      // Unique constraint violation
      return true
    }
    console.error('Error following user:', error)
    throw error
  }

  return true
}

/**
 * 取消關注用戶
 */
export async function unfollowUser(followingId: string): Promise<boolean> {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('User not authenticated')
  }

  const { error } = await supabase
    .from('follows')
    .delete()
    .eq('follower_id', user.id)
    .eq('following_id', followingId)

  if (error) {
    console.error('Error unfollowing user:', error)
    throw error
  }

  return true
}

/**
 * 檢查當前用戶是否關注了指定用戶
 */
export async function isFollowing(followingId: string): Promise<boolean> {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return false
  }

  const { data, error } = await supabase
    .from('follows')
    .select('id')
    .eq('follower_id', user.id)
    .eq('following_id', followingId)
    .single()

  if (error || !data) {
    return false
  }

  return true
}

/**
 * 獲取用戶的追蹤者列表
 */
export async function getFollowers(userId: string, limit: number = 50, offset: number = 0) {
  const supabase = await createServerSupabaseClient()

  const { data: follows, error } = await supabase
    .from('follows')
    .select('follower_id, created_at')
    .eq('following_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    console.error('Error fetching followers:', error)
    throw error
  }

  if (!follows || follows.length === 0) {
    return []
  }

  // Fetch profiles for followers
  const followerIds = (follows as { follower_id: string; created_at: string }[]).map((f) => f.follower_id)
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url, bio')
    .in('id', followerIds)

  const profilesMap = new Map(
    (profiles || []).map((profile: any) => [profile.id, profile])
  )

  return (follows as { follower_id: string; created_at: string }[]).map((follow) => ({
    id: follow.follower_id,
    ...profilesMap.get(follow.follower_id),
    followed_at: follow.created_at,
  }))
}

/**
 * 獲取用戶追蹤的列表
 */
export async function getFollowing(userId: string, limit: number = 50, offset: number = 0) {
  const supabase = await createServerSupabaseClient()

  const { data: follows, error } = await supabase
    .from('follows')
    .select('following_id, created_at')
    .eq('follower_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    console.error('Error fetching following:', error)
    throw error
  }

  if (!follows || follows.length === 0) {
    return []
  }

  // Fetch profiles for following users
  const followingIds = (follows as { following_id: string; created_at: string }[]).map((f) => f.following_id)
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url, bio')
    .in('id', followingIds)

  const profilesMap = new Map(
    (profiles || []).map((profile: any) => [profile.id, profile])
  )

  return (follows as { following_id: string; created_at: string }[]).map((follow) => ({
    id: follow.following_id,
    ...profilesMap.get(follow.following_id),
    followed_at: follow.created_at,
  }))
}

