import { RecipeCard } from '@/components/recipes/RecipeCard'
import { getRecipesByCategorySlug } from '@/lib/actions/categories'
import { notFound } from 'next/navigation'

// 強制動態渲染（因為使用了 cookies）
export const dynamic = 'force-dynamic'

interface CategoryPageProps {
  params: {
    categorySlug: string
  }
  searchParams: {
    page?: string
  }
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const page = parseInt(searchParams.page || '1')
  const limit = 12
  const offset = (page - 1) * limit

  const decodedSlug = decodeURIComponent(params.categorySlug)
  const { category, recipes, totalCount } = await getRecipesByCategorySlug(decodedSlug, {
    limit,
    offset,
  })

  if (!category) {
    notFound()
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Category Header */}
      <div className="mb-8">
        <div className="mb-4 flex items-center gap-4">
          {category.icon && (
            <div className="text-4xl">{category.icon}</div>
          )}
          <div>
            <h1 className="text-3xl font-bold">{category.name}</h1>
            {category.description && (
              <p className="mt-2 text-gray-600">{category.description}</p>
            )}
          </div>
        </div>
        <p className="text-sm text-gray-500">
          共找到 {totalCount} 個食譜
        </p>
      </div>

      {/* Recipes Grid */}
      {recipes.length > 0 ? (
        <>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {recipes.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </div>

          {/* Pagination */}
          {totalCount > limit && (
            <div className="mt-8 flex justify-center">
              <div className="flex space-x-2">
                {page > 1 && (
                  <a
                    href={`/recipes/category/${params.categorySlug}?page=${page - 1}`}
                    className="rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50"
                  >
                    上一頁
                  </a>
                )}
                {offset + limit < totalCount && (
                  <a
                    href={`/recipes/category/${params.categorySlug}?page=${page + 1}`}
                    className="rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50"
                  >
                    下一頁
                  </a>
                )}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-12 text-center">
          <p className="text-gray-600">此分類下尚無食譜</p>
        </div>
      )}
    </div>
  )
}






