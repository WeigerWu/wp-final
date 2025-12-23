import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Comment } from '@/types/recipe'

// Server-side version for use in server components
export async function getCommentsServer(recipeId: string): Promise<Comment[]> {
  const supabase = await createServerSupabaseClient()
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


