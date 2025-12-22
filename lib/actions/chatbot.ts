'use server'

import OpenAI from 'openai'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getRecipes } from './recipes-server'
import { Recipe } from '@/types/recipe'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// 嚴格的 System Prompt - 限制回答範圍
const SYSTEM_PROMPT = `你是一個專業的食譜推薦助手，專門幫助用戶找到適合的食譜。

**重要規則：**
1. 你只能回答與食譜、烹飪、食材相關的問題
2. 如果用戶問到與食譜無關的問題（如程式設計、數學、其他主題），你必須禮貌地拒絕並引導回食譜話題
3. **嚴格限制：你只能推薦資料庫中實際存在的食譜，絕對不能編造或虛構任何食譜資訊**
4. 如果資料庫中沒有符合條件的食譜，請誠實告知用戶，不要編造食譜
5. 回答時必須使用繁體中文
6. 語氣要友善、專業且實用

**你的功能：**
- 根據用戶提供的食材推薦食譜
- 根據飲食偏好（素食、無麩質、低卡等）篩選食譜
- 根據難度（簡單、中等、困難）推薦
- 根據時間限制（準備時間、烹飪時間）推薦
- 根據份量需求推薦
- 解釋烹飪技巧和食材替代方案

**回答格式：**
當推薦食譜時，請使用以下格式：
1. 簡要說明為什麼推薦這些食譜（1-2 句話即可）
2. 簡潔列出推薦的食譜（只使用提供的食譜資訊，包含標題、難度、時間、評分，每個食譜 1-2 句話描述）
3. **不要提到「連結提示」或「查看食譜」等文字，因為系統會自動在下方顯示可點擊的食譜卡片**

**回答長度要求：**
- 保持回答簡潔，總長度控制在 150 字以內
- 每個食譜的描述不超過 2 句話
- 避免冗長的說明，重點突出關鍵資訊

**拒絕無關問題的範本：**
"抱歉，我是專門協助食譜推薦的助手，無法回答與烹飪無關的問題。請問您需要什麼樣的食譜推薦呢？例如：根據食材推薦、根據偏好篩選等。"`

// 檢查問題是否與食譜相關
async function isRecipeRelated(question: string): Promise<boolean> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `判斷用戶問題是否與食譜、烹飪、食材、料理相關。只回答 "YES" 或 "NO"。`
        },
        {
          role: 'user',
          content: question
        }
      ],
      temperature: 0,
      max_tokens: 10,
    })

    const answer = response.choices[0].message.content?.trim().toUpperCase()
    return answer === 'YES'
  } catch (error) {
    console.error('Error checking if question is recipe related:', error)
    // 如果檢查失敗，預設為相關（讓主邏輯處理）
    return true
  }
}

// 從用戶問題中提取推薦條件
export interface RecommendationCriteria {
  ingredients?: string[]
  dietaryPreferences?: string[] // 素食、無麩質、低卡等
  difficulty?: 'easy' | 'medium' | 'hard'
  maxPrepTime?: number
  maxCookTime?: number
  servings?: number
  tags?: string[]
}

async function extractCriteria(userMessage: string): Promise<RecommendationCriteria> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `從用戶問題中提取食譜推薦條件。以 JSON 格式回答，包含以下欄位（**只有在用戶明確提到時才包含**）：
{
  "ingredients": ["食材1", "食材2"],
  "dietaryPreferences": ["素食", "無麩質"],
  "difficulty": "easy|medium|hard",
  "maxPrepTime": 數字（分鐘）,
  "maxCookTime": 數字（分鐘）,
  "servings": 數字,
  "tags": ["標籤1", "標籤2"]
}

**重要規則：**
1. 如果用戶沒有明確提到某個條件（例如：沒有說「簡單」、「中等」、「困難」），就不要包含該欄位
2. 如果用戶只說「根據時間推薦」或「時間較短」，只提取時間相關條件，不要推斷難度
3. 如果用戶只說「根據食材推薦」，只提取食材，不要推斷其他條件
4. 絕對不要自行推斷或假設用戶沒有明確提到的條件

只回答 JSON，不要其他文字。`
        },
        {
          role: 'user',
          content: userMessage
        }
      ],
      temperature: 0,
      response_format: { type: 'json_object' },
    })

    const content = response.choices[0].message.content
    if (!content) return {}

    try {
      return JSON.parse(content) as RecommendationCriteria
    } catch {
      return {}
    }
  } catch (error) {
    console.error('Error extracting criteria:', error)
    return {}
  }
}

