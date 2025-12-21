import Link from 'next/link'
import { RecipeCard } from '@/components/recipes/RecipeCard'
import { getRecipes } from '@/lib/actions/recipes-server'
import { getUserIdByUsername } from '@/lib/actions/users'
import { Button } from '@/components/ui/Button'

interface RecipeSection {
  title: string
  recipes: Awaited<ReturnType<typeof getRecipes>>
  linkHref?: string
  linkText?: string
}

export default async function HomePage() {
  // 獲取各個用戶的ID
  const [chaewonId, yujinId, karinaId] = await Promise.all([
    getUserIdByUsername('Chaewon'),
    getUserIdByUsername('Yujin'),
    getUserIdByUsername('Karina'),
  ])

  // 獲取各排食譜
  const [
    latestRecipes,
    chaewonRecipes,
    yujinRecipes,
    karinaRecipes,
    meatRecipes,
  ] = await Promise.all([
    getRecipes({ limit: 8 }),
    chaewonId ? getRecipes({ userId: chaewonId, limit: 8 }) : [],
    yujinId ? getRecipes({ userId: yujinId, limit: 8 }) : [],
    karinaId ? getRecipes({ userId: karinaId, limit: 8 }) : [],
    getRecipes({ 
      tags: ['肉', '豬肉', '牛肉', '雞肉', '羊肉', '烤肉', '肉類'], 
      limit: 8 
    }),
  ])

  const sections: RecipeSection[] = [
    {
      title: '最新食譜',
      recipes: latestRecipes,
      linkHref: '/recipes',
      linkText: '查看更多 →',
    },
    {
      title: 'Chaewon教你做',
      recipes: chaewonRecipes,
      linkHref: chaewonId ? `/recipes?userId=${chaewonId}` : undefined,
      linkText: '查看更多 →',
    },
    {
      title: 'Yujin的秘密料理',
      recipes: yujinRecipes,
      linkHref: yujinId ? `/recipes?userId=${yujinId}` : undefined,
      linkText: '查看更多 →',
    },
    {
      title: 'Karina做給你吃',
      recipes: karinaRecipes,
      linkHref: karinaId ? `/recipes?userId=${karinaId}` : undefined,
      linkText: '查看更多 →',
    },
    {
      title: '想吃點肉？',
      recipes: meatRecipes,
      linkHref: '/recipes?tags=肉',
      linkText: '查看更多 →',
    },
  ]

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

      {/* Recipe Sections */}
      {sections.map((section, index) => (
        <section key={section.title} className={index > 0 ? 'mt-12' : ''}>
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold dark:text-gray-100">{section.title}</h2>
            {section.linkHref && section.linkText && (
              <Link 
                href={section.linkHref} 
                className="text-primary-600 hover:underline dark:text-primary-400"
              >
                {section.linkText}
              </Link>
            )}
          </div>
          {section.recipes.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {section.recipes.map((recipe) => (
                <RecipeCard key={recipe.id} recipe={recipe} />
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center dark:border-gray-700 dark:bg-gray-800">
              <p className="text-gray-600 dark:text-gray-400">暫無食譜</p>
            </div>
          )}
        </section>
      ))}
    </div>
  )
}


