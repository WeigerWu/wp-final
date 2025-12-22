import { SearchBar } from '@/components/recipes/SearchBar'
import { FilterBar } from '@/components/recipes/FilterBar'
import { RecipeCard } from '@/components/recipes/RecipeCard'
import { getRecipes } from '@/lib/actions/recipes-server'

// 強制動態渲染（因為使用了 cookies）
export const dynamic = 'force-dynamic'

interface SearchPageProps {
  searchParams: {
    search?: string
    tags?: string
    difficulty?: string
    category?: string
    page?: string
  }
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const page = parseInt(searchParams.page || '1')
  const limit = 12
  const offset = (page - 1) * limit

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
    offset,
  })

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="mb-4 text-3xl font-bold">搜尋食譜</h1>
      </div>

      {/* Search and Filter */}
      <div className="mb-8 space-y-4">
        <SearchBar />
        <FilterBar />
      </div>

      {/* Results */}
      {recipes.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {recipes.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-12 text-center">
          <p className="text-gray-600">找不到符合條件的食譜</p>
        </div>
      )}
    </div>
  )
}


