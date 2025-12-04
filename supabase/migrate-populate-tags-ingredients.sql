-- ============================================
-- 遷移腳本：將現有食譜資料填入 tags、recipe_tags、ingredients_library 表格
-- ============================================
-- 此腳本會：
-- 1. 從 recipes.tags (JSONB array) 提取所有標籤並填入 tags 和 recipe_tags 表格
-- 2. 從 recipes.ingredients (JSONB array) 提取所有食材並填入 ingredients_library 表格
-- ============================================

-- ============================================
-- 輔助函數：生成 slug
-- ============================================

CREATE OR REPLACE FUNCTION generate_slug(input_text TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN lower(regexp_replace(
        regexp_replace(
            regexp_replace(input_text, '[^a-zA-Z0-9\u4e00-\u9fa5]+', '-', 'g'),
            '^-|-$', '', 'g'
        ),
        '-+', '-', 'g'
    ));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================
-- 第一部分：處理 Tags
-- ============================================

-- 步驟 1: 從 recipes.tags JSONB 欄位提取所有標籤並創建 tags 記錄
INSERT INTO public.tags (name, slug, usage_count, created_at)
SELECT DISTINCT
    tag_name::TEXT AS name,
    generate_slug(tag_name::TEXT) AS slug,
    0 AS usage_count, -- 稍後會更新
    NOW() AS created_at
FROM (
    SELECT jsonb_array_elements_text(r.tags) AS tag_name
    FROM public.recipes r
    WHERE r.tags IS NOT NULL 
      AND jsonb_typeof(r.tags) = 'array'
      AND jsonb_array_length(r.tags) > 0
) AS extracted_tags
WHERE tag_name IS NOT NULL 
  AND trim(tag_name::TEXT) != ''
ON CONFLICT (name) DO NOTHING;

-- 步驟 2: 建立 recipe_tags 關聯
INSERT INTO public.recipe_tags (recipe_id, tag_id, created_at)
SELECT DISTINCT
    r.id AS recipe_id,
    t.id AS tag_id,
    NOW() AS created_at
FROM public.recipes r
CROSS JOIN LATERAL jsonb_array_elements_text(r.tags) AS tag_name
INNER JOIN public.tags t ON LOWER(trim(t.name)) = LOWER(trim(tag_name::TEXT))
WHERE r.tags IS NOT NULL 
  AND jsonb_typeof(r.tags) = 'array'
  AND jsonb_array_length(r.tags) > 0
  AND tag_name IS NOT NULL
  AND trim(tag_name::TEXT) != ''
  AND NOT EXISTS (
      SELECT 1 FROM public.recipe_tags rt
      WHERE rt.recipe_id = r.id AND rt.tag_id = t.id
  );

-- 步驟 3: 更新 tags 的 usage_count（觸發器應該會自動處理，但我們手動更新以確保）
UPDATE public.tags t
SET usage_count = (
    SELECT COUNT(*)
    FROM public.recipe_tags rt
    WHERE rt.tag_id = t.id
);

-- ============================================
-- 第二部分：處理 Ingredients
-- ============================================

-- 步驟 1: 從 recipes.ingredients JSONB 欄位提取所有食材並創建 ingredients_library 記錄
INSERT INTO public.ingredients_library (name, name_zh, category, unit, created_at)
SELECT DISTINCT ON (LOWER(trim(ingredient->>'name')))
    ingredient->>'name' AS name,
    ingredient->>'name' AS name_zh, -- 如果只有中文，可以之後手動調整
    COALESCE(NULLIF(trim(ingredient->>'category'), ''), '其他') AS category,
    NULLIF(trim(ingredient->>'unit'), '') AS unit,
    NOW() AS created_at
FROM (
    SELECT jsonb_array_elements(r.ingredients) AS ingredient
    FROM public.recipes r
    WHERE r.ingredients IS NOT NULL 
      AND jsonb_typeof(r.ingredients) = 'array'
      AND jsonb_array_length(r.ingredients) > 0
) AS extracted_ingredients
WHERE ingredient->>'name' IS NOT NULL
  AND trim(ingredient->>'name') != ''
ORDER BY LOWER(trim(ingredient->>'name')), ingredient->>'category'
ON CONFLICT (name) DO NOTHING;

-- 步驟 2: 對於已存在的食材，更新 category 和 unit（如果原本為空）
UPDATE public.ingredients_library il
SET 
    category = COALESCE(
        il.category,
        (
            SELECT COALESCE(NULLIF(trim(ingredient->>'category'), ''), '其他')
            FROM public.recipes r
            CROSS JOIN LATERAL jsonb_array_elements(r.ingredients) AS ingredient
            WHERE LOWER(trim(ingredient->>'name')) = LOWER(trim(il.name))
              AND ingredient->>'category' IS NOT NULL
              AND trim(ingredient->>'category') != ''
            LIMIT 1
        ),
        '其他'
    ),
    unit = COALESCE(
        il.unit,
        (
            SELECT NULLIF(trim(ingredient->>'unit'), '')
            FROM public.recipes r
            CROSS JOIN LATERAL jsonb_array_elements(r.ingredients) AS ingredient
            WHERE LOWER(trim(ingredient->>'name')) = LOWER(trim(il.name))
              AND ingredient->>'unit' IS NOT NULL
              AND trim(ingredient->>'unit') != ''
            LIMIT 1
        )
    )
WHERE il.category IS NULL OR il.unit IS NULL;

-- ============================================
-- 第三部分：統計與驗證
-- ============================================

-- 顯示遷移結果統計
DO $$
DECLARE
    tag_count INTEGER;
    recipe_tag_count INTEGER;
    ingredient_count INTEGER;
    recipe_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO tag_count FROM public.tags;
    SELECT COUNT(*) INTO recipe_tag_count FROM public.recipe_tags;
    SELECT COUNT(*) INTO ingredient_count FROM public.ingredients_library;
    SELECT COUNT(*) INTO recipe_count FROM public.recipes WHERE tags IS NOT NULL OR ingredients IS NOT NULL;
    
    RAISE NOTICE '===========================================';
    RAISE NOTICE '遷移完成統計：';
    RAISE NOTICE '===========================================';
    RAISE NOTICE '處理的食譜數量: %', recipe_count;
    RAISE NOTICE '創建的標籤數量: %', tag_count;
    RAISE NOTICE '創建的標籤關聯數量: %', recipe_tag_count;
    RAISE NOTICE '創建的食材數量: %', ingredient_count;
    RAISE NOTICE '===========================================';
END $$;

-- ============================================
-- 清理輔助函數（可選）
-- ============================================
-- 如果不需要保留 generate_slug 函數，可以取消註解以下行：
-- DROP FUNCTION IF EXISTS generate_slug(TEXT);

-- ============================================
-- 完成
-- ============================================

