-- 遷移腳本：為 recipes 表添加 tags JSONB 欄位
-- 執行方式：在 Supabase SQL Editor 中執行此腳本

-- 添加 tags 欄位（如果不存在）
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'recipes' 
        AND column_name = 'tags'
    ) THEN
        ALTER TABLE public.recipes 
        ADD COLUMN tags JSONB DEFAULT '[]'::jsonb;
        
        RAISE NOTICE '✅ tags 欄位已添加';
    ELSE
        RAISE NOTICE '⚠️  tags 欄位已存在，跳過';
    END IF;
END $$;

-- 更新現有記錄，將 NULL 設為空陣列
UPDATE public.recipes 
SET tags = '[]'::jsonb 
WHERE tags IS NULL;

-- 創建索引（可選，用於搜索）
CREATE INDEX IF NOT EXISTS idx_recipes_tags ON public.recipes USING GIN (tags);

-- 驗證
SELECT 
    column_name, 
    data_type, 
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'recipes' 
AND column_name = 'tags';










