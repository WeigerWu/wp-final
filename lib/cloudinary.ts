/**
 * Cloudinary 客戶端圖片上傳函數
 * 可在客戶端組件中使用（僅使用瀏覽器 API）
 * @param file 圖片檔案（應在上傳前壓縮）
 * @param folder 上傳資料夾
 */
export const uploadImage = async (
  file: File, 
  folder: string = 'recipes'
): Promise<string> => {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'recipes_preset'

  if (!cloudName) {
    throw new Error('Cloudinary cloud name is not configured')
  }

  // 圖片壓縮應該在上傳前處理，這裡只負責上傳
  // 壓縮功能在組件層面處理，避免 SSR 問題

  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', uploadPreset)
  formData.append('folder', folder)

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    {
      method: 'POST',
      body: formData,
      // 不設置超時，讓瀏覽器自己處理，但我們在上層會處理超時
    }
  )

  if (!response.ok) {
    const errorData = await response.text()
    console.error('Cloudinary upload error:', errorData)
    
    // 提供更詳細的錯誤訊息
    let errorMessage = '圖片上傳失敗'
    try {
      const errorJson = JSON.parse(errorData)
      if (errorJson.error) {
        errorMessage = `Cloudinary 錯誤: ${errorJson.error.message || errorJson.error}`
        
        // 常見錯誤的具體提示
        if (errorJson.error.message?.includes('Invalid upload preset')) {
          errorMessage = 'Upload Preset 不存在或設定錯誤，請檢查 Cloudinary Dashboard 設定'
        } else if (errorJson.error.message?.includes('Invalid API Key')) {
          errorMessage = 'Cloud Name 可能不正確，請檢查環境變數設定'
        }
      }
    } catch {
      // 如果不是 JSON，使用原始錯誤訊息
      if (errorData.includes('Invalid upload preset')) {
        errorMessage = 'Upload Preset 不存在或設定錯誤，請檢查 Cloudinary Dashboard 設定'
      } else {
        errorMessage = `上傳失敗: ${errorData.substring(0, 200)}`
      }
    }
    
    throw new Error(errorMessage)
  }

  const data = await response.json()
  return data.secure_url
}

/**
 * Cloudinary 服務器端圖片刪除函數
 * 僅能在服務器端使用
 */
export const deleteImage = async (publicId: string): Promise<void> => {
  // 這個函數需要在服務器端使用
  // 如果需要刪除圖片，應該創建一個 API route
  // 目前先導出一個佔位函數
  console.warn('deleteImage should be called from server-side API route')
  throw new Error('deleteImage must be called from server-side API route')
}


