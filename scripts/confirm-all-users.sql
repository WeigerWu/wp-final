-- 手動確認所有用戶的 Email（僅用於開發測試）
-- 在 Supabase Dashboard > SQL Editor 執行此 SQL

-- 1. 查看未確認的用戶
SELECT 
    id,
    email,
    created_at,
    email_confirmed_at,
    CASE 
        WHEN email_confirmed_at IS NULL THEN '❌ 未確認'
        ELSE '✅ 已確認'
    END as status
FROM auth.users
ORDER BY created_at DESC;

-- 2. 手動確認所有用戶的 Email（謹慎使用！）
UPDATE auth.users
SET email_confirmed_at = COALESCE(email_confirmed_at, NOW())
WHERE email_confirmed_at IS NULL;

-- 3. 驗證結果
SELECT 
    'Total users' as type,
    COUNT(*) as count
FROM auth.users
UNION ALL
SELECT 
    'Confirmed users' as type,
    COUNT(*) as count
FROM auth.users
WHERE email_confirmed_at IS NOT NULL;

-- ⚠️ 注意：此 SQL 會確認所有未確認的用戶
-- 僅用於開發測試，不要在有真實用戶的生產環境中使用

