-- ============================================
-- 檢視當前資料庫中的分類
-- ============================================
-- 執行方式：
-- 1. 登入 Supabase Dashboard
-- 2. 前往 SQL Editor
-- 3. 複製貼上此腳本並執行
-- ============================================

-- 查詢所有分類及其詳細資訊
SELECT 
    id,
    name,
    slug,
    description,
    icon,
    parent_id,
    sort_order,
    created_at,
    -- 計算每個分類的食譜數量
    (SELECT COUNT(*) 
     FROM public.recipes 
     WHERE category_id = c.id 
     AND status = 'published' 
     AND is_public = true) AS recipe_count
FROM public.categories c
ORDER BY sort_order, name;

-- 顯示統計資訊
SELECT 
    COUNT(*) AS total_categories,
    COUNT(CASE WHEN parent_id IS NULL THEN 1 END) AS top_level_categories,
    COUNT(CASE WHEN parent_id IS NOT NULL THEN 1 END) AS sub_categories
FROM public.categories;

-- 顯示每個分類的食譜數量統計
SELECT 
    c.name AS category_name,
    c.slug AS category_slug,
    COUNT(r.id) AS total_recipes,
    COUNT(CASE WHEN r.status = 'published' AND r.is_public = true THEN 1 END) AS published_recipes,
    COUNT(CASE WHEN r.status = 'draft' THEN 1 END) AS draft_recipes
FROM public.categories c
LEFT JOIN public.recipes r ON r.category_id = c.id
GROUP BY c.id, c.name, c.slug
ORDER BY published_recipes DESC, c.sort_order, c.name;

