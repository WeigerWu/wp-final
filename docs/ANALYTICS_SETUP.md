# 使用者追蹤系統設定指南

本專案實作了混合追蹤系統，包含 Google Analytics 4 (GA4) 和自建追蹤系統。

## 📊 系統架構

### 1. Google Analytics 4 (GA4)
- **用途**: 整體流量分析、使用者路徑、轉換漏斗
- **優點**: 免費、功能完整、即時數據
- **限制**: 無法直接追蹤特定使用者 ID 的詳細活動

### 2. 自建追蹤系統
- **用途**: 詳細的使用者行為記錄、後台管理
- **優點**: 完全客製化、可查詢特定使用者活動
- **資料儲存**: Supabase `user_events` 資料表

## 🚀 設定步驟

### 步驟 1: 設定 Google Analytics 4

1. **建立 GA4 資源**
   - 前往 [Google Analytics](https://analytics.google.com/)
   - 建立新的 GA4 資源
   - 取得「測量 ID」（Measurement ID），格式為 `G-XXXXXXXXXX`

2. **設定環境變數**
   ```env
   NEXT_PUBLIC_GA4_MEASUREMENT_ID=G-XXXXXXXXXX
   ```

3. **驗證設定**
   - 啟動開發伺服器：`npm run dev`
   - 開啟瀏覽器開發者工具
   - 檢查 Network 標籤，應該會看到對 `google-analytics.com` 的請求

### 步驟 2: 設定資料庫

1. **執行資料庫 Migration**
   ```sql
   -- 在 Supabase SQL Editor 中執行
   -- 檔案位置: supabase/user-events-schema.sql
   ```

2. **驗證資料表**
   - 確認 `user_events` 資料表已建立
   - 確認索引已建立
   - 確認 RLS 政策已設定

### 步驟 3: 設定管理員權限

1. **取得管理員使用者 ID**
   - 在 Supabase Dashboard 中查看 `auth.users` 資料表
   - 複製要設為管理員的使用者 ID（UUID 格式）

2. **設定環境變數**
   ```env
   # 管理員使用者 ID 列表（逗號分隔）
   ADMIN_USER_IDS=user-id-1,user-id-2,user-id-3
   ```

3. **驗證管理員權限**
   - 使用管理員帳號登入
   - 訪問 `/admin/events` 頁面
   - 應該可以看到後台管理介面

## 📝 環境變數清單

在 `.env.local` 或部署平台的環境變數設定中加入：

```env
# Google Analytics 4
NEXT_PUBLIC_GA4_MEASUREMENT_ID=G-XXXXXXXXXX

# 管理員權限（可選，如果不需要後台管理可以省略）
ADMIN_USER_IDS=user-id-1,user-id-2
```

## 🎯 追蹤的事件類型

系統會自動追蹤以下事件：

### 頁面瀏覽
- `page_view` - 所有頁面瀏覽

### 食譜相關
- `view_recipe` - 查看食譜詳情
- `create_recipe` - 建立新食譜
- `edit_recipe` - 編輯食譜
- `delete_recipe` - 刪除食譜
- `favorite_recipe` - 收藏食譜
- `unfavorite_recipe` - 取消收藏
- `rate_recipe` - 評分食譜
- `start_cooking_mode` - 開始烹飪模式
- `export_recipe` - 匯出食譜（PDF/JSON/Text）

### 互動相關
- `add_comment` - 新增留言
- `edit_comment` - 編輯留言
- `delete_comment` - 刪除留言
- `search_recipes` - 搜尋食譜

### 使用者相關
- `view_profile` - 查看個人資料
- `follow_user` - 追蹤使用者
- `unfollow_user` - 取消追蹤
- `login` - 登入
- `signup` - 註冊
- `update_profile` - 更新個人資料

## 🔍 使用後台管理介面

### 訪問後台
1. 使用管理員帳號登入
2. 訪問 `/admin/events`

### 功能說明

#### 統計卡片
- **總事件數**: 過去 N 天的總事件數量
- **活躍使用者**: 過去 N 天的活躍使用者數
- **事件類型**: 不同事件類型的數量
- **活躍使用者**: 前 20 名最活躍的使用者

#### 篩選功能
- **使用者 ID**: 查詢特定使用者的活動
- **事件類型**: 篩選特定類型的事件
- **時間範圍**: 選擇過去 1/7/30/90 天

#### 事件列表
- 顯示所有事件記錄
- 包含時間、使用者、事件類型、頁面路徑等資訊
- 可展開查看詳細的事件資料（JSON 格式）

## 🔒 權限控制

### RLS 政策
- 使用者只能查看自己的事件
- 任何人都可以插入事件（用於追蹤）
- 後台管理使用 `service_role_key` 繞過 RLS

### 管理員檢查
- 透過環境變數 `ADMIN_USER_IDS` 定義管理員
- 只有管理員可以訪問 `/admin/events`
- 非管理員訪問會被重定向到首頁

## 📊 資料保留政策

預設情況下，系統會保留所有事件記錄。如果需要清理舊資料：

```sql
-- 刪除 90 天前的舊事件
SELECT public.cleanup_old_events();
```

或手動執行：

```sql
DELETE FROM public.user_events
WHERE created_at < NOW() - INTERVAL '90 days';
```

## 🛠️ 疑難排解

### GA4 沒有數據
1. 檢查 `NEXT_PUBLIC_GA4_MEASUREMENT_ID` 是否正確設定
2. 確認環境變數有 `NEXT_PUBLIC_` 前綴（客戶端可訪問）
3. 檢查瀏覽器控制台是否有錯誤
4. 使用 GA4 DebugView 即時查看事件

### 後台無法訪問
1. 確認 `ADMIN_USER_IDS` 環境變數已設定
2. 確認使用者 ID 正確（UUID 格式）
3. 確認使用者已登入
4. 檢查瀏覽器控制台是否有錯誤

### 事件沒有記錄
1. 檢查 Supabase 連線是否正常
2. 檢查 `user_events` 資料表是否存在
3. 檢查 RLS 政策是否正確設定
4. 查看伺服器日誌是否有錯誤

## 📚 相關檔案

- `lib/analytics/ga4.ts` - GA4 整合函數
- `lib/analytics/tracking.ts` - 自建追蹤系統
- `components/analytics/GoogleAnalytics.tsx` - GA4 元件
- `components/analytics/PageViewTracker.tsx` - 頁面瀏覽追蹤
- `lib/actions/admin.ts` - 後台管理 API
- `app/admin/events/page.tsx` - 後台管理頁面
- `supabase/user-events-schema.sql` - 資料庫 Schema

## 🔗 相關資源

- [Google Analytics 4 文件](https://developers.google.com/analytics/devguides/collection/ga4)
- [Next.js Third-Parties](https://nextjs.org/docs/app/api-reference/components/third-parties)
- [Supabase RLS 文件](https://supabase.com/docs/guides/auth/row-level-security)

