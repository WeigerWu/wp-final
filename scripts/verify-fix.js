/**
 * 驗證修復結果
 * 檢查哪些食譜有分類，哪些沒有
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

async function verifyFix() {
  console.log('=== 驗證修復結果 ===\n')

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
      .select('id, title, category_id, tags')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ 查詢食譜時發生錯誤:', error)
      process.exit(1)
    }

    const recipesWithCategory = recipes.filter(r => r.category_id)
    const recipesWithoutCategory = recipes.filter(r => !r.category_id)

    console.log(`📊 總食譜數: ${recipes.length}`)
    console.log(`✅ 有分類: ${recipesWithCategory.length}`)
    console.log(`❌ 無分類: ${recipesWithoutCategory.length}\n`)

    // 檢查有分類的食譜
    if (recipesWithCategory.length > 0) {
      console.log(`\n✅ 有分類的食譜 (${recipesWithCategory.length}個):`)
      recipesWithCategory.slice(0, 10).forEach((r, i) => {
        console.log(`   ${i + 1}. ${r.title} (ID: ${r.id.substring(0, 8)}...)`)
      })
      if (recipesWithCategory.length > 10) {
        console.log(`   ... 還有 ${recipesWithCategory.length - 10} 個`)
      }
    }

    // 檢查無分類但標籤中有分類名稱的食譜
    const { data: categories } = await supabase
      .from('categories')
      .select('name')

    const categoryNames = new Set(categories.map(c => c.name))

    const recipesWithCategoryInTags = recipesWithoutCategory.filter(r => {
      if (!r.tags || !Array.isArray(r.tags)) return false
      return r.tags.some(tag => 
        typeof tag === 'string' && categoryNames.has(tag.trim())
      )
    })

    if (recipesWithCategoryInTags.length > 0) {
      console.log(`\n⚠️  無分類但標籤中有分類名稱的食譜 (${recipesWithCategoryInTags.length}個):`)
      recipesWithCategoryInTags.slice(0, 10).forEach((r, i) => {
        const categoryTags = r.tags.filter(tag => 
          typeof tag === 'string' && categoryNames.has(tag.trim())
        )
        console.log(`   ${i + 1}. ${r.title}`)
        console.log(`      標籤中的分類: ${categoryTags.join(', ')}`)
      })
      if (recipesWithCategoryInTags.length > 10) {
        console.log(`   ... 還有 ${recipesWithCategoryInTags.length - 10} 個`)
      }
    }

    // 檢查一些無分類的食譜
    console.log(`\n❌ 無分類的食譜範例 (前10個):`)
    recipesWithoutCategory.slice(0, 10).forEach((r, i) => {
      const tags = r.tags && Array.isArray(r.tags) ? r.tags.slice(0, 3).join(', ') : '無標籤'
      console.log(`   ${i + 1}. ${r.title}`)
      console.log(`      標籤: ${tags}${r.tags && r.tags.length > 3 ? '...' : ''}`)
    })

  } catch (err) {
    console.error('❌ 發生錯誤:', err)
    process.exit(1)
  }
}

verifyFix()

