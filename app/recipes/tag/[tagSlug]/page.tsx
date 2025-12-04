import { getRecipesByTagSlug, getTagBySlug, getRecipesByTagName } from '@/lib/actions/tags'
import { RecipeCard } from '@/components/recipes/RecipeCard'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { decodeTagSlug } from '@/lib/utils/tags'
import { Tag } from '@/types/tag'

interface TagPageProps {
  params: {
    tagSlug: string
  }
  searchParams: {
    page?: string
  }
}

export default async function TagPage({ params, searchParams }: TagPageProps) {
  const { tagSlug } = params
  const page = parseInt(searchParams.page || '1')
  const limit = 12
  const offset = (page - 1) * limit

  // 獲取標籤資訊（先用 slug 查詢）
  let tag: Tag | null = await getTagBySlug(tagSlug)
  let recipes: any[] = []
  let total = 0
  
  if (tag) {
    // 如果找到標籤，使用 slug 查詢
    const result = await getRecipesByTagSlug(tagSlug, {
      limit,
      offset,
    })
    recipes = result.recipes
    total = result.total
  } else {
    // 如果找不到，嘗試用標籤名稱查詢（向後兼容，處理遷移未完成的情況）
    const tagName = decodeTagSlug(tagSlug)
    const result = await getRecipesByTagName(tagName, {
      limit,
      offset,
    })
    
    if (!result.tag && result.recipes.length === 0) {
      notFound()
    }
    
    recipes = result.recipes
    total = result.total
    tag = result.tag || {
      id: '',
      name: tagName,
      slug: tagSlug,
      description: null,
      usage_count: 0,
    }
  }
  
  // 確保 tag 不為 null（此時 TypeScript 應該知道 tag 不為 null）
  if (!tag) {
    notFound()
  }

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/recipes"
          className="mb-4 inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          返回食譜列表
        </Link>
        <div className="mt-4">
          <h1 className="text-3xl font-bold mb-2">
            標籤：<span className="text-primary-600">#{tag.name}</span>
          </h1>
          {tag.description && (
            <p className="text-gray-600">{tag.description}</p>
          )}
          <p className="text-sm text-gray-500 mt-2">
            共找到 {total} 個食譜
          </p>
        </div>
      </div>

      {/* Recipes Grid */}
      {recipes.length > 0 ? (
        <>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mb-8">
            {recipes.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-8">
              {page > 1 && (
                <Link
                  href={`/recipes/tag/${tagSlug}?page=${page - 1}`}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  上一頁
                </Link>
              )}
              
              <span className="px-4 py-2 text-gray-600">
                第 {page} / {totalPages} 頁
              </span>

              {page < totalPages && (
                <Link
                  href={`/recipes/tag/${tagSlug}?page=${page + 1}`}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  下一頁
                </Link>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-12 text-center">
          <p className="text-gray-600">此標籤目前沒有任何食譜</p>
        </div>
      )}
    </div>
  )
}

// 生成頁面 metadata
export async function generateMetadata({ params }: TagPageProps) {
  const tag = await getTagBySlug(params.tagSlug)
  
  if (!tag) {
    return {
      title: '標籤不存在',
    }
  }

  return {
    title: `#${tag.name} 標籤 - 食譜分享平台`,
    description: tag.description || `查看所有標籤為「${tag.name}」的食譜`,
  }
}

