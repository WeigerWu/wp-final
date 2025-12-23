import { createBrowserClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { Database } from './types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// 檢查環境變數（僅在模組載入時檢查）
if (typeof window === 'undefined') {
  // 服務器端檢查
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('⚠️ Missing Supabase environment variables:')
    console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗')
    console.error('   NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✓' : '✗')
    throw new Error(
      'Missing Supabase environment variables. Please check your .env file.'
    )
  }
}

// 客戶端單例實例（避免創建多個 GoTrueClient 實例）
let supabaseClient: ReturnType<typeof createBrowserClient<Database>> | null = null

export const createSupabaseClient = () => {
  // 客戶端：使用單例模式，避免創建多個實例
  if (typeof window !== 'undefined') {
    if (supabaseClient) {
      return supabaseClient
    }

    const clientUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const clientKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!clientUrl || !clientKey) {
      console.error('⚠️ Supabase environment variables not found in client:')
      console.error('   NEXT_PUBLIC_SUPABASE_URL:', clientUrl ? '✓' : '✗')
      console.error('   NEXT_PUBLIC_SUPABASE_ANON_KEY:', clientKey ? '✓' : '✗')
      console.error('   請確保 .env 檔案存在且環境變數正確設定')
      console.error('   重新啟動開發伺服器: npm run dev')
      throw new Error('Supabase environment variables not configured')
    }

    // 使用 @supabase/ssr 的 createBrowserClient 來避免多個實例問題
    supabaseClient = createBrowserClient<Database>(clientUrl, clientKey)

    return supabaseClient
  }

  // 服務器端：使用服務器端客戶端
  // 這個函數主要在客戶端使用，服務器端應該使用 createServerSupabaseClient
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Supabase client initialization failed. Please check your .env file and restart the development server.'
    )
  }

  // 服務器端不應該使用這個函數，但為了向後兼容保留
  // 只在開發環境輸出警告
  if (process.env.NODE_ENV === 'development') {
    console.warn('createSupabaseClient called on server side, use createServerSupabaseClient instead')
  }
  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey)
}

// For server-side usage
export const createSupabaseServerClient = () => {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
