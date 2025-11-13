-- ============================================
-- 食譜分享平台 - 完整資料庫架構
-- ============================================
-- 適用於全新安裝
-- 執行前請確保已刪除所有舊表格
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 用戶相關表格
-- ============================================

-- Create profiles table (擴充版)
-- 注意：密碼不應該存在 profiles 表中，密碼由 Supabase Auth 在 auth.users 中管理
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    display_name TEXT,
    avatar_url TEXT,
    bio TEXT,
    website TEXT,
    location TEXT,
    -- 用戶偏好設定
    dietary_preferences TEXT[],
    dietary_restrictions TEXT[],
    cuisine_preferences TEXT[],
    -- 統計資訊
    recipe_count INTEGER DEFAULT 0,
    follower_count INTEGER DEFAULT 0,
    following_count INTEGER DEFAULT 0,
    -- 設定
    is_public BOOLEAN DEFAULT true,
    email_notifications BOOLEAN DEFAULT true,
    -- 時間戳記
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 用戶追蹤系統
CREATE TABLE IF NOT EXISTS public.follows (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    follower_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    following_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(follower_id, following_id),
    CHECK (follower_id != following_id)
);

-- ============================================
-- 分類和標籤系統
-- ============================================

-- 分類系統（必須在 recipes 之前建立）
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    icon TEXT,
    parent_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 標籤系統
