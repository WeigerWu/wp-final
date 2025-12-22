/**
 * 根據檢查報告批量修正食譜分類
 * 執行方式: node scripts/fix-categories-from-report.js
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

async function fixCategoriesFromReport() {
  console.log('=== 根據檢查報告批量修正食譜分類 ===\n')

  loadEnvFile()

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ 缺少 Supabase 環境變數')
    process.exit(1)
  }

  // 讀取檢查報告
  const reportPath = path.join(__dirname, '..', 'suspicious-categories.json')
  if (!fs.existsSync(reportPath)) {
    console.error('❌ 找不到檢查報告檔案: suspicious-categories.json')
    console.error('   請先執行: node scripts/check-category-accuracy.js')
    process.exit(1)
  }

  const reportData = JSON.parse(fs.readFileSync(reportPath, 'utf-8'))
  const suspiciousRecipes = reportData.suspiciousRecipes || []

  if (suspiciousRecipes.length === 0) {
    console.log('✅ 沒有需要修正的分類')
    return
  }

  console.log(`📊 找到 ${suspiciousRecipes.length} 個需要修正的食譜\n`)

  const supabase = createClient(supabaseUrl, supabaseKey)

  try {
    // 獲取所有分類的 ID 映射
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('id, name, slug')

    if (categoriesError) {
      console.error('❌ 查詢分類時發生錯誤:', categoriesError)
      process.exit(1)
    }

    const categorySlugToId = new Map(categories.map(c => [c.slug, c.id]))
    const categoryIdToName = new Map(categories.map(c => [c.id, c.name]))

    console.log('📋 可用分類：')
    categories.forEach(cat => {
      console.log(`   ${cat.name} (${cat.slug})`)
    })
    console.log('')

    // 統計修正結果
    const results = {
      success: [],
      failed: [],
      skipped: [],
      stats: {}
    }

    // 按建議分類統計
    const statsByCategory = new Map()

    // 處理每個食譜
    for (let i = 0; i < suspiciousRecipes.length; i++) {
      const item = suspiciousRecipes[i]
      const { recipeId, title, currentCategorySlug, suggestedCategory } = item

      // 檢查建議分類是否存在
      const suggestedCategoryId = categorySlugToId.get(suggestedCategory)
      if (!suggestedCategoryId) {
        console.log(`⚠️  [${i + 1}/${suspiciousRecipes.length}] ${title}`)
        console.log(`    ❌ 找不到建議分類: ${suggestedCategory}`)
        results.failed.push({
          ...item,
          error: `找不到分類: ${suggestedCategory}`
        })
        continue
      }

      const suggestedCategoryName = categoryIdToName.get(suggestedCategoryId)

      // 如果建議分類和目前分類相同，跳過
      if (currentCategorySlug === suggestedCategory) {
        console.log(`⏭️  [${i + 1}/${suspiciousRecipes.length}] ${title}`)
        console.log(`    目前分類已是建議分類，跳過`)
        results.skipped.push(item)
        continue
      }

      // 更新分類
      const { error: updateError } = await supabase
        .from('recipes')
        .update({ category_id: suggestedCategoryId })
        .eq('id', recipeId)

      if (updateError) {
        console.log(`❌ [${i + 1}/${suspiciousRecipes.length}] ${title}`)
        console.log(`   更新失敗: ${updateError.message}`)
        results.failed.push({
          ...item,
          error: updateError.message
        })
      } else {
        console.log(`✅ [${i + 1}/${suspiciousRecipes.length}] ${title}`)
        console.log(`   ${currentCategorySlug} → ${suggestedCategory} (${suggestedCategoryName})`)
        results.success.push(item)
        
        // 統計
        const key = `${suggestedCategoryName} (${suggestedCategory})`
        statsByCategory.set(key, (statsByCategory.get(key) || 0) + 1)
      }
    }

    // 顯示結果統計
    console.log('\n' + '='.repeat(80))
    console.log('修正結果統計')
    console.log('='.repeat(80))
    console.log(`✅ 成功: ${results.success.length} 個`)
    console.log(`❌ 失敗: ${results.failed.length} 個`)
    console.log(`⏭️  跳過: ${results.skipped.length} 個`)
    console.log(`📊 總計: ${suspiciousRecipes.length} 個\n`)

    if (statsByCategory.size > 0) {
      console.log('按新分類統計：')
      statsByCategory.forEach((count, category) => {
        console.log(`   ${category}: ${count} 個`)
      })
      console.log('')
    }

    // 如果有失敗的，顯示詳細資訊
    if (results.failed.length > 0) {
      console.log('失敗的食譜：')
      results.failed.forEach((item, i) => {
        console.log(`   ${i + 1}. ${item.title} - ${item.error}`)
      })
      console.log('')
    }

    // 保存修正結果
    const resultPath = path.join(__dirname, '..', 'category-fix-results.json')
    const resultData = {
      fixedAt: new Date().toISOString(),
      total: suspiciousRecipes.length,
      success: results.success.length,
      failed: results.failed.length,
      skipped: results.skipped.length,
      successRecipes: results.success,
      failedRecipes: results.failed,
      skippedRecipes: results.skipped,
      statsByCategory: Object.fromEntries(statsByCategory)
    }
    fs.writeFileSync(resultPath, JSON.stringify(resultData, null, 2), 'utf-8')
    console.log(`💾 修正結果已保存至: ${resultPath}`)

  } catch (err) {
    console.error('❌ 發生錯誤:', err)
    process.exit(1)
  }
}

// 執行修正
fixCategoriesFromReport()

