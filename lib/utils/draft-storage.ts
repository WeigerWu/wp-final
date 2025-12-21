/**
 * 草稿自動儲存功能
 * 使用 localStorage 保存食譜表單的草稿狀態
 */

const DRAFT_STORAGE_KEY = 'recipe_draft'

export interface RecipeDraft {
  // 基本資訊
  title: string
  description: string
  servings: string
  prepTime: string
  cookTime: string
  difficulty: 'easy' | 'medium' | 'hard' | ''
  categoryId: string
  
  // 圖片預覽（base64）
  imagePreview: string | null
  
  // 食材
  ingredients: Array<{
    name: string
    amount: string
    unit: string
    note: string
    category: string
  }>
  
  // 步驟
  steps: Array<{
    instruction: string
    image_url?: string
    timer_minutes?: number
  }>
  
  // 步驟圖片預覽
  stepImagePreviews: { [index: number]: string | null }
  
  // 標籤
  tags: string[]
  
  // 自定義食材分類
  customCategories: string[]
  
  // 時間戳
  savedAt: string
}

/**
 * 儲存草稿到 localStorage
 */
export function saveDraft(draft: Omit<RecipeDraft, 'savedAt'>): void {
  try {
    const draftWithTimestamp: RecipeDraft = {
      ...draft,
      savedAt: new Date().toISOString(),
    }
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draftWithTimestamp))
  } catch (error) {
    console.error('Error saving draft:', error)
    // localStorage 可能已滿或不可用，忽略錯誤
  }
}

/**
 * 從 localStorage 載入草稿
 */
export function loadDraft(): RecipeDraft | null {
  try {
    const draftJson = localStorage.getItem(DRAFT_STORAGE_KEY)
    if (!draftJson) {
      return null
    }
    
    const draft = JSON.parse(draftJson) as RecipeDraft
    return draft
  } catch (error) {
    console.error('Error loading draft:', error)
    return null
  }
}

/**
 * 清除草稿
 */
export function clearDraft(): void {
  try {
    localStorage.removeItem(DRAFT_STORAGE_KEY)
  } catch (error) {
    console.error('Error clearing draft:', error)
  }
}

/**
 * 檢查是否有草稿
 */
export function hasDraft(): boolean {
  try {
    return localStorage.getItem(DRAFT_STORAGE_KEY) !== null
  } catch (error) {
    return false
  }
}

/**
 * 獲取草稿保存時間
 */
export function getDraftSavedTime(): Date | null {
  const draft = loadDraft()
  if (!draft || !draft.savedAt) {
    return null
  }
  
  try {
    return new Date(draft.savedAt)
  } catch (error) {
    return null
  }
}



