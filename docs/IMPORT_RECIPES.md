# 從網路導入食譜到資料庫

## 使用方式

### 1. 設定環境變數

確保 `.env` 檔案中有以下變數：

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SPOONACULAR_API_KEY=your-spoonacular-api-key
OPENAI_API_KEY=your-openai-api-key
```

> **重要**：
> - `SUPABASE_SERVICE_ROLE_KEY` 可以在 Supabase Dashboard > Settings > API 找到
> - 這個 Key 可以繞過 RLS (Row Level Security) 政策，請妥善保管！
> - `SPOONACULAR_API_KEY` 用於從 Spoonacular API 獲取食譜（可在 [Spoonacular](https://spoonacular.com/food-api) 註冊獲取）
> - `OPENAI_API_KEY` 用於自動翻譯英文食譜為繁體中文（可在 [OpenAI](https://platform.openai.com/api-keys) 獲取）

### 2. 修改腳本以適配您的資料來源

編輯 `scripts/import-recipes.js` 中的 `fetchRecipeFromWeb` 函數：

```javascript
async function fetchRecipeFromWeb(recipeUrl) {
  // 範例 1: 從公開 API 抓取
  const response = await fetch(recipeUrl)
  const data = await response.json()
  return parseRecipeData(data)
  
  // 範例 2: 從特定網站爬取（需要處理 HTML）
  // 可以使用 cheerio 或 puppeteer 等工具
}
```

### 3. 執行腳本

```bash
npm run import:recipes
```

或直接執行：

```bash
node scripts/import-recipes.js [食譜URL]
```

## 支援的資料來源範例

### 範例 1: 使用 Spoonacular API（推薦）

腳本已內建支援 Spoonacular API，並會自動將英文內容翻譯為繁體中文。

#### 基本使用

```bash
# 導入隨機 10 個食譜（自動翻譯為中文）
node scripts/import-recipes.js --spoonacular --random --number 10

# 根據關鍵字搜尋並導入 5 個食譜
node scripts/import-recipes.js --spoonacular --search "pasta" --number 5

# 導入指定 ID 的食譜
node scripts/import-recipes.js --spoonacular --id 123456

# 導入但不翻譯（保留英文）
node scripts/import-recipes.js --spoonacular --random --no-translate

