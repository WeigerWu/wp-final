'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { createSupabaseClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Menu, X, Search, User, LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createSupabaseClient()
  const [user, setUser] = useState<any>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const navItems = [
    { href: '/', label: '首頁' },
    { href: '/recipes', label: '探索食譜' },
    { href: '/recipes/new', label: '上傳食譜' },
  ]

  return (
    <nav className="border-b border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="text-xl font-bold text-primary-600 dark:text-primary-400">
            I'm cooked
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:space-x-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`transition-colors hover:text-primary-600 dark:hover:text-primary-400 ${
                  pathname === item.href ? 'text-primary-600 font-semibold dark:text-primary-400' : 'text-gray-700 dark:text-gray-300'
                }`}
              >
                {item.label}
              </Link>
            ))}
            <Link href="/recipes/search">
              <Search className="h-5 w-5 text-gray-700 hover:text-primary-600 dark:text-gray-300 dark:hover:text-primary-400" />
            </Link>
          </div>

          {/* User Menu */}
          <div className="hidden md:flex md:items-center md:space-x-4">
            {!mounted ? (
              // 在 hydration 前顯示登入按鈕，避免不匹配
              <>
                <Link 
                  href="/auth/login"
                  className="inline-flex items-center justify-center rounded-md h-8 px-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  登入
                </Link>
                <Link 
                  href="/auth/signup"
                  className="inline-flex items-center justify-center rounded-md h-8 px-3 text-sm font-medium bg-primary-600 text-white transition-colors hover:bg-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                >
                  註冊
                </Link>
              </>
            ) : user ? (
              <>
                <Link
                  href={user ? `/profile/${user.id}` : '/profile'}
                  className="text-gray-700 hover:text-primary-600 dark:text-gray-300 dark:hover:text-primary-400"
                >
                  <span className="flex items-center space-x-2">
                    <User className="h-5 w-5" />
                    <span>個人資料</span>
                  </span>
                </Link>
                <Button variant="outline" size="sm" onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  登出
                </Button>
              </>
            ) : (
              <>
                <Link 
                  href="/auth/login"
                  className="inline-flex items-center justify-center rounded-md h-8 px-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  登入
                </Link>
                <Link 
                  href="/auth/signup"
                  className="inline-flex items-center justify-center rounded-md h-8 px-3 text-sm font-medium bg-primary-600 text-white transition-colors hover:bg-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                >
                  註冊
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-gray-700 dark:text-gray-300"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="border-t border-gray-200 py-4 md:hidden dark:border-gray-700">
            <div className="flex flex-col space-y-4">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`transition-colors hover:text-primary-600 dark:hover:text-primary-400 ${
                    pathname === item.href ? 'text-primary-600 font-semibold dark:text-primary-400' : 'text-gray-700 dark:text-gray-300'
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              <Link
                href="/recipes/search"
                className="text-gray-700 hover:text-primary-600 dark:text-gray-300 dark:hover:text-primary-400"
                onClick={() => setIsOpen(false)}
              >
                <span className="flex items-center space-x-2">
                  <Search className="h-5 w-5" />
                  <span>搜尋</span>
                </span>
              </Link>
              {!mounted ? (
                // 在 hydration 前顯示登入連結，避免不匹配
                <>
                  <Link
                    href="/auth/login"
                    className="text-gray-700 hover:text-primary-600 dark:text-gray-300 dark:hover:text-primary-400"
                    onClick={() => setIsOpen(false)}
                  >
                    登入
                  </Link>
                  <Link
                    href="/auth/signup"
                    className="text-gray-700 hover:text-primary-600 dark:text-gray-300 dark:hover:text-primary-400"
                    onClick={() => setIsOpen(false)}
                  >
                    註冊
                  </Link>
                </>
              ) : user ? (
                <>
                  <Link
                    href={user ? `/profile/${user.id}` : '/profile'}
                    className="text-gray-700 hover:text-primary-600 dark:text-gray-300 dark:hover:text-primary-400"
                    onClick={() => setIsOpen(false)}
                  >
                    <span className="flex items-center space-x-2">
                      <User className="h-5 w-5" />
                      <span>個人資料</span>
                    </span>
                  </Link>
                  <button
                    onClick={() => {
                      handleSignOut()
                      setIsOpen(false)
                    }}
                    className="flex items-center space-x-2 text-left text-gray-700 hover:text-primary-600 dark:text-gray-300 dark:hover:text-primary-400"
                  >
                    <LogOut className="h-5 w-5" />
                    <span>登出</span>
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/auth/login"
                    className="text-gray-700 hover:text-primary-600 dark:text-gray-300 dark:hover:text-primary-400"
                    onClick={() => setIsOpen(false)}
                  >
                    登入
                  </Link>
                  <Link
                    href="/auth/signup"
                    className="text-gray-700 hover:text-primary-600 dark:text-gray-300 dark:hover:text-primary-400"
                    onClick={() => setIsOpen(false)}
                  >
                    註冊
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

