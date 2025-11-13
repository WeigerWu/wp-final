-- 檢查觸發器設置的 SQL
-- 在 Supabase Dashboard > SQL Editor 執行此 SQL

-- 1. 檢查觸發器是否存在
SELECT 
    trigger_name,
    event_object_table,
    event_manipulation,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'users'
AND trigger_schema = 'auth';

-- 2. 檢查函數是否存在
SELECT 
    routine_name,
    routine_type,
    routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name = 'handle_new_user';

-- 3. 如果觸發器不存在，執行以下 SQL 創建：

-- 創建函數
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, username, display_name)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8)),
        COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8))
    );
    RETURN NEW;
EXCEPTION
    WHEN unique_violation THEN
        -- 如果 profile 已存在，則更新
        UPDATE public.profiles
        SET 
            username = COALESCE(NEW.raw_user_meta_data->>'username', username),
            display_name = COALESCE(NEW.raw_user_meta_data->>'username', display_name)
        WHERE id = NEW.id;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 創建觸發器
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW 
    EXECUTE FUNCTION public.handle_new_user();

-- 4. 檢查是否有用戶但沒有 profile
SELECT 
    u.id,
    u.email,
    u.raw_user_meta_data->>'username' as username,
    CASE WHEN p.id IS NULL THEN '❌ 缺少 profile' ELSE '✅ 有 profile' END as profile_status
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
ORDER BY u.created_at DESC
LIMIT 10;

-- 5. 為所有沒有 profile 的用戶創建 profile（如果需要的話）
INSERT INTO public.profiles (id, username, display_name)
SELECT 
    id,
    COALESCE(raw_user_meta_data->>'username', 'user_' || substr(id::text, 1, 8)),
    COALESCE(raw_user_meta_data->>'username', 'user_' || substr(id::text, 1, 8))
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;

