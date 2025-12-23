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

- **Node.js 18+** (建議使用 Node.js 18 或更高版本)
- **npm** 或 **yarn** (本文件以 npm 為例)
- **Supabase 帳號** (免費帳號即可)
- **Cloudinary 帳號** (免費帳號即可)

### 安裝步驟

#### 步驟 1: 複製專案

```bash
git clone <repository-url>
cd wp-final
```

#### 步驟 2: 安裝依賴套件

```bash
npm install
```

**預期結果**: 所有依賴套件會安裝到 `node_modules/` 目錄，安裝過程可能需要 1-3 分鐘。

**常見問題**: 
- 如果遇到權限問題，請使用 `sudo npm install` (macOS/Linux) 或以管理員身份執行 (Windows)
- 如果安裝失敗，請確認 Node.js 版本是否符合需求：`node --version`

#### 步驟 3: 建立 Supabase 專案並取得連線資訊

1. 前往 [Supabase](https://supabase.com/) 並登入（或註冊新帳號）
2. 點擊「New Project」建立新專案
3. 填寫專案資訊：
   - **Project Name**: 任意名稱（例如：im-cooked）
   - **Database Password**: 請記住此密碼，後續會用到
   - **Region**: 選擇離您最近的區域
4. 等待專案建立完成（約 1-2 分鐘）
5. 進入專案後，點擊左側選單的 **Settings** → **API**
6. 複製以下資訊：
   - **Project URL** (例如：`https://xxxxx.supabase.co`)
   - **anon public** key (在 Project API keys 區塊)
   - **service_role** key (在 Project API keys 區塊，**請妥善保管，不要公開**)

#### 步驟 4: 設定 Supabase 資料庫

1. 在 Supabase Dashboard 中，點擊左側選單的 **SQL Editor**
2. 點擊 **New query**
3. 開啟專案中的 `supabase/schema.sql` 檔案，複製全部內容
4. 貼上到 SQL Editor 中
5. 點擊 **Run** 執行 SQL（或按 `Cmd/Ctrl + Enter`）
6. **確認執行成功**: 應該會看到 "Success. No rows returned" 訊息

**重要**: 如果需要在後台查看數據分析功能，請重複上述步驟執行 `supabase/migration-create-user-events.sql` 檔案。

#### 步驟 5: 建立 Cloudinary 帳號並設定

1. 前往 [Cloudinary](https://cloudinary.com/) 並登入（或註冊新帳號）
2. 進入 Dashboard 後，在右上角可以看到：
   - **Cloud name** (例如：`dxxxxx`)
   - 點擊 **Account Details** 可以看到：
     - **API Key**
     - **API Secret**
3. 設定上傳預設（Upload Preset）：
   - 點擊左側選單的 **Settings** → **Upload**
   - 在 **Upload presets** 區塊，點擊 **Add upload preset**
   - 設定如下：
     - **Preset name**: `recipes_preset`
     - **Signing mode**: 選擇 **Unsigned** (允許前端直接上傳)
     - **Folder**: 可選，例如 `recipes/`
   - 點擊 **Save**

#### 步驟 6: 設定環境變數

在專案根目錄建立 `.env.local` 檔案（注意：是 `.env.local` 不是 `.env`）：

```env
# Supabase (從步驟 3 取得)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Cloudinary (從步驟 5 取得)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name_here
CLOUDINARY_API_KEY=your_api_key_here
CLOUDINARY_API_SECRET=your_api_secret_here

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**重要**: 
- 請將上述所有 `your_xxx_here` 替換為實際的值
- `.env.local` 檔案已加入 `.gitignore`，不會被提交到版本控制

#### 步驟 7: 啟動開發伺服器

```bash
npm run dev
```

**預期結果**: 終端機應該會顯示：
```
  ▲ Next.js 14.x.x
  - Local:        http://localhost:3000
  - ready started server on 0.0.0.0:3000
```

#### 步驟 8: 開啟瀏覽器測試

開啟瀏覽器前往 [http://localhost:3000](http://localhost:3000)

**預期結果**: 應該能看到網站首頁，顯示食譜列表。

**常見問題**:
- 如果看到錯誤訊息，請檢查：
  1. 環境變數是否正確設定
  2. Supabase 資料庫是否已正確建立
  3. 終端機是否有錯誤訊息

### 測試帳號

**方式一：自行註冊測試帳號**

1. 前往 [http://localhost:3000/auth/signup](http://localhost:3000/auth/signup)
2. 填寫註冊資訊：
   - 電子郵件（任意有效郵件格式即可，例如：`test@example.com`）
   - 密碼（至少 6 個字元）
3. 點擊「註冊」
4. **注意**: 根據專案設定，可能需要確認郵件。如果遇到郵件確認問題，請參考專案中的 `DISABLE_EMAIL_CONFIRMATION.md` 檔案。

**方式二：使用現有測試帳號（如果有提供）**

如果專案有提供測試帳號，請在此處列出：
- 帳號: `test@example.com`
- 密碼: `test123456`

### 測試步驟

以下測試步驟可協助驗證專案功能是否正常運作：

#### 1. 測試註冊與登入功能

1. 前往 [http://localhost:3000/auth/signup](http://localhost:3000/auth/signup)
2. 註冊一個新帳號
3. 登入後應該會自動跳轉到首頁
4. 登出後，前往 [http://localhost:3000/auth/login](http://localhost:3000/auth/login) 測試登入功能

**預期結果**: 
- 註冊成功後可以登入
- 登入後可以看到導航列顯示使用者資訊

#### 2. 測試瀏覽食譜功能

1. 在首頁查看食譜列表
2. 點擊任一食譜卡片進入詳細頁面
3. 測試搜尋功能：在搜尋欄輸入關鍵字（例如：「雞肉」）
4. 測試分類篩選：點擊分類標籤
5. 測試標籤篩選：點擊標籤

**預期結果**: 
- 食譜列表正常顯示
- 搜尋和篩選功能正常運作

#### 3. 測試上傳食譜功能

1. 登入後，前往 [http://localhost:3000/recipes/new](http://localhost:3000/recipes/new)
2. 填寫食譜資訊：
   - 標題：例如「測試食譜」
   - 描述：任意描述
   - 食材：輸入食材列表（每行一個）
   - 步驟：輸入烹飪步驟（每行一個）
   - 上傳圖片（可選）
3. 點擊「發布食譜」

**預期結果**: 
- 食譜成功上傳
- 可以在首頁或個人資料頁面看到新上傳的食譜

#### 4. 測試互動功能

1. 前往任一食譜詳細頁面
2. 測試收藏功能：點擊收藏按鈕
3. 測試評分功能：點擊星星評分（1-5 星）
4. 測試留言功能：在留言區輸入留言並提交
5. 測試烹飪模式：點擊「開始烹飪」按鈕

**預期結果**: 
- 收藏、評分、留言功能正常運作
- 烹飪模式可以逐步顯示步驟

#### 5. 測試個人資料功能

1. 前往 [http://localhost:3000/profile](http://localhost:3000/profile)
2. 查看「我的食譜」標籤
3. 查看「收藏的食譜」標籤
4. 測試編輯個人資料功能

**預期結果**: 
- 可以查看自己上傳的食譜
- 可以查看收藏的食譜
- 可以編輯個人資料

#### 6. 測試追蹤功能（如果已實作）

1. 前往其他使用者的個人資料頁面
2. 點擊「追蹤」按鈕
3. 前往自己的個人資料頁面，查看「追蹤中」和「追蹤者」列表

**預期結果**: 
- 可以追蹤其他使用者
- 追蹤列表正確顯示

#### 7. 測試後台數據分析功能

1. 前往 [http://localhost:3000/admin](http://localhost:3000/admin)
2. 查看統計數據（總事件數、活躍使用者等）
3. 測試篩選功能：
   - 選擇不同的事件類型
   - 選擇不同的時間範圍
   - 輸入使用者 ID（如果知道）
4. 點擊「套用篩選」查看結果

**預期結果**: 
- 後台頁面正常顯示
- 統計數據正確
- 篩選功能正常運作

#### 8. 測試 Chatbot 功能（如果已實作）

1. 在網站任一頁面找到 Chatbot 圖示或按鈕
2. 點擊開啟 Chatbot
3. 輸入問題或使用快速操作按鈕
4. 測試對話功能

**預期結果**: 
- Chatbot 可以正常開啟
- 可以進行對話互動

**注意事項**:
- 如果某些功能測試失敗，請檢查：
  1. 終端機是否有錯誤訊息
  2. 瀏覽器開發者工具（F12）的 Console 是否有錯誤
  3. 環境變數是否正確設定
  4. 資料庫連線是否正常

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

## 組員分工

### 吳承暐

**負責項目**:

1. **設計與實作專案架構雛形**
   - 規劃 Next.js 14 App Router 專案結構
   - 建立基礎的頁面路由和元件架構
   - 設定 TypeScript 配置和類型定義
   - 整合 Supabase 和 Cloudinary 服務

2. **建構初版資料庫**
   - 設計資料庫 Schema（`supabase/schema.sql`）
   - 建立主要資料表：profiles, recipes, recipe_ratings, recipe_favorites, comments 等
   - 設定 Row Level Security (RLS) 政策確保資料安全
   - 建立必要的索引和觸發器

3. **前端細緻功能微調**
   - 優化使用者介面互動體驗
   - 實作載入狀態和錯誤處理
   - 改善響應式設計

**貢獻說明**: 負責專案的核心架構設計與資料庫建置，為後續功能開發奠定基礎。

### 楊家驊

**負責項目**:

1. **追蹤者系統（用戶互追）**
   - 實作使用者之間的追蹤/取消追蹤功能
   - 建立 `follows` 資料表並設定相關 RLS 政策
   - 開發追蹤者列表和追蹤中列表頁面（`/profile/[userId]/followers` 和 `/profile/[userId]/following`）
   - 實作追蹤統計的自動更新機制（使用資料庫觸發器）

2. **追蹤者系統（後台追蹤）**
   - 開發使用者行為追蹤系統
   - 建立 `user_events` 資料表用於記錄使用者行為
   - 實作後台數據分析頁面（`/admin`）
   - 開發事件追蹤的 API 端點和統計功能

3. **評論架構**
   - 設計並實作留言系統的資料庫結構
   - 開發留言的 CRUD 功能（新增、編輯、刪除）
   - 實作留言的即時更新機制
   - 建立留言相關的 Server Actions 和元件

4. **前端細緻功能微調**
   - 優化追蹤和留言功能的 UI/UX
   - 實作相關的載入和錯誤狀態處理

**貢獻說明**: 負責社群互動功能的核心開發，包括使用者追蹤系統和留言系統，以及後台數據分析功能。

### 吳俞寬

**負責項目**:

1. **爬取並清理食譜資料**
   - 開發食譜資料爬取腳本（`scripts/import-recipes.js`）
   - 清理和格式化爬取的食譜資料
   - 將資料匯入 Supabase 資料庫
   - 處理食譜圖片的上傳和連結

2. **Chatbot 功能實作**
   - 設計 Chatbot 的使用者介面（`components/chatbot/`）
   - 整合 AI 對話功能
   - 實作快速操作按鈕和對話歷史記錄
   - 建立 Chatbot 相關的 Server Actions（`lib/actions/chatbot.ts`）
   - 建立對話記錄的資料表結構（`supabase/chatbot-conversations.sql`）

3. **UI/UX 優化**
   - 改善整體網站的使用者體驗
   - 優化響應式設計，確保在不同裝置上正常顯示
   - 實作動畫和過渡效果
   - 改善色彩配置和視覺設計

4. **前端細緻功能微調**
   - 優化各頁面的使用者互動
   - 實作表單驗證和錯誤提示
   - 改善載入狀態的視覺回饋

**貢獻說明**: 負責資料準備、AI 功能整合以及整體 UI/UX 的優化，提升使用者的使用體驗。

### 外掛說明

**本專題無使用外掛**。所有功能皆由三位組員自行開發實作。

**說明**: 
- 所有程式碼皆由組員親自撰寫
- 使用的第三方套件僅限於開源函式庫（如 Next.js、Supabase、Cloudinary 等），這些屬於技術框架和服務，並非外掛協助開發

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
