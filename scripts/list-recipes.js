/**
 * 查詢資料庫中的所有食譜
 * 執行: node scripts/list-recipes.js
 */

// 讀取 .env 檔案
const fs = require('fs')
const path = require('path')

function loadEnvFile() {
  const envPath = path.join(process.cwd(), '.env')
  const envLocalPath = path.join(process.cwd(), '.env.local')
  
  let envPathToUse = null
  if (fs.existsSync(envPath)) {
    envPathToUse = envPath
  } else if (fs.existsSync(envLocalPath)) {
    envPathToUse = envLocalPath
  } else {
    console.error('❌ 找不到 .env 或 .env.local 檔案')
    process.exit(1)
  }

  const envContent = fs.readFileSync(envPathToUse, 'utf8')
  const envVars = {}
  
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim()
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=')
      if (key && valueParts.length > 0) {
        envVars[key.trim()] = valueParts.join('=').trim().replace(/^["']|["']$/g, '')
      }
    }
  })

  return envVars
}

async function listRecipes() {
  // 載入環境變數
  const envVars = loadEnvFile()
  const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ 環境變數未設定！')
    console.error('請檢查 .env 檔案中的 NEXT_PUBLIC_SUPABASE_URL 和 NEXT_PUBLIC_SUPABASE_ANON_KEY')
    process.exit(1)
  }

  const cleanUrl = supabaseUrl.replace(/\/$/, '')

  console.log('=== 查詢資料庫中的食譜 ===\n')

  try {
    // 查詢所有食譜
    const response = await fetch(`${cleanUrl}/rest/v1/recipes?select=*&order=created_at.desc`, {
      method: 'GET',
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ 查詢失敗:')
      console.error(`狀態碼: ${response.status}`)
      console.error('錯誤訊息:', errorText)
      
      if (response.status === 401) {
        console.error('\n提示: 可能是 RLS (Row Level Security) 政策限制')
        console.error('建議: 使用 Service Role Key 或檢查 RLS 政策設定')
      }
      process.exit(1)
    }

    const recipes = await response.json()

    if (recipes.length === 0) {
      console.log('📭 資料庫中目前沒有任何食譜')
      console.log('\n提示: 您可以透過以下方式新增食譜：')
      console.log('1. 在應用程式中使用「新增食譜」功能')
      console.log('2. 直接使用 Supabase Dashboard 的 SQL Editor')
      return
    }

    console.log(`✅ 找到 ${recipes.length} 個食譜\n`)
    console.log('='.repeat(80))

    // 顯示每個食譜的詳細資訊
    recipes.forEach((recipe, index) => {
      console.log(`\n📝 食譜 #${index + 1}`)
      console.log('-'.repeat(80))
      console.log(`ID: ${recipe.id}`)
      console.log(`標題: ${recipe.title || '(無標題)'}`)
      console.log(`描述: ${recipe.description ? recipe.description.substring(0, 100) + '...' : '(無描述)'}`)
      console.log(`狀態: ${recipe.status || 'published'}`)
      console.log(`公開: ${recipe.is_public ? '是' : '否'}`)
      console.log(`難度: ${recipe.difficulty || '(未設定)'}`)
      console.log(`份量: ${recipe.servings || '(未設定)'} 人份`)
      console.log(`準備時間: ${recipe.prep_time || 0} 分鐘`)
      console.log(`烹飪時間: ${recipe.cook_time || 0} 分鐘`)
      console.log(`瀏覽次數: ${recipe.view_count || 0}`)
      console.log(`收藏數: ${recipe.favorite_count || 0}`)
      console.log(`評分數: ${recipe.rating_count || 0}`)
      console.log(`平均評分: ${recipe.average_rating || 0}`)
      console.log(`留言數: ${recipe.comment_count || 0}`)
      console.log(`建立時間: ${recipe.created_at ? new Date(recipe.created_at).toLocaleString('zh-TW') : '(未知)'}`)
      console.log(`更新時間: ${recipe.updated_at ? new Date(recipe.updated_at).toLocaleString('zh-TW') : '(未知)'}`)
      
      if (recipe.image_url) {
        console.log(`圖片: ${recipe.image_url}`)
      }

      // 顯示食材數量
      try {
        const ingredients = Array.isArray(recipe.ingredients) ? recipe.ingredients : JSON.parse(recipe.ingredients || '[]')
        console.log(`食材數量: ${ingredients.length} 項`)
      } catch (e) {
        console.log(`食材: (無法解析)`)
      }

      // 顯示步驟數量
      try {
        const steps = Array.isArray(recipe.steps) ? recipe.steps : JSON.parse(recipe.steps || '[]')
        console.log(`步驟數量: ${steps.length} 步`)
      } catch (e) {
        console.log(`步驟: (無法解析)`)
      }

      console.log(`作者 ID: ${recipe.user_id}`)
    })

    console.log('\n' + '='.repeat(80))
    console.log(`\n總計: ${recipes.length} 個食譜`)

    // 統計資訊
    const publishedCount = recipes.filter(r => r.status === 'published').length
    const draftCount = recipes.filter(r => r.status === 'draft').length
    const archivedCount = recipes.filter(r => r.status === 'archived').length
    const publicCount = recipes.filter(r => r.is_public === true).length

    console.log('\n📊 統計資訊:')
    console.log(`  - 已發布: ${publishedCount}`)
    console.log(`  - 草稿: ${draftCount}`)
    console.log(`  - 已封存: ${archivedCount}`)
    console.log(`  - 公開: ${publicCount}`)
    console.log(`  - 非公開: ${recipes.length - publicCount}`)

  } catch (error) {
    console.error('\n❌ 查詢過程中發生錯誤:')
    console.error(error.message)
    process.exit(1)
  }
}

listRecipes()


