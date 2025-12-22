-- ============================================
-- 分類系統遷移腳本
-- ============================================
-- 將舊的分類系統（混合多個維度）遷移到新的單一維度分類系統
-- 執行方式：
-- 1. 登入 Supabase Dashboard
-- 2. 前往 SQL Editor
-- 3. 複製貼上此腳本並執行
-- ============================================

-- 步驟 1: 創建新分類（如果不存在）
INSERT INTO public.categories (name, slug, description, icon, parent_id, sort_order)
VALUES
  ('主菜', 'main-course', '各種主菜料理', '🍽️', NULL, 1),
  ('湯品', 'soup', '各式湯品和燉品', '🍲', NULL, 2),
  ('甜點', 'dessert', '甜點和點心', '🍰', NULL, 3),
  ('飲料', 'beverage', '各種飲品', '🥤', NULL, 4),
  ('開胃菜', 'appetizer', '前菜和小食', '🥗', NULL, 5),
  ('沙拉', 'salad', '各種沙拉料理', '🥗', NULL, 6),
  ('主食', 'staple', '米飯、麵食、麵包等主食', '🍚', NULL, 7),
  ('醬料/調味品', 'sauce-condiment', '各種醬料和調味品', '🧂', NULL, 8)
ON CONFLICT (slug) DO NOTHING;

-- 步驟 2: 獲取新分類的 ID（用於後續映射）
DO $$
DECLARE
  main_course_id UUID;
  soup_id UUID;
  dessert_id UUID;
  beverage_id UUID;
  appetizer_id UUID;
  salad_id UUID;
  staple_id UUID;
  sauce_id UUID;
BEGIN
  -- 獲取新分類 ID
  SELECT id INTO main_course_id FROM public.categories WHERE slug = 'main-course';
  SELECT id INTO soup_id FROM public.categories WHERE slug = 'soup';
  SELECT id INTO dessert_id FROM public.categories WHERE slug = 'dessert';
  SELECT id INTO beverage_id FROM public.categories WHERE slug = 'beverage';
  SELECT id INTO appetizer_id FROM public.categories WHERE slug = 'appetizer';
  SELECT id INTO salad_id FROM public.categories WHERE slug = 'salad';
  SELECT id INTO staple_id FROM public.categories WHERE slug = 'staple';
  SELECT id INTO sauce_id FROM public.categories WHERE slug = 'sauce-condiment';

  -- 步驟 3: 映射舊分類到新分類並更新食譜
  -- 早餐、午餐、晚餐 -> 主菜（因為這些時段通常吃主菜）
  UPDATE public.recipes
  SET category_id = main_course_id
  WHERE category_id IN (
    SELECT id FROM public.categories WHERE slug IN ('breakfast', 'lunch', 'dinner')
  )
  AND category_id IS NOT NULL;

  -- 點心 -> 甜點（點心和甜點概念相近）
  UPDATE public.recipes
  SET category_id = dessert_id
  WHERE category_id IN (
    SELECT id FROM public.categories WHERE slug = 'snack'
  )
  AND category_id IS NOT NULL;

  -- 素食 -> 主菜（素食料理通常也是主菜）
  UPDATE public.recipes
  SET category_id = main_course_id
  WHERE category_id IN (
    SELECT id FROM public.categories WHERE slug = 'vegetarian'
  )
  AND category_id IS NOT NULL;

  -- 快速料理 -> 主菜（快速料理通常也是主菜）
  UPDATE public.recipes
  SET category_id = main_course_id
  WHERE category_id IN (
    SELECT id FROM public.categories WHERE slug = 'quick-meal'
  )
  AND category_id IS NOT NULL;

  -- 健康料理 -> 主菜（健康料理通常也是主菜）
  UPDATE public.recipes
  SET category_id = main_course_id
  WHERE category_id IN (
    SELECT id FROM public.categories WHERE slug = 'healthy'
  )
  AND category_id IS NOT NULL;

  -- 步驟 4: 刪除舊分類（已遷移的分類）
  DELETE FROM public.categories
  WHERE slug IN ('breakfast', 'lunch', 'dinner', 'snack', 'vegetarian', 'quick-meal', 'healthy');

  RAISE NOTICE '✅ 分類遷移完成！';
  RAISE NOTICE '已將舊分類映射到新分類，並更新了所有相關食譜';
END $$;

-- 步驟 5: 驗證遷移結果
SELECT 
    c.name AS category_name,
    c.slug AS category_slug,
    COUNT(r.id) AS recipe_count
FROM public.categories c
LEFT JOIN public.recipes r ON r.category_id = c.id
GROUP BY c.id, c.name, c.slug
ORDER BY c.sort_order, c.name;

-- 步驟 6: 檢查是否有食譜沒有分類
SELECT 
    COUNT(*) AS recipes_without_category
FROM public.recipes
WHERE category_id IS NULL AND status = 'published' AND is_public = true;

-- 如果看到遷移結果，表示成功！
-- 建議：將舊分類名稱（早餐、午餐、晚餐、點心、素食、快速料理、健康料理）添加到標籤系統

