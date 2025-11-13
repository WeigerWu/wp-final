import Link from 'next/link'

export function Footer() {
  return (
    <footer className="border-t bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div>
            <h3 className="mb-4 text-lg font-semibold">食譜平台</h3>
            <p className="text-sm text-gray-600">
              探索、分享、烹飪美味的食譜世界
            </p>
          </div>
          <div>
            <h4 className="mb-4 font-semibold">探索</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>
                <Link href="/recipes" className="hover:text-primary-600">
                  所有食譜
                </Link>
              </li>
              <li>
                <Link href="/recipes/search" className="hover:text-primary-600">
                  搜尋食譜
                </Link>
              </li>
              <li>
                <Link href="/recipes/new" className="hover:text-primary-600">
                  上傳食譜
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="mb-4 font-semibold">關於</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>
                <Link href="/about" className="hover:text-primary-600">
                  關於我們
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-primary-600">
                  聯絡我們
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="mb-4 font-semibold">法律</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>
                <Link href="/terms" className="hover:text-primary-600">
                  使用條款
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-primary-600">
                  隱私政策
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t pt-8 text-center text-sm text-gray-600">
          <p>&copy; {new Date().getFullYear()} 食譜平台. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}


