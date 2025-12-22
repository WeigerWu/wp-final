/**
 * 測試 OpenAI API 連接
 * 執行方式: node scripts/test-openai-connection.js
 */

const OpenAI = require('openai')
const fs = require('fs')
const path = require('path')

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

async function testOpenAIConnection() {
  console.log('=== 測試 OpenAI API 連接 ===\n')

  loadEnvFile()

  const openaiApiKey = process.env.OPENAI_API_KEY

  if (!openaiApiKey) {
    console.error('❌ 缺少 OPENAI_API_KEY 環境變數')
    console.error('   請在 .env 檔案中添加: OPENAI_API_KEY=your_api_key')
    process.exit(1)
  }

  console.log(`✅ 找到 OPENAI_API_KEY: ${openaiApiKey.substring(0, 20)}...\n`)

  try {
    const openai = new OpenAI({ apiKey: openaiApiKey })

    console.log('🔌 正在測試連接...\n')

    // 測試簡單的 API 調用
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: '請回答「連接成功」'
        }
      ],
      max_tokens: 10,
    })

    const message = response.choices[0].message.content

    console.log('✅ OpenAI API 連接成功！')
    console.log(`📝 回應: ${message}\n`)

    // 測試分類功能
    console.log('🧪 測試分類功能...\n')

    const categoryResponse = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: '你是一個專業的食譜分類專家。只回答分類的 slug（例如：main-course），不要回答其他內容。'
        },
        {
          role: 'user',
          content: '請為「烤雞」這個食譜分類，可選分類：main-course, soup, dessert, beverage, appetizer, salad, staple, sauce-condiment。只回答 slug。'
        }
      ],
      temperature: 0.2,
      max_tokens: 20,
    })

    const categorySlug = categoryResponse.choices[0].message.content.trim()
    console.log(`✅ 分類測試成功！`)
    console.log(`📝 分類結果: ${categorySlug}\n`)

    console.log('🎉 所有測試通過！OpenAI API 可以正常使用。')

  } catch (error) {
    console.error('❌ OpenAI API 連接失敗:')
    console.error(`   錯誤訊息: ${error.message}`)
    
    if (error.status) {
      console.error(`   HTTP 狀態碼: ${error.status}`)
    }
    
    if (error.response) {
      console.error(`   回應內容: ${JSON.stringify(error.response, null, 2)}`)
    }

    console.error('\n💡 可能的原因：')
    console.error('   1. API Key 無效或過期')
    console.error('   2. API Key 沒有足夠的權限')
    console.error('   3. 網路連接問題')
    console.error('   4. OpenAI 服務暫時不可用')

    process.exit(1)
  }
}

// 執行測試
testOpenAIConnection()

