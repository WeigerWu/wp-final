# I'm cooked

一個可供使用者上傳、探索與分享食譜的網站平台，結合社群互動與智慧推薦機制，形成一個活躍的烹飪社群。

## 功能特色

- 📝 **上傳食譜** - 用戶可以上傳自己的食譜（含步驟、圖片、食材等資訊）
- ⭐ **評價與收藏** - 評價與收藏他人食譜
- 💬 **留言系統** - 在留言區交流烹飪心得
- 👨‍🍳 **烹飪模式** - 使用「烹飪模式」一步步跟著食譜操作
- 🔍 **搜尋與標籤** - 透過搜尋與標籤探索不同菜式
- 🤖 **AI 推薦** - 智慧推薦系統（基礎版本）

## 線上體驗

- 前台平台網址：[https://im-cooked.vercel.app/](https://im-cooked.vercel.app/)
- 後台使用者行為追蹤頁面：[https://im-cooked.vercel.app/admin](https://im-cooked.vercel.app/admin)

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

   # App
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

4. **設定 Supabase 資料庫**
   
   在 Supabase Dashboard 中執行 `supabase/schema.sql` 來建立資料表結構。
   
   如果需要在後台查看數據分析，請執行 `supabase/migration-create-user-events.sql` 來建立使用者行為追蹤資料表。

5. **設定 Cloudinary**
   
   - 在 Cloudinary Dashboard 中建立上傳預設（Upload Preset）
   - 設定預設名稱為 `recipes_preset` 或更新 `.env` 中的設定

6. **啟動開發伺服器**
   ```bash
   npm run dev
   ```

   開啟 [http://localhost:3000](http://localhost:3000) 查看結果。

## 專案結構

```
wp-final/
├── app/                    # Next.js App Router 頁面
│   ├── auth/              # 認證頁面（登入、註冊）
│   ├── recipes/           # 食譜相關頁面
│   ├── profile/           # 個人資料頁面
│   ├── admin/             # 後台數據分析頁面
│   ├── api/               # API 路由
│   │   └── admin/         # 後台 API
│   └── layout.tsx         # 根佈局
├── components/            # React 元件
│   ├── layout/           # 佈局元件（Navbar, Footer）
│   ├── recipes/          # 食譜相關元件
│   ├── profile/          # 個人資料元件
│   ├── admin/            # 後台管理元件
│   └── ui/               # UI 元件
├── lib/                  # 工具函數
│   ├── actions/          # Server Actions
│   ├── supabase/         # Supabase 客戶端
│   └── cloudinary.ts     # Cloudinary 整合
├── types/                # TypeScript 類型定義
├── supabase/             # Supabase 設定
│   └── schema.sql        # 資料庫 schema
└── public/               # 靜態資源
```

## 資料庫結構

### 主要資料表

- **profiles** - 用戶資料
- **recipes** - 食譜
- **recipe_ratings** - 食譜評分
- **recipe_favorites** - 食譜收藏
- **comments** - 留言

詳細的資料庫結構請參考 `supabase/schema.sql`。

### 數據分析資料表

- **user_events** - 使用者行為追蹤事件（用於後台數據分析）

如需啟用數據分析功能，請在 Supabase Dashboard 中執行 `supabase/migration-create-user-events.sql`。

## 部署

### Vercel 部署

1. 將專案推送到 GitHub
2. 在 Vercel 中匯入專案
3. 設定環境變數
4. 部署

### 環境變數設定

在 Vercel 專案設定中添加以下環境變數：

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `NEXT_PUBLIC_APP_URL`

## 使用說明

### 基本功能

1. **註冊與登入**
   - 前往 `/auth/signup` 註冊新帳號
   - 前往 `/auth/login` 登入現有帳號

2. **瀏覽食譜**
   - 在首頁查看最新食譜
   - 使用搜尋功能尋找特定食譜
   - 透過分類和標籤篩選食譜

3. **上傳食譜**
   - 登入後前往 `/recipes/new` 上傳新食譜
   - 填寫食譜標題、描述、食材和步驟
   - 上傳食譜圖片

4. **互動功能**
   - 收藏喜歡的食譜
   - 為食譜評分（1-5 星）
   - 在食譜下方留言交流
   - 使用「烹飪模式」逐步跟做

5. **個人資料**
   - 前往 `/profile` 查看和管理個人資料
   - 查看自己上傳的食譜
   - 查看收藏的食譜

### 後台數據分析

網站提供數據分析後台，可查看使用者的行為統計：

1. **訪問後台**
   - 前往 `/admin` 查看數據分析儀表板
   - 無需特殊權限，所有使用者都可以訪問

2. **查看統計數據**
   - **總事件數**：追蹤的所有使用者行為事件總數
   - **活躍使用者**：有記錄行為的獨立使用者數量
   - **事件類型**：不同類型的事件數量
   - **不重複頁面**：被訪問的不重複頁面數量

3. **使用篩選功能**
   - **使用者 ID**：輸入特定使用者 ID 查看該使用者的行為
   - **事件類型**：選擇特定事件類型（如：頁面瀏覽、查看食譜等）
   - **時間範圍**：選擇過去 1 天、7 天、30 天或全部數據
   - 點擊「套用篩選」更新統計數據

4. **查看詳細統計**
   - **事件類型統計**：查看每種事件類型的發生次數和涉及的使用者數量
   - **事件記錄**：查看最近的事件記錄列表，包含時間、類型、頁面和使用者資訊
   - **熱門頁面**：查看最常被訪問的頁面

### 數據追蹤說明

網站會自動追蹤以下使用者行為事件：
- 頁面瀏覽
- 查看食譜
- 建立/編輯/刪除食譜
- 收藏/取消收藏食譜
- 評分食譜
- 新增/編輯/刪除留言
- 搜尋食譜
- 開始烹飪模式
- 查看個人資料
- 追蹤/取消追蹤使用者
- 登入/註冊
- 更新個人資料

所有追蹤數據儲存在 Supabase `user_events` 資料表中，用於後台數據分析。

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
