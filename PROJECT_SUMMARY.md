# 專案摘要

## 專案概述

本專案是一個完整的食譜分享平台 MVP，使用 Next.js 14、Supabase 和 Cloudinary 建置。專案包含所有核心功能，並可部署到 Vercel。

## 已實作功能

### 1. 使用者認證系統
- ✅ 用戶註冊（含使用者名稱）
- ✅ 用戶登入/登出
- ✅ 個人資料管理
- ✅ 自動建立用戶資料檔

### 2. 食譜管理
- ✅ 建立新食譜（含標題、描述、圖片、食材、步驟）
- ✅ 編輯食譜（僅限作者）
- ✅ 刪除食譜（僅限作者）
- ✅ 查看食譜詳情
- ✅ 食譜列表（含分頁）
- ✅ 圖片上傳（Cloudinary 整合）

### 3. 評價與收藏
- ✅ 1-5 星評分系統
- ✅ 平均評分顯示
- ✅ 收藏/取消收藏功能
- ✅ 收藏數量顯示

### 4. 留言系統
- ✅ 留言功能
- ✅ 留言列表
- ✅ 留言時間顯示
- ✅ 用戶資訊顯示

### 5. 烹飪模式
- ✅ 逐步指導模式
- ✅ 步驟導航
- ✅ 步驟完成標記
- ✅ 計時器功能
- ✅ 進度顯示
- ✅ 步驟圖片顯示

### 6. 搜尋與篩選
- ✅ 關鍵字搜尋
- ✅ 標籤篩選
- ✅ 難度篩選
- ✅ 組合篩選

### 7. 標籤系統
- ✅ 標籤建立
- ✅ 標籤顯示
- ✅ 標籤搜尋

### 8. 個人資料
- ✅ 個人資料頁面
- ✅ 編輯個人資料
- ✅ 我的食譜列表

### 9. 響應式設計
- ✅ 行動裝置適配
- ✅ 桌面裝置適配
- ✅ 導航列適配

## 技術架構

### 前端
- **框架**: Next.js 14 (App Router)
- **語言**: TypeScript
- **樣式**: Tailwind CSS
- **表單處理**: React Hook Form + Zod
- **圖標**: Lucide React

### 後端
- **資料庫**: Supabase (PostgreSQL)
- **認證**: Supabase Auth
- **圖片服務**: Cloudinary
- **Row Level Security**: 已實作

### 部署
- **平台**: Vercel
- **配置**: vercel.json

## 資料庫結構

### 資料表
1. **profiles** - 用戶資料
2. **recipes** - 食譜
3. **recipe_ratings** - 食譜評分
4. **recipe_favorites** - 食譜收藏
5. **comments** - 留言

### 索引
- recipes.user_id
- recipes.tags (GIN)
- recipes.created_at
- recipe_ratings.recipe_id
- recipe_favorites.user_id
- comments.recipe_id

### RLS 政策
- 所有資料表已啟用 RLS
- 用戶可查看所有公開資料
- 用戶只能修改自己的資料

## 檔案結構

```
wp-final/
├── app/                    # Next.js App Router 頁面
│   ├── auth/              # 認證頁面
│   ├── recipes/           # 食譜頁面
│   ├── profile/           # 個人資料頁面
│   └── layout.tsx         # 根佈局
├── components/            # React 元件
│   ├── layout/           # 佈局元件
│   ├── recipes/          # 食譜元件
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

## 環境變數

請參考 `ENV_SETUP.md` 了解如何設定環境變數。

### 必要環境變數
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`

## 部署步驟

1. 將專案推送到 GitHub
2. 在 Vercel 中匯入專案
3. 設定環境變數
4. 部署

## 未來功能

- [ ] AI 推薦系統（進階版本）
- [ ] 冰箱剩食推薦
- [ ] 營養分析
- [ ] 挑戰賽功能
- [ ] 影音功能
- [ ] 社交分享
- [ ] 通知系統
- [ ] 多語言支援

## 開發規範

- 使用 TypeScript 確保類型安全
- 遵循 Next.js App Router 最佳實踐
- 使用 Server Actions 處理資料操作
- 實作 Row Level Security 確保資料安全
- 使用 Tailwind CSS 進行樣式設計
- 遵循 React Hooks 最佳實踐

## 測試

目前專案尚未包含測試。建議未來新增：
- 單元測試
- 整合測試
- E2E 測試

## 授權

MIT License

## 聯絡方式

如有問題或建議，請開啟 Issue 或 Pull Request。


