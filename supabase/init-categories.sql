-- ============================================
-- 初始化預設分類數據
-- ============================================
-- 此腳本用於初始化食譜分類系統
-- 執行方式：
-- 1. 登入 Supabase Dashboard
-- 2. 前往 SQL Editor
-- 3. 複製貼上此腳本並執行

-- 清除現有分類（可選，僅在需要重置時使用）
-- DELETE FROM public.categories;

-- 插入預設分類（單一維度分類 - 只保留餐點類型）
INSERT INTO public.categories (name, slug, description, icon, parent_id, sort_order)
VALUES
  -- 主要分類（餐點類型）
  ('主菜', 'main-course', '各種主菜料理', '🍽️', NULL, 1),
  ('湯品', 'soup', '各式湯品和燉品', '🍲', NULL, 2),
  ('甜點', 'dessert', '甜點和點心', '🍰', NULL, 3),
  ('飲料', 'beverage', '各種飲品', '🥤', NULL, 4),
  ('開胃菜', 'appetizer', '前菜和小食', '🥗', NULL, 5),
  ('沙拉', 'salad', '各種沙拉料理', '🥗', NULL, 6),
  ('主食', 'staple', '米飯、麵食、麵包等主食', '🍚', NULL, 7),
  ('醬料/調味品', 'sauce-condiment', '各種醬料和調味品', '🧂', NULL, 8)
ON CONFLICT (slug) DO NOTHING;

-- 驗證插入的分類
SELECT 
    id,
    name,
    slug,
    description,
    icon,
    parent_id,
    sort_order,
    created_at
FROM public.categories
ORDER BY sort_order, name;

-- 如果看到所有分類，表示成功！
-- 如果沒有，請檢查錯誤訊息