# 導入但不上傳圖片到 Cloudinary
node scripts/import-recipes.js --spoonacular --random --no-upload-images
```

#### 翻譯功能

從 Spoonacular 導入的食譜預設會自動翻譯為繁體中文，包括：
- 食譜標題
- 食譜描述
- 食材名稱
- 烹飪步驟說明
- 標籤

翻譯使用 OpenAI GPT-3.5-turbo 模型，確保翻譯品質。如果翻譯失敗，會保留原始英文內容並顯示警告。

#### 命令列選項

- `--spoonacular, -s`: 使用 Spoonacular API
- `--random, -r`: 導入隨機食譜
- `--search <關鍵字>`: 搜尋並導入食譜
- `--id <食譜ID>`: 導入指定 ID 的食譜
- `--number, -n <數量>`: 導入數量（預設: 10）
- `--no-upload-images`: 不上傳圖片到 Cloudinary
- `--no-translate`: 不翻譯為中文（預設會自動翻譯）
- `--help, -h`: 顯示使用說明

### 範例 2: 使用其他公開的食譜 API

如果您想使用其他 API，可以修改 `fetchRecipeFromWeb` 函數：

```javascript
async function fetchRecipeFromWeb(recipeUrl) {
  // 範例：從其他 API 抓取
  const response = await fetch(recipeUrl)
  const data = await response.json()
  
  return {
    title: data.title,
    description: data.summary,
    image_url: data.image,
    servings: data.servings,
    prep_time: data.preparationMinutes,
    cook_time: data.cookingMinutes,
    ingredients: data.extendedIngredients.map(ing => ({
      name: ing.name,
      amount: ing.amount,
      unit: ing.unit,
    })),
    steps: data.analyzedInstructions[0]?.steps.map((step, i) => ({
      step_number: i + 1,
      instruction: step.step,
    })),
    source_url: data.sourceUrl,
    source_name: '來源名稱',
  }
}
```

### 範例 3: 從 JSON 檔案導入

如果您有 JSON 格式的食譜資料：

```javascript
async function fetchRecipeFromWeb(recipeUrl) {
  // 如果 recipeUrl 是本地檔案路徑
  const fs = require('fs')
  const data = JSON.parse(fs.readFileSync(recipeUrl, 'utf8'))
  return parseRecipeData(data)
}
```

### 範例 4: 批量導入多個食譜

修改腳本以支援批量導入：

```javascript
async function main() {
  const recipeUrls = [
    'https://example.com/recipe/1',
    'https://example.com/recipe/2',
    'https://example.com/recipe/3',
  ]
  
  const userId = await getOrCreateSystemUser()
  
  for (const url of recipeUrls) {
    try {
      const recipeData = await fetchRecipeFromWeb(url)
      await insertRecipeToDatabase(recipeData, userId)
      console.log(`✅ 成功導入: ${recipeData.title}`)
    } catch (error) {
      console.error(`❌ 導入失敗 (${url}):`, error.message)
    }
  }
}
```

## 資料格式說明

腳本會將抓取的資料轉換成以下格式：

```javascript
{
  title: '食譜標題',              // 必填
  description: '食譜描述',         // 選填
  image_url: 'https://...',       // 選填
  servings: 4,                    // 選填，人份數
  prep_time: 15,                  // 選填，準備時間（分鐘）
  cook_time: 30,                  // 選填，烹飪時間（分鐘）
  difficulty: 'easy',             // 選填：'easy' | 'medium' | 'hard'
  ingredients: [                  // 必填
    {
      name: '雞肉',
      amount: '500',
      unit: 'g',
      note: '選用雞胸肉',          // 選填
      category: '肉類',            // 選填
    }
  ],
  steps: [                         // 必填
    {
      step_number: 1,
      instruction: '將雞肉切塊',
      image_url: null,             // 選填
      timer_minutes: null,          // 選填
    }
  ],
  tags: ['中式', '主菜'],          // 選填
  source_url: 'https://...',      // 選填，來源網址
  source_name: '來源名稱',         // 選填
}
```

## 注意事項

1. **Service Role Key 安全性**
   - Service Role Key 可以繞過所有 RLS 政策
   - 請勿將此 Key 提交到 Git
   - 僅在伺服器端或腳本中使用

2. **資料來源合法性**
   - 確保您有權限使用抓取的資料
   - 遵守網站的 robots.txt 和使用條款
   - 尊重版權和智慧財產權

3. **資料品質**
   - 檢查抓取的資料是否完整
   - 驗證必填欄位（title, ingredients, steps）
   - 清理和格式化資料

4. **錯誤處理**
   - 腳本會自動處理常見錯誤
   - 如果導入失敗，檢查資料格式是否正確
   - 查看 Supabase Dashboard 的日誌

## 常見問題

### Q: 如何指定要使用的用戶 ID？

A: 修改 `getOrCreateSystemUser` 函數，或直接在腳本中指定：

```javascript
const userId = 'your-user-id-here'
```

### Q: 可以導入草稿狀態的食譜嗎？

A: 可以，修改 `insertRecipeToDatabase` 函數中的 `status` 欄位：

```javascript
status: 'draft',  // 或 'published' 或 'archived'
```

### Q: 如何處理圖片？

A: 腳本會直接使用 `image_url`。如果需要下載圖片並上傳到 Cloudinary，可以：

1. 下載圖片到本地
2. 使用 Cloudinary API 上傳
3. 使用返回的 URL 作為 `image_url`

### Q: 導入的食譜會自動關聯標籤嗎？

A: 目前腳本會將標籤存儲在 `tags` 欄位（JSONB 陣列）。如果需要使用 `recipe_tags` 關聯表，需要額外處理。

### Q: 翻譯功能如何運作？

A: 當使用 `--spoonacular` 選項時，腳本會自動使用 OpenAI API 將英文內容翻譯為繁體中文。翻譯包括：
- 食譜標題和描述
- 所有食材名稱
- 所有烹飪步驟
- 所有標籤

翻譯使用批量處理以提高效率，如果某個文本翻譯失敗，會保留原始英文內容。您可以使用 `--no-translate` 選項來跳過翻譯步驟。

### Q: 翻譯需要多少成本？

A: 翻譯使用 OpenAI GPT-3.5-turbo 模型，成本相對較低。一個包含 10 個食材和 10 個步驟的食譜，翻譯成本約為 $0.01-0.02 USD。您可以根據需要調整翻譯選項或使用 `--no-translate` 來節省成本。

## 進階用法

### 使用 Puppeteer 爬取動態網頁

```bash
npm install puppeteer
```

```javascript
const puppeteer = require('puppeteer')

async function fetchRecipeFromWeb(recipeUrl) {
  const browser = await puppeteer.launch()
  const page = await browser.newPage()
  await page.goto(recipeUrl)
  
  const recipeData = await page.evaluate(() => {
    return {
      title: document.querySelector('.recipe-title')?.textContent,
      description: document.querySelector('.recipe-description')?.textContent,
      // ... 其他資料
    }
  })
  
  await browser.close()
  return parseRecipeData(recipeData)
}
```

### 使用 Cheerio 解析 HTML

```bash
npm install cheerio
```

```javascript
const cheerio = require('cheerio')

async function fetchRecipeFromWeb(recipeUrl) {
  const response = await fetch(recipeUrl)
  const html = await response.text()
  const $ = cheerio.load(html)
  
  return {
    title: $('.recipe-title').text(),
    description: $('.recipe-description').text(),
    // ... 其他資料
  }
}
```

## 相關檔案

- `scripts/import-recipes.js` - 主要導入腳本
- `scripts/list-recipes.js` - 查看資料庫中的食譜
- `lib/actions/recipes.ts` - 應用程式中的食譜操作函數
- `lib/utils/translate.js` - 翻譯工具模組（JavaScript 版本）
- `lib/utils/translate.ts` - 翻譯工具模組（TypeScript 版本）

