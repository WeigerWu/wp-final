# 生產模式問題診斷指南

## 問題症狀

- `npm run dev` 正常運作
- `npm run build && npm start` 無法載入用戶資料和條件篩選

## 診斷步驟

### 1. 檢查瀏覽器控制台

打開瀏覽器開發者工具（F12），查看 Console 標籤是否有錯誤：

```javascript
// 在瀏覽器控制台中執行以下命令來檢查環境變數
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '存在' : '不存在')
```

**注意**：在生產構建中，`process.env` 在客戶端是不可用的。環境變數應該已經被嵌入到代碼中了。

### 2. 檢查 Network 請求

1. 打開 Network 標籤
2. 過濾 `supabase.co` 的請求
3. 檢查是否有 401/403/404 錯誤

### 3. 測試 Supabase 連接

在瀏覽器控制台執行：

```javascript
// 測試 Supabase 連接
fetch('https://rraovbcxuphhvdqhhscd.supabase.co/rest/v1/', {
  headers: {
    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJyYW92YmN4dXBoaHZkcWhoc2NkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMwMDUxNzUsImV4cCI6MjA3ODU4MTE3NX0.9xjrH-xvtd7k1fVjIHjd0d7uGAOm62Od4Yam0--a96Y'
  }
}).then(r => console.log('Supabase 連接:', r.ok ? '成功' : '失敗', r.status))
```

## 關於 Vercel 部署

### 環境變數設置

在 Vercel 上部署時，需要在 Vercel 儀表板中設置環境變數：

1. 前往 Vercel 專案設置
2. 進入 "Environment Variables"
3. 添加以下變數：
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - 其他需要的環境變數

### 構建時環境變數

Vercel 會在構建時自動讀取環境變數並嵌入到客戶端代碼中，所以：
- ✅ 本地修復的代碼可以正常部署到 Vercel
- ✅ 只要在 Vercel 設置了正確的環境變數，就會正常工作

### 本地生產模式測試

如果要在本地測試生產模式，確保：

1. `.env` 文件存在且包含所有必要的變數
2. 在構建前確認環境變數可訪問：
   ```bash
   # 檢查環境變數
   grep NEXT_PUBLIC_SUPABASE .env
   
   # 構建
   npm run build
   
   # 啟動
   npm start
   ```

## 可能的解決方案

### 方案 1：檢查 RLS 政策

如果 Supabase 連接成功但無法讀取數據，可能是 RLS（Row Level Security）政策的問題。

### 方案 2：檢查 CORS 設置

確保 Supabase 允許來自生產域名的請求。

### 方案 3：檢查客戶端代碼執行時機

確保 Supabase 客戶端只在客戶端初始化（已在 Navbar 中修復）。

## 測試命令

```bash
# 1. 清除構建緩存
rm -rf .next

# 2. 確認環境變數
cat .env | grep NEXT_PUBLIC_SUPABASE

# 3. 重新構建
npm run build

# 4. 啟動生產服務器
npm start

# 5. 在瀏覽器中打開 http://localhost:3000
# 6. 打開開發者工具檢查 Console 和 Network
```


