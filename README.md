# 食譜分享平台

一個可供使用者上傳、探索與分享食譜的網站平台，結合社群互動與智慧推薦機制，形成一個活躍的烹飪社群。

## 功能特色

- 📝 **上傳食譜** - 用戶可以上傳自己的食譜（含步驟、圖片、食材等資訊）
- ⭐ **評價與收藏** - 評價與收藏他人食譜
- 💬 **留言系統** - 在留言區交流烹飪心得
- 👨‍🍳 **烹飪模式** - 使用「烹飪模式」一步步跟著食譜操作
- 🔍 **搜尋與標籤** - 透過搜尋與標籤探索不同菜式
- 🤖 **AI 推薦** - 智慧推薦系統（基礎版本）

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
│   └── layout.tsx         # 根佈局
├── components/            # React 元件
│   ├── layout/           # 佈局元件（Navbar, Footer）
│   ├── recipes/          # 食譜相關元件
│   ├── profile/          # 個人資料元件
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
