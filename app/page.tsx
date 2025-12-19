import Link from 'next/link'
import { RecipeCard } from '@/components/recipes/RecipeCard'
import { getRecipes } from '@/lib/actions/recipes-server'
import { Button } from '@/components/ui/Button'

export default async function HomePage() {
  const recipes = await getRecipes({ limit: 12 })

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <section className="mb-12 text-center">
        <h1 className="mb-4 text-4xl font-bold md:text-6xl dark:text-gray-100">
          探索美味的食譜世界
        </h1>
        <p className="mb-8 text-lg text-gray-600 md:text-xl dark:text-gray-400">
          上傳、分享、探索各式各樣的食譜，與全球烹飪愛好者一起交流
        </p>
        <div className="flex justify-center gap-4">
          <Link 
            href="/recipes/new"
            className="inline-flex items-center justify-center rounded-md bg-primary-600 px-6 py-3 text-lg font-medium text-white transition-colors hover:bg-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          >
            上傳食譜
          </Link>
          <Link 
            href="/recipes"
            className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-6 py-3 text-lg font-medium text-gray-700 transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
          >
            探索食譜
          </Link>
        </div>
      </section>

      {/* Featured Recipes */}
      <section>
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold dark:text-gray-100">最新食譜</h2>
          <Link href="/recipes" className="text-primary-600 hover:underline dark:text-primary-400">
            查看更多 →
          </Link>
        </div>
        {recipes.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {recipes.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-12 text-center dark:border-gray-700 dark:bg-gray-800">
            <p className="text-gray-600 dark:text-gray-400">尚無食譜，成為第一個上傳食譜的人吧！</p>
            <Link 
              href="/recipes/new" 
              className="mt-4 inline-flex items-center justify-center rounded-md bg-primary-600 px-4 py-2 font-medium text-white transition-colors hover:bg-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            >
              上傳食譜
            </Link>
          </div>
        )}
      </section>
    </div>
  )
}


