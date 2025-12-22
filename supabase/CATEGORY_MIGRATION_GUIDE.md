# 分類系統遷移指南

## 📋 概述

本次遷移將分類系統從**多維度混合分類**改為**單一維度分類**（只保留餐點類型），其他屬性（用餐時段、飲食類型、料理特性）改為標籤。

## 🔄 變更內容

### 舊分類（12個）→ 新分類（8個）

**保留的分類：**
- ✅ 主菜 (main-course)
- ✅ 湯品 (soup)
- ✅ 甜點 (dessert)
- ✅ 飲料 (beverage)
- ✅ 開胃菜 (appetizer)

**新增的分類：**
- ➕ 沙拉 (salad)
- ➕ 主食 (staple)
- ➕ 醬料/調味品 (sauce-condiment)

**移除的分類（改為標籤）：**
- ❌ 早餐 (breakfast) → 映射到「主菜」，並建議添加「早餐」標籤
- ❌ 午餐 (lunch) → 映射到「主菜」，並建議添加「午餐」標籤
- ❌ 晚餐 (dinner) → 映射到「主菜」，並建議添加「晚餐」標籤
- ❌ 點心 (snack) → 映射到「甜點」，並建議添加「點心」標籤
- ❌ 素食 (vegetarian) → 映射到「主菜」，並建議添加「素食」標籤
- ❌ 快速料理 (quick-meal) → 映射到「主菜」，並建議添加「快速」標籤
- ❌ 健康料理 (healthy) → 映射到「主菜」，並建議添加「健康」標籤

## 📝 執行步驟

### 步驟 1: 備份資料庫

在執行遷移前，請先備份資料庫：
1. 登入 Supabase Dashboard
2. 前往 Settings → Database
3. 點擊「Backup」或使用 Supabase CLI 備份

### 步驟 2: 執行遷移腳本

1. 登入 Supabase Dashboard
2. 前往 SQL Editor
3. 複製 `supabase/migrate-categories.sql` 的內容
4. 貼上並執行

### 步驟 3: 驗證遷移結果

遷移腳本會自動顯示：
- 新分類列表及其食譜數量
- 沒有分類的食譜數量

檢查這些結果，確保遷移成功。

### 步驟 4: 手動添加標籤（可選）

建議手動為受影響的食譜添加對應的標籤：

```sql
-- 為原本是「早餐」的食譜添加「早餐」標籤
-- （需要根據實際情況調整）

-- 為原本是「素食」的食譜添加「素食」標籤
-- 為原本是「快速料理」的食譜添加「快速」標籤
-- 為原本是「健康料理」的食譜添加「健康」標籤
```

## ⚠️ 注意事項

1. **資料映射邏輯**：
   - 早餐/午餐/晚餐 → 主菜（因為這些時段通常吃主菜）
   - 點心 → 甜點（點心和甜點概念相近）
   - 素食/快速料理/健康料理 → 主菜（這些通常也是主菜類型）

2. **如果映射不正確**：
   - 可以手動調整特定食譜的分類
   - 或修改遷移腳本中的映射邏輯後重新執行

3. **標籤系統**：
   - 舊分類名稱（早餐、午餐、晚餐、點心、素食、快速、健康）現在應該作為標籤使用
   - 建議在食譜上傳時，將這些屬性添加到標籤欄位

## 🔍 驗證查詢

執行以下查詢來驗證遷移結果：

```sql
-- 查看所有分類及其食譜數量
SELECT 
    c.name AS category_name,
    c.slug AS category_slug,
    COUNT(r.id) AS recipe_count
FROM public.categories c
LEFT JOIN public.recipes r ON r.category_id = c.id
GROUP BY c.id, c.name, c.slug
ORDER BY c.sort_order, c.name;

-- 查看沒有分類的食譜
SELECT 
    id,
    title,
    status,
    is_public
FROM public.recipes
WHERE category_id IS NULL 
AND status = 'published' 
AND is_public = true;
```

## 📚 相關文件

- `supabase/init-categories.sql` - 新的分類初始化腳本
- `supabase/migrate-categories.sql` - 遷移腳本
- `lib/utils/auto-categorize.ts` - 自動分類工具（已更新關鍵字映射）

## ✅ 完成後

遷移完成後，系統將使用新的分類結構：
- 分類：只包含餐點類型（主菜、湯品、甜點等）
- 標籤：包含用餐時段、飲食類型、料理特性等

這樣可以避免分類衝突，讓系統更加清晰和易於維護。

