'use client'

/**
 * 客戶端專用的 PDF 導出功能
 * 此文件只會在瀏覽器中執行，不會在服務器端被解析
 */

import { Recipe } from '@/types/recipe'
import html2pdf from 'html2pdf.js'

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
 * HTML 轉義函數
 */
function escapeHtml(text: string | null | undefined): string {
  if (!text) return ''
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

/**
 * 創建用於 PDF 匯出的 HTML 內容
 */
function createPDFHTML(recipe: Recipe): string {
  const safeTitle = escapeHtml(recipe.title)
  
  // 處理主圖片
  let mainImageHtml = ''
  if (recipe.image_url) {
    mainImageHtml = `
      <div class="recipe-image-section">
        <img src="${recipe.image_url}" alt="${safeTitle}" class="recipe-main-image" />
      </div>
    `
  }
  
  // 處理食材
  let ingredientsHtml = ''
  if (recipe.ingredients && recipe.ingredients.length > 0) {
    const groupedIngredients: { [category: string]: typeof recipe.ingredients } = {}
    recipe.ingredients.forEach((ing) => {
      const category = ing.category || '其他'
      if (!groupedIngredients[category]) {
        groupedIngredients[category] = []
      }
      groupedIngredients[category].push(ing)
    })
    
    ingredientsHtml = '<div class="section"><h2 class="section-title">食材</h2><div class="ingredient-list">'
    Object.keys(groupedIngredients).forEach((category) => {
      if (category !== '其他') {
        ingredientsHtml += `<div class="ingredient-category-title">${escapeHtml(category)}</div>`
      }
      ingredientsHtml += '<div class="ingredient-category">'
      groupedIngredients[category].forEach((ing) => {
        const parts = [ing.amount, ing.unit].filter(Boolean)
        const details = parts.length > 0 ? escapeHtml(parts.join(' ')) : ''
        const note = ing.note ? ` (${escapeHtml(ing.note)})` : ''
        ingredientsHtml += `
          <div class="ingredient-item">
            <span class="ingredient-name">${escapeHtml(ing.name)}</span>
            <span class="ingredient-details">${details}${note}</span>
          </div>
        `
      })
      ingredientsHtml += '</div>'
    })
    ingredientsHtml += '</div></div>'
  }
  
  // 處理步驟
  let stepsHtml = ''
  if (recipe.steps && recipe.steps.length > 0) {
    stepsHtml = '<div class="section"><h2 class="section-title">製作步驟</h2><div class="steps-list">'
    recipe.steps.forEach((step, index) => {
      const safeInstruction = escapeHtml(step.instruction).replace(/\n/g, '<br>')
      const timerHtml = step.timer_minutes 
        ? `<div class="step-timer">⏱️ ${formatTime(step.timer_minutes)}</div>` 
        : ''
      const stepImageHtml = step.image_url
        ? `<div class="step-image-wrapper"><img src="${step.image_url}" alt="步驟 ${index + 1}" class="step-image" /></div>`
        : ''
      stepsHtml += `
        <div class="step-item">
          <div class="step-number">${index + 1}</div>
          <div class="step-content">
            <div class="step-instruction">${safeInstruction}</div>
            ${timerHtml}
            ${stepImageHtml}
          </div>
        </div>
      `
    })
    stepsHtml += '</div></div>'
  }
  
  // 返回只包含 body 內容和樣式的 HTML（用於插入到 div 中）
  const html = `<style>
    .pdf-container {
      font-family: 'Microsoft YaHei', 'PingFang SC', 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.7;
      color: #1a202c;
      font-size: 14px;
      margin: 0;
      padding: 20px;
      background: #ffffff !important;
      background-color: #ffffff !important;
      box-sizing: border-box;
    }
    .pdf-container * {
      box-sizing: border-box;
    }
    .pdf-container .container {
      max-width: 100%;
      margin: 0;
      padding: 0;
      background: #ffffff !important;
      background-color: #ffffff !important;
    }
    .pdf-container .header {
      background: #ffffff !important;
      background-color: #ffffff !important;
      color: #1a202c;
      padding: 0 0 20px 0;
      margin: 0 0 30px 0;
      border-bottom: 2px solid #1a202c;
    }
    .pdf-container .title {
      font-size: 32px;
      font-weight: 700;
      margin: 0;
      letter-spacing: -0.5px;
      color: #1a202c;
    }
    .pdf-container .section {
      margin-bottom: 30px;
      page-break-inside: avoid;
    }
    .pdf-container .section-title {
      font-size: 20px;
      font-weight: 700;
      color: #1a202c;
      margin-bottom: 15px;
      padding-bottom: 8px;
      border-bottom: 1px solid #1a202c;
    }
    .pdf-container .ingredient-list {
      margin: 0;
    }
    .pdf-container .ingredient-category {
      margin-bottom: 15px;
    }
    .pdf-container .ingredient-category-title {
      font-weight: 600;
      font-size: 16px;
      color: #1a202c;
      margin-bottom: 10px;
      margin-top: 10px;
    }
    .pdf-container .ingredient-item {
      padding: 8px 0;
      font-size: 14px;
      border-bottom: 1px solid #e5e7eb;
      overflow: hidden;
    }
    .pdf-container .ingredient-item:last-child {
      border-bottom: none;
    }
    .pdf-container .ingredient-name {
      font-weight: 500;
      color: #1a202c;
      float: left;
    }
    .pdf-container .ingredient-details {
      color: #6b7280;
      float: right;
    }
    .pdf-container .steps-list {
      margin: 0;
    }
    .pdf-container .step-item {
      margin-bottom: 20px;
      padding: 0;
      background: #ffffff !important;
      background-color: #ffffff !important;
      overflow: hidden;
    }
    .pdf-container .step-number {
      font-weight: 700;
      font-size: 18px;
      color: #1a202c;
      width: 30px;
      height: 30px;
      background: #ffffff !important;
      background-color: #ffffff !important;
      border: 2px solid #1a202c;
      border-radius: 50%;
      text-align: center;
      line-height: 26px;
      float: left;
      margin-right: 15px;
    }
    .pdf-container .step-content {
      overflow: hidden;
    }
    .pdf-container .step-instruction {
      font-size: 14px;
      line-height: 1.8;
      color: #1a202c;
      margin-bottom: 5px;
    }
    .pdf-container .step-timer {
      margin-top: 8px;
      font-size: 12px;
      color: #6b7280;
      font-style: italic;
    }
    .pdf-container .recipe-image-section {
      margin-bottom: 30px;
      text-align: center;
    }
    .pdf-container .recipe-main-image {
      max-width: 100%;
      height: auto;
      max-height: 400px;
      object-fit: contain;
      border-radius: 8px;
    }
    .pdf-container .step-image-wrapper {
      margin-top: 12px;
      text-align: center;
    }
    .pdf-container .step-image {
      max-width: 100%;
      height: auto;
      max-height: 300px;
      object-fit: contain;
      border-radius: 6px;
      border: 1px solid #e5e7eb;
    }
  </style>
  <div class="pdf-container">
    <div class="container">
      <div class="header">
        <h1 class="title">${safeTitle}</h1>
      </div>
      ${mainImageHtml}
      ${ingredientsHtml}
      ${stepsHtml}
    </div>
  </div>`
  
  return html
}

/**
 * 匯出食譜為 PDF 檔
 */
export async function exportRecipeToPDF(recipe: Recipe): Promise<void> {
  try {
    // 創建臨時的 HTML 內容
    const htmlContent = createPDFHTML(recipe)
    
    // 創建一個隱藏的 div 來渲染 HTML（比 iframe 更可靠）
    const tempDiv = document.createElement('div')
    tempDiv.style.position = 'absolute'
    tempDiv.style.left = '-9999px'
    tempDiv.style.top = '-9999px'
    tempDiv.style.width = '800px'
    tempDiv.style.backgroundColor = '#ffffff'
    tempDiv.innerHTML = htmlContent
    
    // 將 div 添加到 body
    document.body.appendChild(tempDiv)
    
    // 等待 DOM 渲染和樣式應用
    await new Promise((resolve) => setTimeout(resolve, 500))
    
    // 找到 pdf-container 元素（這是我們要轉換的根元素）
    const pdfContainer = tempDiv.querySelector('.pdf-container') as HTMLElement
    if (!pdfContainer) {
      document.body.removeChild(tempDiv)
      throw new Error('無法找到 PDF 內容容器')
    }
    
    // 檢查是否有實際內容
    const hasContent = pdfContainer.querySelector('.section') || pdfContainer.querySelector('.title')
    if (!hasContent) {
      console.error('PDF 內容為空')
      console.error('HTML 內容:', htmlContent.substring(0, 500))
      console.error('PDF Container HTML:', pdfContainer.innerHTML.substring(0, 500))
      document.body.removeChild(tempDiv)
      throw new Error('PDF 內容為空，請檢查食譜資料')
    }
    
    // 等待圖片載入（如果有）
    const images = pdfContainer.querySelectorAll('img')
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
        windowWidth: pdfContainer.scrollWidth || 800,
        windowHeight: pdfContainer.scrollHeight || 1200,
      },
      jsPDF: { 
        unit: 'mm' as const, 
        format: 'a4' as const, 
        orientation: 'portrait' as const,
      },
    }
    
    // 生成 PDF - 使用 pdf-container 作為目標元素
    await html2pdf().set(opt).from(pdfContainer).save()
    
    // 清理：移除臨時 div
    document.body.removeChild(tempDiv)
  } catch (error) {
    console.error('Error generating PDF:', error)
    alert(`PDF 生成失敗：${error instanceof Error ? error.message : '請稍後再試'}`)
  }
}

