'use client'

import { useState, useEffect } from 'react'
import { X, Star, Send } from 'lucide-react'
import { createSupabaseClient } from '@/lib/supabase/client'
import { rateRecipe, getUserRating } from '@/lib/actions/recipes'
import { createComment } from '@/lib/actions/comments'
import { Button } from '@/components/ui/Button'

interface ReviewModalProps {
  isOpen: boolean
  onClose: () => void
  recipeId: string
  onSuccess: () => void
}

export function ReviewModal({
  isOpen,
  onClose,
  recipeId,
  onSuccess,
}: ReviewModalProps) {
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true)
      const supabase = createSupabaseClient()
      supabase.auth.getUser().then(async ({ data }) => {
        setCurrentUser(data.user)
        if (data.user) {
          // 載入用戶的現有評分
          const userRating = await getUserRating(recipeId)
          if (userRating) {
            setRating(userRating)
          }
        }
        setIsLoading(false)
      })
    } else {
      // 關閉時重置
      setRating(0)
      setComment('')
    }
  }, [isOpen, recipeId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentUser) {
      alert('請先登入')
      return
    }

    if (rating === 0 && !comment.trim()) {
      alert('請至少提供評分或評論')
      return
    }

    setIsSubmitting(true)
    try {
      // 如果有評分，提交評分
      if (rating > 0) {
        await rateRecipe(recipeId, rating)
      }

      // 如果有評論，提交評論
      if (comment.trim()) {
        await createComment(recipeId, comment.trim())
      }

      // 重置表單
      setRating(0)
      setComment('')
      onSuccess()
      onClose()
    } catch (error) {
      console.error('Error submitting review:', error)
      alert('提交失敗，請稍後再試')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      setRating(0)
      setComment('')
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
      onClick={handleClose}
    >
      <div
        className="relative w-full max-w-2xl rounded-lg bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 p-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">撰寫評論</h2>
            <p className="mt-1 text-sm text-gray-500">分享你的烹飪體驗</p>
          </div>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Rating Section */}
          <div className="mb-6">
            <label className="mb-3 block text-sm font-medium text-gray-700">
              評分 <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center space-x-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  disabled={isSubmitting}
                  className="disabled:opacity-50"
                >
                  <Star
                    className={`h-8 w-8 transition-colors ${
                      star <= rating
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300 hover:text-yellow-300'
                    }`}
                  />
                </button>
              ))}
              {rating > 0 && (
                <span className="ml-2 text-sm text-gray-600">
                  {rating === 1
                    ? '很差'
                    : rating === 2
                    ? '差'
                    : rating === 3
                    ? '普通'
                    : rating === 4
                    ? '很好'
                    : '非常好'}
                </span>
              )}
            </div>
          </div>

          {/* Comment Section */}
          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium text-gray-700">
              評論內容
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="分享你的烹飪心得、建議或任何想法..."
              rows={6}
              className="w-full rounded-md border border-gray-300 px-4 py-3 text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
              disabled={isSubmitting}
            />
            <p className="mt-2 text-xs text-gray-500">
              {comment.length} / 500 字
            </p>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end space-x-3 border-t border-gray-200 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              取消
            </Button>
            <Button type="submit" disabled={isSubmitting || (rating === 0 && !comment.trim())}>
              {isSubmitting ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  提交中...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  發布評論
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

