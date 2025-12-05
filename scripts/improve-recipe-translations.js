/**
 * 檢查和改進資料庫中已翻譯的食譜
 * 
 * 使用方式：
 * node scripts/improve-recipe-translations.js [選項]
 * 
 * 選項：
 * --check-only          只檢查不修改
 * --limit <數量>        處理的食譜數量（預設：10）
 * --id <食譜ID>         只處理指定 ID 的食譜
 * --help, -h            顯示使用說明
 * 
 * 範例：
 * # 只檢查 10 個食譜，不修改
 * node scripts/improve-recipe-translations.js --check-only --limit 10
 * 
 * # 檢查並改進 5 個食譜
 * node scripts/improve-recipe-translations.js --limit 5
 * 
 * # 改進指定 ID 的食譜
 * node scripts/improve-recipe-translations.js --id <食譜ID>
 */

const fs = require('fs')
const path = require('path')
const OpenAI = require('openai')

/**
 * 載入環境變數
 */
function loadEnvFile() {
  const envPath = path.join(process.cwd(), '.env')
  const envLocalPath = path.join(process.cwd(), '.env.local')
  
  let envPathToUse = null
  if (fs.existsSync(envPath)) {
    envPathToUse = envPath
  } else if (fs.existsSync(envLocalPath)) {
    envPathToUse = envLocalPath
  } else {
    console.error('❌ 找不到 .env 或 .env.local 檔案')
    process.exit(1)
  }

  const envContent = fs.readFileSync(envPathToUse, 'utf8')
  const envVars = {}
  
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim()
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=')
      if (key && valueParts.length > 0) {
        envVars[key.trim()] = valueParts.join('=').trim().replace(/^["']|["']$/g, '')
      }
    }
  })

  return envVars
}

/**
 * 獲取 OpenAI API Key
 */
function getOpenAIApiKey() {
  const envVars = loadEnvFile()
  const apiKey = envVars.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('❌ 缺少 OPENAI_API_KEY 環境變數！請在 .env 檔案中設定。')
  }
  return apiKey
}

/**
 * 初始化 OpenAI 客戶端
 */
function getOpenAIClient() {
  const apiKey = getOpenAIApiKey()
  return new OpenAI({ apiKey })
}

/**
 * 檢查翻譯是否自然
 * @param {string} text 翻譯後的文本
 * @param {string} originalText 原始英文文本（用於參考，但可能不存在）
 * @returns {Promise<Object>} 品質評估結果
 */
async function checkTranslationQuality(text, originalText = null) {
  const client = getOpenAIClient()
  
  const prompt = originalText
    ? `原文（英文）：${originalText}\n\n翻譯（中文）：${text}`
    : `翻譯（中文）：${text}`
  
  const response = await client.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [
      {
        role: 'system',
        content: `你是一個專業的中文編輯。請評估以下翻譯的品質，判斷是否自然流暢。

評估標準：
1. 是否像逐字翻譯（不自然）
2. 是否符合中文表達習慣
3. 是否有明顯的翻譯腔
4. 用詞是否恰當

請用 JSON 格式回答：
{
  "quality": "good" | "needs_improvement" | "poor",
  "reason": "評估原因",
  "suggested_improvement": "改進建議（如果品質不佳，提供改進後的版本）"
}

只返回 JSON，不要添加其他內容。`,
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0.3,
    response_format: { type: "json_object" },
  })

  try {
    const result = JSON.parse(response.choices[0]?.message?.content || '{}')
    return result
  } catch (error) {
    console.error('解析評估結果失敗:', error)
    return { quality: 'unknown', reason: '解析失敗' }
  }
}

/**
 * 改進翻譯
 * @param {string} text 現有翻譯
 * @param {string} originalText 原始英文文本
 * @param {string} context 上下文類型：'title' | 'description' | 'step' | 'ingredient'
 * @returns {Promise<string>} 改進後的翻譯
 */
