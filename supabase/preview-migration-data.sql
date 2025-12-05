-- ============================================
-- 遷移前預覽腳本：查看將會提取的資料
-- ============================================
-- 此腳本不會修改任何資料，僅用於預覽遷移結果
-- ============================================

-- ============================================
-- 第一部分：預覽 Tags 資料
-- ============================================

-- 查看所有唯一的標籤（將會被插入到 tags 表格）
SELECT DISTINCT
    tag_name::TEXT AS 標籤名稱,
    COUNT(*) AS 使用次數
FROM (
    SELECT jsonb_array_elements_text(r.tags) AS tag_name
    FROM public.recipes r
    WHERE r.tags IS NOT NULL 
      AND jsonb_typeof(r.tags) = 'array'
      AND jsonb_array_length(r.tags) > 0
) AS extracted_tags
WHERE tag_name IS NOT NULL 
  AND trim(tag_name::TEXT) != ''
GROUP BY tag_name
ORDER BY 使用次數 DESC, tag_name;

-- 查看哪些食譜有關聯標籤
SELECT 
    r.id AS 食譜ID,
    r.title AS 食譜標題,
    r.tags AS 標籤陣列,
    jsonb_array_length(r.tags) AS 標籤數量
FROM public.recipes r
WHERE r.tags IS NOT NULL 
  AND jsonb_typeof(r.tags) = 'array'
  AND jsonb_array_length(r.tags) > 0
ORDER BY jsonb_array_length(r.tags) DESC
LIMIT 20;

-- ============================================
-- 第二部分：預覽 Ingredients 資料
-- ============================================

-- 查看所有唯一的食材（將會被插入到 ingredients_library 表格）
SELECT DISTINCT ON (LOWER(trim(ingredient->>'name')))
    ingredient->>'name' AS 食材名稱,
    COALESCE(NULLIF(trim(ingredient->>'category'), ''), '未分類') AS 分類,
    NULLIF(trim(ingredient->>'unit'), '') AS 單位,
    COUNT(*) OVER (PARTITION BY LOWER(trim(ingredient->>'name'))) AS 使用次數
FROM (
    SELECT jsonb_array_elements(r.ingredients) AS ingredient
    FROM public.recipes r
    WHERE r.ingredients IS NOT NULL 
      AND jsonb_typeof(r.ingredients) = 'array'
      AND jsonb_array_length(r.ingredients) > 0
) AS extracted_ingredients
WHERE ingredient->>'name' IS NOT NULL
  AND trim(ingredient->>'name') != ''
ORDER BY LOWER(trim(ingredient->>'name')), 使用次數 DESC;

-- 查看食材分類統計
SELECT 
    COALESCE(NULLIF(trim(ingredient->>'category'), ''), '未分類') AS 分類,
    COUNT(DISTINCT LOWER(trim(ingredient->>'name'))) AS 食材種類數,
    COUNT(*) AS 總使用次數
FROM (
    SELECT jsonb_array_elements(r.ingredients) AS ingredient
    FROM public.recipes r
    WHERE r.ingredients IS NOT NULL 
      AND jsonb_typeof(r.ingredients) = 'array'
      AND jsonb_array_length(r.ingredients) > 0
) AS extracted_ingredients
WHERE ingredient->>'name' IS NOT NULL
  AND trim(ingredient->>'name') != ''
GROUP BY COALESCE(NULLIF(trim(ingredient->>'category'), ''), '未分類')
ORDER BY 總使用次數 DESC;

-- 查看一些範例食譜的食材
SELECT 
    r.id AS 食譜ID,
    r.title AS 食譜標題,
    jsonb_array_length(r.ingredients) AS 食材數量,
    r.ingredients AS 食材列表
FROM public.recipes r
WHERE r.ingredients IS NOT NULL 
  AND jsonb_typeof(r.ingredients) = 'array'
  AND jsonb_array_length(r.ingredients) > 0
ORDER BY jsonb_array_length(r.ingredients) DESC
LIMIT 10;

-- ============================================
-- 第三部分：統計資訊
-- ============================================

-- 整體統計
SELECT 
    '總食譜數' AS 項目,
    COUNT(*)::TEXT AS 數量
FROM public.recipes
UNION ALL
SELECT 
    '有標籤的食譜',
    COUNT(*)::TEXT
FROM public.recipes
WHERE tags IS NOT NULL 
  AND jsonb_typeof(tags) = 'array'
  AND jsonb_array_length(tags) > 0
UNION ALL
SELECT 
    '有食材的食譜',
    COUNT(*)::TEXT
FROM public.recipes
WHERE ingredients IS NOT NULL 
  AND jsonb_typeof(ingredients) = 'array'
  AND jsonb_array_length(ingredients) > 0
UNION ALL
SELECT 
    '唯一標籤數（預估）',
    COUNT(DISTINCT tag_name)::TEXT
FROM (
    SELECT jsonb_array_elements_text(r.tags) AS tag_name
    FROM public.recipes r
    WHERE r.tags IS NOT NULL 
      AND jsonb_typeof(r.tags) = 'array'
      AND jsonb_array_length(r.tags) > 0
) AS tags
WHERE tag_name IS NOT NULL AND trim(tag_name::TEXT) != ''
UNION ALL
SELECT 
    '唯一食材數（預估）',
    COUNT(DISTINCT LOWER(trim(ingredient->>'name')))::TEXT
FROM (
    SELECT jsonb_array_elements(r.ingredients) AS ingredient
    FROM public.recipes r
    WHERE r.ingredients IS NOT NULL 
      AND jsonb_typeof(r.ingredients) = 'array'
      AND jsonb_array_length(r.ingredients) > 0
) AS ingredients
WHERE ingredient->>'name' IS NOT NULL
  AND trim(ingredient->>'name') != '';

-- ============================================
-- 第四部分：檢查現有表格狀態
-- ============================================

-- 檢查現有的 tags 表格
SELECT 
    '現有標籤數' AS 項目,
    COUNT(*)::TEXT AS 數量
FROM public.tags
UNION ALL
SELECT 
    '現有標籤關聯數',
    COUNT(*)::TEXT
FROM public.recipe_tags
UNION ALL
SELECT 
    '現有食材數',
    COUNT(*)::TEXT
FROM public.ingredients_library;

-- ============================================
-- 完成
-- ============================================




