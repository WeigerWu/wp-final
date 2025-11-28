-- ============================================
-- 快速修復：為 recipes 表添加 tags JSONB 欄位
-- ============================================
-- 問題：recipes 表缺少 tags 欄位，導致發布失敗
-- 解決：添加 tags JSONB 欄位（與 ingredients 和 steps 類似）
--
-- 執行方式：
-- 1. 登入 Supabase Dashboard
-- 2. 前往 SQL Editor
-- 3. 複製貼上此腳本並執行

-- 步驟 1: 添加 tags 欄位
ALTER TABLE public.recipes 
ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'::jsonb;

-- 步驟 2: 更新現有記錄（將 NULL 設為空陣列）
UPDATE public.recipes 
SET tags = '[]'::jsonb 
WHERE tags IS NULL;

-- 步驟 3: 創建索引（可選，用於搜索標籤）
CREATE INDEX IF NOT EXISTS idx_recipes_tags ON public.recipes USING GIN (tags);

-- 步驟 4: 驗證欄位已添加
SELECT 
    column_name, 
    data_type, 
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'recipes' 
AND column_name = 'tags';

-- 如果看到 tags 欄位，表示成功！
-- 如果沒有，請檢查錯誤訊息


