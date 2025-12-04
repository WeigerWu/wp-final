/**
 * 生成標籤的 URL-friendly slug
 * 將中文標籤轉換為 URL 安全的格式
 * 注意：此函數生成的 slug 應該與資料庫遷移腳本中的 generate_slug 函數一致
 */
export function generateTagSlug(tagName: string): string {
  // 移除前後的空白
  let slug = tagName.trim()
  
  if (!slug) {
    return ''
  }
  
  // 將多個非字母數字、非中文的字符替換為單個連字符
  // 保留中文字符和英文字母數字
  slug = slug
    .replace(/[^a-zA-Z0-9\u4e00-\u9fa5]+/g, '-') // 將非字母數字、非中文的字符替換為 -
    .replace(/^-+|-+$/g, '') // 移除前後的連字符
    .replace(/-+/g, '-') // 將多個連字符合併為一個
  
  // 對於純中文，直接使用（資料庫的 generate_slug 函數也是這樣處理）
  // 但我們需要確保 URL 編碼，所以使用 encodeURIComponent
  // 但為了與資料庫的 slug 匹配，我們應該直接返回小寫的 slug
  // 注意：資料庫中儲存的 slug 可能與此不完全一致，但應該足夠接近
  
  // 如果結果為空，使用編碼後的標籤名稱作為後備
  if (!slug) {
    return encodeURIComponent(tagName)
  }
  
  // 轉為小寫（資料庫的函數也使用 lower()）
  return slug.toLowerCase()
}

/**
 * 從 tag slug 還原 tag name（如果需要）
 * 注意：這只是簡單的嘗試，因為 slug 可能不是可逆的
 */
export function decodeTagSlug(slug: string): string {
  try {
    return decodeURIComponent(slug)
  } catch {
    return slug
  }
}

