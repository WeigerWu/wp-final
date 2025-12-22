/**
 * 使用 OpenAI 自動為無分類的食譜分配分類
 * 執行方式: node scripts/auto-categorize-with-openai.js
 */

const { createClient } = require('@supabase/supabase-js')
const OpenAI = require('openai')
const fs = require('fs')
const path = require('path')

// 載入環境變數
function loadEnvFile() {
  const envPath = path.join(__dirname, '..', '.env')
  const envLocalPath = path.join(__dirname, '..', '.env.local')

  let envContent = ''

  if (fs.existsSync(envLocalPath)) {
    envContent = fs.readFileSync(envLocalPath, 'utf-8')
    console.log('📄 讀取 .env.local')
  } else if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf-8')
    console.log('📄 讀取 .env')
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

// 分類列表
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

async function categorizeWithOpenAI(recipe, openai) {
  const categoryList = CATEGORIES.map(c => `- ${c.name} (${c.slug}): ${c.description}`).join('\n')

  const validSlugs = CATEGORIES.map(c => c.slug).join(', ')
  
  const prompt = `你是一個專業的食譜分類專家。請根據以下食譜資訊，判斷它應該屬於哪個分類。

**重要：你只能從以下分類中選擇，絕對不能使用其他分類名稱！**

可用分類（只能選擇這些）：
${categoryList}

**詳細分類定義：**

1. **主菜 (main-course)**
   - 定義：正餐的主要料理，通常包含肉類、海鮮、蛋類或其他蛋白質來源，可以單獨作為一餐的主食
   - 特徵：營養完整、能單獨成餐、通常有蛋白質和配菜
   - 範例：烤雞、牛排、炒飯、義大利麵、漢堡、年糕、炒麵、燉肉、魚料理、海鮮料理、豆腐料理（作為主菜時）

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

**分類判斷邏輯：**
- 如果食譜包含蛋白質（肉、魚、蛋、豆腐等）且能單獨成餐 → 主菜
- 如果主要是液體且用來喝的 → 飲料
- 如果主要是液體且是湯類 → 湯品
- 如果是甜的點心 → 甜點
- 如果是小份量的前菜或配菜 → 開胃菜
- 如果主要是生菜/蔬菜沙拉 → 沙拉（除非有大量蛋白質作為主菜）
- 如果是純粹的米飯/麵食/麵包 → 主食
- 如果是醬料或調味品 → 醬料/調味品

食譜資訊：
- 標題：${recipe.title}
- 描述：${recipe.description || '無'}
- 標籤：${(recipe.tags || []).join(', ') || '無'}

請仔細分析食譜的性質，從以下分類中選擇最合適的一個：
${validSlugs}

**只回答一個分類的 slug（例如：main-course），不要回答其他內容。如果無法確定，請回答 "unknown"。**`

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `你是一個專業的食譜分類專家。請根據食譜的標題、描述和標籤，準確判斷它應該屬於哪個分類。

你只能從以下8個分類中選擇：${CATEGORIES.map(c => c.slug).join(', ')}

分類定義：
1. 主菜 (main-course): 正餐的主要料理，包含蛋白質，能單獨成餐
2. 湯品 (soup): 以液體為主的湯、羹、粥
3. 甜點 (dessert): 甜食和點心
4. 飲料 (beverage): 各種飲品
5. 開胃菜 (appetizer): 餐前小食、前菜、配菜
6. 沙拉 (salad): 以生菜/蔬菜為主的沙拉（含大量蛋白質時歸主菜）
7. 主食 (staple): 純粹的米飯、麵食、麵包（不含配菜）
8. 醬料/調味品 (sauce-condiment): 各種醬料、調味品

只回答一個分類的 slug（例如：main-course），不要回答其他內容。絕對不能使用不在列表中的分類名稱。`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 50,
    })

    const categorySlug = response.choices[0].message.content.trim().toLowerCase()

    // 清理可能的額外文字
    let cleanSlug = categorySlug.split('\n')[0].split(' ')[0].replace(/[^a-z-]/g, '')

    // 處理一些常見的錯誤分類映射
    const slugMapping = {
      'side-dish': 'appetizer', // 配菜 -> 開胃菜
      'side': 'appetizer',
      'main': 'main-course',
      'main-dish': 'main-course',
      'drink': 'beverage',
      'snack': 'appetizer',
    }

    if (slugMapping[cleanSlug]) {
      cleanSlug = slugMapping[cleanSlug]
    }

    // 驗證分類 slug 是否有效
    const validCategory = CATEGORIES.find(c => c.slug === cleanSlug)
    if (!validCategory && cleanSlug !== 'unknown') {
      console.warn(`⚠️  收到無效的分類 slug: ${cleanSlug} (原始: ${categorySlug})`)
      return null
    }

    return validCategory ? validCategory.slug : null
  } catch (error) {
    console.error(`❌ OpenAI API 調用失敗: ${error.message}`)
    return null
  }
}