// 根據條件查詢食譜
async function findMatchingRecipes(criteria: RecommendationCriteria): Promise<Recipe[]> {
  const options: Parameters<typeof getRecipes>[0] = {
    limit: 20, // 先取得較多，之後再篩選
  }

  // 根據標籤過濾
  if (criteria.tags && criteria.tags.length > 0) {
    options.tags = criteria.tags
  }

  // 根據難度過濾（需要在記憶體中過濾）
  let recipes = await getRecipes(options)

  // 在記憶體中進行更精細的過濾
  recipes = recipes.filter(recipe => {
    // 難度過濾
    if (criteria.difficulty && recipe.difficulty !== criteria.difficulty) {
      return false
    }

    // 時間過濾
    if (criteria.maxPrepTime && recipe.prep_time && recipe.prep_time > criteria.maxPrepTime) {
      return false
    }
    if (criteria.maxCookTime && recipe.cook_time && recipe.cook_time > criteria.maxCookTime) {
      return false
    }

    // 份量過濾
    if (criteria.servings && recipe.servings && recipe.servings < criteria.servings) {
      return false
    }

    // 食材過濾（檢查 ingredients 陣列）
    if (criteria.ingredients && criteria.ingredients.length > 0) {
      const recipeIngredients = recipe.ingredients.map(ing => 
        ing.name.toLowerCase()
      )
      const hasMatchingIngredient = criteria.ingredients.some(ing =>
        recipeIngredients.some(ri => ri.includes(ing.toLowerCase()))
      )
      if (!hasMatchingIngredient) {
        return false
      }
    }

    // 飲食偏好過濾（檢查 tags 或 description）
    if (criteria.dietaryPreferences && criteria.dietaryPreferences.length > 0) {
      const recipeText = [
        recipe.title,
        recipe.description,
        ...recipe.tags
      ].join(' ').toLowerCase()

      const hasMatchingPreference = criteria.dietaryPreferences.some(pref => {
        const prefLower = pref.toLowerCase()
        // 檢查常見的飲食偏好關鍵字
        const preferenceKeywords: Record<string, string[]> = {
          '素食': ['素食', 'vegetarian', 'veggie'],
          '無麩質': ['無麩質', 'gluten-free', 'gluten free'],
          '低卡': ['低卡', 'low-calorie', 'low calorie', '低熱量'],
          '低脂': ['低脂', 'low-fat', 'low fat'],
          '高蛋白': ['高蛋白', 'high-protein', 'high protein'],
        }
        
        const keywords = preferenceKeywords[prefLower] || [prefLower]
        return keywords.some(keyword => recipeText.includes(keyword))
      })

      if (!hasMatchingPreference) {
        return false
      }
    }

    return true
  })

  // 按評分和收藏數排序
  recipes.sort((a, b) => {
    const scoreA = (a.average_rating || 0) * 0.7 + (a.favorite_count || 0) * 0.3
    const scoreB = (b.average_rating || 0) * 0.7 + (b.favorite_count || 0) * 0.3
    return scoreB - scoreA
  })

  // 返回前 5 個最相關的
  return recipes.slice(0, 5)
}

