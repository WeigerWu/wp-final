'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { createSupabaseClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Menu, X, Search, User, LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const searchFormRef = useRef<HTMLFormElement>(null)
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createSupabaseClient()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<{ username: string | null; avatar_url: string | null; display_name: string | null } | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    
    const loadProfile = async (userId: string) => {
      try {
        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('username, avatar_url, display_name')
          .eq('id', userId)
          .single()
        
        if (error) {
          console.error('Error fetching profile in Navbar:', error)
          // 如果 profile 不存在，設置為空對象以便顯示預設值
          setProfile({ username: null, avatar_url: null, display_name: null })
          return
        }
        
        if (profileData) {
          console.log('Profile loaded in Navbar:', profileData)
          setProfile(profileData)
        } else {
          setProfile({ username: null, avatar_url: null, display_name: null })
        }
      } catch (err) {
        console.error('Exception loading profile:', err)
        setProfile({ username: null, avatar_url: null, display_name: null })
      }
    }

    supabase.auth.getUser().then(({ data }) => {
      console.log('Auth user in Navbar:', data.user)
      setUser(data.user)
      if (data.user) {
        loadProfile(data.user.id)
      }
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      console.log('Auth state changed in Navbar:', session?.user?.id)
      setUser(session?.user ?? null)
      if (session?.user) {
        await loadProfile(session.user.id)
      } else {
        setProfile(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  // 處理點擊外部關閉搜尋框
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showSearch && searchFormRef.current && !searchFormRef.current.contains(event.target as Node)) {
        setShowSearch(false)
        setSearchQuery('')
      }
    }

    if (showSearch) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showSearch])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/recipes/search?search=${encodeURIComponent(searchQuery.trim())}`)
      setShowSearch(false)
      setSearchQuery('')
    }
  }

  const handleSearchIconClick = (e: React.MouseEvent) => {
    e.preventDefault()
    setShowSearch(true)
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
          <Link href="/" className="flex items-center space-x-2 text-xl font-bold text-primary-600 dark:text-primary-400">
            <Image
              src="/imcook_icon.png"
              alt="I'm cooked logo"
              width={32}
              height={32}
              className="h-8 w-8 rounded-full object-cover"
            />
            <span>I'm cooked</span>
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
            {showSearch ? (
              <form ref={searchFormRef} onSubmit={handleSearchSubmit} className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="搜尋食譜..."
                    autoFocus
                    className="w-64 rounded-md border border-gray-300 py-1.5 pl-9 pr-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                  />
                </div>
                <Button type="submit" size="sm">搜尋</Button>
                <button
                  type="button"
                  onClick={() => {
                    setShowSearch(false)
                    setSearchQuery('')
                  }}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  aria-label="關閉搜尋"
                >
                  <X className="h-4 w-4" />
                </button>
              </form>
            ) : (
              <button
                onClick={handleSearchIconClick}
                className="text-gray-700 hover:text-primary-600 dark:text-gray-300 dark:hover:text-primary-400"
                aria-label="搜尋食譜"
              >
                <Search className="h-5 w-5" />
              </button>
            )}
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
                <div className="flex items-center space-x-2">
                  {profile?.avatar_url ? (
                    <Image
                      src={profile.avatar_url}
                      alt={profile.display_name || profile.username || 'User'}
                      width={32}
                      height={32}
                      className="h-8 w-8 rounded-full object-cover border-2 border-gray-200 dark:border-gray-700"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center border-2 border-gray-200 dark:border-gray-700">
                      <User className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                    </div>
                  )}
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    {profile?.display_name || profile?.username || '用戶'}
                  </span>
                </div>
                <Link
                  href={user ? `/profile/${user.id}` : '/profile'}
                  className="flex items-center space-x-2 text-gray-700 hover:text-primary-600 dark:text-gray-300 dark:hover:text-primary-400 transition-colors"
                >
                  <User className="h-5 w-5" />
                  <span>個人資料</span>
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
              {showSearch ? (
                <form ref={searchFormRef} onSubmit={handleSearchSubmit} className="space-y-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="搜尋食譜..."
                      autoFocus
                      className="w-full rounded-md border border-gray-300 py-2 pl-9 pr-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" size="sm" className="flex-1">搜尋</Button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowSearch(false)
                        setSearchQuery('')
                      }}
                      className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
                    >
                      取消
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  onClick={() => setShowSearch(true)}
                  className="flex items-center space-x-2 text-gray-700 hover:text-primary-600 dark:text-gray-300 dark:hover:text-primary-400"
                >
                  <Search className="h-5 w-5" />
                  <span>搜尋</span>
                </button>
              )}
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
                  <div className="flex items-center space-x-2">
                    {profile?.avatar_url ? (
                      <Image
                        src={profile.avatar_url}
                        alt={profile.display_name || profile.username || 'User'}
                        width={32}
                        height={32}
                        className="h-8 w-8 rounded-full object-cover border-2 border-gray-200 dark:border-gray-700"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center border-2 border-gray-200 dark:border-gray-700">
                        <User className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                      </div>
                    )}
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      {profile?.display_name || profile?.username || '用戶'}
                    </span>
                  </div>
                  <Link
                    href={user ? `/profile/${user.id}` : '/profile'}
                    className="flex items-center space-x-2 text-gray-700 hover:text-primary-600 dark:text-gray-300 dark:hover:text-primary-400 transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    <User className="h-5 w-5" />
                    <span>個人資料</span>
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

