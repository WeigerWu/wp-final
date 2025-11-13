'use client'

import { useState, useEffect } from 'react'
import { Comment } from '@/types/recipe'
import { createComment } from '@/lib/actions/comments'
import { createSupabaseClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Send } from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface CommentsSectionProps {
  recipeId: string
  initialComments: Comment[]
}

export function CommentsSection({ recipeId, initialComments }: CommentsSectionProps) {
  const [comments, setComments] = useState(initialComments)
  const [newComment, setNewComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const supabase = createSupabaseClient()
  const [currentUser, setCurrentUser] = useState<any>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setCurrentUser(data.user)
    })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || !currentUser) return

    setIsSubmitting(true)
    try {
      const comment = await createComment(recipeId, newComment.trim())
      if (comment) {
        setComments([comment, ...comments])
        setNewComment('')
      }
    } catch (error) {
      console.error('Error creating comment:', error)
      alert('留言失敗，請稍後再試')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="mt-12">
      <h2 className="mb-6 text-2xl font-bold">留言區</h2>

      {/* Comment Form */}
      {currentUser ? (
        <form onSubmit={handleSubmit} className="mb-8">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="分享你的烹飪心得..."
            rows={4}
            className="w-full rounded-md border border-gray-300 p-4 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
          <div className="mt-2 flex justify-end">
            <Button type="submit" disabled={isSubmitting || !newComment.trim()}>
              <Send className="mr-2 h-4 w-4" />
              發送
            </Button>
          </div>
        </form>
      ) : (
        <div className="mb-8 rounded-lg border border-gray-200 bg-gray-50 p-4 text-center text-gray-600">
          請先登入以留言
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-6">
        {comments.length > 0 ? (
          comments.map((comment) => (
            <div key={comment.id} className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="mb-2 flex items-center space-x-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-sm text-gray-600">
                  {comment.user?.username?.[0]?.toUpperCase() || 'U'}
                </div>
                <div>
                  <div className="font-semibold text-gray-900">
                    {comment.user?.username || '匿名用戶'}
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatDate(comment.created_at)}
                  </div>
                </div>
              </div>
              <p className="text-gray-700 whitespace-pre-wrap">{comment.content}</p>
            </div>
          ))
        ) : (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center text-gray-600">
            尚無留言，成為第一個留言的人吧！
          </div>
        )}
      </div>
    </section>
  )
}

