import { getRecipes } from '@/lib/actions/recipes-server'
import { SearchBar } from '@/components/recipes/SearchBar'
import { FilterBar } from '@/components/recipes/FilterBar'
import { LoadMoreRecipes } from '@/components/recipes/LoadMoreRecipes'

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
  const recipes = await getRecipes({
    search: searchParams.search,
    tags,
    categoryId: searchParams.category,
    limit,
    offset: 0,
  })

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="mb-4 text-3xl font-bold dark:text-gray-100">探索食譜</h1>
        <p className="text-gray-600 dark:text-gray-400">發現來自世界各地的美味食譜</p>
      </div>

      {/* Search and Filter */}
      <div className="mb-8 space-y-4">
        <SearchBar />
        <FilterBar />
      </div>

      {/* Load More Recipes Component */}
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


