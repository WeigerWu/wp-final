/**
 * Cloudinary 服務器端工具
 * 僅能在服務器端使用（Server Actions, API Routes 等）
 */

import { v2 as cloudinary } from 'cloudinary'

// 只在服務器端配置
if (typeof window === 'undefined') {
  cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  })
}

export default cloudinary

/**
 * 服務器端刪除圖片
 */
export const deleteImageServer = async (publicId: string): Promise<void> => {
  if (typeof window !== 'undefined') {
    throw new Error('deleteImageServer can only be called from server-side')
  }

  try {
    await cloudinary.uploader.destroy(publicId)
  } catch (error) {
    console.error('Error deleting image from Cloudinary:', error)
    throw error
  }
}

/**
 * 從 URL 下載圖片並上傳到 Cloudinary
 * @param imageUrl 圖片 URL
 * @param folder 上傳資料夾（預設 'recipes'）
 * @returns Cloudinary 圖片 URL
 */
export const uploadImageFromUrl = async (
  imageUrl: string,
  folder: string = 'recipes'
): Promise<string> => {
  if (typeof window !== 'undefined') {
    throw new Error('uploadImageFromUrl can only be called from server-side')
  }

  if (!imageUrl) {
    throw new Error('Image URL is required')
  }

  try {
    // 下載圖片
    const response = await fetch(imageUrl)
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.status} ${response.statusText}`)
    }

    // 將圖片轉換為 buffer
    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // 上傳到 Cloudinary
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: folder,
          resource_type: 'image',
        },
        (error, result) => {
          if (error) {
            reject(new Error(`Cloudinary upload failed: ${error.message}`))
          } else if (result) {
            resolve(result.secure_url)
          } else {
            reject(new Error('Cloudinary upload returned no result'))
          }
        }
      )

      uploadStream.end(buffer)
    })
  } catch (error) {
    console.error('Error uploading image from URL:', error)
    throw error
  }
}

