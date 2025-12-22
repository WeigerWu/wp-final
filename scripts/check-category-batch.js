/**
 * 批次檢查食譜分類（可設定批次大小）
 * 執行方式: node scripts/check-category-batch.js [批次大小]
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
        const value = valueParts.join('=').trim().replace(/^["']|[""]$/g, '')
        process.env[key.trim()] = value
      }
    }
  })
}

async function checkRecipe(recipe, currentCategory, openai) {
  const prompt = `檢查這個食譜的分類是否合理。

食譜：${recipe.title}
描述：${recipe.description || '無'}
標籤：${(recipe.tags || []).join(', ') || '無'}
目前分類：${currentCategory}

分類定義：
- main-course: 正餐主菜，含蛋白質，能單獨成餐
- soup: 湯、羹、粥
- dessert: 甜食點心
- beverage: 飲品
- appetizer: 前菜、小食、配菜
- salad: 生菜/蔬菜沙拉（含大量蛋白質時歸主菜）
- staple: 純粹的米飯/麵食/麵包（不含配菜）
- sauce-condiment: 醬料、調味品

只回答：合理 或 不合理|建議分類|原因（用|分隔）`

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
      max_tokens: 80,
    })

    return response.choices[0].message.content.trim()
  } catch (error) {
    return null
  }
}

async function checkBatch() {
  const batchSize = parseInt(process.argv[2]) || 50 // 預設檢查50個

  console.log(`=== 批次檢查食譜分類（檢查前 ${batchSize} 個）===\n`)

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
      .limit(batchSize)

    console.log(`📊 檢查 ${recipes.length} 個食譜...\n`)

    const suspiciousRecipes = []

    for (let i = 0; i < recipes.length; i++) {
      const recipe = recipes[i]
      const currentCategoryName = categoryMap.get(recipe.category_id)

      console.log(`[${i + 1}/${recipes.length}] ${recipe.title}`)

      const result = await checkRecipe(recipe, currentCategoryName, openai)

      if (result && result.startsWith('不合理')) {
        const parts = result.split('|')
        suspiciousRecipes.push({
          title: recipe.title,
          current: currentCategoryName,
          suggested: parts[1]?.trim() || '未知',
          reason: parts[2]?.trim() || '無說明',
          tags: (recipe.tags || []).join(', ') || '無'
        })
        console.log(`   ⚠️  可能有問題: ${currentCategoryName} → ${parts[1]?.trim()}`)
      } else {
        console.log(`   ✅ 分類合理`)
      }

      await new Promise(resolve => setTimeout(resolve, 400))
    }

    console.log(`\n=== 檢查完成 ===`)
    console.log(`📊 檢查了 ${recipes.length} 個食譜`)
    console.log(`⚠️  發現 ${suspiciousRecipes.length} 個可能有問題的分類\n`)

    if (suspiciousRecipes.length > 0) {
      console.log('可能有問題的分類：\n')
      suspiciousRecipes.forEach((item, i) => {
        console.log(`${i + 1}. ${item.title}`)
        console.log(`   目前分類: ${item.current}`)
        console.log(`   建議分類: ${item.suggested}`)
        console.log(`   原因: ${item.reason}`)
        console.log(`   標籤: ${item.tags}`)
        console.log('')
      })

      // 保存到文件
      const outputFile = path.join(__dirname, '..', 'suspicious-categories.txt')
      const lines = suspiciousRecipes.map((item, i) => 
        `${i + 1}. ${item.title}\n   目前: ${item.current} → 建議: ${item.suggested}\n   原因: ${item.reason}\n   標籤: ${item.tags}\n`
      ).join('\n')
      
      fs.writeFileSync(outputFile, `=== 可能有問題的分類 ===\n\n${lines}`, 'utf-8')
      console.log(`📄 結果已保存到: suspicious-categories.txt`)
    } else {
      console.log('✅ 所有檢查的食譜分類都很合理！')
    }

  } catch (err) {
    console.error('❌ 發生錯誤:', err)
    process.exit(1)
  }
}

checkBatch()

