import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Profile } from '@/types/recipe'

interface GetUsersOptions {
  limit?: number
  offset?: number
  search?: string
}

export async function searchUsers(options: GetUsersOptions = {}): Promise<Profile[]> {
  const supabase = await createServerSupabaseClient()
  
  let query = supabase
    .from('profiles')
    .select('id, username, avatar_url, bio, created_at, updated_at')
    .order('created_at', { ascending: false })

  // Add search filter if provided
  if (options.search && options.search.trim()) {
    const searchTerm = options.search.trim()
    query = query.ilike('username', `%${searchTerm}%`)
  }

  // Add pagination
  if (options.limit) {
    query = query.limit(options.limit)
  }
  if (options.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 20) - 1)
  }

  const { data, error } = await query

  if (error) {
    console.error('[searchUsers] Error searching users:', error)
    return []
  }

  return (data as Profile[]) || []
}

export async function getUserProfile(userId: string): Promise<Profile | null> {
  const supabase = await createServerSupabaseClient()
  
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, avatar_url, bio, created_at, updated_at')
    .eq('id', userId)
    .single()

  if (error) {
    console.error('[getUserProfile] Error fetching user profile:', error)
    return null
  }

  return data as Profile | null
}

/**
 * 根據用戶名獲取用戶ID
 */
export async function getUserIdByUsername(username: string): Promise<string | null> {
  const supabase = await createServerSupabaseClient()
  
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', username)
    .single()

  if (error) {
    console.error('[getUserIdByUsername] Error fetching user ID by username:', error)
    return null
  }

  return (data as { id: string } | null)?.id || null
}

