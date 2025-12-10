-- 啟用 profiles 表的 Realtime 複製
-- 在 Supabase SQL Editor 執行此腳本

-- 1. 檢查 supabase_realtime publication 是否存在
SELECT * FROM pg_publication WHERE pubname = 'supabase_realtime';

-- 2. 檢查 profiles 表是否已經在 publication 中
SELECT 
    schemaname,
    tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
AND tablename = 'profiles';

-- 3. 如果上面的查詢沒有結果（profiles 表不在 publication 中），執行以下：
-- 將 profiles 表添加到 Realtime publication
-- 注意：如果表已經在 publication 中，這會報錯，但可以忽略
DO $$
BEGIN
    -- 嘗試添加表，如果已經存在會報錯，但我們用 EXCEPTION 處理
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
        RAISE NOTICE '✅ profiles 表已添加到 Realtime publication';
    EXCEPTION
        WHEN duplicate_object THEN
            RAISE NOTICE 'ℹ️  profiles 表已經在 Realtime publication 中';
        WHEN OTHERS THEN
            RAISE NOTICE '⚠️  錯誤: %', SQLERRM;
    END;
END $$;

-- 4. 再次驗證 profiles 表是否已添加到 publication
SELECT 
    schemaname,
    tablename,
    CASE 
        WHEN tablename = 'profiles' THEN '✅ Realtime 已啟用'
        ELSE '❌ Realtime 未啟用'
    END as 狀態
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
AND tablename = 'profiles';

