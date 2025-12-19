/**
 * 根據食譜內容自動分類的工具函數
 * 使用關鍵字匹配來推斷最適合的分類
 */

interface Category {
  id: string
  name: string
  slug: string
  keywords: string[] // 分類關鍵字
}

// 分類關鍵字映射表（根據 supabase/init-categories.sql 的分類定義）
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  '主菜': [
    '主菜', '主餐', '正餐', '配飯', '下飯', '肉類', '魚', '雞肉', '豬肉', '牛肉',
    '羊肉', '魚肉', '海鮮', '炒飯', '炒麵', '義大利麵', '披薩', '漢堡', '三明治',
    '排', '燉', '燒', '烤', '炸', '蒸', '紅燒', '糖醋'
  ],
  '湯品': [
    '湯', '湯品', '湯類', '燉湯', '煲湯', '清湯', '濃湯', '雞湯', '排骨湯',
    '魚湯', '蔬菜湯', '番茄湯', '玉米湯', '蘑菇湯', '紫菜湯', '酸辣湯',
    '羅宋湯', '味噌湯', '高湯', '羹', '粥'
  ],
  '甜點': [
    '甜點', '點心', '蛋糕', '餅乾', '布丁', '布蕾', '冰淇淋', '優格', '優格',
    '馬芬', '鬆餅', '可麗餅', '提拉米蘇', '起司蛋糕', '巧克力', '糖果',
    '馬卡龍', '泡芙', '塔', '派', '慕斯', '舒芙蕾'
  ],
  '飲料': [
    '飲料', '飲品', '茶', '咖啡', '果汁', '奶茶', '拿鐵', '卡布奇諾',
    '氣泡水', '蘇打', '汽水', '可樂', '檸檬汁', '柳橙汁', '葡萄汁',
    '冰沙', '奶昔', '調酒', '雞尾酒', '茶飲'
  ],
  '開胃菜': [
    '開胃菜', '前菜', '小菜', '配菜', '涼拌', '沙拉', '生菜', '小食',
    '小點', '下酒菜', '冷盤', '拼盤'
  ],
  '早餐': [
    '早餐', '早點', '蛋', '煎蛋', '炒蛋', '水煮蛋', '荷包蛋', '蛋餅',
    '吐司', '三明治', '貝果', '鬆餅', '法式吐司', '燕麥', '麥片',
    '豆漿', '油條', '包子', '饅頭', '燒餅', '飯糰'
  ],
  '午餐': [
    '午餐', '便當', '飯盒', '簡餐', '輕食'
  ],
  '晚餐': [
    '晚餐', '晚飯', '正餐'
  ],
  '點心': [
    '點心', '零食', '小食', '宵夜', '茶點', '餅乾', '蛋糕', '派'
  ],
  '素食': [
    '素食', '蔬食', '全素', '蛋奶素', '純素', '蔬菜', '豆腐', '豆製品',
    '素肉', '素雞', '素魚', '菇類', '蘑菇', '香菇', '金針菇'
  ],
  '快速料理': [
    '快速', '簡單', '簡易', '方便', '懶人', '一鍋', '快手', '快炒',
    '10分鐘', '15分鐘', '20分鐘', '30分鐘', '電鍋', '微波', '即食'
  ],
  '健康料理': [
    '健康', '減脂', '低卡', '低熱量', '低脂', '高蛋白', '營養', '養生',
    '無糖', '少油', '少鹽', '清淡', '有機', '天然'
  ],
}

/**
 * 分析文本內容，找出匹配的關鍵字
 */
function findMatchingKeywords(text: string, keywords: string[]): number {
  const lowerText = text.toLowerCase()
  let matches = 0
  
  for (const keyword of keywords) {
    if (lowerText.includes(keyword.toLowerCase())) {
      matches++
    }
  }
  
  return matches
}

/**
 * 根據食譜內容自動推斷分類
 * @param title 食譜標題
 * @param description 食譜描述
 * @param tags 標籤陣列
 * @param categories 所有可用分類列表
 * @returns 最匹配的分類 ID，如果沒有匹配則返回 null
 */
export function autoCategorize(
  title: string,
  description: string,
  tags: string[],
  categories: Array<{ id: string; name: string; slug: string }>
): string | null {
  // 合併所有文本內容
  const content = `${title} ${description || ''} ${tags.join(' ')}`.toLowerCase()
  
  // 為每個分類計算匹配分數
  const scores: Array<{ categoryId: string; categoryName: string; score: number }> = []
  
  for (const category of categories) {
    const keywords = CATEGORY_KEYWORDS[category.name] || []
    if (keywords.length === 0) continue
    
    const score = findMatchingKeywords(content, keywords)
    if (score > 0) {
      scores.push({
        categoryId: category.id,
        categoryName: category.name,
        score,
      })
    }
  }
  
  // 如果沒有匹配的分類，返回 null
  if (scores.length === 0) {
    return null
  }
  
  // 按分數排序，返回分數最高的分類
  scores.sort((a, b) => b.score - a.score)
  
  // 只返回分數最高且分數大於 0 的分類
  const topMatch = scores[0]
  return topMatch.score > 0 ? topMatch.categoryId : null
}

/**
 * 獲取分類建議（包含匹配分數）
 * @param title 食譜標題
 * @param description 食譜描述
 * @param tags 標籤陣列
 * @param categories 所有可用分類列表
 * @param limit 返回前 N 個建議（預設 3）
 * @returns 按分數排序的分類建議列表
 */
export function getCategorySuggestions(
  title: string,
  description: string,
  tags: string[],
  categories: Array<{ id: string; name: string; slug: string }>,
  limit: number = 3
): Array<{ categoryId: string; categoryName: string; score: number }> {
  const content = `${title} ${description || ''} ${tags.join(' ')}`.toLowerCase()
  const scores: Array<{ categoryId: string; categoryName: string; score: number }> = []
  
  for (const category of categories) {
    const keywords = CATEGORY_KEYWORDS[category.name] || []
    if (keywords.length === 0) continue
    
    const score = findMatchingKeywords(content, keywords)
    if (score > 0) {
      scores.push({
        categoryId: category.id,
        categoryName: category.name,
        score,
      })
    }
  }
  
  // 按分數排序
  scores.sort((a, b) => b.score - a.score)
  
  // 返回前 N 個建議
  return scores.slice(0, limit)
}

