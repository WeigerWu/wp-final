/**
 * 復原最近1小時內更新的有分類食譜
 * 將這些食譜的 category_id 設為 NULL
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

async function revertRecent1Hour() {
  console.log('=== 復原最近1小時內更新的有分類食譜 ===\n')

  loadEnvFile()

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ 缺少 Supabase 環境變數')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  try {
    // 計算1小時前的時間
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    
    console.log(`查詢時間範圍: ${new Date(oneHourAgo).toLocaleString('zh-TW')} 之後更新的食譜\n`)

    // 查詢最近1小時內更新且有分類的食譜
    const { data: recentRecipes, error } = await supabase
      .from('recipes')
      .select('id, title, category_id, updated_at')
      .gte('updated_at', oneHourAgo)
      .not('category_id', 'is', null)
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('❌ 查詢食譜時發生錯誤:', error)
      process.exit(1)
    }

    if (!recentRecipes || recentRecipes.length === 0) {
      console.log('✅ 沒有找到最近1小時內更新的有分類食譜')
      return
    }

    console.log(`📊 找到 ${recentRecipes.length} 個最近1小時內更新的有分類食譜\n`)

    // 顯示將要復原的食譜
    console.log('將要復原的食譜：')
    recentRecipes.forEach((r, i) => {
      console.log(`   ${i + 1}. ${r.title}`)
      console.log(`      更新時間: ${new Date(r.updated_at).toLocaleString('zh-TW')}`)
    })

    console.log(`\n⚠️  準備將這 ${recentRecipes.length} 個食譜的分類設為 NULL...`)

    // 復原分類
    let successCount = 0
    let errorCount = 0

    for (const recipe of recentRecipes) {
      const { error: updateError } = await supabase
        .from('recipes')
        .update({ category_id: null })
        .eq('id', recipe.id)

      if (updateError) {
        console.error(`❌ 復原失敗: ${recipe.title} - ${updateError.message}`)
        errorCount++
      } else {
        console.log(`✅ 已復原: ${recipe.title}`)
        successCount++
      }
    }

    console.log('\n=== 復原完成 ===')
    console.log(`✅ 成功: ${successCount}`)
    console.log(`❌ 失敗: ${errorCount}`)
    console.log(`📊 總計: ${recentRecipes.length}`)

  } catch (err) {
    console.error('❌ 發生錯誤:', err)
    process.exit(1)
  }
}

// 執行復原
revertRecent1Hour()

