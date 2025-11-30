/**
 * 從網路抓取食譜並直接寫入資料庫
 * 
 * 使用方式：
 * 1. 修改下面的 fetchRecipeFromWeb 函數來抓取您想要的食譜來源
 * 2. 執行: node scripts/import-recipes.js
 * 
 * 注意：此腳本使用 Service Role Key 來繞過 RLS 政策
 * 請確保 .env 中有 SUPABASE_SERVICE_ROLE_KEY
 */

const fs = require('fs')
const path = require('path')
const { v2: cloudinary } = require('cloudinary')
const { translateRecipe } = require('../lib/utils/translate.js')

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
 * 初始化 Cloudinary 配置
 */
function initCloudinary() {
  const envVars = loadEnvFile()
  cloudinary.config({
    cloud_name: envVars.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: envVars.CLOUDINARY_API_KEY,
    api_secret: envVars.CLOUDINARY_API_SECRET,
  })
}

/**
 * 從 URL 下載圖片並上傳到 Cloudinary
 * @param {string} imageUrl 圖片 URL
 * @param {string} folder 上傳資料夾（預設 'recipes'）
 * @returns {Promise<string>} Cloudinary 圖片 URL
 */
async function uploadImageFromUrl(imageUrl, folder = 'recipes') {
  if (!imageUrl) {
    return null
  }

  try {
    initCloudinary()
    
    // 下載圖片
    const response = await fetch(imageUrl)
    if (!response.ok) {
      console.warn(`⚠️  無法下載圖片 ${imageUrl}: ${response.status}`)
      return null
    }

    // 將圖片轉換為 buffer
    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // 上傳到 Cloudinary
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: folder,
          resource_type: 'image',
        },
        (error, result) => {
          if (error) {
            console.warn(`⚠️  Cloudinary 上傳失敗: ${error.message}`)
            resolve(null) // 失敗時返回 null，不中斷流程
          } else if (result) {
            resolve(result.secure_url)
          } else {
            resolve(null)
          }
        }
      )

      uploadStream.end(buffer)
    })
  } catch (error) {
    console.warn(`⚠️  圖片上傳錯誤: ${error.message}`)
    return null
  }
}

/**
 * 獲取 Spoonacular API Key
 */
function getSpoonacularApiKey() {
  const envVars = loadEnvFile()
  const apiKey = envVars.SPOONACULAR_API_KEY
  if (!apiKey) {
    throw new Error('❌ 缺少 SPOONACULAR_API_KEY 環境變數！請在 .env 檔案中設定。')
  }
  return apiKey
}

/**
 * 從 Spoonacular API 獲取單個食譜
 * @param {number} recipeId 食譜 ID
 * @returns {Promise<Object|null>} 食譜資料
 */
