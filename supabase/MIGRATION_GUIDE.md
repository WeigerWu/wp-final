# 資料遷移指南：填充 Tags 和 Ingredients 表格

## 概述

此遷移腳本會將現有 `recipes` 表中的 `tags` 和 `ingredients` 資料提取出來，分別填入以下表格：
- `tags` - 標籤主表
- `recipe_tags` - 食譜與標籤的關聯表
- `ingredients_library` - 食材庫

## 遷移前的準備

### 1. 預覽將要遷移的資料（強烈推薦）

在執行遷移前，建議先執行預覽腳本來查看將會提取哪些資料：

**使用 Supabase Dashboard SQL Editor 執行：**
- 打開 `supabase/preview-migration-data.sql`
- 複製內容到 SQL Editor 並執行
- 查看結果，確認資料格式正確

這個腳本**不會修改任何資料**，僅用於預覽。

### 2. 檢查現有資料

或者，你也可以手動檢查現有資料：

```sql
-- 檢查有多少食譜有 tags
SELECT COUNT(*) 
FROM public.recipes 
WHERE tags IS NOT NULL 
  AND jsonb_typeof(tags) = 'array' 
  AND jsonb_array_length(tags) > 0;

-- 檢查有多少食譜有 ingredients
SELECT COUNT(*) 
FROM public.recipes 
WHERE ingredients IS NOT NULL 
  AND jsonb_typeof(ingredients) = 'array' 
  AND jsonb_array_length(ingredients) > 0;

-- 查看一些範例 tags
SELECT id, title, tags 
FROM public.recipes 
WHERE tags IS NOT NULL 
  AND jsonb_array_length(tags) > 0
LIMIT 5;

-- 查看一些範例 ingredients
SELECT id, title, ingredients 
FROM public.recipes 
WHERE ingredients IS NOT NULL 
  AND jsonb_array_length(ingredients) > 0
LIMIT 3;
```

### 2. 備份資料庫

**強烈建議**在執行遷移前先備份資料庫！可以使用 Supabase Dashboard 的備份功能。

## 執行遷移

### 方法一：透過 Supabase Dashboard

1. 登入 Supabase Dashboard
2. 進入你的專案
3. 點選左側選單的 **SQL Editor**
4. 複製 `supabase/migrate-populate-tags-ingredients.sql` 的內容
5. 貼上到 SQL Editor
6. 點選 **Run** 執行

### 方法二：透過 Supabase CLI

```bash
# 確保已安裝 Supabase CLI
supabase db push --file supabase/migrate-populate-tags-ingredients.sql
```

### 方法三：透過 psql

```bash
psql -h <your-supabase-host> -U postgres -d postgres -f supabase/migrate-populate-tags-ingredients.sql
```

## 遷移後驗證

執行遷移後，檢查結果：

```sql
-- 檢查標籤數量
SELECT COUNT(*) AS tag_count FROM public.tags;
SELECT COUNT(*) AS recipe_tag_count FROM public.recipe_tags;

-- 檢查食材數量
SELECT COUNT(*) AS ingredient_count FROM public.ingredients_library;

-- 查看最常用的標籤
SELECT t.name, t.usage_count, COUNT(rt.recipe_id) AS recipe_count
FROM public.tags t
LEFT JOIN public.recipe_tags rt ON t.id = rt.tag_id
GROUP BY t.id, t.name, t.usage_count
ORDER BY t.usage_count DESC
LIMIT 10;

-- 查看食材分類統計
SELECT category, COUNT(*) AS count
FROM public.ingredients_library
GROUP BY category
ORDER BY count DESC;

-- 檢查是否有食譜沒有關聯到任何標籤（但原本有 tags）
SELECT r.id, r.title, r.tags
FROM public.recipes r
WHERE r.tags IS NOT NULL 
  AND jsonb_array_length(r.tags) > 0
  AND NOT EXISTS (
      SELECT 1 FROM public.recipe_tags rt WHERE rt.recipe_id = r.id
  );
```

## 常見問題

### Q: 如果標籤名稱重複怎麼辦？

A: 腳本會自動處理重複的標籤名稱，使用 `ON CONFLICT DO NOTHING` 來避免重複插入。

### Q: 如果食材名稱有大小寫差異怎麼辦？

A: 腳本使用 `LOWER()` 函數來統一處理大小寫，所以 "雞蛋" 和 "雞蛋" 會被視為同一個食材。

### Q: 遷移後原有的 recipes.tags 和 recipes.ingredients 欄位會保留嗎？

A: 是的，這些欄位會保留。遷移只是將資料複製到新表格，不會刪除原有資料。

### Q: 如果遷移失敗怎麼辦？

A: 
1. 檢查錯誤訊息
2. 確保所有表格都已建立（執行 `supabase/schema.sql`）
3. 檢查資料格式是否正確
4. 如果問題無法解決，可以從備份還原資料庫

### Q: 可以重複執行遷移腳本嗎？

A: 可以！腳本使用了 `ON CONFLICT DO NOTHING` 和 `NOT EXISTS` 檢查，所以重複執行不會產生重複資料。

## 下一步

遷移完成後，建議：

1. **更新應用程式碼**：修改上傳和編輯食譜的邏輯，使其直接使用新的表格結構
2. **測試查詢功能**：測試基於標籤和食材的搜尋功能
3. **優化查詢**：利用新的表格結構優化現有的查詢性能

## 回滾（如果需要）

如果遷移後發現問題需要回滾：

```sql
-- 刪除所有遷移產生的資料（謹慎使用！）
DELETE FROM public.recipe_tags;
DELETE FROM public.tags;
DELETE FROM public.ingredients_library;
```

或者從備份還原資料庫。

