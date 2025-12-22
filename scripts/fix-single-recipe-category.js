/**
 * 修正單個食譜的分類
 * 執行方式: node scripts/fix-single-recipe-category.js
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

async function fixSingleRecipeCategory() {
  console.log('=== 修正單個食譜分類 ===\n')

  loadEnvFile()

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ 缺少 Supabase 環境變數')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  // 食譜ID和目標分類
  const recipeId = '1399ee1d-23f9-4c25-8a13-7463413f69e4'
  const targetCategorySlug = 'appetizer' // 開胃菜

  try {
    // 獲取分類ID
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('id, name, slug')
      .eq('slug', targetCategorySlug)
      .single()

    if (categoriesError || !categories) {
      console.error('❌ 找不到分類:', targetCategorySlug)
      process.exit(1)
    }

    console.log(`📋 目標分類: ${categories.name} (${categories.slug})`)

    // 獲取目前食譜資訊
    const { data: recipe, error: recipeError } = await supabase
      .from('recipes')
      .select('id, title, category_id')
      .eq('id', recipeId)
      .single()

    if (recipeError || !recipe) {
      console.error('❌ 找不到食譜:', recipeId)
      process.exit(1)
    }

    console.log(`📝 食譜: ${recipe.title}`)

    // 獲取目前分類名稱
    let currentCategoryName = '無'
    if (recipe.category_id) {
      const { data: currentCategory } = await supabase
        .from('categories')
        .select('name, slug')
        .eq('id', recipe.category_id)
        .single()
      
      if (currentCategory) {
        currentCategoryName = `${currentCategory.name} (${currentCategory.slug})`
      }
    }

    console.log(`   目前分類: ${currentCategoryName}`)

    // 更新分類
    const { error: updateError } = await supabase
      .from('recipes')
      .update({ category_id: categories.id })
      .eq('id', recipeId)

    if (updateError) {
      console.error('❌ 更新失敗:', updateError.message)
      process.exit(1)
    }

    console.log(`✅ 已成功更新為: ${categories.name} (${categories.slug})`)

  } catch (err) {
    console.error('❌ 發生錯誤:', err)
    process.exit(1)
  }
}

// 執行修正
fixSingleRecipeCategory()

