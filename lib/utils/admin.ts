/**
 * 管理員權限檢查工具
 */

/**
 * 檢查使用者是否為管理員
 * 管理員 ID 列表從環境變數 ADMIN_USER_IDS 取得（逗號分隔）
 */
export function isAdmin(userId: string | null | undefined): boolean {
  if (!userId) return false

  const adminIds = process.env.ADMIN_USER_IDS?.split(',').map((id) => id.trim()) || []
  return adminIds.includes(userId)
}

/**
 * 取得管理員 ID 列表
 */
export function getAdminIds(): string[] {
  return process.env.ADMIN_USER_IDS?.split(',').map((id) => id.trim()) || []
}

