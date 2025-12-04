-- 快速修復：為 recipes 表添加 tags JSONB 欄位
-- 執行方式：在 Supabase Dashboard > SQL Editor 中執行此腳本

-- 添加 tags 欄位（如果不存在）
ALTER TABLE public.recipes 
ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'::jsonb;

-- 更新現有記錄
UPDATE public.recipes 
SET tags = '[]'::jsonb 
WHERE tags IS NULL;

-- 驗證欄位已添加
SELECT 
    column_name, 
    data_type, 
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'recipes' 
AND column_name = 'tags';









