# 步驟圖片上傳功能說明

## 功能概述

每個步驟現在都可以上傳一張圖片，幫助用戶更清楚地理解每個步驟的操作。

## 資料庫結構

**不需要修改資料庫！** 現有的資料庫結構已經支持步驟圖片：

### `recipes` 表的 `steps` 欄位

- **類型**: JSONB
- **預設值**: `'[]'::jsonb`
- **結構**: 每個步驟物件包含以下欄位：
  ```json
  {
    "step_number": 1,
    "instruction": "將雞胸肉切成適口大小",
    "image_url": "https://res.cloudinary.com/.../step-image.jpg",  // 可選
    "timer_minutes": 10  // 可選
  }
  ```

### 現有結構支援

資料庫的 `steps` JSONB 欄位已經完全支持 `image_url` 欄位，因此：
- ✅ **無需執行任何 SQL 遷移**
- ✅ **無需修改資料庫結構**
- ✅ **向後兼容**：沒有圖片的步驟仍然正常運作

## 功能特點

### 1. 圖片上傳
- 每個步驟都有獨立的圖片上傳區域
- 支持常見圖片格式（jpg, png, gif, webp 等）
- 自動壓縮圖片以減少上傳時間和儲存空間
- 上傳前可以預覽圖片

### 2. 圖片管理
- 可以隨時更換步驟圖片
- 可以移除步驟圖片
- 刪除步驟時，對應的圖片也會被清理

### 3. 上傳流程
發布食譜時，所有步驟圖片會：
1. 自動壓縮（使用 `smartCompressImage`）
2. 上傳到 Cloudinary（路徑：`recipes/steps`）
3. 獲取圖片 URL 並儲存到資料庫

## 使用方式

### 在表單中添加步驟圖片

1. 在「步驟列表」區域中，找到要添加圖片的步驟
2. 點擊「步驟圖片（選填）」區域
3. 選擇圖片文件
4. 預覽圖片，確認無誤
5. 如需更換或移除，點擊對應按鈕

### 技術實現細節

#### 狀態管理
```typescript
// 每個步驟對應一個文件和預覽
const [stepImageFiles, setStepImageFiles] = useState<{ [index: number]: File | null }>({})
const [stepImagePreviews, setStepImagePreviews] = useState<{ [index: number]: string | null }>({})
```

#### 上傳邏輯
- 圖片會在表單提交時批量上傳
- 上傳進度會在進度條中顯示
- 如果某個步驟圖片上傳失敗，會保留原有的 `image_url`（如果有的話）

#### 圖片儲存
- 上傳到 Cloudinary 的 `recipes/steps` 路徑
- URL 儲存在步驟物件的 `image_url` 欄位中

## 顯示步驟圖片

在顯示食譜步驟時，可以從步驟物件中讀取 `image_url`：

```typescript
steps.map((step, index) => (
  <div key={index}>
    <h3>步驟 {step.step_number}</h3>
    <p>{step.instruction}</p>
    {step.image_url && (
      <img src={step.image_url} alt={`步驟 ${step.step_number}`} />
    )}
  </div>
))
```

## 注意事項

1. **圖片大小限制**：建議單張圖片不超過 5MB
2. **圖片格式**：支援常見的圖片格式
3. **網路連線**：上傳多張圖片時需要穩定的網路連線
4. **上傳時間**：步驟圖片會在封面圖片之後上傳，需要一些時間

## 故障排除

### 圖片上傳失敗
- 檢查網路連線
- 確認圖片格式正確
- 檢查 Cloudinary 配置是否正確
- 查看瀏覽器控制台的錯誤訊息

### 圖片顯示不出來
- 檢查步驟物件中是否有 `image_url` 欄位
- 確認圖片 URL 是否有效
- 檢查 Cloudinary 的 CORS 設定

## 未來改進

- [ ] 支援拖放上傳
- [ ] 圖片編輯功能（裁剪、旋轉）
- [ ] 支援多張圖片（輪播）
- [ ] 圖片標註功能









