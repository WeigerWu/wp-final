/**
 * 查詢資料庫中的分類
 * 執行方式: node scripts/check-categories.js
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// 載入環境變數
function loadEnvFile() {
  const envPath = path.join(__dirname, '..', '.env')
  const envLocalPath = path.join(__dirname, '..', '.env.local')

  let envContent = ''

  // 優先讀取 .env.local
  if (fs.existsSync(envLocalPath)) {
    envContent = fs.readFileSync(envLocalPath, 'utf-8')
    console.log('📄 讀取 .env.local')
  } else if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf-8')
    console.log('📄 讀取 .env')
  } else {
    console.error('❌ 找不到 .env 或 .env.local 檔案')
    console.error('   請確保環境變數檔案存在於專案根目錄')
    process.exit(1)
  }

  // 解析環境變數
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

async function checkCategories() {
  console.log('=== 查詢資料庫中的分類 ===\n')

  // 載入環境變數
  loadEnvFile()

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ 缺少 Supabase 環境變數')
    console.error('   請確保 .env 檔案中包含:')
    console.error('   - NEXT_PUBLIC_SUPABASE_URL')
    console.error('   - NEXT_PUBLIC_SUPABASE_ANON_KEY')
    process.exit(1)
  }

  console.log(`✅ 連接到: ${supabaseUrl}\n`)

  const supabase = createClient(supabaseUrl, supabaseAnonKey)

  try {
    // 查詢所有分類
    const { data: categories, error } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true })

    if (error) {
      console.error('❌ 查詢分類時發生錯誤:', error)
      process.exit(1)
    }

    if (!categories || categories.length === 0) {
      console.log('⚠️  資料庫中沒有任何分類')
      return
    }

    console.log(`📊 找到 ${categories.length} 個分類:\n`)

    // 查詢每個分類的食譜數量
    for (const category of categories) {
      const { count } = await supabase
        .from('recipes')
        .select('*', { count: 'exact', head: true })
        .eq('category_id', category.id)
        .eq('status', 'published')
        .eq('is_public', true)

      const recipeCount = count || 0

      console.log(`📁 ${category.icon || '📦'} ${category.name} (${category.slug})`)
      console.log(`   描述: ${category.description || '無'}`)
      console.log(`   排序: ${category.sort_order}`)
      console.log(`   食譜數量: ${recipeCount}`)
      if (category.parent_id) {
        console.log(`   父分類 ID: ${category.parent_id}`)
      }
      console.log(`   建立時間: ${new Date(category.created_at).toLocaleString('zh-TW')}`)
      console.log('')
    }

    // 統計資訊
    console.log('\n=== 統計資訊 ===')
    const totalCategories = categories.length
    const topLevelCategories = categories.filter(c => !c.parent_id).length
    const subCategories = categories.filter(c => c.parent_id).length

    console.log(`總分類數: ${totalCategories}`)
    console.log(`頂層分類: ${topLevelCategories}`)
    console.log(`子分類: ${subCategories}`)

    // 檢查是否有舊分類需要遷移
    const oldCategories = categories.filter(c => 
      ['breakfast', 'lunch', 'dinner', 'snack', 'vegetarian', 'quick-meal', 'healthy'].includes(c.slug)
    )

    if (oldCategories.length > 0) {
      console.log('\n⚠️  發現需要遷移的舊分類:')
      oldCategories.forEach(c => {
        console.log(`   - ${c.name} (${c.slug})`)
      })
      console.log('\n💡 建議執行 migrate-categories.sql 進行遷移')
    } else {
      console.log('\n✅ 沒有發現需要遷移的舊分類')
    }

  } catch (err) {
    console.error('❌ 發生錯誤:', err)
    process.exit(1)
  }
}

// 執行查詢
checkCategories()