async function improveTranslation(text, originalText, context = null) {
  const client = getOpenAIClient()
  
  let systemPrompt = ''
  if (context === 'title') {
    systemPrompt = `你是一個專業的中文食譜編輯。請將以下翻譯改寫成更自然流暢的繁體中文標題。
要求：
1. 不要逐字翻譯，要理解意思後用中文習慣表達
2. 食譜標題應該簡潔有力，符合中文讀者的閱讀習慣
3. 保留原意但讓標題更吸引人
4. 只返回改寫後的標題，不要添加任何解釋`
  } else if (context === 'description') {
    systemPrompt = `你是一個專業的中文食譜編輯。請將以下翻譯改寫成更自然流暢的繁體中文描述。
要求：
1. 理解原文意思後，用自然的中文重新表達
2. 符合台灣讀者的閱讀習慣和用語
3. 保持專業但親切的語氣
4. 只返回改寫後的描述，不要添加任何解釋`
  } else if (context === 'step') {
    systemPrompt = `你是一個專業的中文食譜編輯。請將以下翻譯改寫成更自然流暢的繁體中文步驟說明。
要求：
1. 理解烹飪動作後，用自然的中文重新表達
2. 使用台灣常見的烹飪用語（例如：爆香、煸炒、悶煮）
3. 語氣親切易懂，符合中文讀者的理解習慣
4. 只返回改寫後的步驟說明，不要添加任何解釋`
  } else if (context === 'ingredient') {
    systemPrompt = `你是一個專業的中文食譜編輯。請將以下翻譯改寫成台灣常用的繁體中文食材名稱。
要求：
1. 使用台灣常見的食材名稱（例如：番茄而非西紅柿）
2. 如果食材在台灣有特定名稱，請使用該名稱
3. 保持簡潔，只返回食材名稱，不要添加說明`
  } else {
    systemPrompt = `你是一個專業的中文編輯。請將以下翻譯改寫成更自然流暢的繁體中文。
要求：
1. 不要逐字翻譯，要理解意思後用中文習慣重新表達
2. 符合台灣讀者的閱讀習慣和用語
3. 語氣自然親切
4. 只返回改寫後的文本，不要添加任何解釋`
  }
  
  const userContent = originalText
    ? `原文（英文）：${originalText}\n\n現有翻譯（需要改進）：${text}`
    : `現有翻譯（需要改進）：${text}`
  
  const response = await client.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [
      {
        role: 'system',
        content: systemPrompt,
      },
      {
        role: 'user',
        content: userContent,
      },
    ],
    temperature: 0.5,
    max_tokens: 1000,
  })

  return response.choices[0]?.message?.content?.trim() || text
}

/**
 * 從資料庫獲取食譜
 * @param {number} limit 限制數量
 * @param {string} recipeId 特定食譜 ID
 * @returns {Promise<Array>} 食譜列表
 */
async function getRecipesFromDatabase(limit = 10, recipeId = null) {
  const envVars = loadEnvFile()
  const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = envVars.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('缺少必要的環境變數：NEXT_PUBLIC_SUPABASE_URL 和 SUPABASE_SERVICE_ROLE_KEY')
  }

  const cleanUrl = supabaseUrl.replace(/\/$/, '')
  let url = `${cleanUrl}/rest/v1/recipes?select=*&order=created_at.desc`
  
  if (recipeId) {
    url += `&id=eq.${recipeId}`
  } else {
    url += `&limit=${limit}`
  }

  const response = await fetch(url, {
    headers: {
      'apikey': serviceRoleKey,
      'Authorization': `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`獲取食譜失敗 (${response.status}): ${errorText}`)
  }

  return await response.json()
}

/**
 * 更新食譜
 * @param {string} recipeId 食譜 ID
 * @param {Object} updates 要更新的欄位
 * @returns {Promise<Object>} 更新結果
 */
async function updateRecipe(recipeId, updates) {
  const envVars = loadEnvFile()
  const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = envVars.SUPABASE_SERVICE_ROLE_KEY

  const cleanUrl = supabaseUrl.replace(/\/$/, '')
  const response = await fetch(`${cleanUrl}/rest/v1/recipes?id=eq.${recipeId}`, {
    method: 'PATCH',
    headers: {
      'apikey': serviceRoleKey,
      'Authorization': `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
    },
    body: JSON.stringify(updates),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`更新失敗 (${response.status}): ${errorText}`)
  }

  return await response.json()
}

