/**
 * Cloudinary 上傳功能測試腳本
 * 測試實際的圖片上傳功能
 */

const fs = require('fs')
const path = require('path')
const https = require('https')
const http = require('http')

// 讀取環境變數
function loadEnvFile() {
  const envPath = path.join(process.cwd(), '.env')
  const envLocalPath = path.join(process.cwd(), '.env.local')

  let envPathToUse = null
  if (fs.existsSync(envPath)) {
    envPathToUse = envPath
  } else if (fs.existsSync(envLocalPath)) {
    envPathToUse = envLocalPath
  } else {
    console.error('❌ 找不到 .env 或 .env.local 檔案')
    process.exit(1)
  }

  const envContent = fs.readFileSync(envPathToUse, 'utf8')
  const envVars = {}

  envContent.split('\n').forEach(line => {
    const trimmed = line.trim()
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=')
      if (key && valueParts.length > 0) {
        envVars[key.trim()] = valueParts.join('=').trim().replace(/^["']|["']$/g, '')
      }
    }
  })

  return envVars
}

async function testUpload() {
  console.log('=== Cloudinary 上傳功能測試 ===\n')

  const envVars = loadEnvFile()
  const cloudName = envVars.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  const uploadPreset = envVars.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'recipes_preset'

  if (!cloudName) {
    console.error('❌ NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME 未設定')
    process.exit(1)
  }

  console.log(`Cloud Name: ${cloudName}`)
  console.log(`Upload Preset: ${uploadPreset}`)
  console.log()

  // 創建一個簡單的測試圖片（1x1 像素的 PNG）
  const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
  const testImageBuffer = Buffer.from(testImageBase64, 'base64')

  console.log('📤 開始上傳測試圖片...')

  const formData = new FormData()
  formData.append('file', new Blob([testImageBuffer], { type: 'image/png' }), 'test.png')
  formData.append('upload_preset', uploadPreset)
  formData.append('folder', 'test')

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    )

    const responseText = await response.text()

    if (!response.ok) {
      console.error('❌ 上傳失敗!')
      console.error(`狀態碼: ${response.status}`)
      console.error(`回應: ${responseText}`)
      
      // 常見錯誤提示
      if (responseText.includes('Invalid upload preset')) {
        console.error('\n💡 錯誤原因: Upload Preset 不存在或設定錯誤')
        console.error('   請在 Cloudinary Dashboard 中:')
        console.error('   1. 前往 Settings > Upload > Upload presets')
        console.error(`   2. 創建名為 "${uploadPreset}" 的 Upload Preset`)
        console.error('   3. 設定為 "Unsigned"（允許未簽名上傳）')
      } else if (responseText.includes('Invalid API Key')) {
        console.error('\n💡 錯誤原因: Cloud Name 可能不正確')
      }
      
      process.exit(1)
    }

    const data = JSON.parse(responseText)
    console.log('✅ 上傳成功!')
    console.log(`   圖片 URL: ${data.secure_url}`)
    console.log(`   Public ID: ${data.public_id}`)
    console.log(`   檔案大小: ${data.bytes} bytes`)
    console.log()
    console.log('🎉 Cloudinary 連接和上傳功能正常！')
    return true
  } catch (error) {
    console.error('❌ 上傳過程發生錯誤:', error.message)
    console.error('\n可能的原因:')
    console.error('   1. 網路連接問題')
    console.error('   2. Cloudinary 服務暫時不可用')
    console.error('   3. Upload Preset 設定錯誤')
    process.exit(1)
  }
}

// 在 Node.js 環境中使用 node-fetch 或原生 fetch
if (typeof fetch === 'undefined') {
  // Node.js 18+ 應該有 fetch
  console.log('⚠️  需要 Node.js 18+ 才能執行此測試')
  console.log('   或者可以使用瀏覽器控制台測試')
  process.exit(1)
}

testUpload()













