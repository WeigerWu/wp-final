import Link from 'next/link'
import { RecipeCard } from '@/components/recipes/RecipeCard'
import { getRecipes } from '@/lib/actions/recipes-server'
import { getUserIdByUsername } from '@/lib/actions/users'
import { Button } from '@/components/ui/Button'

// 强制动态渲染，禁用缓存
export const dynamic = 'force-dynamic'

interface RecipeSection {
  title: string
  recipes: Awaited<ReturnType<typeof getRecipes>>
  linkHref?: string
  linkText?: string
}

export default async function HomePage() {
  // 獲取各個用戶的ID
  let chaewonId: string | null = null
  let yujinId: string | null = null
  let karinaId: string | null = null

  try {
    const userIds = await Promise.allSettled([
      getUserIdByUsername('Chaewon'),
      getUserIdByUsername('Yujin'),
      getUserIdByUsername('Karina'),
    ])
    chaewonId = userIds[0].status === 'fulfilled' ? userIds[0].value : null
    yujinId = userIds[1].status === 'fulfilled' ? userIds[1].value : null
    karinaId = userIds[2].status === 'fulfilled' ? userIds[2].value : null
  } catch (error) {
    console.error('[HomePage] Error fetching user IDs:', error)
  }

  // 獲取各排食譜
  let latestRecipes: Awaited<ReturnType<typeof getRecipes>> = []
  let chaewonRecipes: Awaited<ReturnType<typeof getRecipes>> = []
  let yujinRecipes: Awaited<ReturnType<typeof getRecipes>> = []
  let karinaRecipes: Awaited<ReturnType<typeof getRecipes>> = []
  let meatRecipes: Awaited<ReturnType<typeof getRecipes>> = []

  try {
    const recipeResults = await Promise.allSettled([
      getRecipes({ limit: 8 }),
      chaewonId ? getRecipes({ userId: chaewonId, limit: 8 }) : Promise.resolve([]),
      yujinId ? getRecipes({ userId: yujinId, limit: 8 }) : Promise.resolve([]),
      karinaId ? getRecipes({ userId: karinaId, limit: 8 }) : Promise.resolve([]),
      getRecipes({ 
        ingredientKeywords: ['肉', '豬肉', '牛肉', '雞肉', '羊肉', '鴨肉', '魚肉', '蝦', '蟹', '貝', '肉片', '肉絲', '肉末', '肉丸', '肉排'], 
        limit: 8 
      }),
    ])

    latestRecipes = recipeResults[0].status === 'fulfilled' ? recipeResults[0].value : []
    chaewonRecipes = recipeResults[1].status === 'fulfilled' ? recipeResults[1].value : []
    yujinRecipes = recipeResults[2].status === 'fulfilled' ? recipeResults[2].value : []
    karinaRecipes = recipeResults[3].status === 'fulfilled' ? recipeResults[3].value : []
    meatRecipes = recipeResults[4].status === 'fulfilled' ? recipeResults[4].value : []
  } catch (error) {
    console.error('[HomePage] Error fetching recipes:', error)
  }

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
    <div className="container mx-auto px-4 py-8 md:py-12">
      {/* Hero Section */}
      <section className="mb-16 text-center">
        <h1 className="mb-4 text-4xl font-bold md:text-5xl lg:text-6xl dark:text-gray-100 tracking-tight">
          探索美味的食譜世界
        </h1>
        <p className="mb-10 text-lg text-gray-600 md:text-xl dark:text-gray-400 max-w-2xl mx-auto">
          上傳、分享、探索各式各樣的食譜，與全球烹飪愛好者一起交流
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link 
            href="/recipes"
            className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-8 py-3.5 text-lg font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-50 hover:shadow hover:border-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:translate-y-0 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 dark:hover:border-gray-500"
          >
            探索食譜
          </Link>
          <Link 
            href="/recipes/new"
            className="inline-flex items-center justify-center rounded-lg bg-primary-600 px-8 py-3.5 text-lg font-medium text-white shadow-sm transition-all hover:bg-primary-700 hover:shadow-md hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:translate-y-0"
          >
            上傳食譜
          </Link>
        </div>
      </section>

      {/* Recipe Sections */}
      {sections.map((section, index) => (
        <section key={section.title} className={index > 0 ? 'mt-16 md:mt-20' : ''}>
          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-2xl md:text-3xl font-bold dark:text-gray-100">{section.title}</h2>
            {section.linkHref && section.linkText && (
              <Link 
                href={section.linkHref} 
                className="text-primary-600 transition-all hover:text-primary-700 hover:underline dark:text-primary-400 dark:hover:text-primary-300 flex items-center gap-1 group"
              >
                <span>{section.linkText.replace(' →', '')}</span>
                <span className="transition-transform group-hover:translate-x-1">→</span>
              </Link>
            )}
          </div>
          {section.recipes.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {section.recipes.map((recipe, idx) => (
                <div 
                  key={recipe.id}
                  style={{ 
                    animation: `fadeIn 0.5s ease-out ${idx * 0.05}s both`
                  }}
                >
                  <RecipeCard recipe={recipe} />
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-12 text-center dark:border-gray-700 dark:bg-gray-800/50">
              <p className="text-gray-600 dark:text-gray-400">暫無食譜</p>
            </div>
          )}
        </section>
      ))}
    </div>
  )
}