// 主對話函數
export async function chatWithRecipeAssistant(
  userMessage: string,
  conversationId?: string
): Promise<{ response: string; recipes?: Recipe[]; newConversationId?: string }> {
  const supabase = await createServerSupabaseClient()
  
  // 檢查用戶認證
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    throw new Error('User not authenticated')
  }

  // 1. 檢查問題是否相關
  const isRelated = await isRecipeRelated(userMessage)
  
  if (!isRelated) {
    const rejectionResponse = '抱歉，我是專門協助食譜推薦的助手，無法回答與烹飪無關的問題。請問您需要什麼樣的食譜推薦呢？例如：\n- 根據食材推薦（如：我有雞蛋和番茄，推薦什麼食譜？）\n- 根據偏好篩選（如：推薦簡單的素食食譜）\n- 根據時間限制（如：30分鐘內可以完成的食譜）'
    
    // 儲存對話（即使被拒絕）
    if (conversationId) {
      await saveMessage(conversationId, 'user', userMessage)
      await saveMessage(conversationId, 'assistant', rejectionResponse)
    }
    
    return {
      response: rejectionResponse
    }
  }

  // 2. 提取推薦條件
  const criteria = await extractCriteria(userMessage)

  // 3. 查詢匹配的食譜
  const matchingRecipes = await findMatchingRecipes(criteria)

  // 4. 準備上下文資訊
  const recipesContext = matchingRecipes.length > 0
    ? matchingRecipes.map((recipe, index) => `
食譜 ${index + 1}：
- 標題：${recipe.title}
- 難度：${recipe.difficulty || '未指定'}
- 準備時間：${recipe.prep_time || '未指定'} 分鐘
- 烹飪時間：${recipe.cook_time || '未指定'} 分鐘
- 份量：${recipe.servings || '未指定'} 人份
- 評分：${recipe.average_rating?.toFixed(1) || '0'} 星（${recipe.rating_count || 0} 個評價）
- 收藏數：${recipe.favorite_count || 0}
- 標籤：${recipe.tags.join(', ') || '無'}
- 描述：${recipe.description || '無'}
- 食材：${recipe.ingredients.map(ing => `${ing.name} ${ing.amount}${ing.unit || ''}`).join(', ')}
`.trim()).join('\n\n')
    : '目前資料庫中沒有找到完全符合條件的食譜。'

  // 5. 取得對話歷史（如果有的話）
  let conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = []
  if (conversationId) {
    const messages = await getConversationMessages(conversationId)
    conversationHistory = messages.map((msg: any) => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content
    }))
  }

  // 6. 生成 AI 回答
  const contextPrompt = matchingRecipes.length > 0
    ? `以下是從資料庫中找到的推薦食譜（**你只能使用這些食譜，絕對不能編造其他食譜**）：

${recipesContext}

**重要指示：**
1. 你只能推薦上述列表中的食譜，不能編造、虛構或添加任何不在列表中的食譜
2. 如果列表中的食譜數量少於用戶期望，請誠實告知，不要編造更多食譜
3. 在回答中，請使用上述食譜的實際資訊（標題、難度、時間、評分等）
4. **不要提到「連結提示」或「查看食譜」等文字**，因為系統會自動在回答下方顯示可點擊的食譜卡片
5. **回答必須簡潔**：總長度控制在 150 字以內，每個食譜描述不超過 2 句話
6. 用友善且實用的方式簡要介紹這些食譜的優點和特色，避免冗長說明`
    : `**重要：資料庫中沒有找到符合條件的食譜。**

請禮貌地告知用戶：
1. 資料庫中目前沒有找到符合條件的食譜
2. 建議他們可以：
   - 放寬搜尋條件（例如：不指定特定食材）
   - 嘗試不同的食材組合
   - 查看其他類似的食譜
3. **絕對不要編造或虛構任何食譜資訊**`

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...conversationHistory,
        { role: 'user', content: userMessage },
        { role: 'assistant', content: contextPrompt }
      ],
      temperature: 0.7,
    })

    const aiResponse = response.choices[0].message.content || '抱歉，我無法處理這個問題。'

    // 7. 儲存對話
    let finalConversationId = conversationId
    if (!finalConversationId) {
      // 建立新對話
      finalConversationId = await createConversation(user.id, userMessage)
    }

    await saveMessage(finalConversationId, 'user', userMessage)
    await saveMessage(finalConversationId, 'assistant', aiResponse, matchingRecipes.map(r => r.id))

    return {
      response: aiResponse,
      recipes: matchingRecipes.length > 0 ? matchingRecipes : undefined,
      newConversationId: conversationId ? undefined : finalConversationId
    }
  } catch (error) {
    console.error('Error generating AI response:', error)
    throw new Error('無法生成回答，請稍後再試')
  }
}