/**
 * 解析命令列參數
 */
function parseArgs() {
  const args = process.argv.slice(2)
  const options = {
    checkOnly: false,
    limit: 10,
    id: null,
  }

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    
    if (arg === '--check-only') {
      options.checkOnly = true
    } else if (arg === '--limit') {
      if (i + 1 < args.length && !args[i + 1].startsWith('--')) {
        options.limit = parseInt(args[++i], 10)
      }
    } else if (arg === '--id') {
      if (i + 1 < args.length && !args[i + 1].startsWith('--')) {
        options.id = args[++i]
      }
    } else if (arg === '--help' || arg === '-h') {
      console.log(`
使用方式:
  node scripts/improve-recipe-translations.js [選項]

選項:
  --check-only          只檢查不修改
  --limit <數量>        處理的食譜數量（預設: 10）
  --id <食譜ID>         只處理指定 ID 的食譜
  --help, -h            顯示此說明

範例:
  # 只檢查 10 個食譜，不修改
  node scripts/improve-recipe-translations.js --check-only --limit 10

  # 檢查並改進 5 個食譜
  node scripts/improve-recipe-translations.js --limit 5

  # 改進指定 ID 的食譜
  node scripts/improve-recipe-translations.js --id <食譜ID>
      `)
      process.exit(0)
    }
  }

  return options
}

/**
 * 主函數
 */
