/**
 * 翻譯工具模組 (JavaScript 版本，用於 Node.js 腳本)
 */

const OpenAI = require('openai')

/**
 * 獲取 OpenAI API Key
 */
function getOpenAIApiKey() {
  const fs = require('fs')
  const path = require('path')
  
  // 嘗試從環境變數獲取
  if (process.env.OPENAI_API_KEY) {
    return process.env.OPENAI_API_KEY
  }
  
  // 嘗試從 .env 或 .env.local 讀取
  const envPath = path.join(process.cwd(), '.env')
  const envLocalPath = path.join(process.cwd(), '.env.local')
  
  let envPathToUse = null
  if (fs.existsSync(envPath)) {
    envPathToUse = envPath
  } else if (fs.existsSync(envLocalPath)) {
    envPathToUse = envLocalPath
  }
  
  if (envPathToUse) {
    const envContent = fs.readFileSync(envPathToUse, 'utf8')
    const lines = envContent.split('\n')
    
    for (const line of lines) {
      const trimmed = line.trim()
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=')
        if (key && key.trim() === 'OPENAI_API_KEY' && valueParts.length > 0) {
          return valueParts.join('=').trim().replace(/^["']|["']$/g, '')
        }
      }
    }
  }
  
  throw new Error('❌ 缺少 OPENAI_API_KEY 環境變數！請在 .env 檔案中設定。')
}

/**
 * 初始化 OpenAI 客戶端
 */
function getOpenAIClient() {
  const apiKey = getOpenAIApiKey()
  return new OpenAI({ apiKey })
}

/**
 * 翻譯單個文本
 * @param {string} text 要翻譯的文本
 * @param {string} targetLanguage 目標語言（預設：繁體中文）
 * @returns {Promise<string>} 翻譯後的文本
 */
async function translateText(text, targetLanguage = '繁體中文') {
  if (!text || text.trim().length === 0) {
    return text
  }

  try {
    const client = getOpenAIClient()
    
    const response = await client.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: `你是一個專業的翻譯助手。請將以下英文文本翻譯成${targetLanguage}，保持原意不變，語氣自然流暢。只返回翻譯結果，不要添加任何解釋或額外內容。`,
        },
        {
          role: 'user',
          content: text,
        },
      ],
      temperature: 0.3,
      max_tokens: 1000,
    })

    const translatedText = response.choices[0]?.message?.content?.trim()
    if (!translatedText) {
      throw new Error('翻譯回應為空')
    }

    return translatedText
  } catch (error) {
    console.error(`翻譯失敗: ${error.message}`)
    throw error
  }
}

/**
 * 批量翻譯多個文本
 * @param {string[]} texts 要翻譯的文本陣列
 * @param {string} targetLanguage 目標語言（預設：繁體中文）
 * @param {number} batchSize 每批處理的數量（預設：10）
 * @returns {Promise<string[]>} 翻譯後的文本陣列（順序與輸入相同）
 */
