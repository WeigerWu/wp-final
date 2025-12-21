'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isEmailNotConfirmed, setIsEmailNotConfirmed] = useState(false)
  const [isResendingEmail, setIsResendingEmail] = useState(false)
  const router = useRouter()
  const supabase = createSupabaseClient()

  const handleResendConfirmation = async () => {
    setIsResendingEmail(true)
    setError('')

    try {
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (resendError) {
        setError(`重新發送失敗：${resendError.message}`)
      } else {
        setError('確認郵件已重新發送，請檢查您的郵件信箱。')
        setIsEmailNotConfirmed(false)
      }
    } catch (err: any) {
      setError(`重新發送失敗：${err.message}`)
    } finally {
      setIsResendingEmail(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsEmailNotConfirmed(false)
    setIsLoading(true)

    try {
      // 檢查 Supabase 客戶端是否正確初始化
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      if (!supabaseUrl) {
        throw new Error('Supabase 設定錯誤：請檢查 .env 檔案中的 NEXT_PUBLIC_SUPABASE_URL')
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error('Supabase login error:', error)
        
        // 檢查是否為 Email 未確認錯誤
        if (error.message?.includes('Email not confirmed') || error.message?.includes('email_not_confirmed')) {
          setIsEmailNotConfirmed(true)
          setError('您的 Email 尚未確認。請檢查您的郵件信箱並點擊確認連結。')
          return
        }
        
        throw error
      }

      // 登入成功
      if (data.session) {
        console.log('✅ 登入成功')
        router.push('/')
        router.refresh()
      }
    } catch (error: any) {
      console.error('Login error:', error)
      
      // 提供更詳細的錯誤訊息
      if (error.message?.includes('fetch')) {
        setError('無法連接到 Supabase，請檢查網路連接和 Supabase URL 設定')
      } else if (error.message?.includes('Invalid API key')) {
        setError('Supabase API Key 設定錯誤，請檢查 .env 檔案')
      } else if (error.message?.includes('Network')) {
        setError('網路連接失敗，請檢查網路連接')
      } else if (error.message?.includes('Invalid login credentials')) {
        setError('電子郵件或密碼錯誤')
      } else {
        setError(error.message || '登入失敗，請稍後再試')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="mx-auto max-w-md">
        <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h1 className="mb-6 text-2xl font-bold dark:text-gray-100">登入</h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className={`rounded-md p-3 text-sm ${
                isEmailNotConfirmed 
                  ? 'bg-yellow-50 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200' 
                  : 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'
              }`}>
                <div>{error}</div>
                {isEmailNotConfirmed && (
                  <div className="mt-2">
                    <button
                      type="button"
                      onClick={handleResendConfirmation}
                      disabled={isResendingEmail}
                      className="text-sm underline hover:no-underline disabled:opacity-50"
                    >
                      {isResendingEmail ? '發送中...' : '重新發送確認郵件'}
                    </button>
                  </div>
                )}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                電子郵件
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                密碼
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800"
              />
            </div>
            <Button type="submit" className="w-full" isLoading={isLoading}>
              {isLoading ? '登入中...' : '登入'}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
            還沒有帳號？{' '}
            <Link href="/auth/signup" className="text-primary-600 hover:underline dark:text-primary-400">
              註冊
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}