async function autoCategorizeRecipes() {
  console.log('=== 使用 OpenAI 自動分類食譜 ===\n')

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
    console.error('   請在 .env 檔案中添加: OPENAI_API_KEY=your_api_key')
    console.error('   可以在 https://platform.openai.com/api-keys 獲取 API Key')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseKey)
  const openai = new OpenAI({ apiKey: openaiApiKey })

  try {
    // 步驟 1: 獲取所有分類的 ID 映射
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('id, name, slug')

    if (categoriesError) {
      console.error('❌ 查詢分類時發生錯誤:', categoriesError)
      process.exit(1)
    }

    const categoryMap = new Map(categories.map(c => [c.slug, c.id]))

    // 步驟 2: 查詢沒有分類的食譜
    const { data: recipes, error: recipesError } = await supabase
      .from('recipes')
      .select('id, title, description, tags, category_id')
      .is('category_id', null)
      .order('created_at', { ascending: false })

    if (recipesError) {
      console.error('❌ 查詢食譜時發生錯誤:', recipesError)
      process.exit(1)
    }

    if (!recipes || recipes.length === 0) {
      console.log('✅ 沒有需要分類的食譜')
      return
    }

    console.log(`📊 找到 ${recipes.length} 個無分類的食譜\n`)

    // 步驟 3: 為每個食譜分類
    let successCount = 0
    let errorCount = 0
    let unknownCount = 0
    const categoryStats = new Map()

    for (let i = 0; i < recipes.length; i++) {
      const recipe = recipes[i]
      console.log(`\n[${i + 1}/${recipes.length}] 處理: ${recipe.title}`)

      // 調用 OpenAI API
      const categorySlug = await categorizeWithOpenAI(recipe, openai)

      if (!categorySlug) {
        console.log(`   ⚠️  無法確定分類`)
        unknownCount++
        continue
      }

      const categoryId = categoryMap.get(categorySlug)
      if (!categoryId) {
        console.log(`   ❌ 找不到分類 ID: ${categorySlug}`)
        errorCount++
        continue
      }

      // 更新食譜分類
      const { error: updateError } = await supabase
        .from('recipes')
        .update({ category_id: categoryId })
        .eq('id', recipe.id)

      if (updateError) {
        console.log(`   ❌ 更新失敗: ${updateError.message}`)
        errorCount++
      } else {
        const categoryName = CATEGORIES.find(c => c.slug === categorySlug)?.name || categorySlug
        console.log(`   ✅ 設為分類: ${categoryName}`)
        successCount++
        
        // 統計
        categoryStats.set(categoryName, (categoryStats.get(categoryName) || 0) + 1)
      }

      // 避免 API 速率限制，稍微延遲
      if (i < recipes.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 800))
      }
    }

    // 步驟 4: 顯示結果
    console.log('\n=== 分類完成 ===')
    console.log(`✅ 成功: ${successCount}`)
    console.log(`⚠️  無法確定: ${unknownCount}`)
    console.log(`❌ 失敗: ${errorCount}`)
    console.log(`📊 總計: ${recipes.length}\n`)

    if (categoryStats.size > 0) {
      console.log('📊 分類統計:')
      categoryStats.forEach((count, name) => {
        console.log(`   ${name}: ${count}`)
      })
    }

  } catch (err) {
    console.error('❌ 發生錯誤:', err)
    process.exit(1)
  }
}

// 執行自動分類
autoCategorizeRecipes()