CREATE TABLE IF NOT EXISTS public.tags (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 食材庫（用於搜尋和推薦）
CREATE TABLE IF NOT EXISTS public.ingredients_library (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    name_zh TEXT,
    category TEXT,
    unit TEXT,
    calories_per_unit DECIMAL(10, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ============================================
-- 食譜相關表格（必須在分類和標籤之後）
-- ============================================

-- Create recipes table (擴充版)
CREATE TABLE IF NOT EXISTS public.recipes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    slug TEXT,
    description TEXT,
    image_url TEXT,
    -- 基本資訊
    servings INTEGER,
    serving_size TEXT,
    prep_time INTEGER, -- 準備時間（分鐘）
    cook_time INTEGER, -- 烹飪時間（分鐘）
    total_time INTEGER, -- 總時間（分鐘）
    difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),
    -- 分類
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    -- 內容
    ingredients JSONB NOT NULL DEFAULT '[]'::jsonb,
    steps JSONB NOT NULL DEFAULT '[]'::jsonb,
    -- 營養資訊
    has_nutrition_info BOOLEAN DEFAULT false,
    -- 統計資訊
    view_count INTEGER DEFAULT 0,
    favorite_count INTEGER DEFAULT 0,
    rating_count INTEGER DEFAULT 0,
    average_rating DECIMAL(3, 2) DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    -- 狀態和可見性
    status TEXT DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
    is_public BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    -- 來源資訊
    source_url TEXT,
    source_name TEXT,
    -- SEO
    meta_description TEXT,
    -- 時間戳記
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    published_at TIMESTAMP WITH TIME ZONE,
    -- 搜尋優化
    search_vector tsvector
);

-- 食譜標籤關聯（必須在 recipes 和 tags 之後）
CREATE TABLE IF NOT EXISTS public.recipe_tags (
    recipe_id UUID REFERENCES public.recipes(id) ON DELETE CASCADE NOT NULL,
    tag_id UUID REFERENCES public.tags(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    PRIMARY KEY (recipe_id, tag_id)
);

-- 營養資訊表格
CREATE TABLE IF NOT EXISTS public.nutrition_info (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    recipe_id UUID REFERENCES public.recipes(id) ON DELETE CASCADE NOT NULL UNIQUE,
    calories INTEGER,
    protein DECIMAL(10, 2),
    carbohydrates DECIMAL(10, 2),
    fat DECIMAL(10, 2),
    fiber DECIMAL(10, 2),
    sugar DECIMAL(10, 2),
    sodium DECIMAL(10, 2),
    serving_size TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 收藏夾/資料夾（必須在 recipe_favorites 之前定義）
CREATE TABLE IF NOT EXISTS public.recipe_collections (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT false,
    cover_image_url TEXT,
    recipe_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 食譜收藏（擴充版）
CREATE TABLE IF NOT EXISTS public.recipe_favorites (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    recipe_id UUID REFERENCES public.recipes(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    collection_id UUID REFERENCES public.recipe_collections(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(recipe_id, user_id)
);

-- 食譜評分
CREATE TABLE IF NOT EXISTS public.recipe_ratings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    recipe_id UUID REFERENCES public.recipes(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
    review TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(recipe_id, user_id)
);

-- 留言（擴充版）
CREATE TABLE IF NOT EXISTS public.comments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    recipe_id UUID REFERENCES public.recipes(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
    is_edited BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 食譜瀏覽記錄
CREATE TABLE IF NOT EXISTS public.recipe_views (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    recipe_id UUID REFERENCES public.recipes(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    ip_address INET,
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 烹飪歷史記錄（用於烹飪模式）
CREATE TABLE IF NOT EXISTS public.cooking_history (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    recipe_id UUID REFERENCES public.recipes(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    duration_minutes INTEGER,
    notes TEXT,
    photos JSONB,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 食譜分享記錄
CREATE TABLE IF NOT EXISTS public.recipe_shares (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    recipe_id UUID REFERENCES public.recipes(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    share_type TEXT NOT NULL CHECK (share_type IN ('link', 'social', 'email')),
    share_platform TEXT,
    shared_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ============================================
-- 通知系統
-- ============================================

CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT,
    link TEXT,
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    related_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    related_recipe_id UUID REFERENCES public.recipes(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ============================================
-- 舉報系統
-- ============================================

CREATE TABLE IF NOT EXISTS public.reports (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    reporter_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    report_type TEXT NOT NULL CHECK (report_type IN ('recipe', 'comment', 'user')),
    reported_recipe_id UUID REFERENCES public.recipes(id) ON DELETE CASCADE,
    reported_comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
    reported_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
    reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ============================================
-- 索引建立
-- ============================================

-- Profiles 索引
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at DESC);

-- Follows 索引
CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON public.follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following_id ON public.follows(following_id);

-- Categories 索引
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON public.categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories(slug);

-- Tags 索引
CREATE INDEX IF NOT EXISTS idx_tags_slug ON public.tags(slug);
CREATE INDEX IF NOT EXISTS idx_tags_name ON public.tags(name);

-- Recipe Tags 索引
CREATE INDEX IF NOT EXISTS idx_recipe_tags_recipe_id ON public.recipe_tags(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_tags_tag_id ON public.recipe_tags(tag_id);

-- Recipes 索引
CREATE INDEX IF NOT EXISTS idx_recipes_user_id ON public.recipes(user_id);
CREATE INDEX IF NOT EXISTS idx_recipes_category_id ON public.recipes(category_id);
CREATE INDEX IF NOT EXISTS idx_recipes_status ON public.recipes(status);
CREATE INDEX IF NOT EXISTS idx_recipes_is_public ON public.recipes(is_public);
CREATE INDEX IF NOT EXISTS idx_recipes_is_featured ON public.recipes(is_featured);
CREATE INDEX IF NOT EXISTS idx_recipes_created_at ON public.recipes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_recipes_published_at ON public.recipes(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_recipes_difficulty ON public.recipes(difficulty);
CREATE INDEX IF NOT EXISTS idx_recipes_slug ON public.recipes(slug);
CREATE INDEX IF NOT EXISTS idx_recipes_search_vector ON public.recipes USING GIN(search_vector);

-- Recipe Ratings 索引
CREATE INDEX IF NOT EXISTS idx_recipe_ratings_recipe_id ON public.recipe_ratings(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_ratings_user_id ON public.recipe_ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_recipe_ratings_rating ON public.recipe_ratings(rating);

-- Recipe Favorites 索引
CREATE INDEX IF NOT EXISTS idx_recipe_favorites_user_id ON public.recipe_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_recipe_favorites_recipe_id ON public.recipe_favorites(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_favorites_collection_id ON public.recipe_favorites(collection_id);

-- Recipe Collections 索引
CREATE INDEX IF NOT EXISTS idx_recipe_collections_user_id ON public.recipe_collections(user_id);
CREATE INDEX IF NOT EXISTS idx_recipe_collections_is_public ON public.recipe_collections(is_public);

-- Comments 索引
CREATE INDEX IF NOT EXISTS idx_comments_recipe_id ON public.comments(recipe_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON public.comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON public.comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON public.comments(created_at DESC);

-- Recipe Views 索引
CREATE INDEX IF NOT EXISTS idx_recipe_views_recipe_id ON public.recipe_views(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_views_user_id ON public.recipe_views(user_id);
CREATE INDEX IF NOT EXISTS idx_recipe_views_viewed_at ON public.recipe_views(viewed_at DESC);

-- Cooking History 索引
CREATE INDEX IF NOT EXISTS idx_cooking_history_recipe_id ON public.cooking_history(recipe_id);
CREATE INDEX IF NOT EXISTS idx_cooking_history_user_id ON public.cooking_history(user_id);
CREATE INDEX IF NOT EXISTS idx_cooking_history_completed_at ON public.cooking_history(completed_at DESC);

-- Notifications 索引
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

-- Reports 索引
CREATE INDEX IF NOT EXISTS idx_reports_reporter_id ON public.reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON public.reports(created_at DESC);

-- ============================================
-- Row Level Security (RLS)
-- ============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nutrition_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ingredients_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cooking_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS Policies
-- ============================================

-- Profiles Policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
    FOR SELECT USING (is_public = true OR auth.uid() = id);

DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Follows Policies
DROP POLICY IF EXISTS "Follows are viewable by everyone" ON public.follows;
CREATE POLICY "Follows are viewable by everyone" ON public.follows
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can create their own follows" ON public.follows;
CREATE POLICY "Users can create their own follows" ON public.follows
    FOR INSERT WITH CHECK (auth.uid() = follower_id);

DROP POLICY IF EXISTS "Users can delete their own follows" ON public.follows;
CREATE POLICY "Users can delete their own follows" ON public.follows
    FOR DELETE USING (auth.uid() = follower_id);

-- Categories Policies (公開讀取)
DROP POLICY IF EXISTS "Categories are viewable by everyone" ON public.categories;
CREATE POLICY "Categories are viewable by everyone" ON public.categories
    FOR SELECT USING (true);

-- Tags Policies (公開讀取)
DROP POLICY IF EXISTS "Tags are viewable by everyone" ON public.tags;
CREATE POLICY "Tags are viewable by everyone" ON public.tags
    FOR SELECT USING (true);

-- Recipe Tags Policies
DROP POLICY IF EXISTS "Recipe tags are viewable by everyone" ON public.recipe_tags;
CREATE POLICY "Recipe tags are viewable by everyone" ON public.recipe_tags
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Recipe authors can manage tags" ON public.recipe_tags;
CREATE POLICY "Recipe authors can manage tags" ON public.recipe_tags
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.recipes
            WHERE recipes.id = recipe_tags.recipe_id
            AND recipes.user_id = auth.uid()
        )
    );

-- Nutrition Info Policies
DROP POLICY IF EXISTS "Nutrition info is viewable by everyone" ON public.nutrition_info;
CREATE POLICY "Nutrition info is viewable by everyone" ON public.nutrition_info
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Recipe authors can manage nutrition info" ON public.nutrition_info;
CREATE POLICY "Recipe authors can manage nutrition info" ON public.nutrition_info
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.recipes
            WHERE recipes.id = nutrition_info.recipe_id
            AND recipes.user_id = auth.uid()
        )
    );

-- Ingredients Library Policies (公開讀取)
DROP POLICY IF EXISTS "Ingredients library is viewable by everyone" ON public.ingredients_library;
CREATE POLICY "Ingredients library is viewable by everyone" ON public.ingredients_library
    FOR SELECT USING (true);

-- Recipes Policies
DROP POLICY IF EXISTS "Public recipes are viewable by everyone" ON public.recipes;
CREATE POLICY "Public recipes are viewable by everyone" ON public.recipes
    FOR SELECT USING (is_public = true AND status = 'published');

DROP POLICY IF EXISTS "Users can view their own recipes" ON public.recipes;
CREATE POLICY "Users can view their own recipes" ON public.recipes
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own recipes" ON public.recipes;
CREATE POLICY "Users can create their own recipes" ON public.recipes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own recipes" ON public.recipes;
CREATE POLICY "Users can update their own recipes" ON public.recipes
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own recipes" ON public.recipes;
CREATE POLICY "Users can delete their own recipes" ON public.recipes
    FOR DELETE USING (auth.uid() = user_id);

-- Recipe Ratings Policies
DROP POLICY IF EXISTS "Ratings are viewable by everyone" ON public.recipe_ratings;
CREATE POLICY "Ratings are viewable by everyone" ON public.recipe_ratings
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can create their own ratings" ON public.recipe_ratings;
CREATE POLICY "Users can create their own ratings" ON public.recipe_ratings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own ratings" ON public.recipe_ratings;
CREATE POLICY "Users can update their own ratings" ON public.recipe_ratings
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own ratings" ON public.recipe_ratings;
CREATE POLICY "Users can delete their own ratings" ON public.recipe_ratings
    FOR DELETE USING (auth.uid() = user_id);

-- Recipe Favorites Policies
DROP POLICY IF EXISTS "Favorites are viewable by everyone" ON public.recipe_favorites;
CREATE POLICY "Favorites are viewable by everyone" ON public.recipe_favorites
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can create their own favorites" ON public.recipe_favorites;
CREATE POLICY "Users can create their own favorites" ON public.recipe_favorites
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own favorites" ON public.recipe_favorites;
CREATE POLICY "Users can update their own favorites" ON public.recipe_favorites
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own favorites" ON public.recipe_favorites;
CREATE POLICY "Users can delete their own favorites" ON public.recipe_favorites
    FOR DELETE USING (auth.uid() = user_id);

-- Recipe Collections Policies
DROP POLICY IF EXISTS "Public collections are viewable by everyone" ON public.recipe_collections;
CREATE POLICY "Public collections are viewable by everyone" ON public.recipe_collections
    FOR SELECT USING (is_public = true OR auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own collections" ON public.recipe_collections;
CREATE POLICY "Users can view their own collections" ON public.recipe_collections
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own collections" ON public.recipe_collections;
CREATE POLICY "Users can create their own collections" ON public.recipe_collections
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own collections" ON public.recipe_collections;
CREATE POLICY "Users can update their own collections" ON public.recipe_collections
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own collections" ON public.recipe_collections;
CREATE POLICY "Users can delete their own collections" ON public.recipe_collections
    FOR DELETE USING (auth.uid() = user_id);

-- Comments Policies
DROP POLICY IF EXISTS "Comments are viewable by everyone" ON public.comments;
CREATE POLICY "Comments are viewable by everyone" ON public.comments
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can create their own comments" ON public.comments;
CREATE POLICY "Users can create their own comments" ON public.comments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own comments" ON public.comments;
CREATE POLICY "Users can update their own comments" ON public.comments
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own comments" ON public.comments;
CREATE POLICY "Users can delete their own comments" ON public.comments
    FOR DELETE USING (auth.uid() = user_id);

-- Recipe Views Policies
DROP POLICY IF EXISTS "Anyone can create view records" ON public.recipe_views;
CREATE POLICY "Anyone can create view records" ON public.recipe_views
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view their own view history" ON public.recipe_views;
CREATE POLICY "Users can view their own view history" ON public.recipe_views
    FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

-- Cooking History Policies
DROP POLICY IF EXISTS "Users can view their own cooking history" ON public.cooking_history;
CREATE POLICY "Users can view their own cooking history" ON public.cooking_history
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own cooking history" ON public.cooking_history;
CREATE POLICY "Users can create their own cooking history" ON public.cooking_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own cooking history" ON public.cooking_history;
CREATE POLICY "Users can update their own cooking history" ON public.cooking_history
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own cooking history" ON public.cooking_history;
CREATE POLICY "Users can delete their own cooking history" ON public.cooking_history
    FOR DELETE USING (auth.uid() = user_id);

-- Recipe Shares Policies
DROP POLICY IF EXISTS "Anyone can create share records" ON public.recipe_shares;
CREATE POLICY "Anyone can create share records" ON public.recipe_shares
    FOR INSERT WITH CHECK (true);

-- Notifications Policies
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
CREATE POLICY "Users can update their own notifications" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- Reports Policies
DROP POLICY IF EXISTS "Users can create reports" ON public.reports;
CREATE POLICY "Users can create reports" ON public.reports
    FOR INSERT WITH CHECK (auth.uid() = reporter_id);

DROP POLICY IF EXISTS "Users can view their own reports" ON public.reports;
CREATE POLICY "Users can view their own reports" ON public.reports
    FOR SELECT USING (auth.uid() = reporter_id);

-- ============================================
-- Functions and Triggers
-- ============================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to automatically update updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_nutrition_info_updated_at ON public.nutrition_info;
CREATE TRIGGER update_nutrition_info_updated_at 
    BEFORE UPDATE ON public.nutrition_info
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_recipes_updated_at ON public.recipes;
CREATE TRIGGER update_recipes_updated_at 
    BEFORE UPDATE ON public.recipes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_recipe_ratings_updated_at ON public.recipe_ratings;
CREATE TRIGGER update_recipe_ratings_updated_at 
    BEFORE UPDATE ON public.recipe_ratings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_recipe_collections_updated_at ON public.recipe_collections;
CREATE TRIGGER update_recipe_collections_updated_at 
    BEFORE UPDATE ON public.recipe_collections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_comments_updated_at ON public.comments;
CREATE TRIGGER update_comments_updated_at 
    BEFORE UPDATE ON public.comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create profile on user signup
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
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update recipe statistics when rating changes
CREATE OR REPLACE FUNCTION update_recipe_rating_stats()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.recipes
    SET
        rating_count = (SELECT COUNT(*) FROM public.recipe_ratings WHERE recipe_id = COALESCE(NEW.recipe_id, OLD.recipe_id)),
        average_rating = (
            SELECT COALESCE(AVG(rating)::DECIMAL(3,2), 0)
            FROM public.recipe_ratings
            WHERE recipe_id = COALESCE(NEW.recipe_id, OLD.recipe_id)
        )
    WHERE id = COALESCE(NEW.recipe_id, OLD.recipe_id);
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to update recipe rating statistics
DROP TRIGGER IF EXISTS update_recipe_rating_stats_trigger ON public.recipe_ratings;
CREATE TRIGGER update_recipe_rating_stats_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.recipe_ratings
    FOR EACH ROW EXECUTE FUNCTION update_recipe_rating_stats();

-- Function to update recipe favorite count
CREATE OR REPLACE FUNCTION update_recipe_favorite_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.recipes
    SET favorite_count = (
        SELECT COUNT(*)
        FROM public.recipe_favorites
        WHERE recipe_id = COALESCE(NEW.recipe_id, OLD.recipe_id)
    )
    WHERE id = COALESCE(NEW.recipe_id, OLD.recipe_id);
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to update recipe favorite count
DROP TRIGGER IF EXISTS update_recipe_favorite_count_trigger ON public.recipe_favorites;
CREATE TRIGGER update_recipe_favorite_count_trigger
    AFTER INSERT OR DELETE ON public.recipe_favorites
    FOR EACH ROW EXECUTE FUNCTION update_recipe_favorite_count();

-- Function to update recipe comment count
CREATE OR REPLACE FUNCTION update_recipe_comment_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.recipes
    SET comment_count = (
        SELECT COUNT(*)
        FROM public.comments
        WHERE recipe_id = COALESCE(NEW.recipe_id, OLD.recipe_id)
    )
    WHERE id = COALESCE(NEW.recipe_id, OLD.recipe_id);
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to update recipe comment count
DROP TRIGGER IF EXISTS update_recipe_comment_count_trigger ON public.comments;
CREATE TRIGGER update_recipe_comment_count_trigger
    AFTER INSERT OR DELETE ON public.comments
    FOR EACH ROW EXECUTE FUNCTION update_recipe_comment_count();

-- Function to update recipe view count
CREATE OR REPLACE FUNCTION update_recipe_view_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.recipes
    SET view_count = view_count + 1
    WHERE id = NEW.recipe_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update recipe view count
DROP TRIGGER IF EXISTS update_recipe_view_count_trigger ON public.recipe_views;
CREATE TRIGGER update_recipe_view_count_trigger
    AFTER INSERT ON public.recipe_views
    FOR EACH ROW EXECUTE FUNCTION update_recipe_view_count();

-- Function to update profile statistics
CREATE OR REPLACE FUNCTION update_profile_stats()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.profiles
    SET
        recipe_count = (SELECT COUNT(*) FROM public.recipes WHERE user_id = COALESCE(NEW.user_id, OLD.user_id) AND status = 'published'),
        follower_count = (SELECT COUNT(*) FROM public.follows WHERE following_id = COALESCE(NEW.user_id, OLD.user_id)),
        following_count = (SELECT COUNT(*) FROM public.follows WHERE follower_id = COALESCE(NEW.user_id, OLD.user_id))
    WHERE id = COALESCE(NEW.user_id, OLD.user_id);
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to update profile stats when recipes change
DROP TRIGGER IF EXISTS update_profile_stats_from_recipes ON public.recipes;
CREATE TRIGGER update_profile_stats_from_recipes
    AFTER INSERT OR UPDATE OR DELETE ON public.recipes
    FOR EACH ROW EXECUTE FUNCTION update_profile_stats();

-- Trigger to update profile stats when follows change
DROP TRIGGER IF EXISTS update_profile_stats_from_follows ON public.follows;
CREATE TRIGGER update_profile_stats_from_follows
    AFTER INSERT OR DELETE ON public.follows
    FOR EACH ROW EXECUTE FUNCTION update_profile_stats();

-- Function to update tag usage count
CREATE OR REPLACE FUNCTION update_tag_usage_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.tags
    SET usage_count = (
        SELECT COUNT(*)
        FROM public.recipe_tags
        WHERE tag_id = COALESCE(NEW.tag_id, OLD.tag_id)
    )
    WHERE id = COALESCE(NEW.tag_id, OLD.tag_id);
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to update tag usage count
DROP TRIGGER IF EXISTS update_tag_usage_count_trigger ON public.recipe_tags;
CREATE TRIGGER update_tag_usage_count_trigger
    AFTER INSERT OR DELETE ON public.recipe_tags
    FOR EACH ROW EXECUTE FUNCTION update_tag_usage_count();

-- Function to create notification
CREATE OR REPLACE FUNCTION create_notification(
    p_user_id UUID,
    p_type TEXT,
    p_title TEXT,
    p_content TEXT,
    p_link TEXT,
    p_related_user_id UUID DEFAULT NULL,
    p_related_recipe_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_notification_id UUID;
BEGIN
    INSERT INTO public.notifications (
        user_id, type, title, content, link,
        related_user_id, related_recipe_id
    )
    VALUES (
        p_user_id, p_type, p_title, p_content, p_link,
        p_related_user_id, p_related_recipe_id
    )
    RETURNING id INTO v_notification_id;
    
    RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to notify on comment
CREATE OR REPLACE FUNCTION notify_on_comment()
RETURNS TRIGGER AS $$
DECLARE
    v_recipe_author_id UUID;
BEGIN
    -- 獲取食譜作者
    SELECT user_id INTO v_recipe_author_id
    FROM public.recipes
    WHERE id = NEW.recipe_id;
    
    -- 如果不是作者自己留言，則發送通知
    IF v_recipe_author_id != NEW.user_id THEN
        PERFORM create_notification(
            v_recipe_author_id,
            'comment',
            '新留言',
            '有人對您的食譜留下留言',
            '/recipes/' || NEW.recipe_id,
            NEW.user_id,
            NEW.recipe_id
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to notify on comment
DROP TRIGGER IF EXISTS notify_on_comment_trigger ON public.comments;
CREATE TRIGGER notify_on_comment_trigger
    AFTER INSERT ON public.comments
    FOR EACH ROW EXECUTE FUNCTION notify_on_comment();

-- Function to generate recipe slug
CREATE OR REPLACE FUNCTION generate_recipe_slug()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.slug IS NULL OR NEW.slug = '' THEN
        NEW.slug := lower(regexp_replace(NEW.title, '[^a-zA-Z0-9]+', '-', 'g'));
        NEW.slug := regexp_replace(NEW.slug, '^-|-$', '', 'g');
    END IF;
    
    -- 如果 status 為 published，自動設定 published_at
    IF NEW.published_at IS NULL AND NEW.status = 'published' THEN
        NEW.published_at := NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to generate slug
DROP TRIGGER IF EXISTS generate_recipe_slug_trigger ON public.recipes;
CREATE TRIGGER generate_recipe_slug_trigger
    BEFORE INSERT OR UPDATE ON public.recipes
    FOR EACH ROW EXECUTE FUNCTION generate_recipe_slug();

-- Function to update search vector
CREATE OR REPLACE FUNCTION update_recipe_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := 
        setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update search vector
DROP TRIGGER IF EXISTS update_recipe_search_vector_trigger ON public.recipes;
CREATE TRIGGER update_recipe_search_vector_trigger
    BEFORE INSERT OR UPDATE ON public.recipes
    FOR EACH ROW EXECUTE FUNCTION update_recipe_search_vector();

-- Function to update collection recipe count
CREATE OR REPLACE FUNCTION update_collection_recipe_count()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.collection_id IS NOT NULL THEN
        UPDATE public.recipe_collections
        SET recipe_count = (
            SELECT COUNT(*)
            FROM public.recipe_favorites
            WHERE collection_id = NEW.collection_id
        )
        WHERE id = NEW.collection_id;
    END IF;
    
    IF OLD.collection_id IS NOT NULL AND OLD.collection_id != COALESCE(NEW.collection_id, OLD.collection_id) THEN
        UPDATE public.recipe_collections
        SET recipe_count = (
            SELECT COUNT(*)
            FROM public.recipe_favorites
            WHERE collection_id = OLD.collection_id
        )
        WHERE id = OLD.collection_id;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to update collection recipe count
DROP TRIGGER IF EXISTS update_collection_recipe_count_trigger ON public.recipe_favorites;
CREATE TRIGGER update_collection_recipe_count_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.recipe_favorites
    FOR EACH ROW EXECUTE FUNCTION update_collection_recipe_count();

-- ============================================
-- 完成
-- ============================================
