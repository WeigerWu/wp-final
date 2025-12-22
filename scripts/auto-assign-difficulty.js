/**
 * 使用 OpenAI 自動為無難易度的食譜分配難易度
 * 執行方式: node scripts/auto-assign-difficulty.js
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

// 難易度定義
const DIFFICULTY_LEVELS = {
  easy: {
    name: '簡單',
    description: '適合初學者，步驟簡單，時間短，不需要特殊技巧'
  },
  medium: {
    name: '中等',
    description: '需要一些烹飪經驗，步驟較多，可能需要一些技巧'
  },
  hard: {
    name: '困難',
    description: '需要豐富的烹飪經驗，步驟複雜，需要專業技巧或特殊設備'
  }
}

async function assessDifficultyWithOpenAI(recipe, openai) {
  // 提取步驟資訊
  let stepsText = '無'
  if (recipe.steps && Array.isArray(recipe.steps)) {
    stepsText = recipe.steps
      .map((step, index) => {
        if (typeof step === 'string') {
          return `${index + 1}. ${step}`
        } else if (step.instruction) {
          return `${index + 1}. ${step.instruction}`
        }
        return `${index + 1}. ${JSON.stringify(step)}`
      })
      .join('\n')
      .substring(0, 1000) // 限制長度
  }

  // 提取食材資訊
  let ingredientsText = '無'
  if (recipe.ingredients && Array.isArray(recipe.ingredients)) {
    ingredientsText = recipe.ingredients
      .map(ing => {
        if (typeof ing === 'string') {
          return ing
        } else if (ing.name) {
          return ing.name
        }
        return JSON.stringify(ing)
      })
      .slice(0, 20) // 只取前20個食材
      .join(', ')
  }

  const prompt = `你是一個專業的食譜難易度評估專家。請根據以下食譜資訊，判斷它的難易度。

**難易度定義：**

1. **簡單 (easy)**
   - 特徵：適合初學者，步驟簡單（通常5步以內），準備時間短（通常30分鐘以內），不需要特殊烹飪技巧
   - 範例：簡單的炒菜、水煮蛋、簡單的沙拉、簡單的湯品、簡單的甜點

2. **中等 (medium)**
   - 特徵：需要一些烹飪經驗，步驟較多（通常6-10步），準備時間中等（30-60分鐘），可能需要一些技巧如調味、火候控制
   - 範例：需要調味的料理、需要多個步驟的菜餚、需要烘焙的點心、需要燉煮的料理

3. **困難 (hard)**
   - 特徵：需要豐富的烹飪經驗，步驟複雜（通常10步以上），準備時間長（60分鐘以上），需要專業技巧或特殊設備
   - 範例：需要精確溫度的料理、需要多種烹飪技巧的複雜菜餚、需要特殊設備的料理、需要長時間發酵或準備的料理

**判斷標準：**
- 步驟數量：步驟越多，難度越高
- 準備時間：時間越長，難度可能越高
- 烹飪技巧：需要特殊技巧（如發酵、烘焙、調味等）會增加難度
- 食材複雜度：需要特殊或難以處理的食材會增加難度
- 設備需求：需要特殊設備會增加難度

**食譜資訊：**
- 標題：${recipe.title}
- 描述：${recipe.description || '無'}
- 準備時間：${recipe.prep_time ? recipe.prep_time + ' 分鐘' : '未知'}
- 烹飪時間：${recipe.cook_time ? recipe.cook_time + ' 分鐘' : '未知'}
- 總時間：${recipe.total_time ? recipe.total_time + ' 分鐘' : '未知'}
- 食材數量：${recipe.ingredients && Array.isArray(recipe.ingredients) ? recipe.ingredients.length : 0} 個
- 步驟數量：${recipe.steps && Array.isArray(recipe.steps) ? recipe.steps.length : 0} 個

**食材：**
${ingredientsText}

**步驟：**
${stepsText}

請仔細分析這個食譜的難易度，只回答一個單詞：easy、medium 或 hard。

**只回答一個單詞（easy、medium 或 hard），不要回答其他內容。**`

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `你是一個專業的食譜難易度評估專家。請根據食譜的步驟數量、準備時間、烹飪技巧複雜度等因素，準確判斷食譜的難易度。

只回答一個單詞：easy、medium 或 hard。絕對不能回答其他內容。`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 10,
    })

    const difficulty = response.choices[0].message.content.trim().toLowerCase()
    
    // 清理可能的額外文字
    let cleanDifficulty = difficulty.split('\n')[0].split(' ')[0].replace(/[^a-z]/g, '')
    
    // 驗證難易度是否有效
    if (['easy', 'medium', 'hard'].includes(cleanDifficulty)) {
      return cleanDifficulty
    }
    
    console.warn(`⚠️  收到無效的難易度: ${cleanDifficulty} (原始: ${difficulty})`)
    return null
  } catch (error) {
    console.error(`❌ OpenAI API 調用失敗: ${error.message}`)
    return null
  }
}

async function autoAssignDifficulty() {
  console.log('=== 使用 OpenAI 自動分配食譜難易度 ===\n')

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
    // 查詢沒有難易度的食譜
    const { data: recipes, error: recipesError } = await supabase
      .from('recipes')
      .select('id, title, description, prep_time, cook_time, total_time, ingredients, steps, difficulty')
      .is('difficulty', null)
      .order('created_at', { ascending: false })

    if (recipesError) {
      console.error('❌ 查詢食譜時發生錯誤:', recipesError)
      process.exit(1)
    }

    if (!recipes || recipes.length === 0) {
      console.log('✅ 沒有需要分配難易度的食譜')
      return
    }

    console.log(`📊 找到 ${recipes.length} 個無難易度的食譜\n`)

    // 統計
    let successCount = 0
    let errorCount = 0
    let unknownCount = 0
    const difficultyStats = new Map()

    for (let i = 0; i < recipes.length; i++) {
      const recipe = recipes[i]
      console.log(`\n[${i + 1}/${recipes.length}] 處理: ${recipe.title}`)

      // 調用 OpenAI API
      const difficulty = await assessDifficultyWithOpenAI(recipe, openai)

      if (!difficulty) {
        console.log(`   ⚠️  無法確定難易度`)
        unknownCount++
        continue
      }

      // 更新食譜難易度
      const { error: updateError } = await supabase
        .from('recipes')
        .update({ difficulty: difficulty })
        .eq('id', recipe.id)

      if (updateError) {
        console.log(`   ❌ 更新失敗: ${updateError.message}`)
        errorCount++
      } else {
        const difficultyName = DIFFICULTY_LEVELS[difficulty]?.name || difficulty
        console.log(`   ✅ 設為難易度: ${difficultyName} (${difficulty})`)
        successCount++
        
        // 統計
        difficultyStats.set(difficulty, (difficultyStats.get(difficulty) || 0) + 1)
      }

      // 避免 API 速率限制，稍微延遲
      if (i < recipes.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 800))
      }
    }

    // 顯示結果
    console.log('\n=== 分配完成 ===')
    console.log(`✅ 成功: ${successCount}`)
    console.log(`⚠️  無法確定: ${unknownCount}`)
    console.log(`❌ 失敗: ${errorCount}`)
    console.log(`📊 總計: ${recipes.length}\n`)

    if (difficultyStats.size > 0) {
      console.log('📊 難易度統計:')
      difficultyStats.forEach((count, difficulty) => {
        const difficultyName = DIFFICULTY_LEVELS[difficulty]?.name || difficulty
        console.log(`   ${difficultyName} (${difficulty}): ${count} 個`)
      })
    }

  } catch (err) {
    console.error('❌ 發生錯誤:', err)
    process.exit(1)
  }
}

// 執行自動分配
autoAssignDifficulty()

