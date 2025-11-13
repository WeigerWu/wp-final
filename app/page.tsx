import Link from 'next/link'
import { RecipeCard } from '@/components/recipes/RecipeCard'
import { getRecipes } from '@/lib/actions/recipes'
import { Button } from '@/components/ui/Button'

export default async function HomePage() {
  const recipes = await getRecipes({ limit: 12 })

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <section className="mb-12 text-center">
        <h1 className="mb-4 text-4xl font-bold md:text-6xl">
          探索美味的食譜世界
        </h1>
        <p className="mb-8 text-lg text-gray-600 md:text-xl">
          上傳、分享、探索各式各樣的食譜，與全球烹飪愛好者一起交流
        </p>
        <div className="flex justify-center gap-4">
          <Link href="/recipes/new">
            <Button size="lg">上傳食譜</Button>
          </Link>
          <Link href="/recipes">
            <Button variant="outline" size="lg">
              探索食譜
            </Button>
          </Link>
        </div>
      </section>

      {/* Featured Recipes */}
      <section>
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold">最新食譜</h2>
          <Link href="/recipes" className="text-primary-600 hover:underline">
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
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-12 text-center">
            <p className="text-gray-600">尚無食譜，成為第一個上傳食譜的人吧！</p>
            <Link href="/recipes/new" className="mt-4 inline-block">
              <Button>上傳食譜</Button>
            </Link>
          </div>
        )}
      </section>
    </div>
  )
}


