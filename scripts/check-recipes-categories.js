/**
 * 檢查食譜的分類分配情況
 * 執行方式: node scripts/check-recipes-categories.js
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

async function checkRecipesCategories() {
  console.log('=== 檢查食譜的分類分配情況 ===\n')

  loadEnvFile()

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ 缺少 Supabase 環境變數')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey)

  try {
    // 查詢所有食譜
    const { data: recipes, error } = await supabase
      .from('recipes')
      .select('id, title, category_id, status, is_public')

    if (error) {
      console.error('❌ 查詢食譜時發生錯誤:', error)
      process.exit(1)
    }

    const totalRecipes = recipes.length
    const recipesWithCategory = recipes.filter(r => r.category_id).length
    const recipesWithoutCategory = totalRecipes - recipesWithCategory

    console.log(`📊 總食譜數: ${totalRecipes}`)
    console.log(`✅ 有分類: ${recipesWithCategory}`)
    console.log(`❌ 無分類: ${recipesWithoutCategory}\n`)

    // 按狀態統計
    const publishedWithCategory = recipes.filter(r => 
      r.status === 'published' && r.is_public && r.category_id
    ).length
    const publishedWithoutCategory = recipes.filter(r => 
      r.status === 'published' && r.is_public && !r.category_id
    ).length

    console.log(`📊 已發布且公開的食譜:`)
    console.log(`   ✅ 有分類: ${publishedWithCategory}`)
    console.log(`   ❌ 無分類: ${publishedWithoutCategory}\n`)

    // 按分類統計
    const { data: categories } = await supabase
      .from('categories')
      .select('id, name, slug')
      .order('sort_order')

    const categoryCounts = new Map()
    categories.forEach(c => {
      const count = recipes.filter(r => r.category_id === c.id).length
      categoryCounts.set(c.name, count)
    })

    console.log(`📊 各分類的食譜數量:`)
    categoryCounts.forEach((count, name) => {
      console.log(`   ${name}: ${count}`)
    })

  } catch (err) {
    console.error('❌ 發生錯誤:', err)
    process.exit(1)
  }
}

checkRecipesCategories()

