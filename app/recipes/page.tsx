import { getRecipes } from '@/lib/actions/recipes-server'
import { SearchBar } from '@/components/recipes/SearchBar'
import { FilterBar } from '@/components/recipes/FilterBar'
import { LoadMoreRecipes } from '@/components/recipes/LoadMoreRecipes'

// 强制动态渲染，禁用缓存
export const dynamic = 'force-dynamic'

interface RecipesPageProps {
  searchParams: {
    search?: string
    tags?: string
    difficulty?: string
    category?: string
    page?: string
  }
}

export default async function RecipesPage({ searchParams }: RecipesPageProps) {
  const limit = 12

  const tags = searchParams.tags ? searchParams.tags.split(',') : undefined
  const difficulty = searchParams.difficulty 
    ? (searchParams.difficulty.includes(',') 
        ? searchParams.difficulty.split(',') as ('easy' | 'medium' | 'hard')[]
        : searchParams.difficulty as 'easy' | 'medium' | 'hard')
    : undefined
  const categoryId = searchParams.category
    ? (searchParams.category.includes(',') 
        ? searchParams.category.split(',')
        : searchParams.category)
    : undefined
  const recipes = await getRecipes({
    search: searchParams.search,
    tags,
    categoryId,
    difficulty,
    limit,
    offset: 0,
  })

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="mb-2 text-3xl font-bold dark:text-gray-100">探索食譜</h1>
        <p className="text-gray-600 dark:text-gray-400">發現來自世界各地的美味食譜</p>
      </div>

      {/* Search Bar */}
      <div className="mb-4">
        <SearchBar />
      </div>

      {/* Filter Bar */}
      <div className="mb-6">
        <FilterBar />
      </div>

      {/* Recipes Content */}
      <LoadMoreRecipes 
        initialRecipes={recipes}
        searchParams={{
          search: searchParams.search,
          tags: searchParams.tags,
          difficulty: searchParams.difficulty,
          category: searchParams.category,
        }}
        limit={limit}
      />
    </div>
  )
}
