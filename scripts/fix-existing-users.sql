-- 為現有用戶創建 profile 的 SQL
-- 在 Supabase Dashboard > SQL Editor 執行此 SQL

-- 1. 先檢查哪些用戶沒有 profile
SELECT 
    u.id,
    u.email,
    u.created_at,
    u.raw_user_meta_data->>'username' as username,
    CASE WHEN p.id IS NULL THEN '❌ 缺少 profile' ELSE '✅ 有 profile' END as profile_status
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
ORDER BY u.created_at DESC;

-- 2. 為所有沒有 profile 的用戶創建 profile
INSERT INTO public.profiles (id, username, display_name)
SELECT 
    id,
    COALESCE(raw_user_meta_data->>'username', 'user_' || substr(id::text, 1, 8)),
    COALESCE(raw_user_meta_data->>'username', 'user_' || substr(id::text, 1, 8))
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;

-- 3. 驗證結果
SELECT 
    COUNT(*) as total_users_with_profiles
FROM auth.users u
INNER JOIN public.profiles p ON u.id = p.id;

