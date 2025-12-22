/**
 * 使用 OpenAI 快速檢查食譜分類是否合理（只檢查可能有問題的）
 * 將結果保存到文件
 */

const { createClient } = require('@supabase/supabase-js')
const OpenAI = require('openai')
const fs = require('fs')
const path = require('path')

function loadEnvFile() {
  const envPath = path.join(__dirname, '..', '.env')
  const envLocalPath = path.join(__dirname, '..', '.env.local')

  let envContent = ''

  if (fs.existsSync(envLocalPath)) {
    envContent = fs.readFileSync(envLocalPath, 'utf-8')
  } else if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf-8')
  } else {
    console.error('❌ 找不到 .env 或 .env.local 檔案')
    process.exit(1)
  }

  envContent.split('\n').forEach(line => {
    const trimmedLine = line.trim()
    if (trimmedLine && !trimmedLine.startsWith('#')) {
      const [key, ...valueParts] = trimmedLine.split('=')
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').trim().replace(/^["']|["']$/g, '')
        process.env[key.trim()] = value
      }
    }
  })
}

const CATEGORIES = [
  { name: '主菜', slug: 'main-course' },
  { name: '湯品', slug: 'soup' },
  { name: '甜點', slug: 'dessert' },
  { name: '飲料', slug: 'beverage' },
  { name: '開胃菜', slug: 'appetizer' },
  { name: '沙拉', slug: 'salad' },
  { name: '主食', slug: 'staple' },
  { name: '醬料/調味品', slug: 'sauce-condiment' },
]

async function quickCheck(recipe, currentCategory, openai) {
  const prompt = `檢查這個食譜的分類是否合理。

食譜：${recipe.title}
描述：${recipe.description || '無'}
標籤：${(recipe.tags || []).join(', ') || '無'}
目前分類：${currentCategory}

可用分類：main-course, soup, dessert, beverage, appetizer, salad, staple, sauce-condiment

只回答：合理 或 不合理|建議分類|原因（一行，用|分隔）`

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: '你是食譜分類檢查專家。只回答：合理 或 不合理|建議分類|原因'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.2,
      max_tokens: 50,
    })

    return response.choices[0].message.content.trim()
  } catch (error) {
    return null
  }
}

async function checkCategoryAccuracy() {
  console.log('=== 快速檢查食譜分類 ===\n')

  loadEnvFile()

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const openaiApiKey = process.env.OPENAI_API_KEY

  if (!supabaseUrl || !supabaseKey || !openaiApiKey) {
    console.error('❌ 缺少必要的環境變數')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseKey)
  const openai = new OpenAI({ apiKey: openaiApiKey })

  try {
    const { data: categories } = await supabase
      .from('categories')
      .select('id, name, slug')

    const categoryMap = new Map(categories.map(c => [c.id, c.name]))
    const categorySlugMap = new Map(categories.map(c => [c.id, c.slug]))

    const { data: recipes } = await supabase
      .from('recipes')
      .select('id, title, description, tags, category_id')
      .not('category_id', 'is', null)
      .order('title', { ascending: true })

    console.log(`📊 檢查 ${recipes.length} 個食譜...\n`)

    const suspiciousRecipes = []
    const outputLines = []

    for (let i = 0; i < recipes.length; i++) {
      const recipe = recipes[i]
      const currentCategoryName = categoryMap.get(recipe.category_id)
      const currentCategorySlug = categorySlugMap.get(recipe.category_id)

      const result = await quickCheck(recipe, currentCategoryName, openai)

      if (result && result.startsWith('不合理')) {
        const parts = result.split('|')
        suspiciousRecipes.push({
          title: recipe.title,
          current: currentCategoryName,
          currentSlug: currentCategorySlug,
          suggested: parts[1]?.trim() || '未知',
          reason: parts[2]?.trim() || '無說明',
          tags: (recipe.tags || []).join(', ') || '無'
        })

        outputLines.push(`${suspiciousRecipes.length}. ${recipe.title}`)
        outputLines.push(`   目前分類: ${currentCategoryName} (${currentCategorySlug})`)
        outputLines.push(`   建議分類: ${parts[1]?.trim() || '未知'}`)
        outputLines.push(`   原因: ${parts[2]?.trim() || '無說明'}`)
        outputLines.push(`   標籤: ${(recipe.tags || []).join(', ') || '無'}`)
        outputLines.push('')
      }

      if ((i + 1) % 20 === 0) {
        console.log(`   已檢查 ${i + 1}/${recipes.length}...`)
      }

      await new Promise(resolve => setTimeout(resolve, 300))
    }

    // 保存結果到文件
    const outputFile = path.join(__dirname, '..', 'suspicious-categories.txt')
    const header = `=== 可能有問題的分類檢查結果 ===\n生成時間: ${new Date().toLocaleString('zh-TW')}\n總共檢查: ${recipes.length} 個食譜\n發現問題: ${suspiciousRecipes.length} 個\n\n`
    
    fs.writeFileSync(outputFile, header + outputLines.join('\n'), 'utf-8')

    console.log(`\n✅ 檢查完成！`)
    console.log(`📊 發現 ${suspiciousRecipes.length} 個可能有問題的分類`)
    console.log(`📄 結果已保存到: suspicious-categories.txt\n`)

    if (suspiciousRecipes.length > 0) {
      console.log('前10個可能有問題的分類：\n')
      suspiciousRecipes.slice(0, 10).forEach((item, i) => {
        console.log(`${i + 1}. ${item.title}`)
        console.log(`   目前: ${item.current} → 建議: ${item.suggested}`)
        console.log(`   原因: ${item.reason}`)
        console.log('')
      })
    }

  } catch (err) {
    console.error('❌ 發生錯誤:', err)
    process.exit(1)
  }
}

checkCategoryAccuracy()

