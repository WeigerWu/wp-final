-- ======================================
-- 重新創建 follows 觸發器
-- ======================================

-- 步驟 1: 刪除舊的觸發器（如果存在）
DROP TRIGGER IF EXISTS update_profile_stats_from_follows ON public.follows;

-- 步驟 2: 刪除舊的函數（如果存在）
DROP FUNCTION IF EXISTS update_profile_stats_from_follows();

-- 步驟 3: 創建新的觸發器函數
CREATE OR REPLACE FUNCTION update_profile_stats_from_follows()
RETURNS TRIGGER AS $$
BEGIN
    -- 當 INSERT 時，更新兩個用戶的統計
    IF (TG_OP = 'INSERT') THEN
        -- 更新被追蹤者（following_id）的 follower_count
        UPDATE public.profiles
        SET follower_count = (
            SELECT COUNT(*)
            FROM public.follows
            WHERE following_id = NEW.following_id
        )
        WHERE id = NEW.following_id;

        -- 更新追蹤者（follower_id）的 following_count
        UPDATE public.profiles
        SET following_count = (
            SELECT COUNT(*)
            FROM public.follows
            WHERE follower_id = NEW.follower_id
        )
        WHERE id = NEW.follower_id;

        RETURN NEW;
    END IF;

    -- 當 DELETE 時，更新兩個用戶的統計
    IF (TG_OP = 'DELETE') THEN
        -- 更新被追蹤者（following_id）的 follower_count
        UPDATE public.profiles
        SET follower_count = (
            SELECT COUNT(*)
            FROM public.follows
            WHERE following_id = OLD.following_id
        )
        WHERE id = OLD.following_id;

        -- 更新追蹤者（follower_id）的 following_count
        UPDATE public.profiles
        SET following_count = (
            SELECT COUNT(*)
            FROM public.follows
            WHERE follower_id = OLD.follower_id
        )
        WHERE id = OLD.follower_id;

        RETURN OLD;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 步驟 4: 創建新的觸發器
CREATE TRIGGER update_profile_stats_from_follows
    AFTER INSERT OR DELETE ON public.follows
    FOR EACH ROW
    EXECUTE FUNCTION update_profile_stats_from_follows();

-- 步驟 5: 驗證觸發器已創建
SELECT
    '✅ 觸發器已創建' as 狀態,
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
AND event_object_table = 'follows'
AND trigger_name = 'update_profile_stats_from_follows';
