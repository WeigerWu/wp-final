/**
 * 分析有分類食譜的時間分佈
 * 幫助判斷哪些是原本就有的，哪些是後來添加的
 */

const { createClient } = require('@supabase/supabase-js')
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

async function analyzeTimeline() {
  console.log('=== 分析有分類食譜的時間分佈 ===\n')

  loadEnvFile()

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ 缺少 Supabase 環境變數')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  try {
    // 查詢所有有分類的食譜
    const { data: recipes, error } = await supabase
      .from('recipes')
      .select('id, title, category_id, created_at, updated_at')
      .not('category_id', 'is', null)
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('❌ 查詢食譜時發生錯誤:', error)
      process.exit(1)
    }

    console.log(`📊 總共有 ${recipes.length} 個有分類的食譜\n`)

    // 分析時間分佈
    const now = new Date()
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const yesterdayStart = new Date(todayStart.getTime() - 24 * 60 * 60 * 1000)

    const recent1Hour = recipes.filter(r => new Date(r.updated_at) > oneHourAgo)
    const todayEarlier = recipes.filter(r => 
      new Date(r.updated_at) > todayStart && 
      new Date(r.updated_at) <= oneHourAgo
    )
    const yesterday = recipes.filter(r => 
      new Date(r.updated_at) > yesterdayStart && 
      new Date(r.updated_at) <= todayStart
    )
    const older = recipes.filter(r => new Date(r.updated_at) <= yesterdayStart)

    console.log('📅 按更新時間分組：')
    console.log(`   最近1小時內: ${recent1Hour.length} 個（已復原）`)
    console.log(`   今天更早: ${todayEarlier.length} 個`)
    console.log(`   昨天: ${yesterday.length} 個`)
    console.log(`   更早之前: ${older.length} 個\n`)

    // 顯示今天更早更新的食譜（可能是從標籤移過來的）
    if (todayEarlier.length > 0) {
      console.log(`⚠️  今天更早更新的食譜（${todayEarlier.length}個，可能是從標籤移過來的）：`)
      todayEarlier.slice(0, 10).forEach((r, i) => {
        console.log(`   ${i + 1}. ${r.title} - ${new Date(r.updated_at).toLocaleString('zh-TW')}`)
      })
      if (todayEarlier.length > 10) {
        console.log(`   ... 還有 ${todayEarlier.length - 10} 個`)
      }
      console.log('')
    }

    // 顯示昨天更新的
    if (yesterday.length > 0) {
      console.log(`📅 昨天更新的食譜（${yesterday.length}個）：`)
      yesterday.slice(0, 5).forEach((r, i) => {
        console.log(`   ${i + 1}. ${r.title} - ${new Date(r.updated_at).toLocaleString('zh-TW')}`)
      })
      if (yesterday.length > 5) {
        console.log(`   ... 還有 ${yesterday.length - 5} 個`)
      }
      console.log('')
    }

    console.log(`💡 建議：`)
    console.log(`   目標是55個有分類，目前有${recipes.length}個`)
    console.log(`   需要復原約 ${recipes.length - 55} 個`)
    console.log(`   今天更早更新的 ${todayEarlier.length} 個很可能是從標籤移過來的，可以考慮復原`)

  } catch (err) {
    console.error('❌ 發生錯誤:', err)
    process.exit(1)
  }
}

analyzeTimeline()

