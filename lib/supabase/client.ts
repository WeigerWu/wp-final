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

export const createSupabaseClient = () => {
  // 客戶端檢查
  if (typeof window !== 'undefined') {
    const clientUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const clientKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!clientUrl || !clientKey) {
      console.error('⚠️ Supabase environment variables not found in client:')
      console.error('   NEXT_PUBLIC_SUPABASE_URL:', clientUrl ? '✓' : '✗')
      console.error('   NEXT_PUBLIC_SUPABASE_ANON_KEY:', clientKey ? '✓' : '✗')
      console.error('   請確保 .env 檔案存在且環境變數正確設定')
      console.error('   重新啟動開發伺服器: npm run dev')
    }
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Supabase client initialization failed. Please check your .env file and restart the development server.'
    )
  }

  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  })
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
