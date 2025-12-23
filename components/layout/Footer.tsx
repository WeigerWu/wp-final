import Link from 'next/link'
import Image from 'next/image'

export function Footer() {
  return (
    <footer className="border-t border-gray-200/80 bg-gray-50/80 backdrop-blur-sm dark:border-gray-700/80 dark:bg-gray-900/80 mt-auto">
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div>
            <Link href="/" className="flex items-center space-x-2 mb-4">
              <div className="h-8 w-8 rounded-full overflow-hidden flex-shrink-0">
                <Image
                  src="/imcook_icon.png"
                  alt="I'm cooked logo"
                  width={32}
                  height={32}
                  className="h-full w-full object-cover"
                />
              </div>
              <h3 className="text-lg font-semibold dark:text-gray-100">I'm cooked</h3>
            </Link>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              探索、分享、烹飪美味的食譜世界
            </p>
          </div>
          <div>
            <h4 className="mb-4 font-semibold dark:text-gray-100">探索</h4>
            <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
              <li>
                <Link href="/recipes" className="transition-colors hover:text-primary-600 dark:hover:text-primary-400 inline-block">
                  所有食譜
                </Link>
              </li>
              <li>
                <Link href="/recipes/search" className="transition-colors hover:text-primary-600 dark:hover:text-primary-400 inline-block">
                  搜尋食譜
                </Link>
              </li>
              <li>
                <Link href="/recipes/new" className="transition-colors hover:text-primary-600 dark:hover:text-primary-400 inline-block">
                  上傳食譜
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="mb-4 font-semibold dark:text-gray-100">關於</h4>
            <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
              <li>
                <Link href="/about" className="transition-colors hover:text-primary-600 dark:hover:text-primary-400 inline-block">
                  關於我們
                </Link>
              </li>
              <li>
                <Link href="/contact" className="transition-colors hover:text-primary-600 dark:hover:text-primary-400 inline-block">
                  聯絡我們
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="mb-4 font-semibold dark:text-gray-100">法律</h4>
            <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
              <li>
                <Link href="/terms" className="transition-colors hover:text-primary-600 dark:hover:text-primary-400 inline-block">
                  使用條款
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="transition-colors hover:text-primary-600 dark:hover:text-primary-400 inline-block">
                  隱私政策
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-12 border-t border-gray-200 pt-8 text-center text-sm text-gray-600 dark:border-gray-700 dark:text-gray-400">
          <p>&copy; {new Date().getFullYear()} I'm cooked. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}


