/**
 * Supabase 連接測試工具
 * 用於診斷 Supabase 環境變數設定問題
 */

export async function testSupabaseConnection() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  console.log('=== Supabase 連接測試 ===\n')

  // 檢查環境變數是否存在
  if (!supabaseUrl) {
    console.error('❌ NEXT_PUBLIC_SUPABASE_URL 未設定')
    return false
  }

  if (!supabaseAnonKey) {
    console.error('❌ NEXT_PUBLIC_SUPABASE_ANON_KEY 未設定')
    return false
  }

  console.log('✅ 環境變數已設定')
  console.log(`   URL: ${supabaseUrl}`)
  console.log(`   Key: ${supabaseAnonKey.substring(0, 20)}...`)

  // 檢查 URL 格式
  if (!supabaseUrl.startsWith('https://')) {
    console.error('❌ URL 格式錯誤！應以 https:// 開頭')
    return false
  }

  if (!supabaseUrl.includes('.supabase.co')) {
    console.error('❌ URL 格式錯誤！應包含 .supabase.co')
    console.error(`   目前值: ${supabaseUrl}`)
    console.error('   正確格式: https://your-project-id.supabase.co')
    return false
  }

  // 移除可能的尾隨斜線
  if (supabaseUrl.endsWith('/')) {
    console.warn('⚠️  URL 結尾不應有斜線，已自動修正')
  }

  console.log('✅ URL 格式正確')

  // 測試連接
  try {
    const testUrl = `${supabaseUrl.replace(/\/$/, '')}/rest/v1/`
    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`,
      },
    })

    if (response.ok) {
      console.log('✅ Supabase 連接成功！')
      return true
    } else if (response.status === 404) {
      console.error('❌ Supabase 連接失敗（404）')
      console.error('   可能的原因：')
      console.error('   1. Supabase 專案 URL 不正確')
      console.error('   2. Supabase 專案已被刪除或暫停')
      console.error('   3. URL 包含了錯誤的路徑')
      console.error(`   測試 URL: ${testUrl}`)
      return false
    } else {
      console.error(`❌ Supabase 連接失敗（狀態碼: ${response.status}）`)
      const text = await response.text()
      if (text.includes('<!DOCTYPE html>')) {
        console.error('   收到 HTML 回應，這表示 URL 不正確')
      }
      return false
    }
  } catch (error: any) {
    console.error('❌ 連接測試失敗:', error.message)
    return false
  }
}