// 建立新對話
async function createConversation(userId: string, firstMessage: string): Promise<string> {
  const supabase = await createServerSupabaseClient()
  
  // 生成對話標題（使用 AI 或簡單截取）
  const title = firstMessage.length > 50 
    ? firstMessage.substring(0, 50) + '...'
    : firstMessage

  const { data, error } = await (supabase
    .from('chatbot_conversations') as any)
    .insert({
      user_id: userId,
      title: title
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating conversation:', error)
    throw new Error('無法建立對話')
  }

  return data.id
}

// 儲存訊息
async function saveMessage(
  conversationId: string,
  role: 'user' | 'assistant',
  content: string,
  recipeIds?: string[]
): Promise<void> {
  const supabase = await createServerSupabaseClient()

  const { error } = await (supabase
    .from('chatbot_messages') as any)
    .insert({
      conversation_id: conversationId,
      role: role,
      content: content,
      recipes: recipeIds || []
    })

  if (error) {
    console.error('Error saving message:', error)
    // 不拋出錯誤，避免影響主流程
  }
}

// 取得用戶的對話列表
export async function getUserConversations() {
  const supabase = await createServerSupabaseClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    throw new Error('User not authenticated')
  }

  const { data, error } = await supabase
    .from('chatbot_conversations')
    .select('*')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })

  if (error) {
    console.error('Error fetching conversations:', error)
    return []
  }

  return data || []
}

// 取得特定對話的訊息
export async function getConversationMessages(conversationId: string) {
  const supabase = await createServerSupabaseClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    throw new Error('User not authenticated')
  }

  // 驗證對話屬於當前用戶
  const { data: conversation } = await supabase
    .from('chatbot_conversations')
    .select('user_id')
    .eq('id', conversationId)
    .single()

  if (!conversation || (conversation as any).user_id !== user.id) {
    throw new Error('Conversation not found or access denied')
  }

  const { data, error } = await supabase
    .from('chatbot_messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching messages:', error)
    return []
  }

  // 如果有食譜 ID，載入完整的食譜資訊
  const messagesWithRecipes = await Promise.all(
    (data || []).map(async (msg: any) => {
      if (msg.role === 'assistant' && msg.recipes && Array.isArray(msg.recipes) && msg.recipes.length > 0) {
        // 載入食譜資訊
        const { getRecipe } = await import('./recipes-server')
        const recipeIds = msg.recipes as string[]
        const recipes = await Promise.all(
          recipeIds.map(id => getRecipe(id))
        )
        const validRecipes = recipes.filter((r): r is Recipe => r !== null)
        return {
          ...msg,
          recipes: validRecipes.length > 0 ? validRecipes : undefined
        }
      }
      return msg
    })
  )

  return messagesWithRecipes
}

// 刪除對話（包含所有訊息）
export async function deleteConversation(conversationId: string): Promise<boolean> {
  const supabase = await createServerSupabaseClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    throw new Error('User not authenticated')
  }

  // 驗證對話屬於當前用戶
  const { data: conversation } = await supabase
    .from('chatbot_conversations')
    .select('user_id')
    .eq('id', conversationId)
    .single()

  if (!conversation || conversation.user_id !== user.id) {
    throw new Error('Conversation not found or access denied')
  }

  // 刪除對話（由於 CASCADE，會自動刪除所有相關訊息）
  const { error } = await supabase
    .from('chatbot_conversations')
    .delete()
    .eq('id', conversationId)

  if (error) {
    console.error('Error deleting conversation:', error)
    return false
  }

  return true
}

