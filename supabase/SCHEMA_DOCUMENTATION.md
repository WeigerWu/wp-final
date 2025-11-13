# 資料庫架構文件

## 📋 架構概覽

本資料庫設計支援完整的食譜分享平台功能，包括用戶管理、食譜管理、社交互動、通知系統等。

## 🔐 重要說明：密碼管理

**❌ `profiles` 表中不包含密碼欄位！**

密碼由 Supabase Auth 在 `auth.users` 表中管理：
- 自動加密儲存
- 不暴露在應用程式代碼中
- 符合安全最佳實踐
- 使用 Supabase Auth API 管理密碼

## 📊 資料表結構

### 1. 用戶相關

#### `profiles` - 用戶資料表
```sql
- id: UUID (主鍵, 關聯 auth.users)
- username: TEXT (唯一, 必填)
- display_name: TEXT (顯示名稱)
- avatar_url: TEXT (頭像 URL)
- bio: TEXT (個人簡介)
- website: TEXT (個人網站)
- location: TEXT (位置)
- dietary_preferences: TEXT[] (飲食偏好)
- dietary_restrictions: TEXT[] (飲食限制)
- cuisine_preferences: TEXT[] (偏好菜系)
- recipe_count: INTEGER (食譜數量, 自動更新)
- follower_count: INTEGER (追蹤者數量, 自動更新)
- following_count: INTEGER (追蹤中數量, 自動更新)
- is_public: BOOLEAN (是否公開)
- email_notifications: BOOLEAN (是否接收郵件通知)
```

#### `follows` - 追蹤關係表
```sql
- follower_id: UUID (追蹤者)
- following_id: UUID (被追蹤者)
- created_at: TIMESTAMP
```

### 2. 分類和標籤

#### `categories` - 分類表
```sql
- name: TEXT (分類名稱)
- slug: TEXT (URL 友好的名稱)
- description: TEXT (描述)
- icon: TEXT (圖標)
- parent_id: UUID (父分類, 支援階層)
- sort_order: INTEGER (排序)
```

#### `tags` - 標籤表
```sql
- name: TEXT (標籤名稱)
- slug: TEXT (URL 友好的名稱)
- description: TEXT (描述)
- usage_count: INTEGER (使用次數, 自動更新)
```

#### `recipe_tags` - 食譜標籤關聯表
```sql
- recipe_id: UUID
- tag_id: UUID
```

### 3. 食譜相關

#### `recipes` - 食譜表（核心表格）
```sql
- user_id: UUID (作者)
- title: TEXT (標題, 必填)
- slug: TEXT (URL 友好標題, 自動生成)
- description: TEXT (描述)
- image_url: TEXT (封面圖片)
- servings: INTEGER (份量)
- serving_size: TEXT (份量說明)
- prep_time: INTEGER (準備時間, 分鐘)
- cook_time: INTEGER (烹飪時間, 分鐘)
- total_time: INTEGER (總時間, 分鐘)
- difficulty: TEXT (難度: easy/medium/hard)
- category_id: UUID (分類)
- ingredients: JSONB (食材陣列)
- steps: JSONB (步驟陣列)
- has_nutrition_info: BOOLEAN (是否有營養資訊)
- view_count: INTEGER (瀏覽次數, 自動更新)
- favorite_count: INTEGER (收藏次數, 自動更新)
- rating_count: INTEGER (評分次數, 自動更新)
- average_rating: DECIMAL(3,2) (平均評分, 自動更新)
- comment_count: INTEGER (留言次數, 自動更新)
- status: TEXT (狀態: draft/published/archived)
- is_public: BOOLEAN (是否公開)
- is_featured: BOOLEAN (是否精選)
- source_url: TEXT (來源網址)
- source_name: TEXT (來源名稱)
- meta_description: TEXT (SEO 描述)
- published_at: TIMESTAMP (發布時間, 自動設定)
- search_vector: tsvector (全文搜尋向量, 自動生成)
```

#### `nutrition_info` - 營養資訊表
```sql
- recipe_id: UUID (關聯食譜, 一對一)
- calories: INTEGER (卡路里)
- protein: DECIMAL (蛋白質, g)
- carbohydrates: DECIMAL (碳水化合物, g)
- fat: DECIMAL (脂肪, g)
- fiber: DECIMAL (纖維, g)
- sugar: DECIMAL (糖, g)
- sodium: DECIMAL (鈉, mg)
- serving_size: TEXT (份量說明)
```

#### `recipe_ratings` - 評分表
```sql
- recipe_id: UUID
- user_id: UUID
- rating: INTEGER (1-5)
- review: TEXT (評論, 可選)
```

#### `recipe_favorites` - 收藏表
```sql
- recipe_id: UUID
- user_id: UUID
- collection_id: UUID (收藏到哪個收藏夾)
- notes: TEXT (個人備註)
```