async function fetchRecipeFromSpoonacular(recipeId) {
  try {
    const apiKey = getSpoonacularApiKey()
    const url = `https://api.spoonacular.com/recipes/${recipeId}/information?apiKey=${apiKey}`
    
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Spoonacular API 錯誤: ${response.status} ${response.statusText}`)
    }
    
    const data = await response.json()
    return parseSpoonacularRecipe(data)
  } catch (error) {
    console.error(`❌ 獲取食譜失敗 (ID: ${recipeId}):`, error.message)
    return null
  }
}

/**
 * 搜尋 Spoonacular 食譜
 * @param {string} query 搜尋關鍵字
 * @param {number} number 返回數量（預設 10）
 * @returns {Promise<Array>} 食譜列表
 */
async function searchSpoonacularRecipes(query, number = 10) {
  try {
    const apiKey = getSpoonacularApiKey()
    const url = `https://api.spoonacular.com/recipes/complexSearch?apiKey=${apiKey}&query=${encodeURIComponent(query)}&number=${number}&addRecipeInformation=true`
    
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Spoonacular API 錯誤: ${response.status} ${response.statusText}`)
    }
    
    const data = await response.json()
    if (!data.results || data.results.length === 0) {
      return []
    }
    
    // 轉換搜尋結果
    return data.results.map(recipe => parseSpoonacularRecipe(recipe))
  } catch (error) {
    console.error(`❌ 搜尋食譜失敗:`, error.message)
    return []
  }
}

/**
 * 獲取隨機 Spoonacular 食譜
 * @param {number} number 返回數量（預設 10）
 * @returns {Promise<Array>} 食譜列表
 */
async function fetchRandomSpoonacularRecipes(number = 10) {
  try {
    const apiKey = getSpoonacularApiKey()
    const url = `https://api.spoonacular.com/recipes/random?apiKey=${apiKey}&number=${number}`
    
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Spoonacular API 錯誤: ${response.status} ${response.statusText}`)
    }
    
    const data = await response.json()
    if (!data.recipes || data.recipes.length === 0) {
      return []
    }
    
    // 轉換隨機食譜結果
    return data.recipes.map(recipe => parseSpoonacularRecipe(recipe))
  } catch (error) {
    console.error(`❌ 獲取隨機食譜失敗:`, error.message)
    return []
  }
}

/**
 * 將 Spoonacular API 回應轉換為我們的資料格式
 * @param {Object} data Spoonacular API 回應資料
 * @returns {Object} 轉換後的食譜資料
 */
function parseSpoonacularRecipe(data) {
  // 解析食材
  const ingredients = (data.extendedIngredients || []).map(ing => ({
    name: ing.name || ing.originalName || '',
    amount: ing.amount ? String(ing.amount) : null,
    unit: ing.unit || null,
    note: ing.original || null,
    category: ing.aisle || null,
  }))

  // 解析步驟
  const steps = []
  if (data.analyzedInstructions && data.analyzedInstructions.length > 0) {
    const instructions = data.analyzedInstructions[0]
    if (instructions.steps) {
      instructions.steps.forEach((step, index) => {
        steps.push({
          step_number: index + 1,
          instruction: step.step || '',
          image_url: null,
          timer_minutes: null,
        })
      })
    }
  }

  // 如果沒有 analyzedInstructions，嘗試使用 instructions
  if (steps.length === 0 && data.instructions) {
    // instructions 可能是 HTML 格式，需要簡單處理
    const instructionText = data.instructions.replace(/<[^>]*>/g, '').trim()
    if (instructionText) {
      const instructionLines = instructionText.split(/\n+/).filter(line => line.trim())
      instructionLines.forEach((line, index) => {
        steps.push({
          step_number: index + 1,
          instruction: line.trim(),
          image_url: null,
          timer_minutes: null,
        })
      })
    }
  }

  // 解析標籤
  const tags = []
  if (data.dishTypes && Array.isArray(data.dishTypes)) {
    tags.push(...data.dishTypes)
  }
  if (data.cuisines && Array.isArray(data.cuisines)) {
    tags.push(...data.cuisines)
  }
  if (data.diets && Array.isArray(data.diets)) {
    tags.push(...data.diets)
  }

  return {
    title: data.title || '未命名食譜',
    description: data.summary ? data.summary.replace(/<[^>]*>/g, '').trim() : null,
    image_url: data.image || null,
    servings: data.servings || null,
    prep_time: data.preparationMinutes || null,
    cook_time: data.cookingMinutes || null,
    difficulty: null, // Spoonacular 沒有直接提供難度
    ingredients: ingredients,
    steps: steps,
    tags: tags,
    source_url: data.sourceUrl || data.spoonacularSourceUrl || null,
    source_name: 'Spoonacular',
    spoonacular_id: data.id, // 保存原始 ID 以便追蹤
  }
}

/**
 * 範例：從 JSON 格式的食譜 API 抓取資料
 * 您可以修改這個函數來適配不同的資料來源
 */
async function fetchRecipeFromWeb(recipeUrl) {
  // 範例 1: 從公開的食譜 API 抓取
  // 這裡使用一個範例 API，您可以替換成實際的 API
  try {
    // 範例：假設有一個食譜 API
    // const response = await fetch(recipeUrl)
    // const data = await response.json()
    // return parseRecipeData(data)
    
    // 範例 2: 手動輸入的食譜資料（用於測試）
    return {
      title: '範例食譜',
      description: '這是一個從網路抓取的範例食譜',
      image_url: null,
      servings: 4,
      prep_time: 15,
      cook_time: 30,
      difficulty: 'medium',
      ingredients: [
        { name: '雞肉', amount: '500', unit: 'g' },
        { name: '洋蔥', amount: '1', unit: '顆' },
        { name: '大蒜', amount: '3', unit: '瓣' },
      ],
      steps: [
        { step_number: 1, instruction: '將雞肉切塊', image_url: null, timer_minutes: null },
        { step_number: 2, instruction: '熱鍋下油，爆香大蒜', image_url: null, timer_minutes: null },
        { step_number: 3, instruction: '加入雞肉炒至變色', image_url: null, timer_minutes: 10 },
      ],
      tags: ['中式', '主菜'],
      source_url: recipeUrl,
      source_name: '範例來源',
    }
  } catch (error) {
    console.error('抓取食譜失敗:', error)
    return null
  }
}

/**
 * 解析不同格式的食譜資料
 * 根據您的資料來源調整這個函數
 */
function parseRecipeData(rawData) {
  // 這裡根據實際的 API 回應格式來解析
  // 範例格式：
  return {
    title: rawData.title || rawData.name || '未命名食譜',
    description: rawData.description || rawData.summary || null,
    image_url: rawData.image || rawData.image_url || null,
    servings: rawData.servings || rawData.servings_count || null,
    prep_time: rawData.prep_time || rawData.prepTimeMinutes || null,
    cook_time: rawData.cook_time || rawData.cookTimeMinutes || null,
    difficulty: mapDifficulty(rawData.difficulty || rawData.difficulty_level),
    ingredients: parseIngredients(rawData.ingredients || rawData.ingredient_list || []),
    steps: parseSteps(rawData.steps || rawData.instructions || rawData.instructions_list || []),
    tags: rawData.tags || rawData.categories || [],
    source_url: rawData.url || rawData.source_url || null,
    source_name: rawData.source || rawData.source_name || null,
  }
}

function mapDifficulty(difficulty) {
  if (!difficulty) return null
  const lower = difficulty.toLowerCase()
  if (lower.includes('easy') || lower.includes('簡單') || lower === '1') return 'easy'
  if (lower.includes('medium') || lower.includes('中等') || lower === '2') return 'medium'
  if (lower.includes('hard') || lower.includes('困難') || lower === '3') return 'hard'
  return null
}

function parseIngredients(ingredients) {
  if (!Array.isArray(ingredients)) return []
  
  return ingredients.map((ing, index) => {
    if (typeof ing === 'string') {
      // 如果是字串格式，嘗試解析（例如："500g 雞肉"）
      const match = ing.match(/^(\d+(?:\.\d+)?)\s*(\w+)?\s+(.+)$/)
      if (match) {
        return {
          name: match[3].trim(),
          amount: match[1],
          unit: match[2] || null,
        }
      }
      return { name: ing.trim(), amount: null, unit: null }
    }
    
    // 如果是物件格式
    return {
      name: ing.name || ing.ingredient || ing.item || '',
      amount: ing.amount || ing.quantity || null,
      unit: ing.unit || ing.measurement || null,
      note: ing.note || null,
      category: ing.category || null,
    }
  })
}

function parseSteps(steps) {
  if (!Array.isArray(steps)) return []
  
  return steps.map((step, index) => {
    if (typeof step === 'string') {
      return {
        step_number: index + 1,
        instruction: step.trim(),
        image_url: null,
        timer_minutes: null,
      }
    }
    
    return {
      step_number: step.step_number || step.number || index + 1,
      instruction: step.instruction || step.text || step.description || '',
      image_url: step.image_url || step.image || null,
      timer_minutes: step.timer_minutes || step.timer || null,
    }
  })
}

/**
 * 將食譜寫入資料庫
 */
async function insertRecipeToDatabase(recipeData, userId) {
  const envVars = loadEnvFile()
  const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = envVars.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ 缺少必要的環境變數！')
    console.error('需要: NEXT_PUBLIC_SUPABASE_URL 和 SUPABASE_SERVICE_ROLE_KEY')
    console.error('\n提示: Service Role Key 可以在 Supabase Dashboard > Settings > API 找到')
    process.exit(1)
  }

  const cleanUrl = supabaseUrl.replace(/\/$/, '')

  // 準備要插入的資料
  const insertData = {
    user_id: userId,
    title: recipeData.title,
    description: recipeData.description || null,
    image_url: recipeData.image_url || null,
    servings: recipeData.servings || null,
    prep_time: recipeData.prep_time || null,
    cook_time: recipeData.cook_time || null,
    total_time: (recipeData.prep_time || 0) + (recipeData.cook_time || 0) || null,
    difficulty: recipeData.difficulty || null,
    ingredients: recipeData.ingredients || [],
    steps: recipeData.steps || [],
    tags: recipeData.tags || [],
    status: 'published',
    is_public: true,
    source_url: recipeData.source_url || null,
    source_name: recipeData.source_name || null,
  }

  try {
    const response = await fetch(`${cleanUrl}/rest/v1/recipes`, {
      method: 'POST',
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
      body: JSON.stringify(insertData),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`插入失敗 (${response.status}): ${errorText}`)
    }

    const result = await response.json()
    return result[0] || result // Supabase 可能返回陣列或單一物件
  } catch (error) {
    console.error('❌ 寫入資料庫失敗:', error.message)
    throw error
  }
}

/**
 * 從 Spoonacular 批量導入食譜
 * @param {Object} options 導入選項
 * @param {string} options.mode 導入模式: 'random' | 'search' | 'id'
 * @param {number} options.number 導入數量（用於 random 和 search 模式）
 * @param {string} options.query 搜尋關鍵字（用於 search 模式）
 * @param {number} options.recipeId 食譜 ID（用於 id 模式）
 * @param {string} options.userId 用戶 ID
 * @param {boolean} options.uploadImages 是否上傳圖片到 Cloudinary（預設 true）
 * @param {boolean} options.translate 是否翻譯為中文（預設 true）
 * @returns {Promise<Object>} 導入結果統計
 */
async function importBatchFromSpoonacular(options) {
  const {
    mode = 'random',
    number = 10,
    query = '',
    recipeId = null,
    userId = null,
    uploadImages = true,
    translate = true,
  } = options

  console.log(`\n📥 開始從 Spoonacular 批量導入食譜...`)
  console.log(`   模式: ${mode}`)
  if (mode === 'search') {
    console.log(`   搜尋關鍵字: ${query}`)
  } else if (mode === 'id') {
    console.log(`   食譜 ID: ${recipeId}`)
  }
  console.log(`   數量: ${number}`)
  console.log(`   上傳圖片: ${uploadImages ? '是' : '否'}`)
  console.log(`   翻譯為中文: ${translate ? '是' : '否'}\n`)

  let recipes = []

  // 根據模式獲取食譜
  try {
    if (mode === 'random') {
      recipes = await fetchRandomSpoonacularRecipes(number)
    } else if (mode === 'search') {
      recipes = await searchSpoonacularRecipes(query, number)
    } else if (mode === 'id') {
      const recipe = await fetchRecipeFromSpoonacular(recipeId)
      if (recipe) {
        recipes = [recipe]
      }
    } else {
      throw new Error(`未知的導入模式: ${mode}`)
    }
  } catch (error) {
    console.error(`❌ 獲取食譜失敗:`, error.message)
    return { success: 0, failed: 0, skipped: 0, total: 0 }
  }

  if (recipes.length === 0) {
    console.log('⚠️  沒有找到任何食譜')
    return { success: 0, failed: 0, skipped: 0, total: 0 }
  }

  console.log(`✅ 成功獲取 ${recipes.length} 個食譜\n`)

  // 獲取用戶 ID
  const targetUserId = userId || await getOrCreateSystemUser()

  const stats = {
    success: 0,
    failed: 0,
    skipped: 0,
    total: recipes.length,
  }

  // 逐個處理食譜
  for (let i = 0; i < recipes.length; i++) {
    const recipe = recipes[i]
    console.log(`\n[${i + 1}/${recipes.length}] 處理食譜: ${recipe.title}`)

    try {
      // 翻譯為中文（如果需要）
      if (translate) {
        try {
          console.log(`   🌐 正在翻譯為中文...`)
          const translatedRecipe = await translateRecipe(recipe, {
            translateTitle: true,
            translateDescription: true,
            translateIngredients: true,
            translateSteps: true,
            translateTags: true,
            targetLanguage: '繁體中文',
          })
          // 將翻譯後的內容合併回原食譜物件
          Object.assign(recipe, translatedRecipe)
        } catch (translateError) {
          console.warn(`   ⚠️  翻譯失敗，使用原始英文內容: ${translateError.message}`)
          // 翻譯失敗時繼續使用原始英文內容
        }
      }

      // 上傳圖片到 Cloudinary（如果需要）
      if (uploadImages && recipe.image_url) {
        console.log(`   📸 正在上傳圖片...`)
        const cloudinaryUrl = await uploadImageFromUrl(recipe.image_url, 'recipes')
        if (cloudinaryUrl) {
          recipe.image_url = cloudinaryUrl
          console.log(`   ✅ 圖片上傳成功`)
        } else {
          console.log(`   ⚠️  圖片上傳失敗，使用原始 URL`)
        }
      }

      // 寫入資料庫
      console.log(`   💾 正在寫入資料庫...`)
      const result = await insertRecipeToDatabase(recipe, targetUserId)
      console.log(`   ✅ 成功導入！食譜 ID: ${result.id}`)
      stats.success++
    } catch (error) {
      console.error(`   ❌ 導入失敗: ${error.message}`)
      stats.failed++
    }
  }

  // 顯示統計
  console.log(`\n\n📊 導入完成統計:`)
  console.log(`   總數: ${stats.total}`)
  console.log(`   ✅ 成功: ${stats.success}`)
  console.log(`   ❌ 失敗: ${stats.failed}`)
  console.log(`   ⏭️  跳過: ${stats.skipped}`)

  return stats
}

/**
 * 獲取或創建一個系統用戶（用於批量導入）
 * 如果沒有指定 userId，會使用第一個找到的用戶
 */
async function getOrCreateSystemUser() {
  const envVars = loadEnvFile()
  const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = envVars.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('缺少環境變數')
  }

  const cleanUrl = supabaseUrl.replace(/\/$/, '')

  // 嘗試獲取第一個用戶
  try {
    const response = await fetch(`${cleanUrl}/rest/v1/profiles?limit=1`, {
      method: 'GET',
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
      },
    })

    if (response.ok) {
      const profiles = await response.json()
      if (profiles && profiles.length > 0) {
        return profiles[0].id
      }
    }
  } catch (error) {
    console.warn('無法獲取用戶列表:', error.message)
  }

  // 如果沒有用戶，提示用戶手動指定
  console.error('❌ 找不到任何用戶！')
  console.error('請先建立一個用戶帳號，或手動指定 userId')
  process.exit(1)
}

/**
 * 解析命令列參數
 */
function parseArgs() {
  const args = process.argv.slice(2)
  const options = {
    spoonacular: false,
    mode: null,
    number: 10,
    query: '',
    id: null,
    uploadImages: true,
    translate: true,
  }

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    
    if (arg === '--spoonacular' || arg === '-s') {
      options.spoonacular = true
    } else if (arg === '--random' || arg === '-r') {
      options.mode = 'random'
    } else if (arg === '--search') {
      options.mode = 'search'
      if (i + 1 < args.length && !args[i + 1].startsWith('--')) {
        options.query = args[++i]
      }
    } else if (arg === '--id') {
      options.mode = 'id'
      if (i + 1 < args.length && !args[i + 1].startsWith('--')) {
        options.id = parseInt(args[++i], 10)
      }
    } else if (arg === '--number' || arg === '-n') {
      if (i + 1 < args.length && !args[i + 1].startsWith('--')) {
        options.number = parseInt(args[++i], 10)
      }
    } else if (arg === '--no-upload-images') {
      options.uploadImages = false
    } else if (arg === '--no-translate') {
      options.translate = false
    } else if (arg === '--help' || arg === '-h') {
      console.log(`
使用方式:
  node scripts/import-recipes.js [選項]

選項:
  --spoonacular, -s              使用 Spoonacular API
  --random, -r                    導入隨機食譜
  --search <關鍵字>               搜尋並導入食譜
  --id <食譜ID>                   導入指定 ID 的食譜
  --number, -n <數量>             導入數量（預設: 10）
  --no-upload-images              不上傳圖片到 Cloudinary
  --no-translate                  不翻譯為中文（預設會自動翻譯）
  --help, -h                      顯示此說明

範例:
  # 導入隨機 10 個食譜
  node scripts/import-recipes.js --spoonacular --random --number 10

  # 根據關鍵字搜尋並導入 5 個食譜
  node scripts/import-recipes.js --spoonacular --search "pasta" --number 5

  # 導入指定 ID 的食譜
  node scripts/import-recipes.js --spoonacular --id 123456

  # 導入隨機食譜但不上傳圖片
  node scripts/import-recipes.js --spoonacular --random --no-upload-images

  # 導入隨機食譜但不翻譯（保留英文）
  node scripts/import-recipes.js --spoonacular --random --no-translate
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
  console.log('=== 從網路導入食譜到資料庫 ===\n')

  // 解析命令列參數
  const options = parseArgs()

  // 如果使用 Spoonacular API
  if (options.spoonacular) {
    if (!options.mode) {
      console.error('❌ 請指定導入模式: --random, --search, 或 --id')
      console.error('   使用 --help 查看使用說明')
      process.exit(1)
    }

    if (options.mode === 'search' && !options.query) {
      console.error('❌ 搜尋模式需要提供關鍵字: --search "關鍵字"')
      process.exit(1)
    }

    if (options.mode === 'id' && !options.id) {
      console.error('❌ ID 模式需要提供食譜 ID: --id <食譜ID>')
      process.exit(1)
    }

    // 獲取用戶 ID
    const userId = await getOrCreateSystemUser()
    console.log(`✅ 使用用戶 ID: ${userId}\n`)

    // 執行批量導入
    const stats = await importBatchFromSpoonacular({
      mode: options.mode,
      number: options.number,
      query: options.query,
      recipeId: options.id,
      userId: userId,
      uploadImages: options.uploadImages,
      translate: options.translate,
    })

    if (stats.failed > 0) {
      process.exit(1)
    }
  } else {
    // 原有的導入方式（向後兼容）
    console.log('📋 正在獲取用戶資訊...')
    const userId = await getOrCreateSystemUser()
    console.log(`✅ 使用用戶 ID: ${userId}\n`)

    // 從網路抓取食譜
    const recipeUrl = process.argv[2] || 'https://example.com/recipe'
    
    console.log(`🌐 正在從網路抓取食譜: ${recipeUrl}`)
    const recipeData = await fetchRecipeFromWeb(recipeUrl)

    if (!recipeData) {
      console.error('❌ 無法抓取食譜資料')
      process.exit(1)
    }

    console.log(`✅ 成功抓取食譜: ${recipeData.title}\n`)

    // 顯示將要導入的資料
    console.log('📝 食譜資訊:')
    console.log(`  標題: ${recipeData.title}`)
    console.log(`  描述: ${recipeData.description || '(無)'}`)
    console.log(`  份量: ${recipeData.servings || '(未設定)'} 人份`)
    console.log(`  準備時間: ${recipeData.prep_time || 0} 分鐘`)
    console.log(`  烹飪時間: ${recipeData.cook_time || 0} 分鐘`)
    console.log(`  難度: ${recipeData.difficulty || '(未設定)'}`)
    console.log(`  食材數量: ${recipeData.ingredients?.length || 0}`)
    console.log(`  步驟數量: ${recipeData.steps?.length || 0}`)
    console.log(`  標籤: ${recipeData.tags?.join(', ') || '(無)'}\n`)

    // 寫入資料庫
    console.log('💾 正在寫入資料庫...')
    try {
      const result = await insertRecipeToDatabase(recipeData, userId)
      console.log('✅ 成功導入食譜！')
      console.log(`   食譜 ID: ${result.id}`)
      console.log(`   查看食譜: /recipes/${result.id}`)
    } catch (error) {
      console.error('❌ 導入失敗:', error.message)
      process.exit(1)
    }
  }
}

// 執行主函數
if (require.main === module) {
  main().catch(console.error)
}

module.exports = {
  fetchRecipeFromWeb,
  parseRecipeData,
  insertRecipeToDatabase,
  getOrCreateSystemUser,
  fetchRecipeFromSpoonacular,
  searchSpoonacularRecipes,
  fetchRandomSpoonacularRecipes,
  parseSpoonacularRecipe,
  importBatchFromSpoonacular,
  uploadImageFromUrl,
}

