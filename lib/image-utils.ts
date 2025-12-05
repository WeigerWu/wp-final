/**
 * 圖片處理工具函數
 * 用於壓縮和優化圖片
 */

/**
 * 壓縮圖片
 * @param file 原始圖片檔案
 * @param maxWidth 最大寬度（預設 1200px）
 * @param maxHeight 最大高度（預設 1200px）
 * @param quality 圖片質量 0-1（預設 0.8）
 * @returns 壓縮後的 Blob
 */
export async function compressImage(
  file: File,
  maxWidth: number = 1200,
  maxHeight: number = 1200,
  quality: number = 0.8
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      const img = new Image()
      
      img.onload = () => {
        // 計算新尺寸
        let width = img.width
        let height = img.height
        
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height)
          width = Math.floor(width * ratio)
          height = Math.floor(height * ratio)
        }
        
        // 創建 canvas
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('無法創建 canvas context'))
          return
        }
        
        // 繪製圖片
        ctx.drawImage(img, 0, 0, width, height)
        
        // 轉換為 Blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob)
            } else {
              reject(new Error('圖片壓縮失敗'))
            }
          },
          file.type || 'image/jpeg',
          quality
        )
      }
      
      img.onerror = () => {
        reject(new Error('圖片載入失敗'))
      }
      
      img.src = e.target?.result as string
    }
    
    reader.onerror = () => {
      reject(new Error('檔案讀取失敗'))
    }
    
    reader.readAsDataURL(file)
  })
}

/**
 * 檢查圖片是否需要壓縮
 * @param file 圖片檔案
 * @returns 是否需要壓縮
 */
export function shouldCompressImage(file: File): boolean {
  // 如果檔案小於 500KB，不需要壓縮
  if (file.size < 500 * 1024) {
    return false
  }
  
  // 如果是 PNG 或 JPEG，需要壓縮
  return file.type === 'image/png' || file.type === 'image/jpeg' || file.type === 'image/jpg'
}

/**
 * 智能壓縮圖片（只在需要時壓縮）
 * @param file 原始圖片檔案
 * @returns 壓縮後的 File 物件
 */
export async function smartCompressImage(file: File): Promise<File> {
  // 如果不需要壓縮，直接返回原檔案
  if (!shouldCompressImage(file)) {
    return file
  }
  
  try {
    // 壓縮圖片
    const compressedBlob = await compressImage(file)
    
    // 創建新的 File 物件
    const compressedFile = new File(
      [compressedBlob],
      file.name,
      {
        type: file.type || 'image/jpeg',
        lastModified: Date.now(),
      }
    )
    
    console.log(`圖片壓縮: ${(file.size / 1024 / 1024).toFixed(2)}MB -> ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`)
    
    return compressedFile
  } catch (error) {
    console.warn('圖片壓縮失敗，使用原檔案:', error)
    return file
  }
}













