/**
 * 修復分類誤存為標籤的問題 (版本2 - 加強版)
 * 檢查標籤中是否有分類名稱，如果有則：
 * 1. 移除該標籤
 * 2. 將食譜的分類設為對應的分類
 * 
 * 執行方式: node scripts/fix-category-in-tags-v2.js
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
  console.log('=== 修復分類誤存為標籤的問題 (版本2) ===\n')

  loadEnvFile()

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  // 優先使用 service role key（可以繞過 RLS）
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ 缺少 Supabase 環境變數')
    console.error('   建議使用 SUPABASE_SERVICE_ROLE_KEY 以繞過 RLS 政策')
    process.exit(1)
  }

  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.log('✅ 使用 Service Role Key（可繞過 RLS）\n')
  } else {
    console.log('⚠️  使用 Anon Key（可能受 RLS 限制）\n')
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

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

    console.log(`✅ 找到 ${categories.length} 個分類\n`)

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
      }
    }

    if (fixes.length === 0) {
      console.log('✅ 沒有發現分類名稱誤存為標籤的情況')
      return
    }

    console.log(`⚠️  發現 ${fixes.length} 個食譜需要修復\n`)

    // 步驟 4: 執行修復
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

        const { data, error: updateError } = await supabase
          .from('recipes')
          .update(updateData)
          .eq('id', fix.recipeId)
          .select()

        if (updateError) {
          console.error(`❌ 修復失敗: ${fix.recipeTitle}`)
          console.error(`   錯誤: ${updateError.message}`)
          console.error(`   詳細: ${JSON.stringify(updateError)}`)
          errorCount++
        } else {
          // 驗證更新是否成功
          if (data && data.length > 0) {
            const updated = data[0]
            if (updated.category_id === fix.categoryId && 
                JSON.stringify(updated.tags) === JSON.stringify(fix.newTags)) {
              console.log(`✅ 已修復: ${fix.recipeTitle}`)
              console.log(`   - 移除標籤: ${fix.categoryTags.join(', ')}`)
              console.log(`   - 設為分類: ${fix.categoryName}`)
              successCount++
            } else {
              console.error(`⚠️  更新不完整: ${fix.recipeTitle}`)
              console.error(`   預期分類: ${fix.categoryId}, 實際: ${updated.category_id}`)
              errorCount++
            }
          } else {
            console.error(`⚠️  更新後查詢不到資料: ${fix.recipeTitle}`)
            errorCount++
          }
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

    // 驗證結果
    if (successCount > 0) {
      console.log('\n🔍 驗證修復結果...')
      const { data: verifyRecipes } = await supabase
        .from('recipes')
        .select('id, category_id')
        .in('id', fixes.map(f => f.recipeId))

      const verifiedCount = verifyRecipes.filter(r => r.category_id).length
      console.log(`✅ 驗證: ${verifiedCount}/${fixes.length} 個食譜現在有分類`)
    }

  } catch (err) {
    console.error('❌ 發生錯誤:', err)
    process.exit(1)
  }
}

// 執行修復
fixCategoryInTags()

