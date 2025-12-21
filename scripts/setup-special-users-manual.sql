-- ============================================
-- 手動設置特殊用戶的 SQL 腳本
-- ============================================
-- 使用說明：
-- 1. 先在 Supabase Dashboard > Authentication > Users 中手動創建這三個用戶：
--    - chaewon@example.com / password123
--    - yujin@example.com / password123  
--    - karina@example.com / password123
-- 2. 然後執行此 SQL 腳本來創建 profiles 和設置 followers
-- ============================================

-- 啟用必要的擴展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 第一部分：創建/更新 Profiles
-- ============================================

-- 為 Chaewon 創建 profile（如果不存在）
INSERT INTO public.profiles (id, username, display_name, bio, created_at, updated_at)
SELECT 
    id,
    'Chaewon',
    'Chaewon',
    '熱愛烹飪的料理達人',
    NOW(),
    NOW()
FROM auth.users
WHERE email = 'chaewon@example.com'
ON CONFLICT (id) DO UPDATE SET
    username = EXCLUDED.username,
    display_name = EXCLUDED.display_name,
    bio = EXCLUDED.bio;

-- 為 Yujin 創建 profile（如果不存在）
INSERT INTO public.profiles (id, username, display_name, bio, created_at, updated_at)
SELECT 
    id,
    'Yujin',
    'Yujin',
    '分享美味食譜的美食愛好者',
    NOW(),
    NOW()
FROM auth.users
WHERE email = 'yujin@example.com'
ON CONFLICT (id) DO UPDATE SET
    username = EXCLUDED.username,
    display_name = EXCLUDED.display_name,
    bio = EXCLUDED.bio;

-- 為 Karina 創建 profile（如果不存在）
INSERT INTO public.profiles (id, username, display_name, bio, created_at, updated_at)
SELECT 
    id,
    'Karina',
    'Karina',
    '專業廚師，專注於創意料理',
    NOW(),
    NOW()
FROM auth.users
WHERE email = 'karina@example.com'
ON CONFLICT (id) DO UPDATE SET
    username = EXCLUDED.username,
    display_name = EXCLUDED.display_name,
    bio = EXCLUDED.bio;

-- ============================================
-- 第二部分：為他們添加 followers（80個）
-- ============================================

DO $$
DECLARE
    chaewon_id UUID;
    yujin_id UUID;
    karina_id UUID;
    all_users UUID[];
    follower_counter INTEGER;
    follower_index INTEGER;
BEGIN
    -- 獲取三個特殊用戶的 ID
    SELECT id INTO chaewon_id FROM auth.users WHERE email = 'chaewon@example.com';
    SELECT id INTO yujin_id FROM auth.users WHERE email = 'yujin@example.com';
    SELECT id INTO karina_id FROM auth.users WHERE email = 'karina@example.com';
    
    IF chaewon_id IS NULL OR yujin_id IS NULL OR karina_id IS NULL THEN
        RAISE EXCEPTION '找不到一個或多個特殊用戶。請先手動在 Supabase Dashboard 中創建這些用戶。';
    END IF;
    
    -- 獲取所有其他用戶的 ID
    SELECT ARRAY_AGG(id) INTO all_users
    FROM auth.users
    WHERE email NOT IN ('chaewon@example.com', 'yujin@example.com', 'karina@example.com')
    AND id IS NOT NULL;
    
    IF all_users IS NULL OR array_length(all_users, 1) < 80 THEN
        RAISE NOTICE '警告：可用用戶數量少於80個，將無法為每個特殊用戶添加80個followers';
        RAISE NOTICE '請先執行 generate-100-users.sql 創建其他用戶';
    END IF;
    
    -- 為 Chaewon 添加 followers
    IF chaewon_id IS NOT NULL AND array_length(all_users, 1) >= 80 THEN
        FOR follower_counter IN 1..80 LOOP
            INSERT INTO public.follows (follower_id, following_id, created_at)
            VALUES (
                all_users[follower_counter],
                chaewon_id,
                NOW() - (random() * interval '30 days')
            ) ON CONFLICT (follower_id, following_id) DO NOTHING;
        END LOOP;
        RAISE NOTICE '已為 Chaewon 添加 followers';
    END IF;
    
    -- 為 Yujin 添加 followers（循環使用用戶）
    IF yujin_id IS NOT NULL AND array_length(all_users, 1) > 0 THEN
        FOR follower_counter IN 1..80 LOOP
            follower_index := ((follower_counter - 1 + 80) % array_length(all_users, 1)) + 1;
            INSERT INTO public.follows (follower_id, following_id, created_at)
            VALUES (
                all_users[follower_index],
                yujin_id,
                NOW() - (random() * interval '30 days')
            ) ON CONFLICT (follower_id, following_id) DO NOTHING;
        END LOOP;
        RAISE NOTICE '已為 Yujin 添加 followers';
    END IF;
    
    -- 為 Karina 添加 followers（循環使用用戶）
    IF karina_id IS NOT NULL AND array_length(all_users, 1) > 0 THEN
        FOR follower_counter IN 1..80 LOOP
            follower_index := ((follower_counter - 1 + 160) % array_length(all_users, 1)) + 1;
            INSERT INTO public.follows (follower_id, following_id, created_at)
            VALUES (
                all_users[follower_index],
                karina_id,
                NOW() - (random() * interval '30 days')
            ) ON CONFLICT (follower_id, following_id) DO NOTHING;
        END LOOP;
        RAISE NOTICE '已為 Karina 添加 followers';
    END IF;
END $$;

-- ============================================
-- 驗證結果
-- ============================================

-- 檢查特殊用戶的 profiles
SELECT 
    u.email,
    p.username,
    p.display_name,
    p.bio
FROM auth.users u
JOIN public.profiles p ON u.id = p.id
WHERE u.email IN ('chaewon@example.com', 'yujin@example.com', 'karina@example.com');

-- 檢查 followers 數量
SELECT 
    p.username,
    COUNT(f.id) as follower_count
FROM public.profiles p
LEFT JOIN public.follows f ON f.following_id = p.id
WHERE p.username IN ('Chaewon', 'Yujin', 'Karina')
GROUP BY p.id, p.username
ORDER BY p.username;

