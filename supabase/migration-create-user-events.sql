-- 遷移腳本：建立 user_events 資料表
-- 執行方式：在 Supabase SQL Editor 中執行此腳本
-- 用途：儲存使用者行為追蹤數據，用於數據分析

-- 建立 user_events 資料表
CREATE TABLE IF NOT EXISTS public.user_events (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    session_id TEXT,
    event_type TEXT NOT NULL,
    event_data JSONB DEFAULT '{}'::jsonb,
    page_path TEXT,
    page_title TEXT,
    user_agent TEXT,
    ip_address INET,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 建立索引以優化查詢效能
CREATE INDEX IF NOT EXISTS idx_user_events_user_id ON public.user_events(user_id);
CREATE INDEX IF NOT EXISTS idx_user_events_session_id ON public.user_events(session_id);
CREATE INDEX IF NOT EXISTS idx_user_events_event_type ON public.user_events(event_type);
CREATE INDEX IF NOT EXISTS idx_user_events_created_at ON public.user_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_events_page_path ON public.user_events(page_path);

-- 建立複合索引用於常見查詢
CREATE INDEX IF NOT EXISTS idx_user_events_user_event_type ON public.user_events(user_id, event_type);
CREATE INDEX IF NOT EXISTS idx_user_events_created_event_type ON public.user_events(created_at DESC, event_type);

-- 啟用 Row Level Security (RLS)
ALTER TABLE public.user_events ENABLE ROW LEVEL SECURITY;

-- RLS 政策：允許所有人讀取（用於統計分析）
CREATE POLICY "允許所有人讀取 user_events"
    ON public.user_events
    FOR SELECT
    USING (true);

-- RLS 政策：允許插入事件（已認證用戶或匿名訪客）
CREATE POLICY "允許插入事件"
    ON public.user_events
    FOR INSERT
    WITH CHECK (true);

-- 備註說明
COMMENT ON TABLE public.user_events IS '使用者行為追蹤事件表，用於數據分析和統計';
COMMENT ON COLUMN public.user_events.user_id IS '使用者 ID（已登入用戶），NULL 表示匿名訪客';
COMMENT ON COLUMN public.user_events.session_id IS '會話 ID（用於追蹤匿名訪客）';
COMMENT ON COLUMN public.user_events.event_type IS '事件類型（page_view, view_recipe, create_recipe 等）';
COMMENT ON COLUMN public.user_events.event_data IS '事件相關資料（JSON 格式）';

