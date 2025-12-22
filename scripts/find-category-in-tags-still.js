/**
 * 找出標籤中仍有分類名稱的食譜
 * 這些可能是誤分類的，應該復原
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

async function findCategoryInTags() {
  console.log('=== 找出標籤中仍有分類名稱的食譜 ===\n')

  loadEnvFile()

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ 缺少 Supabase 環境變數')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  try {
    // 獲取所有分類名稱
    const { data: categories } = await supabase
      .from('categories')
      .select('name')

    const categoryNames = new Set(categories.map(c => c.name))

    // 查詢所有有分類的食譜
    const { data: recipes, error } = await supabase
      .from('recipes')
      .select('id, title, category_id, tags, updated_at')
      .not('category_id', 'is', null)
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('❌ 查詢食譜時發生錯誤:', error)
      process.exit(1)
    }

    // 找出標籤中仍有分類名稱的食譜
    const recipesWithCategoryInTags = []

    for (const recipe of recipes) {
      const tags = recipe.tags || []
      if (Array.isArray(tags)) {
        const hasCategoryInTags = tags.some(tag => 
          typeof tag === 'string' && categoryNames.has(tag.trim())
        )
        
        if (hasCategoryInTags) {
          const categoryTags = tags.filter(tag => 
            typeof tag === 'string' && categoryNames.has(tag.trim())
          )
          recipesWithCategoryInTags.push({
            ...recipe,
            categoryTags
          })
        }
      }
    }

    console.log(`📊 找到 ${recipesWithCategoryInTags.length} 個標籤中仍有分類名稱的食譜\n`)

    if (recipesWithCategoryInTags.length > 0) {
      console.log('這些食譜的標籤中仍有分類名稱（可能是誤分類）：')
      recipesWithCategoryInTags.forEach((r, i) => {
        console.log(`   ${i + 1}. ${r.title}`)
        console.log(`      標籤中的分類: ${r.categoryTags.join(', ')}`)
        console.log(`      更新時間: ${new Date(r.updated_at).toLocaleString('zh-TW')}`)
      })
    } else {
      console.log('✅ 沒有找到標籤中仍有分類名稱的食譜')
    }

  } catch (err) {
    console.error('❌ 發生錯誤:', err)
    process.exit(1)
  }
}

findCategoryInTags()

