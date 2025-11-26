# 專案快速回顧指南

## 📌 專案概述

這是一個**食譜分享平台**，允許用戶上傳、瀏覽、評價和收藏食譜。專案使用 Next.js 14 + Supabase + Cloudinary 建置。

## 🚀 技術棧

- **前端框架**: Next.js 14 (App Router)
- **語言**: TypeScript
- **樣式**: Tailwind CSS
- **後端/資料庫**: Supabase (PostgreSQL + Auth + Storage)
- **圖片服務**: Cloudinary
- **部署**: Vercel

## ✅ 已實現的核心功能

### 1. 用戶認證
- ✅ 用戶註冊（含使用者名稱）
- ✅ 用戶登入/登出
- ✅ 個人資料管理
- ✅ 自動建立用戶資料檔

### 2. 食譜管理
- ✅ 建立新食譜（標題、描述、圖片、食材、步驟）
- ✅ 編輯食譜（僅限作者）
- ✅ 刪除食譜（僅限作者）
- ✅ 查看食譜詳情
- ✅ 食譜列表（含分頁）

### 3. 互動功能
- ✅ 1-5 星評分系統
- ✅ 收藏/取消收藏
- ✅ 留言系統
- ✅ 平均評分顯示

### 4. 特殊功能
- ✅ 烹飪模式（逐步指導，含計時器）
- ✅ 搜尋功能（關鍵字）
- ✅ 標籤系統
- ✅ 篩選功能（難度、標籤）

### 5. 其他
- ✅ 響應式設計（手機/桌面適配）
- ✅ 個人資料頁面

## 📁 專案結構

```
wp-final/
├── app/                    # Next.js App Router 頁面
│   ├── auth/              # 認證頁面（登入、註冊）
│   ├── recipes/           # 食譜相關頁面
│   │   ├── [id]/         # 食譜詳情/編輯
│   │   ├── new/          # 建立新食譜
│   │   └── search/       # 搜尋頁面
│   ├── profile/          # 個人資料
│   └── layout.tsx        # 根佈局
├── components/           # React 元件
│   ├── layout/          # 導航列、頁尾
│   ├── recipes/         # 食譜相關元件
│   ├── profile/         # 個人資料元件
│   └── ui/              # UI 元件
├── lib/                 # 工具函數
│   ├── actions/         # Server Actions（資料操作）
│   ├── supabase/        # Supabase 客戶端配置
│   └── cloudinary.ts    # Cloudinary 整合
├── types/               # TypeScript 類型定義
├── supabase/            # Supabase 設定
│   ├── schema.sql       # 資料庫 schema
│   └── SCHEMA_DOCUMENTATION.md
└── scripts/             # 工具腳本
```

## 🗄️ 資料庫結構

主要資料表：
- `profiles` - 用戶資料
- `recipes` - 食譜
- `recipe_ratings` - 食譜評分
- `recipe_favorites` - 食譜收藏
- `comments` - 留言

## ⚙️ 環境變數設定

建立 `.env` 檔案在專案根目錄：

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=recipes_preset

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 如何取得環境變數

#### Supabase
1. 前往 [Supabase Dashboard](https://app.supabase.com/)
2. 選擇專案 > Settings > API
3. 複製 `Project URL` 和 `anon public` key
4. 複製 `service_role` key（僅用於後端操作）

#### Cloudinary
1. 前往 [Cloudinary Dashboard](https://cloudinary.com/)
2. Dashboard 首頁即可看到 `Cloud name`、`API Key`、`API Secret`
3. Settings > Upload > Upload presets
4. 建立新的 Upload Preset（設定為 "Unsigned" 模式）

## 🏃 快速開始

### 1. 安裝依賴

```bash
npm install
```

### 2. 設定 Supabase 資料庫

1. 前往 Supabase Dashboard > SQL Editor
2. 執行 `supabase/schema.sql` 建立資料表

### 3. 設定環境變數

建立 `.env` 檔案並填入所有必要的環境變數（見上方）

### 4. 測試 Supabase 連接

```bash
npm run test:supabase
```

### 5. 啟動開發伺服器

```bash
npm run dev
```

開啟 [http://localhost:3000](http://localhost:3000)

## 📝 重要頁面路徑

- `/` - 首頁（最新食譜）
- `/recipes` - 食譜列表
- `/recipes/[id]` - 食譜詳情
- `/recipes/new` - 建立新食譜
- `/recipes/[id]/edit` - 編輯食譜
- `/recipes/search` - 搜尋頁面
- `/auth/login` - 登入
- `/auth/signup` - 註冊
- `/profile` - 個人資料

## ⚠️ 已知問題與解決方案

### Email 確認問題

如果登入時顯示 "Email not confirmed"：

**解決方案 1: 關閉 Email 確認（推薦用於開發）**
1. Supabase Dashboard > Authentication > Providers > Email
2. 取消勾選 "Confirm email"
3. 執行 `scripts/confirm-all-users.sql` 確認現有用戶

**解決方案 2: 使用登入頁面的「重新發送確認郵件」功能**

詳細說明請參考 `DISABLE_EMAIL_CONFIRMATION.md`

### Supabase 連接錯誤

如果看到 HTML 404 錯誤，通常是 Supabase URL 設定錯誤：

1. 確保 URL 格式為 `https://xxx.supabase.co`（不包含 `/rest/v1` 或其他路徑）
2. 執行 `npm run test:supabase` 測試連接
3. 重新啟動開發伺服器

詳細說明請參考 `TROUBLESHOOTING.md`

## 🔧 常用指令

```bash
# 開發模式
npm run dev

# 建置生產版本
npm run build

# 啟動生產伺服器
npm start

# 測試 Supabase 連接
npm run test:supabase

# 程式碼檢查
npm run lint
```

## 📚 重要文檔

- `README.md` - 主要專案文檔
- `PROJECT_SUMMARY.md` - 完整功能摘要
- `SETUP_GUIDE.md` - 詳細設定指南
- `TROUBLESHOOTING.md` - 疑難排解指南
- `DISABLE_EMAIL_CONFIRMATION.md` - Email 設定指南
- `supabase/SCHEMA_DOCUMENTATION.md` - 資料庫架構文檔

## 🎯 下一步開發方向

建議的未來功能：
- [ ] AI 推薦系統（進階版本）
- [ ] 冰箱剩食推薦
- [ ] 營養分析
- [ ] 挑戰賽功能
- [ ] 影音功能
- [ ] 社交分享
- [ ] 通知系統
- [ ] 多語言支援

## 💡 開發提醒

1. **環境變數**: 確保 `.env` 檔案存在且正確設定
2. **資料庫**: 執行 `schema.sql` 建立所有必要的資料表
3. **Email 確認**: 開發期間建議關閉 Email 確認功能
4. **測試**: 使用 `npm run test:supabase` 驗證 Supabase 連接
5. **重新啟動**: 更改環境變數後記得重新啟動開發伺服器

## 🐛 遇到問題？

1. 先查看 `TROUBLESHOOTING.md`
2. 執行 `npm run test:supabase` 檢查連接
3. 檢查終端機的錯誤訊息
4. 確認 Supabase Dashboard 中的專案狀態

---

**最後更新**: 2024

