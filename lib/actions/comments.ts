import { createSupabaseClient } from '@/lib/supabase/client'
import { Comment } from '@/types/recipe'

export async function getComments(recipeId: string): Promise<Comment[]> {
  const supabase = createSupabaseClient()
  const { data, error } = await supabase
    .from('comments')
    .select('*')
    .eq('recipe_id', recipeId)
    .order('created_at', { ascending: true })

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

  // Map all comments with user info
  const commentsMap = new Map<string, Comment>()
  const rootComments: Comment[] = []

  // First pass: create all comment objects
  data.forEach((comment: any) => {
    const commentObj: Comment = {
      ...comment,
      user: profilesMap.get(comment.user_id) || { username: 'Unknown', avatar_url: null },
      replies: [],
    }
    commentsMap.set(comment.id, commentObj)
  })

  // Second pass: build nested structure and fetch parent user info for replies
  data.forEach((comment: any) => {
    const commentObj = commentsMap.get(comment.id)!
    
    if (comment.parent_id) {
      // This is a reply, add it to parent's replies
      const parent = commentsMap.get(comment.parent_id)
      if (parent) {
        // Fetch parent user info for reply display
        commentObj.parent_user = parent.user || null
        if (!parent.replies) {
          parent.replies = []
        }
        parent.replies.push(commentObj)
      }
    } else {
      // This is a root comment
      rootComments.push(commentObj)
    }
  })

  // Sort root comments by created_at descending, and replies by created_at ascending
  rootComments.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  
  // Sort replies within each comment
  const sortReplies = (comment: Comment) => {
    if (comment.replies && comment.replies.length > 0) {
      comment.replies.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      comment.replies.forEach(sortReplies)
    }
  }
  rootComments.forEach(sortReplies)

  return rootComments
}

export async function createComment(
  recipeId: string,
  content: string,
  parentId?: string | null
): Promise<Comment | null> {
  const supabase = createSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('User not authenticated')
  }

  const insertData: any = {
    recipe_id: recipeId,
    user_id: user.id,
    content,
  }

  if (parentId) {
    insertData.parent_id = parentId
  }

  const { data, error } = await (supabase
    .from('comments') as any)
    .insert(insertData)
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

  // If this is a reply, fetch parent user info
  let parentUser = null
  if (parentId) {
    const { data: parentComment } = await supabase
      .from('comments')
      .select('user_id')
      .eq('id', parentId)
      .single()
    
    if (parentComment && (parentComment as any).user_id) {
      const { data: parentProfile } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .eq('id', (parentComment as any).user_id)
        .single()
      
      parentUser = parentProfile || null
    }
  }

  return {
    ...data,
    user: profile || { username: 'Unknown', avatar_url: null },
    parent_user: parentUser,
    replies: [],
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

  // Soft delete: update is_deleted instead of actually deleting
  // This prevents CASCADE deletion of child comments
  const { error } = await (supabase
    .from('comments') as any)
    .update({ is_deleted: true })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    console.error('Error deleting comment:', error)
    throw error
  }

  return true
}

