# 修復 Tags 欄位缺失問題

## 問題描述

發布食譜時出現錯誤：`Could not find the 'tags' column of 'recipes' in the schema cache`

這是因為資料庫中的 `recipes` 表缺少 `tags` 欄位。

## 解決方案

### 快速修復（推薦）

在 Supabase Dashboard 執行 SQL 腳本添加 `tags` 欄位：

1. **登入 Supabase Dashboard**
   - 前往 https://supabase.com/dashboard
   - 選擇你的專案

2. **打開 SQL Editor**
   - 左側選單 > SQL Editor
   - 點擊 "New query"

3. **執行以下 SQL**（或使用 `supabase/fix-add-tags-column.sql`）：

```sql
-- 添加 tags 欄位
ALTER TABLE public.recipes 
ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'::jsonb;

-- 更新現有記錄
UPDATE public.recipes 
SET tags = '[]'::jsonb 
WHERE tags IS NULL;

-- 驗證
SELECT column_name, data_type 
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'recipes' 
AND column_name = 'tags';
```

4. **執行後**，發布功能就可以正常使用 tags 了！

### 暫時解決方案

如果暫時不想修改資料庫，代碼已經修改為：
- 基本發布功能可以正常工作（不包含 tags）
- 標籤功能暫時跳過，不會導致發布失敗

## 驗證

執行 SQL 後，檢查是否有 `tags` 欄位：
- 如果看到查詢結果有 `tags` 欄位 → 成功！
- 如果沒有結果 → 檢查錯誤訊息


