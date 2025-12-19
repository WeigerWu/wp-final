'use client'

import { createSupabaseClient } from '@/lib/supabase/client'

/**
 * 檢查當前用戶是否關注了指定用戶（客戶端版本）
 */
export async function isFollowingClient(followingId: string): Promise<boolean> {
  const supabase = createSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return false
  }

  const { data, error } = await supabase
    .from('follows')
    .select('id')
    .eq('follower_id', user.id)
    .eq('following_id', followingId)
    .single()

  if (error || !data) {
    return false
  }

  return true
}


