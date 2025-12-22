# I'm cooked

一個可供使用者上傳、探索與分享食譜的網站平台，結合社群互動與智慧推薦機制，形成一個活躍的烹飪社群。

## 功能特色

- 📝 **上傳食譜** - 用戶可以上傳自己的食譜（含步驟、圖片、食材等資訊）
- ⭐ **評價與收藏** - 評價與收藏他人食譜
- 💬 **留言系統** - 在留言區交流烹飪心得
- 👨‍🍳 **烹飪模式** - 使用「烹飪模式」一步步跟著食譜操作
- 🔍 **搜尋與標籤** - 透過搜尋與標籤探索不同菜式
- 🤖 **AI 推薦** - 智慧推薦系統（基礎版本）
- 📊 **使用者追蹤系統** - 整合 Google Analytics 4 (GA4) 和自建追蹤系統
- 🛡️ **後台管理** - 完整的使用者行為數據分析與管理介面

## 技術架構

- **前端框架**: Next.js 14 (App Router)
- **後端服務**: Supabase (PostgreSQL + Auth + Storage)
- **圖片服務**: Cloudinary
- **部署平台**: Vercel
- **樣式**: Tailwind CSS
- **類型安全**: TypeScript

## 快速開始

### 環境需求

- Node.js 18+ 
- npm 或 yarn
- Supabase 帳號
- Cloudinary 帳號

### 安裝步驟

1. **複製專案**
   ```bash
   git clone <repository-url>
   cd wp-final
   ```

2. **安裝依賴**
   ```bash
   npm install
   ```

3. **設定環境變數**
   
   建立 `.env.local` 檔案（建議使用 `.env.local` 而非 `.env`，避免提交到 Git）：
   ```env
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

   # Cloudinary
   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret

   # Google Analytics 4 (可選)
   NEXT_PUBLIC_GA4_MEASUREMENT_ID=G-XXXXXXXXXX

   # 後台管理 (可選，如需使用後台管理功能)
   ADMIN_USER_IDS=your_user_id_1,your_user_id_2

   # App
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

4. **設定 Supabase 資料庫**
   
   在 Supabase Dashboard 的 SQL Editor 中依序執行：
   - `supabase/schema.sql` - 建立主要資料表結構
   - `supabase/user-events-schema.sql` - 建立使用者追蹤系統資料表（如需使用追蹤功能）

5. **設定 Cloudinary**
   
   - 在 Cloudinary Dashboard 中建立上傳預設（Upload Preset）
   - 設定預設名稱為 `recipes_preset` 或更新 `.env` 中的設定

6. **啟動開發伺服器**
   ```bash
   npm run dev
   ```

   開啟 [http://localhost:3000](http://localhost:3000) 查看結果。

## 後台管理系統

### 訪問後台管理頁面

本專案提供完整的使用者行為追蹤與分析後台，僅限管理員訪問。

#### 本地開發環境

1. **設定管理員權限**
   - 在 `.env.local` 中加入你的使用者 ID：
     ```env
     ADMIN_USER_IDS=你的使用者ID
     ```
   - 如需多個管理員，用逗號分隔：
     ```env
     ADMIN_USER_IDS=id1,id2,id3
     ```

2. **取得你的使用者 ID**
   - 方法 A：在 Supabase Dashboard → `auth.users` 資料表查看
   - 方法 B：訪問 `http://localhost:3000/admin/debug` 查看診斷資訊

3. **訪問後台**
   - 確保已登入（使用設為管理員的帳號）
   - 訪問：`http://localhost:3000/admin/events`
   - 如果沒有權限，會被自動重定向到首頁

#### 部署環境（Vercel）

1. **在 Vercel 設定環境變數**
   - 在 Vercel 專案設定 → Environment Variables 中加入：
     ```
     ADMIN_USER_IDS=你的使用者ID
     ```
   - 重新部署專案

2. **訪問後台**
   - 訪問：`https://你的網域.vercel.app/admin/events`
   - 例如：`https://im-cooked.vercel.app/admin/events`

### 後台功能

- 📊 **統計儀表板** - 總事件數、活躍使用者、事件類型統計
- 🔍 **事件篩選** - 依使用者 ID、事件類型、時間範圍篩選
- 📋 **事件列表** - 詳細的事件記錄表格，包含時間、使用者、事件類型、頁面路徑等
- 👥 **活躍使用者** - 查看最活躍的使用者列表
- 📈 **事件分析** - 各事件類型的發生頻率與使用者分布

