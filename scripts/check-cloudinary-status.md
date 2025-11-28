# Cloudinary 連接狀態檢查

## ✅ 基本連接測試結果

根據 `test-cloudinary.js` 的測試結果：

- ✅ **環境變數已設定**
  - Cloud Name: `dhongywqw`
  - Upload Preset: `recipes_preset`
  
- ✅ **Cloudinary 域名可以訪問**
  - API URL: `https://api.cloudinary.com/v1_1/dhongywqw/image/upload`

## ⚠️ 需要確認的事項

### 1. Upload Preset 設定

請在 Cloudinary Dashboard 中確認：

1. 登入 Cloudinary Dashboard: https://console.cloudinary.com/
2. 前往 **Settings > Upload > Upload presets**
3. 檢查是否有名為 `recipes_preset` 的 Upload Preset
4. 如果沒有，請創建一個：
   - 點擊 "Add upload preset"
   - 名稱設為 `recipes_preset`
   - **重要：將 "Signing mode" 設定為 "Unsigned"**（允許未簽名上傳）
   - 設定 Folder: `recipes`（可選）
   - 保存

### 2. 測試上傳功能

#### 方法 1: 在瀏覽器控制台測試

1. 打開開發者工具（F12）
2. 在 Console 中執行以下代碼：

```javascript
// 創建一個簡單的測試圖片
const canvas = document.createElement('canvas')
canvas.width = 1
canvas.height = 1
const ctx = canvas.getContext('2d')
ctx.fillStyle = '#FF0000'
ctx.fillRect(0, 0, 1, 1)

canvas.toBlob(async (blob) => {
  const file = new File([blob], 'test.png', { type: 'image/png' })
  
  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', 'recipes_preset')
  formData.append('folder', 'test')
  
  try {
    const response = await fetch(
      'https://api.cloudinary.com/v1_1/dhongywqw/image/upload',
      {
        method: 'POST',
        body: formData,
      }
    )
    
    if (response.ok) {
      const data = await response.json()
      console.log('✅ 上傳成功!', data.secure_url)
    } else {
      const error = await response.text()
      console.error('❌ 上傳失敗:', error)
    }
  } catch (error) {
    console.error('❌ 錯誤:', error)
  }
})
```

#### 方法 2: 在實際頁面測試

1. 訪問 `/recipes/new` 頁面
2. 嘗試上傳一張圖片
3. 打開瀏覽器開發者工具的 Network 標籤
4. 查看上傳請求的狀態和回應

## 🔍 常見問題排查

### 問題 1: "Invalid upload preset"

**解決方案：**
- 確認 Upload Preset 名稱完全匹配（區分大小寫）
- 確認 Upload Preset 設定為 "Unsigned"
- 在 Cloudinary Dashboard 中檢查 Preset 是否存在

### 問題 2: 上傳很慢

**可能原因：**
- 圖片檔案太大
- 網路連接慢
- Cloudinary 服務響應慢

**解決方案：**
- 壓縮圖片後再上傳
- 檢查網路連接
- 檢查瀏覽器 Network 標籤中的請求時間

### 問題 3: CORS 錯誤

**解決方案：**
- Cloudinary 應該已經允許跨域請求
- 如果仍有問題，檢查瀏覽器控制台的錯誤訊息

## 📝 下一步

1. 確認 Upload Preset 設定正確
2. 在瀏覽器控制台測試上傳功能
3. 如果測試成功，問題可能在應用程式的其他地方
4. 如果測試失敗，根據錯誤訊息調整設定


