/**
 * Cloudinary 客戶端圖片上傳函數
 * 可在客戶端組件中使用（僅使用瀏覽器 API）
 */
export const uploadImage = async (file: File, folder: string = 'recipes'): Promise<string> => {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'recipes_preset'

  if (!cloudName) {
    throw new Error('Cloudinary cloud name is not configured')
  }

  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', uploadPreset)
  formData.append('folder', folder)

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    {
      method: 'POST',
      body: formData,
    }
  )

  if (!response.ok) {
    const errorData = await response.text()
    console.error('Cloudinary upload error:', errorData)
    throw new Error('Failed to upload image to Cloudinary')
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