### 診斷工具

如果無法訪問後台，可以訪問診斷頁面檢查設定：
- 本地：`http://localhost:3000/admin/debug`
- 部署：`https://你的網域.vercel.app/admin/debug`

診斷頁面會顯示：
- 登入狀態
- 你的使用者 ID
- 環境變數設定狀態
- 權限檢查結果

## 專案結構

```
wp-final/
├── app/                    # Next.js App Router 頁面
│   ├── admin/             # 後台管理頁面
│   │   ├── events/        # 使用者行為追蹤後台
│   │   └── debug/          # 權限診斷工具
│   ├── auth/              # 認證頁面（登入、註冊）
│   ├── recipes/           # 食譜相關頁面
│   ├── profile/           # 個人資料頁面
│   └── layout.tsx         # 根佈局
├── components/            # React 元件
│   ├── admin/            # 後台管理元件
│   ├── analytics/        # 追蹤系統元件
│   ├── layout/           # 佈局元件（Navbar, Footer）
│   ├── recipes/          # 食譜相關元件
│   ├── profile/          # 個人資料元件
│   └── ui/               # UI 元件
├── lib/                  # 工具函數
│   ├── actions/          # Server Actions
│   │   └── admin.ts      # 後台管理 API
│   ├── analytics/        # 追蹤系統
│   │   ├── ga4.ts        # Google Analytics 4 整合
│   │   └── tracking.ts   # 自建追蹤系統
│   ├── supabase/         # Supabase 客戶端
│   ├── utils/            # 工具函數
│   │   └── admin.ts      # 管理員權限檢查
│   └── cloudinary.ts     # Cloudinary 整合
├── types/                # TypeScript 類型定義
├── supabase/             # Supabase 設定
│   ├── schema.sql        # 主要資料庫 schema
│   └── user-events-schema.sql  # 使用者追蹤系統 schema
├── docs/                 # 文件
│   ├── ANALYTICS_SETUP.md     # 追蹤系統設定指南
│   └── ANALYTICS_QUICK_START.md  # 快速開始指南
└── public/               # 靜態資源
```

## 資料庫結構

### 主要資料表

- **profiles** - 用戶資料
- **recipes** - 食譜
- **recipe_ratings** - 食譜評分
- **recipe_favorites** - 食譜收藏
- **comments** - 留言
- **user_events** - 使用者行為追蹤記錄（需執行 `user-events-schema.sql`）

詳細的資料庫結構請參考：
- `supabase/schema.sql` - 主要資料表結構
- `supabase/user-events-schema.sql` - 使用者追蹤系統資料表

## 部署

### Vercel 部署

1. 將專案推送到 GitHub
2. 在 Vercel 中匯入專案
3. 設定環境變數
4. 部署

### 環境變數設定

在 Vercel 專案設定 → Environment Variables 中添加以下環境變數：

**必要變數：**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `NEXT_PUBLIC_APP_URL`

**可選變數：**
- `NEXT_PUBLIC_GA4_MEASUREMENT_ID` - Google Analytics 4 測量 ID（如需使用 GA4 追蹤）
- `ADMIN_USER_IDS` - 管理員使用者 ID 列表，逗號分隔（如需使用後台管理功能）

**後台管理路徑：**
- 部署後訪問：`https://你的網域.vercel.app/admin/events`

## 使用者追蹤系統

本專案實作了混合追蹤系統，結合 Google Analytics 4 (GA4) 和自建追蹤系統：

- **GA4 整合** - 整體流量分析、使用者路徑、轉換漏斗
- **自建追蹤** - 詳細的使用者行為記錄，儲存在 Supabase
- **後台管理** - 完整的使用者行為數據分析介面

詳細設定請參考：[`docs/ANALYTICS_SETUP.md`](docs/ANALYTICS_SETUP.md)

## 未來功能

- 冰箱剩食推薦
- 營養分析
- 挑戰賽
- 影音擴充
- 進階 AI 推薦

## 開發規範

- 使用 TypeScript 確保類型安全
- 遵循 Next.js App Router 最佳實踐
- 使用 Server Actions 處理資料操作
- 實作 Row Level Security (RLS) 確保資料安全
- 使用 Tailwind CSS 進行樣式設計

## 授權

MIT License

## 聯絡方式

如有問題或建議，請開啟 Issue 或 Pull Request。
