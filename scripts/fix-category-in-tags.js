/**
 * 修復分類誤存為標籤的問題
 * 檢查標籤中是否有分類名稱，如果有則：
 * 1. 移除該標籤
 * 2. 將食譜的分類設為對應的分類
 * 
 * 執行方式: node scripts/fix-category-in-tags.js
 */

const { createClient } = require('@supabase/supabase-js')
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

async function fixCategoryInTags() {
  console.log('=== 修復分類誤存為標籤的問題 ===\n')

  loadEnvFile()

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ 缺少 Supabase 環境變數')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey)

  try {
    // 步驟 1: 獲取所有分類名稱
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('id, name, slug')

    if (categoriesError) {
      console.error('❌ 查詢分類時發生錯誤:', categoriesError)
      process.exit(1)
    }

    const categoryNames = new Set(categories.map(c => c.name))
    const categoryMap = new Map(categories.map(c => [c.name, c.id]))
    const categorySlugMap = new Map(categories.map(c => [c.slug, c.id]))

    console.log(`✅ 找到 ${categories.length} 個分類:`)
    categories.forEach(c => {
      console.log(`   - ${c.name} (${c.slug})`)
    })
    console.log('')

    // 步驟 2: 查詢所有食譜及其標籤
    const { data: recipes, error: recipesError } = await supabase
      .from('recipes')
      .select('id, title, tags, category_id')

    if (recipesError) {
      console.error('❌ 查詢食譜時發生錯誤:', recipesError)
      process.exit(1)
    }

    console.log(`📊 找到 ${recipes.length} 個食譜\n`)

    // 步驟 3: 檢查每個食譜的標籤
    const fixes = []
    let totalTagsRemoved = 0
    let totalCategoriesUpdated = 0

    for (const recipe of recipes) {
      const tags = recipe.tags || []
      if (!Array.isArray(tags) || tags.length === 0) {
        continue
      }

      const categoryTags = []
      const remainingTags = []

      // 檢查每個標籤是否為分類名稱
      for (const tag of tags) {
        if (typeof tag === 'string' && tag.trim()) {
          const trimmedTag = tag.trim()
          
          // 檢查是否為分類名稱（精確匹配）
          if (categoryNames.has(trimmedTag)) {
            categoryTags.push(trimmedTag)
          } else {
            remainingTags.push(tag)
          }
        } else {
          remainingTags.push(tag)
        }
      }

      // 如果有分類名稱在標籤中
      if (categoryTags.length > 0) {
        // 決定要使用的分類（優先使用第一個匹配的分類）
        const categoryName = categoryTags[0]
        const categoryId = categoryMap.get(categoryName)

        fixes.push({
          recipeId: recipe.id,
          recipeTitle: recipe.title,
          categoryTags,
          categoryId,
          categoryName,
          oldTags: tags,
          newTags: remainingTags,
          oldCategoryId: recipe.category_id,
        })

        totalTagsRemoved += categoryTags.length
        if (!recipe.category_id || recipe.category_id !== categoryId) {
          totalCategoriesUpdated++
        }
      }
    }

    // 步驟 4: 顯示需要修復的食譜
    if (fixes.length === 0) {
      console.log('✅ 沒有發現分類名稱誤存為標籤的情況')
      return
    }

    console.log(`⚠️  發現 ${fixes.length} 個食譜需要修復:\n`)

    fixes.forEach((fix, index) => {
      console.log(`${index + 1}. ${fix.recipeTitle}`)
      console.log(`   食譜 ID: ${fix.recipeId}`)
      console.log(`   誤存為標籤的分類: ${fix.categoryTags.join(', ')}`)
      console.log(`   將設為分類: ${fix.categoryName}`)
      if (fix.oldCategoryId) {
        console.log(`   原分類 ID: ${fix.oldCategoryId}`)
      } else {
        console.log(`   原分類: 無`)
      }
      console.log(`   標籤變更: [${fix.oldTags.join(', ')}] → [${fix.newTags.join(', ')}]`)
      console.log('')
    })

    console.log(`\n📊 統計:`)
    console.log(`   - 需要修復的食譜: ${fixes.length}`)
    console.log(`   - 將移除的標籤數: ${totalTagsRemoved}`)
    console.log(`   - 將更新/新增的分類數: ${totalCategoriesUpdated}`)
    console.log('')

    // 步驟 5: 詢問是否執行修復
    console.log('⚠️  準備執行修復...')
    console.log('   這將：')
    console.log('   1. 從標籤中移除分類名稱')
    console.log('   2. 將食譜的分類設為對應的分類')
    console.log('')

    // 執行修復
    console.log('🔧 開始修復...\n')

    let successCount = 0
    let errorCount = 0

    for (const fix of fixes) {
      try {
        // 更新食譜：移除標籤中的分類名稱，並設置分類
        const updateData = {
          tags: fix.newTags,
          category_id: fix.categoryId,
        }

        const { error: updateError } = await supabase
          .from('recipes')
          .update(updateData)
          .eq('id', fix.recipeId)

        if (updateError) {
          console.error(`❌ 修復失敗: ${fix.recipeTitle}`)
          console.error(`   錯誤: ${updateError.message}`)
          errorCount++
        } else {
          console.log(`✅ 已修復: ${fix.recipeTitle}`)
          console.log(`   - 移除標籤: ${fix.categoryTags.join(', ')}`)
          console.log(`   - 設為分類: ${fix.categoryName}`)
          successCount++
        }
      } catch (err) {
        console.error(`❌ 修復失敗: ${fix.recipeTitle}`)
        console.error(`   錯誤: ${err.message}`)
        errorCount++
      }
    }

    console.log('\n=== 修復完成 ===')
    console.log(`✅ 成功: ${successCount}`)
    console.log(`❌ 失敗: ${errorCount}`)
    console.log(`📊 總計: ${fixes.length}`)

  } catch (err) {
    console.error('❌ 發生錯誤:', err)
    process.exit(1)
  }
}

// 執行修復
fixCategoryInTags()

