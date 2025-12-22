-- ============================================
-- 使用者行為追蹤系統 - user_events 資料表
-- ============================================
-- 用於記錄使用者在平台上的所有行為活動
-- ============================================

-- 建立 user_events 資料表
CREATE TABLE IF NOT EXISTS public.user_events (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    -- 匿名訪客追蹤（未登入使用者）
    session_id TEXT,
    -- 事件類型
    event_type TEXT NOT NULL,
    -- 事件詳細資料（JSON 格式）
    event_data JSONB,
    -- 頁面資訊
    page_path TEXT,
    page_title TEXT,
    -- 技術資訊
    user_agent TEXT,
    ip_address TEXT,
    -- 時間戳記
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 建立索引以提升查詢效能
CREATE INDEX IF NOT EXISTS idx_user_events_user_id ON public.user_events(user_id);
CREATE INDEX IF NOT EXISTS idx_user_events_event_type ON public.user_events(event_type);
CREATE INDEX IF NOT EXISTS idx_user_events_created_at ON public.user_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_events_session_id ON public.user_events(session_id);
CREATE INDEX IF NOT EXISTS idx_user_events_user_created ON public.user_events(user_id, created_at DESC);

-- 建立 GIN 索引用於 JSONB 查詢
CREATE INDEX IF NOT EXISTS idx_user_events_event_data ON public.user_events USING GIN (event_data);

-- 啟用 Row Level Security (RLS)
ALTER TABLE public.user_events ENABLE ROW LEVEL SECURITY;

-- RLS 政策：使用者可以查看自己的事件
CREATE POLICY "Users can view their own events"
    ON public.user_events
    FOR SELECT
    USING (auth.uid() = user_id);

-- RLS 政策：任何人都可以插入事件（用於追蹤）
CREATE POLICY "Anyone can insert events"
    ON public.user_events
    FOR INSERT
    WITH CHECK (true);

-- RLS 政策：僅服務角色可以查看所有事件（用於後台管理）
-- 注意：後台管理需要使用 service_role_key，不透過 RLS

-- 建立函數：清理舊事件（可選，用於資料保留政策）
CREATE OR REPLACE FUNCTION public.cleanup_old_events()
RETURNS void AS $$
BEGIN
    -- 刪除 90 天前的舊事件
    DELETE FROM public.user_events
    WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 建立函數：取得使用者活動統計
CREATE OR REPLACE FUNCTION public.get_user_activity_stats(p_user_id UUID, p_days INTEGER DEFAULT 30)
RETURNS TABLE (
    event_type TEXT,
    event_count BIGINT,
    last_activity TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ue.event_type,
        COUNT(*) as event_count,
        MAX(ue.created_at) as last_activity
    FROM public.user_events ue
    WHERE ue.user_id = p_user_id
        AND ue.created_at >= NOW() - (p_days || ' days')::INTERVAL
    GROUP BY ue.event_type
    ORDER BY event_count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 建立函數：取得熱門事件類型統計
CREATE OR REPLACE FUNCTION public.get_popular_events(p_days INTEGER DEFAULT 7)
RETURNS TABLE (
    event_type TEXT,
    event_count BIGINT,
    unique_users BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ue.event_type,
        COUNT(*) as event_count,
        COUNT(DISTINCT ue.user_id) as unique_users
    FROM public.user_events ue
    WHERE ue.created_at >= NOW() - (p_days || ' days')::INTERVAL
        AND ue.user_id IS NOT NULL
    GROUP BY ue.event_type
    ORDER BY event_count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

