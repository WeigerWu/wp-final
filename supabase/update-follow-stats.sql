-- 手動更新所有用戶的追蹤統計數據
-- 這個腳本會重新計算所有用戶的 follower_count 和 following_count

-- 更新所有用戶的 follower_count（被追蹤者數量）
UPDATE public.profiles
SET follower_count = (
    SELECT COUNT(*) 
    FROM public.follows 
    WHERE following_id = profiles.id
);

-- 更新所有用戶的 following_count（追蹤中數量）
UPDATE public.profiles
SET following_count = (
    SELECT COUNT(*) 
    FROM public.follows 
    WHERE follower_id = profiles.id
);

-- 驗證：顯示更新後的統計數據
SELECT 
    id,
    username,
    follower_count,
    following_count
FROM public.profiles
ORDER BY follower_count DESC
LIMIT 10;


