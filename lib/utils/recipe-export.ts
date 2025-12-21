/**
 * 食譜匯出功能
 * 支援將食譜匯出為文字格式、JSON 格式和 PDF 格式
 */

import { Recipe } from '@/types/recipe'

/**
 * 格式化時間（分鐘）
 */
function formatTime(minutes: number | null | undefined): string {
  if (!minutes) return ''
  if (minutes < 60) return `${minutes} 分鐘`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (mins === 0) return `${hours} 小時`
  return `${hours} 小時 ${mins} 分鐘`
}

/**
 * 格式化難度
 */
function formatDifficulty(difficulty: string | null | undefined): string {
  switch (difficulty) {
    case 'easy':
      return '簡單'
    case 'medium':
      return '中等'
    case 'hard':
      return '困難'
    default:
      return '未設定'
  }
}

/**
 * 將食譜匯出為純文字格式
 */
export function exportRecipeAsText(recipe: Recipe): string {
  let text = '='.repeat(50) + '\n'
  text += `食譜：${recipe.title}\n`
  text += '='.repeat(50) + '\n\n'
  
  // 作者資訊
  if (recipe.user) {
    text += `作者：${recipe.user.username || '未知'}\n`
  }
  
  // 分類
  if (recipe.category) {
    text += `分類：${recipe.category.name}\n`
  }
  
  // 標籤
  if (recipe.tags && recipe.tags.length > 0) {
    text += `標籤：${recipe.tags.join('、')}\n`
  }
  
  text += '\n'
  
  // 描述
  if (recipe.description) {
    text += '─'.repeat(50) + '\n'
    text += '描述\n'
    text += '─'.repeat(50) + '\n'
    text += `${recipe.description}\n\n`
  }
  
  // 基本資訊
  text += '─'.repeat(50) + '\n'
  text += '基本資訊\n'
  text += '─'.repeat(50) + '\n'
  
  if (recipe.servings) {
    text += `份量：${recipe.servings} 人份\n`
  }
  
  if (recipe.prep_time) {
    text += `準備時間：${formatTime(recipe.prep_time)}\n`
  }
  
  if (recipe.cook_time) {
    text += `烹飪時間：${formatTime(recipe.cook_time)}\n`
  }
  
  text += `難度：${formatDifficulty(recipe.difficulty)}\n`
  text += '\n'
  
  // 食材
  if (recipe.ingredients && recipe.ingredients.length > 0) {
    text += '─'.repeat(50) + '\n'
    text += '食材\n'
    text += '─'.repeat(50) + '\n'
    
    // 按分類分組
    const groupedIngredients: { [category: string]: typeof recipe.ingredients } = {}
    
    recipe.ingredients.forEach((ing) => {
      const category = ing.category || '其他'
      if (!groupedIngredients[category]) {
        groupedIngredients[category] = []
      }
      groupedIngredients[category].push(ing)
    })
    
    Object.keys(groupedIngredients).forEach((category) => {
      if (category !== '其他') {
        text += `\n【${category}】\n`
      }
      groupedIngredients[category].forEach((ing) => {
        const parts = [
          ing.name,
          ing.amount,
          ing.unit,
        ].filter(Boolean)
        text += `  • ${parts.join(' ')}`
        if (ing.note) {
          text += `（${ing.note}）`
        }
        text += '\n'
      })
    })
    
    text += '\n'
  }
  
  // 步驟
  if (recipe.steps && recipe.steps.length > 0) {
    text += '─'.repeat(50) + '\n'
    text += '製作步驟\n'
    text += '─'.repeat(50) + '\n\n'
    
    recipe.steps.forEach((step, index) => {
      text += `步驟 ${index + 1}\n`
      if (step.timer_minutes) {
        text += `⏱️ 計時：${formatTime(step.timer_minutes)}\n`
      }
      text += `${step.instruction}\n`
      if (step.image_url) {
        text += `[圖片：${step.image_url}]\n`
      }
      text += '\n'
    })
  }
  
  // 評分資訊
  if (recipe.average_rating) {
    text += '─'.repeat(50) + '\n'
    text += `評分：${recipe.average_rating.toFixed(1)} ⭐（${recipe.rating_count || 0} 則評價）\n`
    text += '─'.repeat(50) + '\n'
  }
  
  // 時間資訊
  text += '\n'
  if (recipe.created_at) {
    const createdAt = new Date(recipe.created_at)
    text += `發布時間：${createdAt.toLocaleString('zh-TW')}\n`
  }
  if (recipe.updated_at) {
    const updatedAt = new Date(recipe.updated_at)
    text += `更新時間：${updatedAt.toLocaleString('zh-TW')}\n`
  }
  
  text += '\n'
  text += '='.repeat(50) + '\n'
  text += `來源：I'm cooked 食譜平台\n`
  text += `匯出時間：${new Date().toLocaleString('zh-TW')}\n`
  text += '='.repeat(50) + '\n'
  
  return text
}

/**
 * 將食譜匯出為 JSON 格式
 */
export function exportRecipeAsJSON(recipe: Recipe): string {
  const exportData = {
    title: recipe.title,
    description: recipe.description,
    author: recipe.user?.username || '未知',
    category: recipe.category?.name || null,
    tags: recipe.tags || [],
    servings: recipe.servings,
    prep_time: recipe.prep_time,
    cook_time: recipe.cook_time,
    difficulty: recipe.difficulty,
    ingredients: recipe.ingredients || [],
    steps: recipe.steps || [],
    image_url: recipe.image_url,
    average_rating: recipe.average_rating,
    rating_count: recipe.rating_count,
    created_at: recipe.created_at,
    updated_at: recipe.updated_at,
    exported_at: new Date().toISOString(),
    source: "I'm cooked 食譜平台",
  }
  
  return JSON.stringify(exportData, null, 2)
}

/**
 * 下載文字檔案
 */
export function downloadTextFile(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * 下載 JSON 檔案
 */
export function downloadJSONFile(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'application/json;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * 匯出食譜為文字檔
 */
export function exportRecipeToTextFile(recipe: Recipe): void {
  const text = exportRecipeAsText(recipe)
  const filename = `${recipe.title.replace(/[^\w\s-]/g, '') || 'recipe'}_${Date.now()}.txt`
  downloadTextFile(text, filename)
}

/**
 * 匯出食譜為 JSON 檔
 */
export function exportRecipeToJSONFile(recipe: Recipe): void {
  const json = exportRecipeAsJSON(recipe)
  const filename = `${recipe.title.replace(/[^\w\s-]/g, '') || 'recipe'}_${Date.now()}.json`
  downloadJSONFile(json, filename)
}

/**
 * 匯出食譜為 PDF 檔
 * 此函數會動態導入客戶端專用的 PDF 導出模組
 */
export async function exportRecipeToPDF(recipe: Recipe): Promise<void> {
  // 確保只在客戶端運行
  if (typeof window === 'undefined') {
    throw new Error('PDF 匯出功能僅支援在瀏覽器中運行')
  }

  // 動態導入客戶端專用的 PDF 導出模組
  const { exportRecipeToPDF: exportPDF } = await import('./recipe-export-pdf.client')
  return exportPDF(recipe)
}

