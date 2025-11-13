/**
 * Supabase 連接測試腳本
 * 執行: node scripts/test-supabase.js
 */

// 讀取 .env 檔案（優先）或 .env.local
const fs = require('fs')
const path = require('path')

function loadEnvFile() {
  const envPath = path.join(process.cwd(), '.env')
  const envLocalPath = path.join(process.cwd(), '.env.local')
  
  let envPathToUse = null
  if (fs.existsSync(envPath)) {
    envPathToUse = envPath
    console.log('✅ 找到 .env 檔案')
  } else if (fs.existsSync(envLocalPath)) {
    envPathToUse = envLocalPath
    console.log('⚠️  使用 .env.local 檔案（建議使用 .env）')
  } else {
    console.error('❌ 找不到 .env 或 .env.local 檔案')
    console.error(`預期路徑: ${envPath}`)
    console.error(`或: ${envLocalPath}`)
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

async function testSupabase() {
  // 載入環境變數
  const envVars = loadEnvFile()
  const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY

  console.log('=== Supabase 連接診斷 ===\n')

  // 檢查環境變數
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ 環境變數未設定！')
    console.error('\n請檢查 .env 檔案：')
    console.error('1. 確保檔案名稱是 .env（不是 .env.local 或 .env.txt）')
    console.error('2. 確保檔案在專案根目錄')
    console.error('3. 確保包含以下變數：')
    console.error('   - NEXT_PUBLIC_SUPABASE_URL')
    console.error('   - NEXT_PUBLIC_SUPABASE_ANON_KEY')
    process.exit(1)
  }

  console.log('✅ 環境變數已找到')
  console.log(`\nURL: ${supabaseUrl}`)
  console.log(`Key: ${supabaseAnonKey.substring(0, 30)}...`)

  // 驗證 URL 格式
  if (!supabaseUrl.startsWith('https://')) {
    console.error('\n❌ URL 格式錯誤！應以 https:// 開頭')
    process.exit(1)
  }

  if (!supabaseUrl.includes('.supabase.co')) {
    console.error('\n❌ URL 格式錯誤！')
    console.error(`目前值: ${supabaseUrl}`)
    console.error('正確格式: https://your-project-id.supabase.co')
    console.error('\n請檢查 Supabase Dashboard > Settings > API')
    process.exit(1)
  }

  // 移除尾隨斜線
  const cleanUrl = supabaseUrl.replace(/\/$/, '')
  if (cleanUrl !== supabaseUrl) {
    console.warn(`\n⚠️  移除 URL 尾隨斜線: ${supabaseUrl} → ${cleanUrl}`)
  }

  // 測試 REST API
  try {
    console.log('\n測試 REST API 連接...')
    const testUrl = `${cleanUrl}/rest/v1/`
    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`,
      },
    })

    if (response.ok) {
      console.log('✅ Supabase 連接成功！')
      console.log('\n接下來請確保：')
      console.log('1. 已執行 supabase/schema.sql 建立資料表')
      console.log('2. RLS 政策已正確設定')
    } else if (response.status === 404) {
      console.error('\n❌ 連接失敗（404 Not Found）')
      console.error('\n可能的原因：')
      console.error('1. Supabase 專案 URL 不正確')
      console.error('2. 專案已被刪除或暫停')
      console.error('3. URL 包含了額外的路徑（不應該有）')
      console.error(`\n測試的 URL: ${testUrl}`)
      console.error('\n請檢查：')
      console.error('- Supabase Dashboard > Settings > API > Project URL')
      process.exit(1)
    } else {
      const text = await response.text()
      if (text.includes('<!DOCTYPE html>')) {
        console.error('\n❌ 收到 HTML 回應（404 頁面）')
        console.error('這表示 URL 不正確，Supabase 返回了錯誤頁面')
        console.error(`\n狀態碼: ${response.status}`)
      } else {
        console.error(`\n❌ 連接失敗（狀態碼: ${response.status}）`)
        console.error('回應:', text.substring(0, 200))
      }
      process.exit(1)
    }
  } catch (error) {
    console.error('\n❌ 連接測試失敗:')
    console.error(error.message)
    console.error('\n請檢查：')
    console.error('1. 網路連接')
    console.error('2. Supabase URL 是否正確')
    process.exit(1)
  }
}

testSupabase()

