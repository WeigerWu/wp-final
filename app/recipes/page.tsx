import { RecipeCard } from '@/components/recipes/RecipeCard'
import { getRecipes } from '@/lib/actions/recipes-server'
import { SearchBar } from '@/components/recipes/SearchBar'
import { FilterBar } from '@/components/recipes/FilterBar'

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
  const page = parseInt(searchParams.page || '1')
  const limit = 12
  const offset = (page - 1) * limit

  const tags = searchParams.tags ? searchParams.tags.split(',') : undefined
  const recipes = await getRecipes({
    search: searchParams.search,
    tags,
    categoryId: searchParams.category,
    limit,
    offset,
  })

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="mb-4 text-3xl font-bold">探索食譜</h1>
        <p className="text-gray-600">發現來自世界各地的美味食譜</p>
      </div>

      {/* Search and Filter */}
      <div className="mb-8 space-y-4">
        <SearchBar />
        <FilterBar />
      </div>

      {/* Recipes Grid */}
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

      {/* Pagination */}
      {recipes.length === limit && (
        <div className="mt-8 flex justify-center">
          <div className="flex space-x-2">
            {page > 1 && (
              <a
                href={`/recipes?page=${page - 1}${searchParams.search ? `&search=${searchParams.search}` : ''}${searchParams.tags ? `&tags=${searchParams.tags}` : ''}`}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50"
              >
                上一頁
              </a>
            )}
            <a
              href={`/recipes?page=${page + 1}${searchParams.search ? `&search=${searchParams.search}` : ''}${searchParams.tags ? `&tags=${searchParams.tags}` : ''}`}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50"
            >
              下一頁
            </a>
          </div>
        </div>
      )}
    </div>
  )
}


