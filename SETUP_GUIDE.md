# 專案設定指南

## 快速開始

### 1. 安裝依賴

```bash
npm install
```

### 2. 設定 Supabase

1. 前往 [Supabase Dashboard](https://app.supabase.com/)
2. 建立新專案
3. 在專案設定中找到 API 設定
4. 複製 `URL` 和 `anon key`
5. 在 SQL Editor 中執行 `supabase/schema.sql` 來建立資料表

### 3. 設定 Cloudinary

1. 前往 [Cloudinary Dashboard](https://cloudinary.com/)
2. 註冊或登入帳號
3. 在 Dashboard 中找到 Cloud Name、API Key 和 API Secret
4. 在 Settings > Upload > Upload presets 中建立一個新的 Upload Preset
   - 設定為 "Unsigned" 模式
   - 設定名稱（例如：`recipes_preset`）

### 4. 設定環境變數

建立 `.env` 檔案：

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=recipes_preset

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 5. 啟動開發伺服器

```bash
npm run dev
```

開啟 [http://localhost:3000](http://localhost:3000) 查看結果。

## 功能說明

### 已實作功能

- ✅ 使用者認證（登入、註冊）
- ✅ 食譜 CRUD（建立、讀取、更新、刪除）
- ✅ 圖片上傳（Cloudinary 整合）
- ✅ 評價系統（1-5 星評分）
- ✅ 收藏功能
- ✅ 留言系統
- ✅ 烹飪模式（逐步指導）
- ✅ 搜尋功能
- ✅ 標籤系統
- ✅ 個人資料頁面
- ✅ 響應式設計

### 資料庫結構

- **profiles** - 用戶資料
- **recipes** - 食譜
- **recipe_ratings** - 食譜評分
- **recipe_favorites** - 食譜收藏
- **comments** - 留言

### 頁面結構

- `/` - 首頁（最新食譜）
- `/recipes` - 食譜列表（含搜尋和篩選）
- `/recipes/[id]` - 食譜詳情頁
- `/recipes/new` - 建立新食譜
- `/recipes/[id]/edit` - 編輯食譜
- `/recipes/search` - 搜尋頁面
- `/auth/login` - 登入頁面
- `/auth/signup` - 註冊頁面
- `/profile` - 個人資料頁面

## 部署到 Vercel

1. 將專案推送到 GitHub
2. 在 Vercel 中匯入專案
3. 設定環境變數（與 `.env` 相同）
4. 部署

## 疑難排解

### 環境變數錯誤

如果看到 "Missing Supabase environment variables" 錯誤，請檢查：
- `.env` 檔案是否存在
- 環境變數是否正確設定
- 檔案名稱是否為 `.env`（不是 `.env.txt`）

### 資料庫錯誤

如果看到資料庫相關錯誤，請檢查：
- Supabase 專案是否正確設定
- `supabase/schema.sql` 是否已執行
- RLS 政策是否正確設定

### 圖片上傳錯誤

如果圖片上傳失敗，請檢查：
- Cloudinary 設定是否正確
- Upload Preset 是否設定為 "Unsigned"
- 環境變數是否正確設定

## 下一步

- 實作 AI 推薦系統
- 新增冰箱剩食推薦功能
- 新增營養分析功能
- 新增挑戰賽功能
- 新增影音功能


