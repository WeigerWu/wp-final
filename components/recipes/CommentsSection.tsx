'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Comment } from '@/types/recipe'
import { getComments, createComment, deleteComment } from '@/lib/actions/comments'
import { createSupabaseClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { MessageSquare, Trash2, Reply } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { ReviewModal } from './ReviewModal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'

interface CommentsSectionProps {
  recipeId: string
  initialComments: Comment[]
}

interface CommentItemProps {
  comment: Comment
  currentUserId: string | null
  recipeId: string
  depth: number
  onCommentUpdate: () => void
}

function CommentItem({ comment, currentUserId, recipeId, depth, onCommentUpdate }: CommentItemProps) {
  const [isReplying, setIsReplying] = useState(false)
  const [replyContent, setReplyContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const isOwner = currentUserId === comment.user_id
  const isDeleted = comment.is_deleted || false
  const isReply = comment.parent_id !== null && comment.parent_id !== undefined
  const maxDepth = 5 // 限制最大嵌套深度

  const handleReply = async () => {
    if (!replyContent.trim() || isSubmitting) return

    setIsSubmitting(true)
    try {
      await createComment(recipeId, replyContent.trim(), comment.id)
      setReplyContent('')
      setIsReplying(false)
      onCommentUpdate()
    } catch (error) {
      console.error('Error creating reply:', error)
      alert('回覆失敗，請稍後再試')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true)
  }

  const handleDeleteConfirm = async () => {
    setShowDeleteConfirm(false)
    setIsDeleting(true)
    try {
      await deleteComment(comment.id)
      onCommentUpdate()
    } catch (error) {
      console.error('Error deleting comment:', error)
      alert('刪除失敗，請稍後再試')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className={`${depth > 0 ? 'ml-8 mt-4 border-l-2 border-gray-200 pl-4 dark:border-gray-700' : ''}`}>
      <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        <div className="mb-2 flex items-start justify-between">
          <div className="flex items-center space-x-2">
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
          {isOwner && !isDeleted && (
            <button
              onClick={handleDeleteClick}
              disabled={isDeleting}
              className="text-red-500 hover:text-red-700 disabled:opacity-50"
              title="刪除評論"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
        
        {!isDeleted && comment.parent_user && (
          <div className="mb-2 text-sm text-gray-600 dark:text-gray-400">
            回覆 <span className="font-semibold">@{comment.parent_user.username || '匿名用戶'}</span>
          </div>
        )}
        
        {isDeleted ? (
          <p className="text-gray-500 italic dark:text-gray-500">
            {isReply ? '此回覆已被刪除' : '此評論已被刪除'}
          </p>
        ) : (
          <p className="text-gray-700 whitespace-pre-wrap dark:text-gray-300">{comment.content}</p>
        )}

        {!isDeleted && currentUserId && depth < maxDepth && (
          <div className="mt-3">
            {!isReplying ? (
              <button
                onClick={() => setIsReplying(true)}
                className="flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
              >
                <Reply className="h-4 w-4" />
                <span>回覆</span>
              </button>
            ) : (
              <div className="mt-3 space-y-2">
                <textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="輸入回覆內容..."
                  className="w-full rounded-lg border border-gray-300 p-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                  rows={3}
                  maxLength={500}
                />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {replyContent.length} / 500 字
                  </span>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsReplying(false)
                        setReplyContent('')
                      }}
                    >
                      取消
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleReply}
                      disabled={!replyContent.trim() || isSubmitting}
                    >
                      {isSubmitting ? '發送中...' : '發送'}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Render replies recursively */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-4 space-y-4">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              currentUserId={currentUserId}
              recipeId={recipeId}
              depth={depth + 1}
              onCommentUpdate={onCommentUpdate}
            />
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteConfirm}
        title="刪除評論"
        message="確定要刪除此評論嗎？刪除後將無法復原。"
        confirmText="刪除"
        cancelText="取消"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  )
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

  const handleCommentUpdate = async () => {
    // 重新載入評論列表
    const updatedComments = await getComments(recipeId)
    setComments(updatedComments)
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
            <CommentItem
              key={comment.id}
              comment={comment}
              currentUserId={currentUser?.id || null}
              recipeId={recipeId}
              depth={0}
              onCommentUpdate={handleCommentUpdate}
            />
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
