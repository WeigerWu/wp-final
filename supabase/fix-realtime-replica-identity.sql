-- ======================================
-- 修復 Realtime 不推送 UPDATE 事件的問題
-- ======================================

-- 問題：Realtime subscription 已連接，但沒有收到 UPDATE 事件
-- 原因：profiles 表的 REPLICA IDENTITY 沒有設置為 FULL
-- 解決方案：設置 REPLICA IDENTITY FULL

-- 步驟 1: 檢查當前的 REPLICA IDENTITY 設置
SELECT
    n.nspname as schemaname,
    c.relname as tablename,
    CASE c.relreplident
        WHEN 'd' THEN 'default (primary key)'
        WHEN 'n' THEN 'nothing'
        WHEN 'f' THEN 'full'
        WHEN 'i' THEN 'index'
    END as replica_identity
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
AND c.relname = 'profiles';

-- 步驟 2: 設置 profiles 表的 REPLICA IDENTITY 為 FULL
-- 這樣 Realtime 才能推送完整的 UPDATE 事件
ALTER TABLE public.profiles REPLICA IDENTITY FULL;

-- 步驟 3: 再次檢查設置是否成功
SELECT
    n.nspname as schemaname,
    c.relname as tablename,
    CASE c.relreplident
        WHEN 'd' THEN '❌ default (需要改為 full)'
        WHEN 'n' THEN '❌ nothing (需要改為 full)'
        WHEN 'f' THEN '✅ full (正確！)'
        WHEN 'i' THEN '⚠️  index (建議改為 full)'
    END as replica_identity_status
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
AND c.relname = 'profiles';

-- 步驟 4: 驗證 Realtime publication 配置
SELECT
    '驗證 Realtime 配置' as 檢查項目,
    tablename,
    '✅ 已加入 Realtime publication' as 狀態
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
AND tablename = 'profiles';
