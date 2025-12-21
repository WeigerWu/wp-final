'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const supabase = createSupabaseClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      // 檢查 Supabase 客戶端是否正確初始化
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      if (!supabaseUrl) {
        throw new Error('Supabase 設定錯誤：請檢查 .env 檔案中的 NEXT_PUBLIC_SUPABASE_URL')
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        console.error('Supabase signup error:', error)
        console.error('Error details:', JSON.stringify(error, null, 2))
        throw error
      }

      // 註冊成功
      console.log('Signup response:', {
        user: data.user ? { id: data.user.id, email: data.user.email } : null,
        session: data.session ? 'exists' : null,
      })

      if (data.user) {
        // 確保 profile 已創建（如果觸發器沒有執行，手動創建）
        try {
          const { error: profileError } = await (supabase
            .from('profiles') as any)
            .upsert({
              id: data.user.id,
              username: username || `user_${data.user.id.substring(0, 8)}`,
              display_name: username || `user_${data.user.id.substring(0, 8)}`,
            }, {
              onConflict: 'id',
            })

          if (profileError) {
            console.warn('Profile creation warning:', profileError)
            // 不中斷流程，繼續執行
          } else {
            console.log('✅ Profile 已創建或更新')
          }
        } catch (profileErr) {
          console.warn('Profile creation error:', profileErr)
          // 不中斷流程，繼續執行
        }

        if (data.session) {
          // 立即登入成功
          console.log('✅ 註冊成功並自動登入')
          router.push('/')
          router.refresh()
        } else {
          // 需要 Email 確認，但仍應該有 session（如果確認已關閉）
          // 嘗試手動登入
          console.log('⚠️ 註冊成功，但沒有 session，嘗試登入...')
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password,
          })

          if (signInError) {
            // 需要 Email 確認
            console.log('⚠️ 需要 Email 確認')
            setError('註冊成功！請檢查您的郵件並點擊確認連結以完成註冊。')
          } else if (signInData.session) {
            // 登入成功
            console.log('✅ 登入成功')
            router.push('/')
            router.refresh()
          }
        }
      } else {
        throw new Error('註冊失敗：未收到用戶資料')
      }
    } catch (error: any) {
      console.error('Registration error:', error)
      
      // 提供更詳細的錯誤訊息
      if (error.message?.includes('fetch')) {
        setError('無法連接到 Supabase，請檢查網路連接和 Supabase URL 設定')
      } else if (error.message?.includes('Invalid API key')) {
        setError('Supabase API Key 設定錯誤，請檢查 .env 檔案')
      } else if (error.message?.includes('Network')) {
        setError('網路連接失敗，請檢查網路連接')
      } else {
        setError(error.message || '註冊失敗，請稍後再試')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="mx-auto max-w-md">
        <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h1 className="mb-6 text-2xl font-bold dark:text-gray-100">註冊</h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
                {error}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                使用者名稱
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800"
              />
            </div>
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
                minLength={6}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800"
              />
            </div>
            <Button type="submit" className="w-full" isLoading={isLoading}>
              {isLoading ? '註冊中...' : '註冊'}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
            已有帳號？{' '}
            <Link href="/auth/login" className="text-primary-600 hover:underline dark:text-primary-400">
              登入
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}


