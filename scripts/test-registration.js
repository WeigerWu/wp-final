/**
 * 測試 Supabase 註冊功能的診斷腳本
 * 運行: node scripts/test-registration.js
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// 載入環境變數
function loadEnvFile() {
  const envPath = path.join(process.cwd(), '.env')
  const envLocalPath = path.join(process.cwd(), '.env.local')
  
  let envPathToUse = null
  if (fs.existsSync(envPath)) {
    envPathToUse = envPath
    console.log('✅ 找到 .env 檔案')
  } else if (fs.existsSync(envLocalPath)) {
    envPathToUse = envLocalPath
    console.log('⚠️  使用 .env.local 檔案')
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

async function testRegistration() {
  console.log('\n=== Supabase 註冊功能診斷 ===\n')

  const envVars = loadEnvFile()
  const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ 環境變數未設定')
    return
  }

  console.log(`✅ URL: ${supabaseUrl}`)
  console.log(`✅ Key: ${supabaseKey.substring(0, 20)}...\n`)

  try {
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })

    // 1. 測試基本連接
    console.log('1. 測試基本連接...')
    const { data: healthCheck, error: healthError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)

    if (healthError && healthError.code !== 'PGRST116') {
      console.error(`❌ 連接失敗: ${healthError.message}`)
      return
    }
    console.log('✅ 連接成功\n')

    // 2. 檢查 Auth API
    console.log('2. 檢查 Auth API...')
    try {
      // 嘗試訪問 auth 端點
      const authResponse = await fetch(`${supabaseUrl}/auth/v1/health`, {
        headers: {
          'apikey': supabaseKey,
        },
      })
      
      if (authResponse.ok) {
        console.log('✅ Auth API 可訪問\n')
      } else {
        console.warn(`⚠️  Auth API 響應異常: ${authResponse.status}\n`)
      }
    } catch (err) {
      console.error(`❌ Auth API 測試失敗: ${err.message}\n`)
    }

    // 3. 檢查 profiles 表
    console.log('3. 檢查 profiles 表...')
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, username, created_at')
      .limit(5)

    if (profilesError) {
      console.error(`❌ 無法查詢 profiles: ${profilesError.message}`)
      console.error(`   錯誤代碼: ${profilesError.code}`)
      if (profilesError.code === '42P01') {
        console.error('   → profiles 表不存在，請執行 supabase/schema.sql')
      }
      console.log()
    } else {
      console.log(`✅ profiles 表存在，目前有 ${profiles?.length || 0} 筆記錄`)
      if (profiles && profiles.length > 0) {
        console.log('   最近的 profiles:')
        profiles.forEach((p, i) => {
          console.log(`   ${i + 1}. ${p.username} (${p.id.substring(0, 8)}...) - ${p.created_at}`)
        })
      }
      console.log()
    }

    // 4. 檢查觸發器設置（需要 Service Role Key）
    console.log('4. 檢查觸發器設置...')
    const serviceKey = envVars.SUPABASE_SERVICE_ROLE_KEY
    if (serviceKey) {
      const adminClient = createClient(supabaseUrl, serviceKey)
      try {
        // 檢查觸發器
        const { data: triggers, error: triggerError } = await adminClient.rpc('exec_sql', {
          sql: `
            SELECT trigger_name, event_object_table
            FROM information_schema.triggers
            WHERE event_object_table = 'users'
            AND trigger_schema = 'auth'
            AND trigger_name = 'on_auth_user_created';
          `
        })
        
        if (!triggerError && triggers && triggers.length > 0) {
          console.log('✅ 觸發器存在')
        } else {
          console.warn('⚠️  無法檢查觸發器（或觸發器不存在）')
          console.warn('   請在 Supabase Dashboard > SQL Editor 執行以下 SQL 檢查:')
          console.warn('   SELECT trigger_name FROM information_schema.triggers')
          console.warn('   WHERE event_object_table = \'users\' AND trigger_schema = \'auth\';')
        }
      } catch (err) {
        console.warn('⚠️  無法檢查觸發器（需要 Service Role Key）')
      }
    } else {
      console.warn('⚠️  未找到 SUPABASE_SERVICE_ROLE_KEY，無法檢查觸發器')
      console.warn('   請在 Supabase Dashboard > SQL Editor 手動檢查觸發器:')
      console.warn('   SELECT trigger_name FROM information_schema.triggers')
      console.warn('   WHERE event_object_table = \'users\' AND trigger_schema = \'auth\';')
    }
    console.log()

    // 5. 檢查 Email 確認設置（無法直接檢查，提供指南）
    console.log('5. Email 確認設置...')
    console.log('   ⚠️  無法自動檢查，請在 Supabase Dashboard 確認:')
    console.log('   1. 前往 Authentication > Providers > Email')
    console.log('   2. 檢查 "Confirm email" 設定')
    console.log('   3. 如果啟用，新用戶需要點擊確認郵件才能登入')
    console.log('   4. 測試期間可以暫時關閉確認要求')
    console.log()

    // 6. 測試註冊 API（使用測試帳號）
    console.log('6. 測試註冊 API...')
    const testEmail = `test_${Date.now()}@example.com`
    const testPassword = 'TestPassword123!'
    const testUsername = `testuser_${Date.now()}`
    
    console.log(`   使用測試帳號: ${testEmail}`)
    
    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          username: testUsername,
        },
        emailRedirectTo: `${supabaseUrl.replace('.supabase.co', '')}/auth/callback`,
      },
    })

    if (signupError) {
      console.error(`❌ 註冊失敗: ${signupError.message}`)
      console.error(`   錯誤代碼: ${signupError.status}`)
      
      if (signupError.message.includes('User already registered')) {
        console.error('   → 用戶已存在，這是正常的（可能之前測試過）')
      } else if (signupError.message.includes('Invalid login credentials')) {
        console.error('   → 憑證錯誤，可能是 API Key 設定錯誤')
      } else if (signupError.message.includes('fetch')) {
        console.error('   → 網路連接失敗，檢查 URL 和網路連接')
      }
    } else {
      console.log('✅ 註冊 API 調用成功')
      if (signupData.user) {
        console.log(`   用戶 ID: ${signupData.user.id}`)
        console.log(`   Email: ${signupData.user.email}`)
        console.log(`   Username: ${signupData.user.user_metadata?.username}`)
        
        // 等待一下再檢查 profile
        console.log('\n   等待 1 秒後檢查 profile...')
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        const { data: newProfile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', signupData.user.id)
          .single()
        
        if (profileError) {
          console.error(`   ❌ Profile 未自動創建: ${profileError.message}`)
          console.error('   → 觸發器可能沒有執行，需要手動檢查觸發器設置')
        } else {
          console.log(`   ✅ Profile 已自動創建`)
          console.log(`      Username: ${newProfile.username}`)
        }
        
        // 清理測試用戶（可選）
        console.log('\n   ℹ️  測試用戶已創建，可在 Supabase Dashboard 中手動刪除')
      } else {
        console.warn('   ⚠️  註冊成功但沒有返回用戶數據')
        console.warn('   → 可能需要 Email 確認')
      }
    }

    console.log('\n=== 診斷完成 ===\n')
    console.log('建議檢查項目:')
    console.log('1. 確認觸發器存在: handle_new_user 函數和 on_auth_user_created 觸發器')
    console.log('2. 確認 Email 確認設置（如需測試可暫時關閉）')
    console.log('3. 重新啟動開發伺服器確保環境變數生效: npm run dev')
    console.log('4. 檢查瀏覽器控制台是否有錯誤訊息')
    console.log()

  } catch (error) {
    console.error('❌ 發生錯誤:', error.message)
    console.error(error)
  }
}

testRegistration()

