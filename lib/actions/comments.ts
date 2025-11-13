import { createSupabaseClient } from '@/lib/supabase/client'
import { Comment } from '@/types/recipe'

export async function getComments(recipeId: string): Promise<Comment[]> {
  const supabase = createSupabaseClient()
  const { data, error } = await supabase
    .from('comments')
    .select('*')
    .eq('recipe_id', recipeId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching comments:', error)
    return []
  }

  if (!data || data.length === 0) {
    return []
  }

  // Fetch user profiles for all comments
  const userIds = Array.from(new Set(data.map((comment: any) => comment.user_id)))
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, username, avatar_url')
    .in('id', userIds)

  const profilesMap = new Map(
    (profiles || []).map((profile: any) => [profile.id, profile])
  )

  return data.map((comment: any) => ({
    ...comment,
    user: profilesMap.get(comment.user_id) || { username: 'Unknown', avatar_url: null },
  })) as Comment[]
}

export async function createComment(
  recipeId: string,
  content: string
): Promise<Comment | null> {
  const supabase = createSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('User not authenticated')
  }

  const { data, error } = await (supabase
    .from('comments') as any)
    .insert({
      recipe_id: recipeId,
      user_id: user.id,
      content,
    })
    .select('*')
    .single()

  if (error) {
    console.error('Error creating comment:', error)
    throw error
  }

  // Fetch user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, username, avatar_url')
    .eq('id', user.id)
    .single()

  return {
    ...data,
    user: profile || { username: 'Unknown', avatar_url: null },
  } as Comment
}

export async function updateComment(
  id: string,
  content: string
): Promise<Comment | null> {
  const supabase = createSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('User not authenticated')
  }

  const { data, error } = await (supabase
    .from('comments') as any)
    .update({ content })
    .eq('id', id)
    .eq('user_id', user.id)
    .select('*')
    .single()

  if (error) {
    console.error('Error updating comment:', error)
    throw error
  }

  // Fetch user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, username, avatar_url')
    .eq('id', user.id)
    .single()

  return {
    ...data,
    user: profile || { username: 'Unknown', avatar_url: null },
  } as Comment
}

export async function deleteComment(id: string): Promise<boolean> {
  const supabase = createSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('User not authenticated')
  }

  const { error } = await supabase
    .from('comments')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    console.error('Error deleting comment:', error)
    throw error
  }

  return true
}

