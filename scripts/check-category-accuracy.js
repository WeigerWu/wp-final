/**
 * 使用 OpenAI 檢查食譜分類是否合理
 * 列出可能有問題的分類供人工檢查
 * 執行方式: node scripts/check-category-accuracy.js
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
  { name: '主菜', slug: 'main-course', description: '各種主菜料理' },
  { name: '湯品', slug: 'soup', description: '各式湯品和燉品' },
  { name: '甜點', slug: 'dessert', description: '甜點和點心' },
  { name: '飲料', slug: 'beverage', description: '各種飲品' },
  { name: '開胃菜', slug: 'appetizer', description: '前菜和小食' },
  { name: '沙拉', slug: 'salad', description: '各種沙拉料理' },
  { name: '主食', slug: 'staple', description: '米飯、麵食、麵包等主食' },
  { name: '醬料/調味品', slug: 'sauce-condiment', description: '各種醬料和調味品' },
]

async function checkCategoryWithOpenAI(recipe, currentCategory, openai) {
  const categoryList = CATEGORIES.map(c => `- ${c.name} (${c.slug}): ${c.description}`).join('\n')
  const validSlugs = CATEGORIES.map(c => c.slug).join(', ')

  // 提取食材資訊（如果有的話）
  let ingredientsText = '無'
  if (recipe.ingredients && Array.isArray(recipe.ingredients)) {
    ingredientsText = recipe.ingredients
      .map(ing => typeof ing === 'string' ? ing : (ing.name || ing.ingredient || JSON.stringify(ing)))
      .slice(0, 10) // 只取前10個食材
      .join(', ')
  } else if (recipe.ingredients && typeof recipe.ingredients === 'string') {
    ingredientsText = recipe.ingredients.substring(0, 200) // 限制長度
  }

  const prompt = `你是一個專業的食譜分類檢查專家。請仔細檢查以下食譜的分類是否合理。

可用分類：
${categoryList}

**詳細分類定義：**

1. **主菜 (main-course)**
   - 定義：正餐的主要料理，通常包含肉類、海鮮、蛋類或其他蛋白質來源，可以單獨作為一餐的主食
   - 特徵：營養完整、能單獨成餐、通常有蛋白質和配菜
   - 範例：烤雞、牛排、炒飯、義大利麵、漢堡、年糕、炒麵、燉肉、魚料理、海鮮料理、豆腐料理（作為主菜時）
   - 注意：如果沙拉包含大量蛋白質（如雞肉沙拉、鮪魚沙拉）且作為主菜，應歸類為「主菜」

2. **湯品 (soup)**
   - 定義：以液體為主的料理，通常是湯、羹、粥等
   - 特徵：主要是液體狀態、可以喝、通常有湯汁
   - 範例：雞湯、蔬菜湯、味噌湯、羅宋湯、酸辣湯、濃湯、清湯、粥、羹

3. **甜點 (dessert)**
   - 定義：甜食和點心，通常在餐後食用或作為零食
   - 特徵：通常是甜的、作為餐後點心或零食
   - 範例：蛋糕、餅乾、冰淇淋、布丁、可麗餅（甜的）、派、馬卡龍、泡芙、糖果

4. **飲料 (beverage)**
   - 定義：各種飲品，包括茶、咖啡、果汁、調酒等
   - 特徵：主要是液體、用來喝的、不是食物
   - 範例：茶、咖啡、果汁、奶茶、拿鐵、調酒、雞尾酒、冰沙、奶昔、汽水

5. **開胃菜 (appetizer)**
   - 定義：餐前小食，通常是前菜、小菜、配菜、下酒菜等
   - 特徵：份量較小、通常在主菜前食用、作為開胃或配菜
   - 範例：小點心、下酒菜、配菜、小菜、涼拌菜、小食、開胃小菜、拼盤

6. **沙拉 (salad)**
   - 定義：以生菜或蔬菜為主的沙拉料理
   - 特徵：主要是生菜或蔬菜、通常有沙拉醬、可以是主菜或配菜
   - 注意：如果沙拉包含大量蛋白質（如雞肉沙拉、鮪魚沙拉）且作為主菜，應歸類為「主菜」
   - 範例：生菜沙拉、水果沙拉、凱薩沙拉、希臘沙拉、馬鈴薯沙拉

7. **主食 (staple)**
   - 定義：純粹的米飯、麵食、麵包等基礎主食，不包含配菜或蛋白質
   - 特徵：基礎碳水化合物、通常是白飯、白麵、白麵包等
   - 注意：如果包含配菜或蛋白質（如炒飯、義大利麵、三明治），應歸類為「主菜」
   - 範例：白飯、白麵條、白麵包、吐司、饅頭、包子（純麵皮）、飯糰（只有米飯）

8. **醬料/調味品 (sauce-condiment)**
   - 定義：各種醬料、調味品、沾醬等
   - 特徵：用來調味或沾取、不是獨立的主食或配菜
   - 範例：番茄醬、辣椒醬、沙拉醬、沾醬、調味醬、醬汁、醬料

**食譜資訊：**
- 標題：${recipe.title}
- 描述：${recipe.description || '無'}
- 標籤：${(recipe.tags || []).join(', ') || '無'}
- 食材：${ingredientsText}
- 目前分類：${currentCategory}

**請仔細判斷：**
1. 目前的分類是否合理？（回答：合理 / 不合理）
2. 如果不合理，應該是什麼分類？（只回答 slug，例如：main-course）
3. 如果不確定，回答：unknown

**請用以下格式回答：**
合理/不合理|正確分類slug|原因說明

例如：
合理||分類正確
不合理|main-course|這個食譜包含蛋白質，應該歸類為主菜`

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: '你是一個專業的食譜分類檢查專家。請檢查食譜的分類是否合理，並提供建議。'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.2,
      max_tokens: 100,
    })

    const result = response.choices[0].message.content.trim()
    return result
  } catch (error) {
    console.error(`❌ OpenAI API 調用失敗: ${error.message}`)
    return null
  }
}

async function checkCategoryAccuracy() {
  console.log('=== 檢查食譜分類是否合理 ===\n')

  loadEnvFile()

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const openaiApiKey = process.env.OPENAI_API_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ 缺少 Supabase 環境變數')
    process.exit(1)
  }

  if (!openaiApiKey) {
    console.error('❌ 缺少 OPENAI_API_KEY 環境變數')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseKey)
  const openai = new OpenAI({ apiKey: openaiApiKey })

  try {
    // 獲取所有分類的 ID 映射
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('id, name, slug')

    if (categoriesError) {
      console.error('❌ 查詢分類時發生錯誤:', categoriesError)
      process.exit(1)
    }

    const categoryMap = new Map(categories.map(c => [c.id, c.name]))
    const categorySlugMap = new Map(categories.map(c => [c.id, c.slug]))

    // 查詢所有有分類的食譜
    const { data: recipes, error: recipesError } = await supabase
      .from('recipes')
      .select('id, title, description, tags, category_id, ingredients, slug')
      .not('category_id', 'is', null)
      .order('title', { ascending: true })

    if (recipesError) {
      console.error('❌ 查詢食譜時發生錯誤:', recipesError)
      process.exit(1)
    }

    console.log(`📊 找到 ${recipes.length} 個有分類的食譜\n`)
    console.log('🔍 開始檢查分類合理性...\n')

    const suspiciousRecipes = []
    let checkedCount = 0

    for (const recipe of recipes) {
      const currentCategoryName = categoryMap.get(recipe.category_id)
      const currentCategorySlug = categorySlugMap.get(recipe.category_id)

      // 調用 OpenAI 檢查
      const checkResult = await checkCategoryWithOpenAI(recipe, currentCategoryName, openai)

      if (checkResult) {
        const parts = checkResult.split('|')
        const isReasonable = parts[0]?.trim()
        const suggestedCategory = parts[1]?.trim()
        const reason = parts[2]?.trim()

        if (isReasonable === '不合理' && suggestedCategory) {
          suspiciousRecipes.push({
            recipe,
            currentCategory: currentCategoryName,
            currentCategorySlug,
            suggestedCategory,
            reason: reason || '無說明',
            checkResult
          })
        }

        checkedCount++
        if (checkedCount % 10 === 0) {
          console.log(`   已檢查 ${checkedCount}/${recipes.length} 個食譜...`)
        }
      }

      // 避免 API 速率限制
      await new Promise(resolve => setTimeout(resolve, 500))
    }

    console.log(`\n✅ 檢查完成！\n`)

    // 準備輸出資料
    const outputData = {
      checkedAt: new Date().toISOString(),
      totalRecipes: recipes.length,
      suspiciousCount: suspiciousRecipes.length,
      suspiciousRecipes: suspiciousRecipes.map(item => ({
        recipeId: item.recipe.id,
        title: item.recipe.title,
        slug: item.recipe.slug,
        description: item.recipe.description,
        tags: item.recipe.tags || [],
        currentCategory: item.currentCategory,
        currentCategorySlug: item.currentCategorySlug,
        suggestedCategory: item.suggestedCategory,
        reason: item.reason,
        checkResult: item.checkResult
      })),
      statistics: {}
    }

    // 按分類統計
    const categoryStats = new Map()
    const fromCategoryStats = new Map()
    const toCategoryStats = new Map()
    
    suspiciousRecipes.forEach(item => {
      const key = `${item.currentCategory} → ${item.suggestedCategory}`
      categoryStats.set(key, (categoryStats.get(key) || 0) + 1)
      fromCategoryStats.set(item.currentCategory, (fromCategoryStats.get(item.currentCategory) || 0) + 1)
      toCategoryStats.set(item.suggestedCategory, (toCategoryStats.get(item.suggestedCategory) || 0) + 1)
    })

    outputData.statistics = {
      byTransition: Object.fromEntries(categoryStats),
      byFromCategory: Object.fromEntries(fromCategoryStats),
      byToCategory: Object.fromEntries(toCategoryStats)
    }

    // 保存 JSON 檔案
    const outputDir = path.join(__dirname, '..')
    const jsonFilePath = path.join(outputDir, 'suspicious-categories.json')
    fs.writeFileSync(jsonFilePath, JSON.stringify(outputData, null, 2), 'utf-8')
    console.log(`💾 詳細結果已保存至: ${jsonFilePath}\n`)

    // 保存文字報告
    const reportLines = []
    reportLines.push('='.repeat(80))
    reportLines.push('食譜分類檢查報告')
    reportLines.push('='.repeat(80))
    reportLines.push(`檢查時間: ${new Date().toLocaleString('zh-TW')}`)
    reportLines.push(`總食譜數: ${recipes.length}`)
    reportLines.push(`有問題的分類: ${suspiciousRecipes.length}`)
    reportLines.push('')
    
    if (suspiciousRecipes.length === 0) {
      reportLines.push('🎉 所有分類看起來都很合理！')
    } else {
      reportLines.push('='.repeat(80))
      reportLines.push('有問題的分類清單')
      reportLines.push('='.repeat(80))
      reportLines.push('')

      suspiciousRecipes.forEach((item, i) => {
        reportLines.push(`${i + 1}. ${item.recipe.title}`)
        reportLines.push(`   食譜ID: ${item.recipe.id}`)
        reportLines.push(`   食譜Slug: ${item.recipe.slug || '無'}`)
        reportLines.push(`   目前分類: ${item.currentCategory} (${item.currentCategorySlug})`)
        reportLines.push(`   建議分類: ${item.suggestedCategory}`)
        reportLines.push(`   原因: ${item.reason}`)
        reportLines.push(`   描述: ${item.recipe.description || '無'}`)
        reportLines.push(`   標籤: ${(item.recipe.tags || []).join(', ') || '無'}`)
        reportLines.push('')
      })

      reportLines.push('='.repeat(80))
      reportLines.push('分類問題統計')
      reportLines.push('='.repeat(80))
      reportLines.push('')
      
      reportLines.push('按分類轉換統計：')
      categoryStats.forEach((count, key) => {
        reportLines.push(`   ${key}: ${count} 個`)
      })
      reportLines.push('')
      
      reportLines.push('按目前分類統計：')
      fromCategoryStats.forEach((count, category) => {
        reportLines.push(`   ${category}: ${count} 個`)
      })
      reportLines.push('')
      
      reportLines.push('按建議分類統計：')
      toCategoryStats.forEach((count, category) => {
        reportLines.push(`   ${category}: ${count} 個`)
      })
    }

    const reportFilePath = path.join(outputDir, 'suspicious-categories-report.txt')
    fs.writeFileSync(reportFilePath, reportLines.join('\n'), 'utf-8')
    console.log(`📄 文字報告已保存至: ${reportFilePath}\n`)

    // 控制台輸出
    if (suspiciousRecipes.length === 0) {
      console.log('🎉 所有分類看起來都很合理！')
    } else {
      console.log(`⚠️  發現 ${suspiciousRecipes.length} 個可能有問題的分類：\n`)

      suspiciousRecipes.forEach((item, i) => {
        console.log(`${i + 1}. ${item.recipe.title} (ID: ${item.recipe.id})`)
        console.log(`   目前分類: ${item.currentCategory} (${item.currentCategorySlug})`)
        console.log(`   建議分類: ${item.suggestedCategory}`)
        console.log(`   原因: ${item.reason}`)
        console.log(`   標籤: ${(item.recipe.tags || []).join(', ') || '無'}`)
        console.log('')
      })

      console.log('\n📊 分類問題統計：')
      console.log('\n按分類轉換統計：')
      categoryStats.forEach((count, key) => {
        console.log(`   ${key}: ${count} 個`)
      })
      
      console.log('\n按目前分類統計：')
      fromCategoryStats.forEach((count, category) => {
        console.log(`   ${category}: ${count} 個`)
      })
      
      console.log('\n按建議分類統計：')
      toCategoryStats.forEach((count, category) => {
        console.log(`   ${category}: ${count} 個`)
      })
    }

  } catch (err) {
    console.error('❌ 發生錯誤:', err)
    process.exit(1)
  }
}

// 執行檢查
checkCategoryAccuracy()

