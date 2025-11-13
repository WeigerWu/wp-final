import Link from 'next/link'
import { Button } from '@/components/ui/Button'

export default function NotFound() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="mx-auto max-w-md text-center">
        <h1 className="mb-4 text-4xl font-bold">404</h1>
        <p className="mb-8 text-lg text-gray-600">找不到此頁面</p>
        <Link href="/">
          <Button>返回首頁</Button>
        </Link>
      </div>
    </div>
  )
}


