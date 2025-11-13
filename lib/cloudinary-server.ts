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

