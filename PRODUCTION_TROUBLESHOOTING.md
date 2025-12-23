# 生產環境問題排查指南

## 問題症狀

在生產環境（`npm run build && npm start`）中出現：
1. 條件篩選跑不出來
2. 右上角的用戶沒有變成用戶名稱和頭貼
3. 最下面的載入更多點下去跑很久跑不出來

但在開發環境（`npm run dev`）中這些問題都不會出現。

## 可能原因

### 1. 環境變數未正確設置

在生產環境中，Next.js 需要在構建時將 `NEXT_PUBLIC_*` 環境變數注入到客戶端代碼中。

**檢查步驟：**

1. 確認 `.env` 文件存在且包含：
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   ```

2. 在生產環境中，環境變數必須在構建時可用：
   ```bash
   # 確保環境變數已設置
   echo $NEXT_PUBLIC_SUPABASE_URL
   echo $NEXT_PUBLIC_SUPABASE_ANON_KEY
   
   # 重新構建
   npm run build
   ```

3. 檢查構建後的代碼是否包含環境變數：
   - 打開瀏覽器開發者工具
   - 查看 Console 是否有 Supabase 相關錯誤
   - 查看 Network 標籤，檢查 API 請求是否成功

### 2. Supabase 客戶端初始化失敗

**檢查步驟：**

1. 打開瀏覽器開發者工具的 Console
2. 查看是否有以下日誌：
   - `✅ Supabase client initialized successfully` - 表示初始化成功
   - `❌ Failed to initialize Supabase client` - 表示初始化失敗
   - `⚠️ Supabase environment variables not found` - 表示環境變數缺失

3. 如果看到錯誤，檢查：
   - 環境變數是否正確
   - Supabase URL 格式是否正確（應該是 `https://xxx.supabase.co`，不包含路徑）

### 3. API 請求失敗

**檢查步驟：**

1. 打開瀏覽器開發者工具的 Network 標籤
2. 過濾 `supabase.co` 的請求
3. 檢查請求狀態：
   - 200 OK - 正常
   - 401/403 - 認證問題
   - 404 - URL 錯誤
   - 500 - 服務器錯誤
   - 網絡錯誤 - 連接問題

### 4. 調試日誌

已添加的調試日誌：

- `[FilterBar] Fetching filter data...` - 開始獲取篩選數據
- `[FilterBar] Filter data fetched` - 篩選數據獲取成功
- `[LoadMoreRecipes] Loading more recipes...` - 開始載入更多食譜
- `[LoadMoreRecipes] Loaded recipes` - 食譜載入成功
- `[getRecipesClient] Fetching recipes` - 開始獲取食譜
- `[getRecipesClient] Found recipes` - 食譜獲取成功

## 解決方案

### 方案 1：確保環境變數正確設置

```bash
# 1. 檢查 .env 文件
cat .env | grep NEXT_PUBLIC_SUPABASE

# 2. 確保環境變數格式正確
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# 3. 清除構建緩存並重新構建
rm -rf .next
npm run build
npm start
```

### 方案 2：檢查 Supabase 配置

1. 前往 Supabase Dashboard
2. 檢查 API 設置：
   - Project URL 是否正確
   - Anon key 是否正確
   - RLS 政策是否允許匿名訪問（如果需要）

### 方案 3：檢查網絡連接

1. 確認 Supabase 服務正常運行
2. 檢查防火牆或代理設置
3. 確認 CORS 設置正確

### 方案 4：使用瀏覽器控制台調試

1. 打開瀏覽器開發者工具（F12）
2. 切換到 Console 標籤
3. 查看錯誤訊息和調試日誌
4. 切換到 Network 標籤
5. 檢查 API 請求的狀態和響應

## 常見錯誤訊息

### "Supabase environment variables not configured"

**原因：** 環境變數未正確設置或未在構建時注入

**解決：**
1. 確認 `.env` 文件存在
2. 確認環境變數名稱正確（`NEXT_PUBLIC_*`）
3. 重新構建應用

### "Failed to fetch" 或網絡錯誤

**原因：** 無法連接到 Supabase

**解決：**
1. 檢查 Supabase URL 是否正確
2. 檢查網絡連接
3. 檢查 Supabase 服務狀態

### 401 Unauthorized

**原因：** API Key 錯誤或 RLS 政策限制

**解決：**
1. 檢查 Anon key 是否正確
2. 檢查 RLS 政策設置

## 測試步驟

1. **構建應用：**
   ```bash
   npm run build
   ```

2. **啟動生產服務器：**
   ```bash
   npm start
   ```

3. **打開瀏覽器：**
   - 訪問 `http://localhost:3000`
   - 打開開發者工具（F12）
   - 查看 Console 和 Network 標籤

4. **測試功能：**
   - 嘗試登入
   - 查看條件篩選是否載入
   - 點擊載入更多按鈕
   - 檢查 Console 中的調試日誌

5. **檢查日誌：**
   - 應該看到 `✅ Supabase client initialized successfully`
   - 應該看到 `[FilterBar] Filter data fetched`
   - 應該看到 `[LoadMoreRecipes] Loaded recipes`

## 如果問題仍然存在

請提供以下信息：
1. 瀏覽器 Console 的完整錯誤訊息
2. Network 標籤中失敗的請求詳情
3. 環境變數設置（隱藏敏感信息）
4. Supabase Dashboard 中的 API 設置截圖（隱藏敏感信息）



