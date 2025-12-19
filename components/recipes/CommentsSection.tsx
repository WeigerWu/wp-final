'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Comment } from '@/types/recipe'
import { getComments } from '@/lib/actions/comments'
import { createSupabaseClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { MessageSquare, Star } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { ReviewModal } from './ReviewModal'

interface CommentsSectionProps {
  recipeId: string
  initialComments: Comment[]
}

export function CommentsSection({ recipeId, initialComments }: CommentsSectionProps) {
  const [comments, setComments] = useState(initialComments)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const supabase = createSupabaseClient()
  const [currentUser, setCurrentUser] = useState<any>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setCurrentUser(data.user)
    })
  }, [])

  const handleReviewSuccess = async () => {
    // 重新載入評論列表
    const updatedComments = await getComments(recipeId)
    setComments(updatedComments)
    // 刷新頁面以更新評分數據
    window.location.reload()
  }

  return (
    <section className="mt-12">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold dark:text-gray-100">評論與留言</h2>
        {currentUser ? (
          <Button onClick={() => setIsModalOpen(true)}>
            <MessageSquare className="mr-2 h-4 w-4" />
            寫評論
          </Button>
        ) : (
          <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-sm text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
            請先登入以發表評論
          </div>
        )}
      </div>

      {/* Review Modal */}
      <ReviewModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        recipeId={recipeId}
        onSuccess={handleReviewSuccess}
      />

      {/* Comments List */}
      <div className="space-y-6">
        {comments.length > 0 ? (
          comments.map((comment) => (
            <div key={comment.id} className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
              <div className="mb-2 flex items-center space-x-2">
                {comment.user?.avatar_url ? (
                  <div className="relative h-8 w-8 overflow-hidden rounded-full">
                    <Image
                      src={comment.user.avatar_url}
                      alt={comment.user?.username || '用戶'}
                      fill
                      className="object-cover"
                      sizes="32px"
                    />
                  </div>
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-sm text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                    {comment.user?.username?.[0]?.toUpperCase() || 'U'}
                  </div>
                )}
                <div>
                  <div className="font-semibold text-gray-900 dark:text-gray-100">
                    {comment.user?.username || '匿名用戶'}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {formatDate(comment.created_at)}
                  </div>
                </div>
              </div>
              <p className="text-gray-700 whitespace-pre-wrap dark:text-gray-300">{comment.content}</p>
            </div>
          ))
        ) : (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
            尚無留言，成為第一個留言的人吧！
          </div>
        )}
      </div>
    </section>
  )
}

