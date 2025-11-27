/**
 * Cloudinary 連接測試腳本
 * 檢查環境變數和連接狀態
 */

const fs = require('fs')
const path = require('path')

// 讀取 .env 檔案
function loadEnvFile() {
  const envPath = path.join(process.cwd(), '.env')
  const envLocalPath = path.join(process.cwd(), '.env.local')

  let envPathToUse = null
  if (fs.existsSync(envPath)) {
    envPathToUse = envPath
    console.log('✅ 找到 .env 檔案')
  } else if (fs.existsSync(envLocalPath)) {
    envPathToUse = envLocalPath
    console.log('⚠️  使用 .env.local 檔案（建議使用 .env）')
  } else {
    console.error('❌ 找不到 .env 或 .env.local 檔案')
    console.error(`預期路徑: ${envPath}`)
    console.error(`或: ${envLocalPath}`)
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

async function testCloudinary() {
  console.log('=== Cloudinary 連接診斷 ===\n')

  // 載入環境變數
  const envVars = loadEnvFile()
  const cloudName = envVars.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  const uploadPreset = envVars.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'recipes_preset'
  const apiKey = envVars.CLOUDINARY_API_KEY
  const apiSecret = envVars.CLOUDINARY_API_SECRET

  // 檢查環境變數
  console.log('📋 環境變數檢查:')
  console.log(`   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: ${cloudName ? '✓ 已設定' : '✗ 未設定'}`)
  console.log(`   NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET: ${uploadPreset ? `✓ ${uploadPreset}` : '✗ 未設定（使用預設值）'}`)
  console.log(`   CLOUDINARY_API_KEY: ${apiKey ? '✓ 已設定' : '✗ 未設定（僅客戶端上傳不需要）'}`)
  console.log(`   CLOUDINARY_API_SECRET: ${apiSecret ? '✓ 已設定' : '✗ 未設定（僅客戶端上傳不需要）'}`)
  console.log()

  if (!cloudName) {
    console.error('❌ Cloudinary Cloud Name 未設定！')
    console.error('\n請在 .env 檔案中添加:')
    console.error('   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name')
    process.exit(1)
  }

  // 測試 Cloudinary URL
  const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`
  console.log(`🔗 Cloudinary API URL: ${cloudinaryUrl}`)
  console.log()

  // 測試連接到 Cloudinary
  console.log('🔍 測試 Cloudinary 連接...')
  try {
    // 測試基本連接（使用一個簡單的測試請求）
    const testUrl = `https://res.cloudinary.com/${cloudName}/image/upload/test`
    
    const response = await fetch(testUrl, {
      method: 'HEAD',
      signal: AbortSignal.timeout(5000), // 5秒超時
    }).catch(() => null)

    if (response) {
      console.log('✅ Cloudinary 域名可以訪問')
    } else {
      console.log('⚠️  無法連接到 Cloudinary 域名（可能是網路問題）')
    }
  } catch (error) {
    console.log('⚠️  連接測試失敗（可能是網路問題）')
  }

  console.log()
  console.log('📝 配置說明:')
  console.log('   1. 客戶端上傳只需要: NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME')
  console.log('   2. Upload Preset 需要在 Cloudinary Dashboard 中設定為 "Unsigned"')
  console.log('   3. 確保 Upload Preset 名稱與環境變數中的名稱一致')
  console.log()

  // 檢查 Upload Preset 配置
  console.log('💡 建議檢查項目:')
  console.log(`   1. Cloud Name: ${cloudName}`)
  console.log(`   2. Upload Preset: ${uploadPreset}`)
  console.log('   3. 在 Cloudinary Dashboard 中確認:')
  console.log('      - Settings > Upload > Upload presets')
  console.log('      - 找到或創建名為 "' + uploadPreset + '" 的 Upload Preset')
  console.log('      - 確保該 Preset 設定為 "Unsigned"（允許未簽名上傳）')
  console.log()

  // 測試上傳功能（如果有 API key 和 secret）
  if (apiKey && apiSecret) {
    console.log('⚠️  檢測到 API Key 和 Secret')
    console.log('   如果需要服務器端上傳，可以使用這些憑證')
    console.log('   客戶端上傳只需要 Cloud Name 和 Upload Preset')
    console.log()
  }

  console.log('✅ 環境變數檢查完成！')
  console.log('\n如果上傳仍然失敗，請檢查:')
  console.log('   1. Cloud Name 是否正確')
  console.log('   2. Upload Preset 是否存在且設定為 Unsigned')
  console.log('   3. 網路連接是否正常')
  console.log('   4. Cloudinary 帳戶是否正常')
}

testCloudinary().catch((error) => {
  console.error('❌ 測試失敗:', error.message)
  process.exit(1)
})

