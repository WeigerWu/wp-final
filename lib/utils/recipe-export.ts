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
 * 創建用於 PDF 匯出的 HTML 內容
 */
function createPDFHTML(recipe: Recipe): string {
  const safeTitle = recipe.title.replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const safeDescription = (recipe.description || '').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  
  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        @page {
          margin: 15mm;
        }
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        html {
          background: #ffffff !important;
        }
        body {
          font-family: 'Microsoft YaHei', 'PingFang SC', 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.7;
          color: #1a202c;
          background: #ffffff !important;
          background-color: #ffffff !important;
          font-size: 14px;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 100%;
          margin: 0;
          padding: 0;
          background: #ffffff !important;
          background-color: #ffffff !important;
        }
        .header {
          background: #ffffff !important;
          background-color: #ffffff !important;
          color: #1a202c;
          padding: 0 0 20px 0;
          margin: 0 0 30px 0;
          border-bottom: 2px solid #1a202c;
        }
        .title {
          font-size: 32px;
          font-weight: 700;
          margin: 0;
          letter-spacing: -0.5px;
        }
        .section {
          margin-bottom: 30px;
          page-break-inside: avoid;
        }
        .section-title {
          font-size: 20px;
          font-weight: 700;
          color: #1a202c;
          margin-bottom: 15px;
          padding-bottom: 8px;
          border-bottom: 1px solid #1a202c;
        }
        .ingredient-list {
          margin: 0;
        }
        .ingredient-category {
          margin-bottom: 15px;
        }
        .ingredient-category-title {
          font-weight: 600;
          font-size: 16px;
          color: #1a202c;
          margin-bottom: 10px;
        }
        .ingredient-item {
          padding: 8px 0;
          font-size: 14px;
          display: flex;
          justify-content: space-between;
          border-bottom: 1px solid #e5e7eb;
        }
        .ingredient-item:last-child {
          border-bottom: none;
        }
        .ingredient-name {
          font-weight: 500;
          color: #1a202c;
        }
        .ingredient-details {
          color: #6b7280;
          margin-left: 15px;
        }
        .steps-list {
          margin: 0;
        }
        .step-item {
          margin-bottom: 20px;
          padding: 0;
          display: flex;
          gap: 15px;
          background: #ffffff !important;
          background-color: #ffffff !important;
        }
        .step-number {
          font-weight: 700;
          font-size: 18px;
          color: #1a202c;
          min-width: 30px;
          height: 30px;
          background: #ffffff !important;
          background-color: #ffffff !important;
          border: 2px solid #1a202c;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .step-content {
          flex: 1;
        }
        .step-instruction {
          font-size: 14px;
          line-height: 1.8;
          color: #1a202c;
        }
        .step-timer {
          margin-top: 8px;
          font-size: 12px;
          color: #6b7280;
          font-style: italic;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 class="title">${safeTitle}</h1>
        </div>
        
        ${recipe.ingredients && recipe.ingredients.length > 0 ? `
          <div class="section">
            <h2 class="section-title">食材</h2>
            <div class="ingredient-list">
              ${(() => {
                const groupedIngredients: { [category: string]: typeof recipe.ingredients } = {}
                recipe.ingredients.forEach((ing) => {
                  const category = ing.category || '其他'
                  if (!groupedIngredients[category]) {
                    groupedIngredients[category] = []
                  }
                  groupedIngredients[category].push(ing)
                })
                
                let ingredientsHtml = ''
                Object.keys(groupedIngredients).forEach((category) => {
                  if (category !== '其他') {
                    ingredientsHtml += `<div class="ingredient-category-title">${category}</div>`
                  }
                  ingredientsHtml += `<div class="ingredient-category">`
                  groupedIngredients[category].forEach((ing) => {
                    const parts = [ing.amount, ing.unit].filter(Boolean)
                    const details = parts.length > 0 ? parts.join(' ') : ''
                    const note = ing.note ? ` (${ing.note})` : ''
                    ingredientsHtml += `
                      <div class="ingredient-item">
                        <span class="ingredient-name">${ing.name}</span>
                        <span class="ingredient-details">${details}${note}</span>
                      </div>
                    `
                  })
                  ingredientsHtml += `</div>`
                })
                return ingredientsHtml
              })()}
            </div>
          </div>
        ` : ''}
        
        ${recipe.steps && recipe.steps.length > 0 ? `
          <div class="section">
            <h2 class="section-title">製作步驟</h2>
            <div class="steps-list">
              ${recipe.steps.map((step, index) => {
                const safeInstruction = step.instruction.replace(/</g, '&lt;').replace(/>/g, '&gt;')
                return `
                  <div class="step-item">
                    <div class="step-number">${index + 1}</div>
                    <div class="step-content">
                      <div class="step-instruction">${safeInstruction.replace(/\n/g, '<br>')}</div>
                      ${step.timer_minutes ? `<div class="step-timer">⏱️ ${formatTime(step.timer_minutes)}</div>` : ''}
                    </div>
                  </div>
                `
              }).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    </body>
    </html>
  `
  
  return html
}

/**
 * 匯出食譜為 PDF 檔
 */
export async function exportRecipeToPDF(recipe: Recipe): Promise<void> {
  try {
    // 動態導入 html2pdf.js（因為它是客戶端庫）
    const html2pdf = (await import('html2pdf.js')).default
    
    // 創建臨時的 HTML 內容
    const htmlContent = createPDFHTML(recipe)
    
    // 創建一個隱藏的 iframe 來渲染 HTML（避免樣式衝突且不需要彈出視窗）
    const iframe = document.createElement('iframe')
    iframe.style.position = 'absolute'
    iframe.style.width = '800px'
    iframe.style.height = '1200px'
    iframe.style.top = '-9999px'
    iframe.style.left = '-9999px'
    document.body.appendChild(iframe)
    
    // 寫入 HTML 內容到 iframe
    const iframeDoc = iframe.contentDocument || (iframe.contentWindow as Window).document
    iframeDoc.open()
    iframeDoc.write(htmlContent)
    iframeDoc.close()
    
    // 確保 iframe 背景為白色
    if (iframeDoc.body) {
      iframeDoc.body.style.backgroundColor = '#ffffff'
      iframeDoc.body.style.background = '#ffffff'
    }
    if (iframeDoc.documentElement) {
      iframeDoc.documentElement.style.backgroundColor = '#ffffff'
      iframeDoc.documentElement.style.background = '#ffffff'
    }
    
    // 等待 iframe 內容載入
    await new Promise<void>((resolve) => {
      if (iframe.contentWindow) {
        iframe.contentWindow.onload = () => resolve()
      }
      // 超時保護
      setTimeout(() => resolve(), 2000)
    })
    
    // 額外等待確保 DOM 已渲染
    await new Promise((resolve) => setTimeout(resolve, 300))
    
    // 等待圖片載入
    const images = iframeDoc.querySelectorAll('img')
    if (images.length > 0) {
      await Promise.all(
        Array.from(images).map((img) => {
          if ((img as HTMLImageElement).complete) return Promise.resolve()
          return new Promise<void>((resolve) => {
            (img as HTMLImageElement).onload = () => resolve()
            ;(img as HTMLImageElement).onerror = () => resolve()
            setTimeout(() => resolve(), 5000)
          })
        })
      )
      // 圖片載入後再等待一下
      await new Promise((resolve) => setTimeout(resolve, 300))
    }
    
    const filename = `${recipe.title.replace(/[^\w\s-]/g, '') || 'recipe'}_${Date.now()}.pdf`
    
    // 配置 PDF 選項
    const opt = {
      margin: [10, 10, 10, 10] as [number, number, number, number],
      filename: filename,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { 
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: iframeDoc.documentElement.scrollWidth || 800,
        windowHeight: iframeDoc.documentElement.scrollHeight || 1200,
      },
      jsPDF: { 
        unit: 'mm' as const, 
        format: 'a4' as const, 
        orientation: 'portrait' as const,
      },
    }
    
    // 確保 body 有內容
    const body = iframeDoc.body
    if (!body || body.children.length === 0) {
      throw new Error('無法讀取 HTML 內容，請重試')
    }
    
    // 生成 PDF
    await html2pdf().set(opt).from(body).save()
    
    // 清理：移除 iframe
    document.body.removeChild(iframe)
  } catch (error) {
    console.error('Error generating PDF:', error)
    alert(`PDF 生成失敗：${error instanceof Error ? error.message : '請稍後再試'}`)
  }
}

