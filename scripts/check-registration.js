/**
 * 檢查 Supabase 註冊問題的診斷腳本
 * 運行: node scripts/check-registration.js
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
    console.log('⚠️  使用 .env.local 檔案（建議使用 .env）')
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

async function checkRegistration() {
  console.log('\n=== Supabase 註冊問題診斷 ===\n')

  const envVars = loadEnvFile()
  const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // 檢查 URL 格式
  console.log('1. 檢查 URL 格式...')
  if (!supabaseUrl) {
    console.error('❌ NEXT_PUBLIC_SUPABASE_URL 未設定')
    return
  }

  if (supabaseUrl.includes('supabase.com/dashboard')) {
    console.error('❌ URL 格式錯誤！')
    console.error(`   目前值: ${supabaseUrl}`)
    console.error('   正確格式應該是: https://your-project-id.supabase.co')
    console.error('\n   如何獲取正確的 URL:')
    console.error('   1. 前往 Supabase Dashboard')
    console.error('   2. 點擊 Settings > API')
    console.error('   3. 複製 Project URL（格式為 https://xxx.supabase.co）')
    return
  }

  if (!supabaseUrl.match(/^https:\/\/.*\.supabase\.co$/)) {
    console.warn('⚠️  URL 格式可能不正確')
    console.warn(`   目前值: ${supabaseUrl}`)
    console.warn('   預期格式: https://your-project-id.supabase.co')
  } else {
    console.log(`✅ URL 格式正確: ${supabaseUrl}`)
  }

  // 檢查 API Key
  console.log('\n2. 檢查 API Key...')
  if (!supabaseKey) {
    console.error('❌ NEXT_PUBLIC_SUPABASE_ANON_KEY 未設定')
    return
  }
  console.log(`✅ API Key 已設定: ${supabaseKey.substring(0, 20)}...`)

  // 連接到 Supabase
  console.log('\n3. 連接到 Supabase...')
  try {
    const supabase = createClient(supabaseUrl, supabaseKey)

    // 檢查連接
    const { data: healthCheck, error: healthError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)

    if (healthError && healthError.code !== 'PGRST116') {
      console.error('❌ 無法連接到 Supabase')
      console.error(`   錯誤: ${healthError.message}`)
      if (healthError.message.includes('Invalid API key')) {
        console.error('\n   可能原因: API Key 錯誤')
        console.error('   解決方法: 檢查 .env 中的 NEXT_PUBLIC_SUPABASE_ANON_KEY')
      }
      return
    }

    console.log('✅ 成功連接到 Supabase')

    // 檢查用戶數量
    console.log('\n4. 檢查註冊的用戶...')
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers()

    if (usersError) {
      console.warn('⚠️  無法檢查用戶列表（可能需要 Service Role Key）')
      console.warn('   請在 Supabase Dashboard > Authentication > Users 中手動檢查')
    } else {
      console.log(`   找到 ${users.length} 個用戶`)
      if (users.length > 0) {
        console.log('\n   用戶列表:')
        users.forEach((user, index) => {
          console.log(`   ${index + 1}. ${user.email} (ID: ${user.id.substring(0, 8)}...)`)
          if (user.user_metadata?.username) {
            console.log(`      Username: ${user.user_metadata.username}`)
          }
        })
      }
    }

    // 檢查 Profiles
    console.log('\n5. 檢查 Profiles...')
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, username')

    if (profilesError) {
      console.error(`❌ 無法查詢 profiles: ${profilesError.message}`)
    } else {
      console.log(`   找到 ${profiles?.length || 0} 個 profiles`)
      if (profiles && profiles.length > 0) {
        console.log('\n   Profiles 列表:')
        profiles.forEach((profile, index) => {
          console.log(`   ${index + 1}. ${profile.username} (ID: ${profile.id.substring(0, 8)}...)`)
        })
      }
    }

    // 檢查是否有用戶但沒有 profile
    if (users && profiles) {
      const userIds = new Set(users.map(u => u.id))
      const profileIds = new Set(profiles.map(p => p.id))
      const missingProfiles = users.filter(u => !profileIds.has(u.id))

      if (missingProfiles.length > 0) {
        console.log('\n⚠️  發現問題: 有用戶但沒有對應的 profile')
        console.log(`   缺少 profile 的用戶數量: ${missingProfiles.length}`)
        console.log('\n   解決方法: 在 Supabase Dashboard > SQL Editor 執行以下 SQL:')
        console.log('\n   INSERT INTO public.profiles (id, username, display_name)')
        console.log('   SELECT')
        console.log('       id,')
        console.log('       COALESCE(raw_user_meta_data->>\'username\', \'user_\' || substr(id::text, 1, 8)),')
        console.log('       COALESCE(raw_user_meta_data->>\'username\', \'user_\' || substr(id::text, 1, 8))')
        console.log('   FROM auth.users')
        console.log('   WHERE id NOT IN (SELECT id FROM public.profiles);')
      } else {
        console.log('\n✅ 所有用戶都有對應的 profile')
      }
    }

    // 檢查觸發器
    console.log('\n6. 檢查觸發器設置...')
    console.log('   （需要在 Supabase Dashboard > SQL Editor 中手動檢查）')
    console.log('\n   執行以下 SQL 檢查觸發器:')
    console.log('\n   SELECT trigger_name, event_object_table')
    console.log('   FROM information_schema.triggers')
    console.log('   WHERE event_object_table = \'users\'')
    console.log('   AND trigger_schema = \'auth\';')
    console.log('\n   檢查函數:')
    console.log('\n   SELECT routine_name')
    console.log('   FROM information_schema.routines')
    console.log('   WHERE routine_schema = \'public\'')
    console.log('   AND routine_name = \'handle_new_user\';')

    console.log('\n=== 診斷完成 ===\n')
  } catch (error) {
    console.error('❌ 發生錯誤:', error.message)
    console.error(error)
  }
}

checkRegistration()