#### `recipe_collections` - 收藏夾表
```sql
- user_id: UUID (擁有者)
- name: TEXT (收藏夾名稱)
- description: TEXT (描述)
- is_public: BOOLEAN (是否公開)
- cover_image_url: TEXT (封面圖片)
- recipe_count: INTEGER (食譜數量, 自動更新)
```

#### `comments` - 留言表
```sql
- recipe_id: UUID
- user_id: UUID
- content: TEXT (留言內容)
- parent_id: UUID (父留言, 支援巢狀留言)
- is_edited: BOOLEAN (是否已編輯)
```

#### `recipe_views` - 瀏覽記錄表
```sql
- recipe_id: UUID
- user_id: UUID (可為 null, 未登入用戶)
- ip_address: INET (IP 地址, 可選)
- viewed_at: TIMESTAMP
```

#### `cooking_history` - 烹飪歷史記錄表
```sql
- recipe_id: UUID
- user_id: UUID
- completed_at: TIMESTAMP (完成時間)
- duration_minutes: INTEGER (實際烹飪時間)
- notes: TEXT (烹飪心得)
- photos: JSONB (完成的照片)
- rating: INTEGER (實際評分)
```

#### `recipe_shares` - 分享記錄表
```sql
- recipe_id: UUID
- user_id: UUID (分享者)
- share_type: TEXT (link/social/email)
- share_platform: TEXT (平台)
```

### 4. 系統表格

#### `notifications` - 通知表
```sql
- user_id: UUID (接收通知的用戶)
- type: TEXT (通知類型)
- title: TEXT (標題)
- content: TEXT (內容)
- link: TEXT (連結)
- is_read: BOOLEAN (是否已讀)
- related_user_id: UUID (相關用戶)
- related_recipe_id: UUID (相關食譜)
```

#### `reports` - 舉報表
```sql
- reporter_id: UUID (舉報者)
- report_type: TEXT (recipe/comment/user)
- reported_recipe_id: UUID (被舉報的食譜)
- reported_comment_id: UUID (被舉報的留言)
- reported_user_id: UUID (被舉報的用戶)
- reason: TEXT (舉報原因)
- description: TEXT (詳細說明)
- status: TEXT (pending/reviewed/resolved/dismissed)
- reviewed_by: UUID (審核者)
```

#### `ingredients_library` - 食材庫表
```sql
- name: TEXT (食材名稱)
- name_zh: TEXT (中文名稱)
- category: TEXT (分類)
- unit: TEXT (常用單位)
- calories_per_unit: DECIMAL (每單位卡路里)
```

## 🔄 自動化功能

### 觸發器 (Triggers)

1. **自動更新時間戳記**
   - `updated_at` 欄位自動更新

2. **自動更新統計資訊**
   - 評分時更新 `recipe.rating_count` 和 `average_rating`
   - 收藏時更新 `recipe.favorite_count`
   - 留言時更新 `recipe.comment_count`
   - 瀏覽時更新 `recipe.view_count`
   - 追蹤時更新 `profile.follower_count` 和 `following_count`

3. **自動生成欄位**
   - 生成 `recipe.slug`
   - 生成 `recipe.search_vector`（全文搜尋）

4. **自動通知**
   - 留言時通知食譜作者

5. **自動計數**
   - 更新標籤使用次數
   - 更新收藏夾食譜數量

## 🔐 安全策略 (RLS)

所有表格都已啟用 Row Level Security (RLS)：

- **公開讀取**：recipes (is_public=true), categories, tags
- **個人資料**：只能查看公開資料或自己的資料
- **所有權控制**：只能修改自己建立的內容
- **統計資訊**：任何人可以查看統計資料

## 📈 效能優化

1. **索引**：所有外鍵和常用查詢欄位都有索引
2. **統計快取**：使用觸發器自動更新統計資訊，減少計算
3. **全文搜尋**：使用 PostgreSQL 的 tsvector 支援全文搜尋
4. **GIN 索引**：tags 和 search_vector 使用 GIN 索引

## 🔄 資料流程

1. **用戶註冊** → 自動建立 `profiles` 記錄
2. **建立食譜** → 自動更新 `profile.recipe_count`
3. **評分** → 自動更新 `recipe.rating_count` 和 `average_rating`
4. **收藏** → 自動更新 `recipe.favorite_count`
5. **留言** → 自動通知作者並更新 `recipe.comment_count`
6. **追蹤** → 自動更新雙方的 `follower_count` 和 `following_count`

## 📝 注意事項

1. **密碼**：永遠不要儲存在 `profiles` 表中
2. **統計資訊**：由觸發器自動維護，不需要手動更新
3. **軟刪除**：使用 `status` 欄位實現軟刪除（如 `archived`）
4. **搜尋**：使用 `search_vector` 欄位進行全文搜尋
5. **效能**：大量資料時考慮使用物化視圖或額外的快取