async function translateBatch(texts, targetLanguage = '繁體中文', batchSize = 10) {
  if (texts.length === 0) {
    return []
  }

  // 過濾空文本並記錄索引
  const nonEmptyTexts = texts
    .map((text, index) => ({ text: text?.trim() || '', index }))
    .filter((item) => item.text.length > 0)

  if (nonEmptyTexts.length === 0) {
    return texts // 如果全部為空，返回原陣列
  }

  const results = new Array(texts.length).fill('')
  
  // 將非空文本分批處理
  for (let i = 0; i < nonEmptyTexts.length; i += batchSize) {
    const batch = nonEmptyTexts.slice(i, i + batchSize)
    
    try {
      const client = getOpenAIClient()
      
      // 構建批量翻譯的提示
      const textsToTranslate = batch.map((item) => item.text)
      const prompt = `請將以下 ${batch.length} 個英文文本翻譯成${targetLanguage}，保持原意不變，語氣自然流暢。請按照以下格式返回，每行一個翻譯結果，順序與輸入相同：\n\n${textsToTranslate.map((t, idx) => `${idx + 1}. ${t}`).join('\n')}\n\n請只返回翻譯結果，每行一個，不要添加編號或其他內容。`

      const response = await client.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `你是一個專業的翻譯助手。請將英文文本翻譯成${targetLanguage}，保持原意不變，語氣自然流暢。`,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 2000,
      })

      const translatedText = response.choices[0]?.message?.content?.trim()
      if (!translatedText) {
        throw new Error('翻譯回應為空')
      }

      // 解析翻譯結果
      const translatedLines = translatedText
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0)
        // 移除可能的編號前綴（如 "1. " 或 "1."）
        .map((line) => line.replace(/^\d+\.\s*/, ''))

      // 將翻譯結果放回對應位置
      batch.forEach((item, batchIndex) => {
        if (translatedLines[batchIndex]) {
          results[item.index] = translatedLines[batchIndex]
        } else {
          // 如果解析失敗，暫時保留原文
          console.warn(`批量翻譯解析失敗，保留原文: ${item.text.substring(0, 50)}...`)
          results[item.index] = item.text
        }
      })

      // 添加延遲以避免 API 速率限制
      if (i + batchSize < nonEmptyTexts.length) {
        await new Promise((resolve) => setTimeout(resolve, 500))
      }
    } catch (error) {
      console.error(`批量翻譯失敗 (批次 ${Math.floor(i / batchSize) + 1}):`, error.message)
      
      // 失敗時，嘗試單個翻譯
      for (const item of batch) {
        try {
          results[item.index] = await translateText(item.text, targetLanguage)
          await new Promise((resolve) => setTimeout(resolve, 200))
        } catch (singleError) {
          console.error(`單個翻譯也失敗，保留原文: ${item.text.substring(0, 50)}...`)
          results[item.index] = item.text // 保留原文
        }
      }
    }
  }

  // 將空文本位置保持為空字串
  texts.forEach((text, index) => {
    if (!text || text.trim().length === 0) {
      results[index] = text
    }
  })

  return results
}

/**
 * 翻譯食譜相關內容
 * @param {Object} recipeData 食譜資料物件
 * @param {Object} options 翻譯選項
 * @returns {Promise<Object>} 翻譯後的食譜資料
 */
async function translateRecipe(recipeData, options = {}) {
  const {
    translateTitle = true,
    translateDescription = true,
    translateIngredients = true,
    translateSteps = true,
    translateTags = true,
    targetLanguage = '繁體中文',
  } = options

  const translated = { ...recipeData }

  try {
    // 翻譯標題
    if (translateTitle && recipeData.title) {
      console.log(`   🔤 翻譯標題...`)
      translated.title = await translateText(recipeData.title, targetLanguage)
    }

    // 翻譯描述
    if (translateDescription && recipeData.description) {
      console.log(`   🔤 翻譯描述...`)
      translated.description = await translateText(recipeData.description, targetLanguage)
    }

    // 翻譯食材名稱
    if (translateIngredients && recipeData.ingredients && recipeData.ingredients.length > 0) {
      console.log(`   🔤 翻譯食材名稱 (${recipeData.ingredients.length} 個)...`)
      const ingredientNames = recipeData.ingredients.map((ing) => ing.name)
      const translatedNames = await translateBatch(ingredientNames, targetLanguage, 10)
      
      translated.ingredients = recipeData.ingredients.map((ing, index) => ({
        ...ing,
        name: translatedNames[index] || ing.name,
      }))
    }

    // 翻譯步驟說明
    if (translateSteps && recipeData.steps && recipeData.steps.length > 0) {
      console.log(`   🔤 翻譯步驟說明 (${recipeData.steps.length} 個)...`)
      const stepInstructions = recipeData.steps.map((step) => step.instruction)
      const translatedInstructions = await translateBatch(stepInstructions, targetLanguage, 5)
      
      translated.steps = recipeData.steps.map((step, index) => ({
        ...step,
        instruction: translatedInstructions[index] || step.instruction,
      }))
    }

    // 翻譯標籤
    if (translateTags && recipeData.tags && recipeData.tags.length > 0) {
      console.log(`   🔤 翻譯標籤 (${recipeData.tags.length} 個)...`)
      const translatedTags = await translateBatch(recipeData.tags, targetLanguage, 10)
      translated.tags = translatedTags
    }

    console.log(`   ✅ 翻譯完成`)
    return translated
  } catch (error) {
    console.error(`   ❌ 翻譯過程出錯:`, error.message)
    // 返回部分翻譯的結果或原始資料
    return translated
  }
}

module.exports = {
  translateText,
  translateBatch,
  translateRecipe,
}

