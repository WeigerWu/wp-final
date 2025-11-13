# 疑難排解指南

## Supabase 連接錯誤

### 錯誤：收到 HTML 回應（404 頁面）

**症狀：**
```
Error fetching recipes: {
  message: `<!DOCTYPE html><html lang="en">...
```

**原因：**
這表示 Supabase URL 設定不正確，Supabase 返回了 404 頁面而不是 API 回應。

**解決步驟：**

#### 1. 檢查環境變數

執行測試腳本：
```bash
npm run test:supabase
```

#### 2. 驗證 Supabase URL 格式

**錯誤的 URL 範例：**
```env
# ❌ 錯誤 - 包含額外路徑
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co/rest/v1
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co/dashboard

# ❌ 錯誤 - 缺少協議
NEXT_PUBLIC_SUPABASE_URL=xxx.supabase.co

# ❌ 錯誤 - 有尾隨斜線（通常可以，但建議移除）
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co/
```

**正確的 URL 格式：**
```env
# ✅ 正確
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
```

#### 3. 如何取得正確的 Supabase URL

1. 前往 [Supabase Dashboard](https://app.supabase.com/)
2. 選擇你的專案
3. 點擊左側選單的 **Settings**（設定）
4. 點擊 **API**
5. 在 **Project URL** 區塊中，複製完整 URL
   - 格式：`https://xxxxxxxxxxxxx.supabase.co`
   - **不要**包含 `/rest/v1` 或其他路徑
   - **不要**複製 Dashboard URL（`https://app.supabase.com/...`）

#### 4. 更新 .env 檔案

```env
# 確保 URL 格式正確
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
```

#### 5. 重新啟動開發伺服器

```bash
# 停止目前的伺服器（Ctrl+C）
# 然後重新啟動
npm run dev
```

### 錯誤：Missing Supabase environment variables

**原因：**
環境變數檔案未正確設定或未載入。

**解決步驟：**

1. **檢查檔案名稱**
   - ✅ 正確：`.env`
   - ❌ 錯誤：`.env.txt` 或 `.env.local.txt`

2. **檢查檔案位置**
   - 檔案應在專案根目錄（與 `package.json` 同一層）

3. **Windows 用戶注意**
   - 確保檔案不是 `.env.txt`
   - 在檔案總管中顯示檔案副檔名來確認

4. **重新載入環境變數**
   ```bash
   # 刪除 .next 資料夾（清除快取）
   rm -rf .next
   # 或 Windows
   rmdir /s .next
   
   # 重新啟動
   npm run dev
   ```

### 錯誤：無法建立資料表

**原因：**
SQL schema 未執行或執行失敗。

**解決步驟：**

1. 前往 Supabase Dashboard
2. 點擊左側選單的 **SQL Editor**
3. 點擊 "New query"
4. 開啟專案中的 `supabase/schema.sql` 檔案
5. 複製整個內容
6. 貼上到 SQL Editor
7. 點擊 "Run" 執行
8. 檢查是否有錯誤訊息

### 錯誤：圖片上傳失敗

**症狀：**
上傳圖片時出現錯誤或圖片不顯示。

**解決步驟：**

1. **檢查 Cloudinary Upload Preset**
   - 確保設定為 **Unsigned** 模式
   - 確認 Preset 名稱與 `.env` 中的 `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` 相同

2. **檢查 Cloudinary API 金鑰**
   - 前往 Cloudinary Dashboard
   - Settings > API Keys
   - 確認 API Key 和 API Secret 正確

3. **檢查環境變數**
   ```env
   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=recipes_preset
   ```

## 常見問題

### Q: 為什麼環境變數沒有生效？

A: Next.js 需要在啟動時載入環境變數。請：
1. 確保檔案名稱為 `.env`
2. 重新啟動開發伺服器
3. 清除 `.next` 快取資料夾

### Q: 如何確認 Supabase 連接正常？

A: 執行測試腳本：
```bash
npm run test:supabase
```

### Q: Supabase URL 應該包含什麼？

A: 只需要專案的基礎 URL：
- ✅ `https://xxx.supabase.co`
- ❌ `https://xxx.supabase.co/rest/v1`
- ❌ `https://app.supabase.com/project/xxx`

### Q: 資料表已建立，但還是出現錯誤？

A: 檢查：
1. RLS 政策是否正確設定
2. 是否執行了完整的 `schema.sql`
3. 用戶是否有正確的權限

## 測試清單

完成以下檢查來確認設定正確：

- [ ] `.env` 檔案存在於專案根目錄
- [ ] 所有必要的環境變數都已設定
- [ ] Supabase URL 格式正確（https://xxx.supabase.co）
- [ ] 執行 `npm run test:supabase` 通過
- [ ] 已執行 `supabase/schema.sql` 建立資料表
- [ ] 可以註冊新用戶（測試 Supabase Auth）
- [ ] 可以上傳圖片（測試 Cloudinary）
- [ ] 可以建立食譜（測試資料庫寫入）

## 獲取幫助

如果以上步驟都無法解決問題：

1. 檢查終端機的完整錯誤訊息
2. 執行 `npm run test:supabase` 並查看輸出
3. 確認 Supabase 專案狀態（Dashboard 中是否正常）
4. 檢查 Supabase 專案的日誌（Dashboard > Logs）