async function main() {
  const options = parseArgs()

  console.log('=== 檢查和改進食譜翻譯 ===\n')
  console.log(`模式: ${options.checkOnly ? '僅檢查' : '檢查並改進'}`)
  if (options.id) {
    console.log(`食譜 ID: ${options.id}`)
  } else {
    console.log(`處理數量: ${options.limit}`)
  }
  console.log('')

  try {
    const recipes = await getRecipesFromDatabase(options.limit, options.id)
    
    if (recipes.length === 0) {
      console.log('⚠️  沒有找到任何食譜')
      return
    }

    console.log(`✅ 找到 ${recipes.length} 個食譜\n`)

    const stats = {
      checked: 0,
      improved: 0,
      skipped: 0,
      title: { checked: 0, improved: 0 },
      description: { checked: 0, improved: 0 },
      steps: { checked: 0, improved: 0 },
    }

    for (let i = 0; i < recipes.length; i++) {
      const recipe = recipes[i]
      console.log(`\n[${i + 1}/${recipes.length}] 處理食譜: ${recipe.title}`)
      console.log(`   ID: ${recipe.id}`)

      try {
        const updates = {}

        // 檢查標題
        if (recipe.title) {
          console.log(`   📝 檢查標題...`)
          const titleCheck = await checkTranslationQuality(recipe.title)
          stats.title.checked++
          stats.checked++
          
          if (titleCheck.quality !== 'good') {
            console.log(`   ⚠️  標題品質: ${titleCheck.quality}`)
            console.log(`   原因: ${titleCheck.reason}`)
            
            if (!options.checkOnly) {
              console.log(`   🔄 改進標題...`)
              // 注意：我們沒有原始英文標題，所以只傳遞現有翻譯
              const improved = await improveTranslation(recipe.title, null, 'title')
              updates.title = improved
              console.log(`   ✅ 標題已改進`)
              console.log(`   原文: ${recipe.title}`)
              console.log(`   改進: ${improved}`)
              stats.title.improved++
              stats.improved++
            }
          } else {
            console.log(`   ✅ 標題品質良好`)
          }
          
          // 添加延遲
          await new Promise(resolve => setTimeout(resolve, 500))
        }

        // 檢查描述
        if (recipe.description) {
          console.log(`   📝 檢查描述...`)
          const descCheck = await checkTranslationQuality(recipe.description)
          stats.description.checked++
          stats.checked++
          
          if (descCheck.quality !== 'good') {
            console.log(`   ⚠️  描述品質: ${descCheck.quality}`)
            console.log(`   原因: ${descCheck.reason}`)
            
            if (!options.checkOnly) {
              console.log(`   🔄 改進描述...`)
              const improved = await improveTranslation(recipe.description, null, 'description')
              updates.description = improved
              console.log(`   ✅ 描述已改進`)
              stats.description.improved++
              stats.improved++
            }
          } else {
            console.log(`   ✅ 描述品質良好`)
          }
          
          await new Promise(resolve => setTimeout(resolve, 500))
        }

        // 檢查步驟
        if (recipe.steps && Array.isArray(recipe.steps) && recipe.steps.length > 0) {
          console.log(`   📝 檢查步驟 (${recipe.steps.length} 個)...`)
          let hasImprovement = false
          const improvedSteps = [...recipe.steps]
          stats.steps.checked++

          for (let j = 0; j < recipe.steps.length; j++) {
            const step = recipe.steps[j]
            if (step.instruction) {
              const stepCheck = await checkTranslationQuality(step.instruction)
              
              if (stepCheck.quality !== 'good') {
                console.log(`   ⚠️  步驟 ${j + 1} 品質: ${stepCheck.quality}`)
                
                if (!options.checkOnly) {
                  const improved = await improveTranslation(step.instruction, null, 'step')
                  improvedSteps[j] = { ...step, instruction: improved }
                  hasImprovement = true
                  console.log(`   ✅ 步驟 ${j + 1} 已改進`)
                } else {
                  // 在 check-only 模式下，標記有需要改進的步驟
                  hasImprovement = true
                }
              }
              
              await new Promise(resolve => setTimeout(resolve, 300))
            }
          }

          if (hasImprovement && !options.checkOnly) {
            updates.steps = improvedSteps
            stats.steps.improved++
            stats.improved++
            console.log(`   ✅ 所有需要改進的步驟已更新`)
          } else if (hasImprovement && options.checkOnly) {
            console.log(`   ⚠️  發現需要改進的步驟，但未修改（check-only 模式）`)
          } else {
            console.log(`   ✅ 所有步驟品質良好`)
          }
        }

        // 如果有更新，寫入資料庫
        if (Object.keys(updates).length > 0 && !options.checkOnly) {
          console.log(`   💾 更新資料庫...`)
          await updateRecipe(recipe.id, updates)
          console.log(`   ✅ 資料庫已更新`)
        }

        // 添加延遲以避免 API 速率限制
        await new Promise(resolve => setTimeout(resolve, 1000))
      } catch (error) {
        console.error(`   ❌ 處理失敗: ${error.message}`)
        stats.skipped++
      }
    }

    console.log(`\n\n📊 處理完成統計:`)
    console.log(`   總檢查項目: ${stats.checked}`)
    console.log(`   總改進項目: ${stats.improved}`)
    console.log(`   跳過項目: ${stats.skipped}`)
    console.log(`\n詳細統計:`)
    console.log(`   標題: 檢查 ${stats.title.checked}, 改進 ${stats.title.improved}`)
    console.log(`   描述: 檢查 ${stats.description.checked}, 改進 ${stats.description.improved}`)
    console.log(`   步驟: 檢查 ${stats.steps.checked}, 改進 ${stats.steps.improved}`)
  } catch (error) {
    console.error(`❌ 執行失敗: ${error.message}`)
    console.error(error.stack)
    process.exit(1)
  }
}

// 執行主函數
if (require.main === module) {
  main().catch(console.error)
}

module.exports = {
  checkTranslationQuality,
  improveTranslation,
  getRecipesFromDatabase,
  updateRecipe,
}

