'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/providers/AuthProvider'
import { uploadImage } from '@/lib/cloudinary'
import { smartCompressImage } from '@/lib/image-utils'
import { autoCategorize } from '@/lib/utils/auto-categorize'
import { saveDraft, loadDraft, clearDraft, hasDraft, getDraftSavedTime, type RecipeDraft } from '@/lib/utils/draft-storage'
import { Button } from '@/components/ui/Button'
import { Plus, X, Upload, ArrowLeft, Check, AlertCircle, Loader2, Sparkles, Save, FileText } from 'lucide-react'
import Link from 'next/link'

interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  icon: string | null
  parent_id: string | null
  sort_order: number
}

interface Ingredient {
  name: string
  amount: string
  unit: string
  note: string
  category: string
}

interface Step {
  instruction: string
  image_url?: string
  timer_minutes?: number
}

interface SubmissionState {
  step: 'idle' | 'validating' | 'uploading-image' | 'saving' | 'success' | 'error'
  progress: number // 0-100
  message: string
  error?: string
}

export function RecipeUploadForm() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [submissionState, setSubmissionState] = useState<SubmissionState>({
    step: 'idle',
    progress: 0,
    message: '',
  })

  // 基本資訊
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [servings, setServings] = useState('')
  const [prepTime, setPrepTime] = useState('')
  const [cookTime, setCookTime] = useState('')
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard' | ''>('')
  const [categoryId, setCategoryId] = useState<string>('')
  
  // 分類列表
  const [categories, setCategories] = useState<Category[]>([])
  const [loadingCategories, setLoadingCategories] = useState(true)
  const [suggestedCategoryId, setSuggestedCategoryId] = useState<string | null>(null)
  const [isAutoSuggested, setIsAutoSuggested] = useState(false)
  const userSelectedCategoryRef = useRef(false) // 追蹤用戶是否手動選擇過分類
  
  // 圖片
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  // 步驟圖片（每個步驟對應一個文件和預覽）
  const [stepImageFiles, setStepImageFiles] = useState<{ [index: number]: File | null }>({})
  const [stepImagePreviews, setStepImagePreviews] = useState<{ [index: number]: string | null }>({})

  // 食材
  const [ingredients, setIngredients] = useState<Ingredient[]>([
    { name: '', amount: '', unit: '', note: '', category: '' },
  ])

  // 食材分類管理
  const commonCategories = ['主料', '調味料', '醬料', '蔬菜', '肉類', '海鮮', '配菜', '裝飾']
  const [customCategories, setCustomCategories] = useState<string[]>([])
  const [newCategoryInput, setNewCategoryInput] = useState('')

  // 步驟
  const [steps, setSteps] = useState<Step[]>([
    { instruction: '' },
  ])

  // 標籤
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')

  const commonTags = ['家常', '快速', '減脂', '素食', '無麩質', '學生宿舍', '電鍋']

  // 圖片上傳處理
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  // 添加食材
  const addIngredient = (category?: string) => {
    setIngredients([...ingredients, { name: '', amount: '', unit: '', note: '', category: category || '' }])
  }

  // 移除食材
  const removeIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index))
  }

  // 更新食材
  const updateIngredient = (index: number, field: keyof Ingredient, value: string) => {
    const newIngredients = [...ingredients]
    newIngredients[index] = { ...newIngredients[index], [field]: value }
    setIngredients(newIngredients)
  }

  // 添加自定義分類
  const addCustomCategory = () => {
    if (newCategoryInput.trim() && !commonCategories.includes(newCategoryInput.trim()) && !customCategories.includes(newCategoryInput.trim())) {
      setCustomCategories([...customCategories, newCategoryInput.trim()])
      setNewCategoryInput('')
    }
  }

  // 獲取所有分類
  const getAllCategories = () => {
    return [...commonCategories, ...customCategories]
  }

  // 添加步驟
  const addStep = () => {
    setSteps([...steps, { instruction: '' }])
  }


  // 更新步驟
  const updateStep = (index: number, field: keyof Step, value: string | number) => {
    const newSteps = [...steps]
    newSteps[index] = { ...newSteps[index], [field]: value }
    setSteps(newSteps)
  }

  // 處理步驟圖片上傳
  const handleStepImageChange = (index: number, file: File | null) => {
    if (file) {
      setStepImageFiles(prev => ({ ...prev, [index]: file }))
      const reader = new FileReader()
      reader.onloadend = () => {
        setStepImagePreviews(prev => ({ ...prev, [index]: reader.result as string }))
      }
      reader.readAsDataURL(file)
    } else {
      // 移除圖片
      setStepImageFiles(prev => {
        const newFiles = { ...prev }
        delete newFiles[index]
        return newFiles
      })
      setStepImagePreviews(prev => {
        const newPreviews = { ...prev }
        delete newPreviews[index]
        return newPreviews
      })
      // 同時清除步驟中的 image_url
      updateStep(index, 'image_url', '')
    }
  }

  // 移除步驟時，同時移除對應的圖片
  const removeStepWithImages = (index: number) => {
    // 先移除圖片狀態
    setStepImageFiles(prev => {
      const newFiles = { ...prev }
      delete newFiles[index]
      // 重新索引後面的圖片
      Object.keys(newFiles).forEach(key => {
        const idx = parseInt(key)
        if (idx > index) {
          newFiles[idx - 1] = newFiles[idx]
          delete newFiles[idx]
        }
      })
      return newFiles
    })
    setStepImagePreviews(prev => {
      const newPreviews = { ...prev }
      delete newPreviews[index]
      // 重新索引後面的圖片
      Object.keys(newPreviews).forEach(key => {
        const idx = parseInt(key)
        if (idx > index) {
          newPreviews[idx - 1] = newPreviews[idx]
          delete newPreviews[idx]
        }
      })
      return newPreviews
    })
    // 然後移除步驟
    setSteps(steps.filter((_, i) => i !== index))
  }

  // 添加標籤
  const addTag = (tag: string) => {
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag])
    }
  }

  // 移除標籤
  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag))
  }

  // 更新提交狀態
  const updateState = (updates: Partial<SubmissionState>) => {
    setSubmissionState(prev => ({ ...prev, ...updates }))
  }

  // 表單提交 - 重新設計的版本
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // 步驟 1: 驗證表單
    updateState({ step: 'validating', progress: 0, message: '正在驗證表單資料...' })

    if (!title.trim()) {
      updateState({ step: 'error', message: '請輸入食譜標題', error: '請輸入食譜標題' })
      return
    }

    const validIngredients = ingredients.filter((ing) => ing.name.trim())
    if (validIngredients.length === 0) {
      updateState({ step: 'error', message: '請至少添加一個食材', error: '請至少添加一個食材' })
      return
    }

    const validSteps = steps.filter((step) => step.instruction.trim())
    if (validSteps.length === 0) {
      updateState({ step: 'error', message: '請至少添加一個步驟', error: '請至少添加一個步驟' })
      return
    }

    try {
      // 步驟 2: 檢查認證
      updateState({ progress: 10, message: '正在驗證登入狀態...' })
      const supabase = createSupabaseClient()
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        updateState({ step: 'error', message: '請先登入', error: '請先登入' })
        router.push('/auth/login')
        return
      }

      // 步驟 3: 上傳圖片（如果有）
      let imageUrl: string | null = null
      if (imageFile) {
        updateState({ step: 'uploading-image', progress: 20, message: '正在壓縮圖片...' })
        
        try {
          // 壓縮圖片
          let fileToUpload = imageFile
          try {
            fileToUpload = await smartCompressImage(imageFile)
            updateState({ progress: 40, message: '圖片壓縮完成，正在上傳...' })
          } catch (compressError) {
            console.warn('圖片壓縮失敗，使用原檔案:', compressError)
            updateState({ progress: 30, message: '正在上傳圖片...' })
          }

          // 上傳圖片
          imageUrl = await uploadImage(fileToUpload, 'recipes')
          updateState({ progress: 60, message: '圖片上傳完成！' })
        } catch (imgError: any) {
          updateState({ 
            step: 'error', 
            message: '圖片上傳失敗', 
            error: `圖片上傳失敗: ${imgError.message || '請檢查網路連接'}` 
          })
          return
        }
      } else {
        updateState({ progress: 40, message: '跳過圖片上傳' })
      }

      // 步驟 4: 上傳所有步驟的圖片
      updateState({ progress: 65, message: '正在上傳步驟圖片...' })
      const stepImageUrls: { [index: number]: string | null } = {}
      
      // 收集所有需要上傳圖片的步驟
      const stepsWithImages: Array<{ index: number; file: File }> = []
      steps.forEach((step, index) => {
        if (stepImageFiles[index]) {
          stepsWithImages.push({ index, file: stepImageFiles[index]! })
        } else {
          // 沒有新圖片，保留原有的 image_url
          stepImageUrls[index] = step.image_url || null
        }
      })
      
      // 上傳所有步驟圖片
      if (stepsWithImages.length > 0) {
        const uploadProgressPerStep = 10 / stepsWithImages.length
        
        await Promise.all(
          stepsWithImages.map(async ({ index, file }, idx) => {
            try {
              updateState({ 
                progress: 65 + (idx + 1) * uploadProgressPerStep, 
                message: `正在上傳步驟 ${index + 1} 的圖片...` 
              })
              
              // 壓縮圖片
              let fileToUpload = file
              try {
                fileToUpload = await smartCompressImage(file)
              } catch (compressError) {
                console.warn(`步驟 ${index + 1} 圖片壓縮失敗，使用原檔案:`, compressError)
              }
              
              // 上傳圖片
              const uploadedUrl = await uploadImage(fileToUpload, 'recipes/steps')
              stepImageUrls[index] = uploadedUrl
            } catch (error: any) {
              console.error(`步驟 ${index + 1} 圖片上傳失敗:`, error)
              // 如果上傳失敗，保留原有的 image_url（如果有的話）
              stepImageUrls[index] = steps[index].image_url || null
            }
          })
        )
      }
      
      updateState({ progress: 75, message: '步驟圖片上傳完成！' })

      // 步驟 5: 準備資料
      updateState({ progress: 80, message: '正在準備資料...' })
      
      const formattedSteps = validSteps.map((step, index) => {
        // 找到原始步驟在 steps 陣列中的索引
        const originalStepIndex = steps.findIndex(s => s === step)
        return {
          step_number: index + 1,
          instruction: step.instruction.trim(),
          image_url: stepImageUrls[originalStepIndex] || step.image_url || null,
          timer_minutes: step.timer_minutes || null,
        }
      })

      const formattedIngredients = validIngredients.map((ing) => ({
        name: ing.name.trim(),
        amount: ing.amount.trim() || undefined,
        unit: ing.unit.trim() || undefined,
        note: ing.note.trim() || undefined,
        category: ing.category.trim() || undefined,
      }))

      // 準備食譜資料
      const recipeData: any = {
        title: title.trim(),
        description: description.trim() || null,
        image_url: imageUrl,
        servings: servings ? parseInt(servings) : null,
        prep_time: prepTime ? parseInt(prepTime) : null,
        cook_time: cookTime ? parseInt(cookTime) : null,
        difficulty: difficulty || null,
        category_id: categoryId || null,
        ingredients: formattedIngredients,
        steps: formattedSteps,
        tags: tags.length > 0 ? tags : [],
      }

      // 步驟 6: 儲存到資料庫
      updateState({ step: 'saving', progress: 85, message: '正在儲存食譜...' })
      
      const { data: recipe, error: insertError } = await (supabase
        .from('recipes') as any)
        .insert({
          ...recipeData,
          user_id: user.id,
        })
        .select()
        .single()

      if (insertError) {
        updateState({ 
          step: 'error', 
          message: '儲存失敗', 
          error: `儲存失敗: ${insertError.message || '請稍後再試'}` 
        })
        return
      }

      // 步驟 7: 儲存標籤（如果有的話）
      // 注意：標籤功能暫時跳過，先確保基本發布功能正常
      // TODO: 實作標籤關聯表功能

      // 步驟 8: 成功！
      updateState({ step: 'success', progress: 100, message: '發布成功！' })

      // 清除草稿
      clearDraft()

      // 2秒後跳轉（使用 window.location 避免 React 狀態問題）
      setTimeout(() => {
        router.push('/recipes')
      }, 2000)

    } catch (err: any) {
      updateState({ 
        step: 'error', 
        message: '發生錯誤', 
        error: err.message || '發生未知錯誤，請稍後再試' 
      })
    }
  }

  // 使用 AuthProvider 的认证状态，不需要单独检查
  // authLoading 和 user 状态由 AuthProvider 管理

  // 獲取分類列表
  useEffect(() => {
    if (authLoading || !user) return
    
    const fetchCategories = async () => {
      try {
        const supabase = createSupabaseClient()
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .order('sort_order', { ascending: true })
          .order('name', { ascending: true })
        
        if (error) {
          console.error('Error fetching categories:', error)
        } else {
          setCategories((data || []) as Category[])
        }
      } catch (err) {
        console.error('Error fetching categories:', err)
      } finally {
        setLoadingCategories(false)
      }
    }
    
    fetchCategories()
  }, [user, authLoading])

  // 載入草稿（僅在已登入且首次載入時執行一次）
  const [draftLoaded, setDraftLoaded] = useState(false)
  useEffect(() => {
    // 只有在已登入的情況下才載入草稿
    if (authLoading || !user || draftLoaded) return
    
    const draft = loadDraft()
    if (draft) {
      // 詢問用戶是否要恢復草稿
      const shouldLoad = window.confirm(
        `偵測到未完成的草稿（保存於 ${new Date(draft.savedAt).toLocaleString('zh-TW')}），是否要恢復？`
      )
      
      if (shouldLoad) {
        setTitle(draft.title)
        setDescription(draft.description)
        setServings(draft.servings)
        setPrepTime(draft.prepTime)
        setCookTime(draft.cookTime)
        setDifficulty(draft.difficulty)
        setCategoryId(draft.categoryId)
        setIngredients(draft.ingredients.length > 0 ? draft.ingredients : [{ name: '', amount: '', unit: '', note: '', category: '' }])
        setSteps(draft.steps.length > 0 ? draft.steps : [{ instruction: '' }])
        setTags(draft.tags)
        setCustomCategories(draft.customCategories)
        setImagePreview(draft.imagePreview)
        setStepImagePreviews(draft.stepImagePreviews)
      } else {
        // 用戶選擇不恢復，清除草稿
        clearDraft()
      }
    }
    setDraftLoaded(true)
  }, [user, authLoading, draftLoaded])

  // 自動分類：當標題、描述或標籤變化時，自動建議分類
  useEffect(() => {
    // 如果用戶已經手動選擇過分類，則不再自動建議
    if (userSelectedCategoryRef.current || categories.length === 0) {
      return
    }

    // 如果標題為空或太短，不進行自動分類
    if (!title || title.trim().length < 2) {
      setSuggestedCategoryId(null)
      setIsAutoSuggested(false)
      // 只有在用戶還沒選擇過時，才清除自動建議的分類
      if (!categoryId) {
        setCategoryId('')
      }
      return
    }

    // 計算建議的分類
    const suggestedId = autoCategorize(title, description, tags, categories)
    
    if (suggestedId) {
      setSuggestedCategoryId(suggestedId)
      setIsAutoSuggested(true)
      // 只有在用戶還沒手動選擇過分類時，才自動設置
      if (!userSelectedCategoryRef.current && !categoryId) {
        setCategoryId(suggestedId)
      }
    } else {
      setSuggestedCategoryId(null)
      setIsAutoSuggested(false)
    }
  }, [title, description, tags, categories, categoryId])

  // 自動儲存草稿（當表單內容變化時）
  const saveDraftTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  useEffect(() => {
    // 只有在已登入且不是首次載入時才自動儲存
    if (authLoading || !user || !draftLoaded) return
    
    // 清除之前的定時器
    if (saveDraftTimeoutRef.current) {
      clearTimeout(saveDraftTimeoutRef.current)
    }
    
    // 延遲 2 秒後儲存（避免頻繁寫入）
    saveDraftTimeoutRef.current = setTimeout(() => {
      const draft: Omit<RecipeDraft, 'savedAt'> = {
        title,
        description,
        servings,
        prepTime,
        cookTime,
        difficulty,
        categoryId,
        imagePreview,
        ingredients,
        steps,
        stepImagePreviews,
        tags,
        customCategories,
      }
      saveDraft(draft)
    }, 2000)
    
    return () => {
      if (saveDraftTimeoutRef.current) {
        clearTimeout(saveDraftTimeoutRef.current)
      }
    }
  }, [title, description, servings, prepTime, cookTime, difficulty, categoryId, imagePreview, ingredients, steps, stepImagePreviews, tags, customCategories, draftLoaded, user, authLoading])

  // 重置狀態
  const resetState = () => {
    updateState({ step: 'idle', progress: 0, message: '', error: undefined })
  }

  const isSubmitting = submissionState.step !== 'idle' && submissionState.step !== 'success' && submissionState.step !== 'error'

  // 如果正在檢查登入狀態，顯示載入中
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600 dark:text-primary-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">正在驗證登入狀態...</p>
        </div>
      </div>
    )
  }

  // 如果未登入，顯示提示信息
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-md rounded-lg border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/30">
                <AlertCircle className="h-8 w-8 text-primary-600 dark:text-primary-400" />
              </div>
              <h2 className="mb-2 text-2xl font-bold text-gray-900 dark:text-gray-100">
                請先登入
              </h2>
              <p className="mb-6 text-gray-600 dark:text-gray-400">
                您需要先登入帳號才能上傳食譜
              </p>
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                <Button
                  onClick={() => router.push('/auth/login?redirect=/recipes/new')}
                  className="w-full sm:w-auto"
                >
                  前往登入
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push('/recipes')}
                  className="w-full sm:w-auto"
                >
                  返回食譜列表
                </Button>
              </div>
              <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                還沒有帳號？{' '}
                <Link
                  href="/auth/signup"
                  className="text-primary-600 hover:underline dark:text-primary-400"
                >
                  立即註冊
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        <div className="container mx-auto px-4 py-4">
          <Link 
            href="/recipes" 
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>返回食譜列表</span>
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">上傳食譜</h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">分享你的美味料理</p>
            </div>
            {user && hasDraft() && (
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Save className="h-4 w-4" />
                <span>
                  草稿已自動保存
                  {(() => {
                    const savedTime = getDraftSavedTime()
                    if (savedTime) {
                      const minutesAgo = Math.floor((Date.now() - savedTime.getTime()) / 60000)
                      if (minutesAgo < 1) return '（剛剛）'
                      if (minutesAgo < 60) return `（${minutesAgo} 分鐘前）`
                      return `（${savedTime.toLocaleString('zh-TW', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}）`
                    }
                    return ''
                  })()}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* 提交狀態顯示 */}
        {(submissionState.step !== 'idle') && (
          <div className={`mb-6 rounded-lg border-2 p-6 shadow-lg ${
            submissionState.step === 'success' 
              ? 'border-green-500 bg-green-50 dark:border-green-400 dark:bg-green-900/20' 
              : submissionState.step === 'error' 
              ? 'border-red-500 bg-red-50 dark:border-red-400 dark:bg-red-900/20' 
              : 'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-900/20'
          }`}>
            <div className="flex items-start space-x-4">
              {/* 圖標 */}
              <div className="flex-shrink-0">
                {submissionState.step === 'success' ? (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                    <Check className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                ) : submissionState.step === 'error' ? (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                    <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                  </div>
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-600 dark:text-blue-400" />
                  </div>
                )}
              </div>

              {/* 內容 */}
              <div className="flex-1">
                <h3 className={`text-lg font-semibold mb-1 ${
                  submissionState.step === 'success' 
                    ? 'text-green-700 dark:text-green-300' 
                    : submissionState.step === 'error' 
                    ? 'text-red-700 dark:text-red-300' 
                    : 'text-blue-700 dark:text-blue-300'
                }`}>
                  {submissionState.step === 'success' 
                    ? '🎉 發布成功！' 
                    : submissionState.step === 'error' 
                    ? '❌ 發布失敗' 
                    : '正在發布...'}
                </h3>
                <p className={`text-sm mb-3 ${
                  submissionState.step === 'success' 
                    ? 'text-green-600 dark:text-green-400' 
                    : submissionState.step === 'error' 
                    ? 'text-red-600 dark:text-red-400' 
                    : 'text-blue-600 dark:text-blue-400'
                }`}>
                  {submissionState.message}
                </p>

                {/* 進度條 */}
                {isSubmitting && (
                  <div className="mb-3">
                    <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                      <div 
                        className="h-full bg-blue-500 dark:bg-blue-400 transition-all duration-300 ease-out"
                        style={{ width: `${submissionState.progress}%` }}
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {submissionState.progress}% 完成
                    </p>
                  </div>
                )}

                {/* 錯誤訊息 */}
                {submissionState.step === 'error' && submissionState.error && (
                  <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-3 mb-3">
                    <p className="text-sm text-red-800 dark:text-red-300">{submissionState.error}</p>
                  </div>
                )}

                {/* 成功訊息 */}
                {submissionState.step === 'success' && (
                  <div className="rounded-md bg-green-50 dark:bg-green-900/20 p-3 mb-3">
                    <p className="text-sm text-green-800 dark:text-green-300">食譜已成功發布，即將跳轉到食譜列表...</p>
                  </div>
                )}

                {/* 操作按鈕 */}
                {submissionState.step === 'error' && (
                  <div className="flex gap-3 mt-4">
                    <Button onClick={resetState} variant="outline" size="sm">
                      重試
                    </Button>
                    <Button onClick={() => router.back()} variant="ghost" size="sm">
                      取消
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 基本資訊區塊 */}
          <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <h2 className="mb-4 text-xl font-bold">① 基本資訊</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">
                  食譜標題 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="例如：奶油蒜香雞胸"
                  className="w-full rounded-md border border-gray-300 px-4 py-3 text-lg focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400"
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">簡短介紹</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="例如：上班族 15 分鐘就能完成的奶油蒜香雞胸。"
                  className="w-full rounded-md border border-gray-300 px-4 py-3 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400"
                  disabled={isSubmitting}
                />
              </div>

              {/* 封面圖片 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">封面圖片</label>
                <div
                  onClick={() => !isSubmitting && document.getElementById('image-upload')?.click()}
                  className={`relative flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-8 transition-colors dark:border-gray-600 dark:bg-gray-700 ${
                    isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary-500 hover:bg-gray-100 dark:hover:bg-gray-600'
                  }`}
                >
                  {imagePreview ? (
                    <>
                      <img
                        src={imagePreview}
                        alt="預覽"
                        className="h-48 w-full rounded-lg object-cover"
                      />
                      {!isSubmitting && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setImagePreview(null)
                            setImageFile(null)
                          }}
                          className="mt-4 rounded-md bg-red-500 px-4 py-2 text-white hover:bg-red-600"
                        >
                          移除圖片
                        </button>
                      )}
                    </>
                  ) : (
                    <>
                      <Upload className="mb-4 h-12 w-12 text-gray-400 dark:text-gray-500" />
                      <p className="text-sm text-gray-600 dark:text-gray-400">點擊上傳封面圖片</p>
                    </>
                  )}
                  <input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* 份量與時間 */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">份量（人份）</label>
                  <input
                    type="number"
                    value={servings}
                    onChange={(e) => setServings(e.target.value)}
                    min="1"
                    placeholder="2"
                    className="w-full rounded-md border border-gray-300 px-4 py-3 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400"
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">準備時間（分鐘）</label>
                  <input
                    type="number"
                    value={prepTime}
                    onChange={(e) => setPrepTime(e.target.value)}
                    min="1"
                    placeholder="10"
                    className="w-full rounded-md border border-gray-300 px-4 py-3 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400"
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">料理時間（分鐘）</label>
                  <input
                    type="number"
                    value={cookTime}
                    onChange={(e) => setCookTime(e.target.value)}
                    min="1"
                    placeholder="15"
                    className="w-full rounded-md border border-gray-300 px-4 py-3 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* 難度 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">難度</label>
                <div className="flex gap-2">
                  {(['easy', 'medium', 'hard'] as const).map((diff) => (
                    <button
                      key={diff}
                      type="button"
                      onClick={() => !isSubmitting && setDifficulty(diff)}
                      disabled={isSubmitting}
                      className={`flex-1 rounded-md px-4 py-3 font-medium transition-colors ${
                        difficulty === diff
                          ? 'bg-primary-500 text-white dark:bg-primary-600'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                      } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {diff === 'easy' ? '簡單' : diff === 'medium' ? '中等' : '困難'}
                    </button>
                  ))}
                </div>
              </div>

              {/* 分類 */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">分類（選填）</label>
                  {isAutoSuggested && suggestedCategoryId && (
                    <span className="flex items-center gap-1 text-xs text-primary-600 dark:text-primary-400">
                      <Sparkles className="h-3 w-3" />
                      <span>已自動建議</span>
                    </span>
                  )}
                </div>
                {loadingCategories ? (
                  <div className="text-sm text-gray-500 dark:text-gray-400">載入分類中...</div>
                ) : (
                  <>
                    <select
                      value={categoryId}
                      onChange={(e) => {
                        setCategoryId(e.target.value)
                        userSelectedCategoryRef.current = true
                        setIsAutoSuggested(false)
                      }}
                      className={`w-full rounded-md border px-4 py-3 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 ${
                        isAutoSuggested && suggestedCategoryId === categoryId
                          ? 'border-primary-300 bg-primary-50 dark:border-primary-600 dark:bg-primary-900/20'
                          : 'border-gray-300'
                      }`}
                      disabled={isSubmitting}
                    >
                      <option value="">選擇分類（選填）</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                    {isAutoSuggested && suggestedCategoryId && suggestedCategoryId === categoryId && (
                      <p className="mt-1 text-xs text-primary-600 dark:text-primary-400">
                        系統根據您的食譜內容自動建議此分類，您仍可手動更改
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>
          </section>

          {/* 食材列表 - 保持原有設計但添加 disabled 狀態 */}
          <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="mb-4">
              <h2 className="mb-4 text-xl font-bold">② 食材列表</h2>
              
              {/* 自定義分類輸入 */}
              <div className="mb-4 rounded-lg bg-gray-50 p-4 dark:bg-gray-700/50">
                <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">自定義分類</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCategoryInput}
                    onChange={(e) => setNewCategoryInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addCustomCategory()
                      }
                    }}
                    placeholder="輸入新分類名稱"
                    className="flex-1 rounded-md border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800"
                    disabled={isSubmitting}
                  />
                  <Button
                    type="button"
                    onClick={addCustomCategory}
                    variant="outline"
                    disabled={isSubmitting}
                  >
                    新增分類
                  </Button>
                </div>
                {customCategories.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {customCategories.map((cat) => (
                      <span
                        key={cat}
                        className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                      >
                        {cat}
                        {!isSubmitting && (
                          <button
                            type="button"
                            onClick={() => setCustomCategories(customCategories.filter((c) => c !== cat))}
                            className="ml-2 text-blue-600 hover:text-blue-800"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* 快速添加按鈕 */}
              <div className="mb-4 flex flex-wrap gap-2">
                {getAllCategories().map((category) => (
                  <Button
                    key={category}
                    type="button"
                    onClick={() => addIngredient(category)}
                    variant="outline"
                    size="sm"
                    disabled={isSubmitting}
                  >
                    <Plus className="mr-1 h-3 w-3" />
                    新增 {category}
                  </Button>
                ))}
                <Button
                  type="button"
                  onClick={() => addIngredient()}
                  variant="outline"
                  size="sm"
                  disabled={isSubmitting}
                >
                  <Plus className="mr-1 h-3 w-3" />
                  新增（無分類）
                </Button>
              </div>
            </div>

            {/* 按分類分組顯示食材 */}
            <div className="space-y-6">
              {(() => {
                const grouped = ingredients.reduce((acc, ing, index) => {
                  const category = ing.category || '未分類'
                  if (!acc[category]) {
                    acc[category] = []
                  }
                  acc[category].push({ ...ing, originalIndex: index })
                  return acc
                }, {} as Record<string, Array<Ingredient & { originalIndex: number }>>)

                const categoriesWithIngredients = Object.keys(grouped).sort()

                if (categoriesWithIngredients.length === 0) {
                  return (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      點擊上方按鈕開始添加食材
                    </div>
                  )
                }

                return categoriesWithIngredients.map((category) => (
                  <div key={category} className="rounded-lg border border-gray-200 p-4 dark:border-gray-700 dark:bg-gray-800/50">
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                        {category === '未分類' ? '未分類' : category}
                      </h3>
                      {!isSubmitting && (
                        <Button
                          type="button"
                          onClick={() => addIngredient(category === '未分類' ? '' : category)}
                          variant="outline"
                          size="sm"
                        >
                          <Plus className="mr-1 h-3 w-3" />
                          添加到此分類
                        </Button>
                      )}
                    </div>
                    <div className="space-y-2">
                      {grouped[category].map((ingredient) => {
                        const index = ingredient.originalIndex
                        return (
                          <div key={index} className="flex gap-2 items-start">
                            <div className="flex-1">
                              <input
                                type="text"
                                value={ingredient.name}
                                onChange={(e) => updateIngredient(index, 'name', e.target.value)}
                                placeholder="食材名稱"
                                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400"
                                disabled={isSubmitting}
                              />
                            </div>
                            <div className="w-20">
                              <input
                                type="text"
                                value={ingredient.amount}
                                onChange={(e) => updateIngredient(index, 'amount', e.target.value)}
                                placeholder="數量"
                                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400"
                                disabled={isSubmitting}
                              />
                            </div>
                            <div className="w-24">
                              <select
                                value={ingredient.unit}
                                onChange={(e) => updateIngredient(index, 'unit', e.target.value)}
                                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                                disabled={isSubmitting}
                              >
                                <option value="">單位</option>
                                <option value="g">g (公克)</option>
                                <option value="kg">kg (公斤)</option>
                                <option value="ml">ml (毫升)</option>
                                <option value="L">L (公升)</option>
                                <option value="小匙">小匙</option>
                                <option value="大匙">大匙</option>
                                <option value="杯">杯</option>
                                <option value="顆">顆</option>
                                <option value="個">個</option>
                                <option value="粒">粒</option>
                                <option value="片">片</option>
                                <option value="瓣">瓣</option>
                                <option value="根">根</option>
                                <option value="條">條</option>
                                <option value="尾">尾</option>
                                <option value="隻">隻</option>
                                <option value="塊">塊</option>
                                <option value="支">支</option>
                                <option value="把">把</option>
                                <option value="束">束</option>
                                <option value="包">包</option>
                                <option value="盒">盒</option>
                                <option value="罐">罐</option>
                                <option value="瓶">瓶</option>
                                <option value="適量">適量</option>
                                <option value="少許">少許</option>
                              </select>
                            </div>
                            <div className="w-28">
                              <select
                                value={ingredient.category}
                                onChange={(e) => updateIngredient(index, 'category', e.target.value)}
                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                                disabled={isSubmitting}
                              >
                                <option value="">無分類</option>
                                {getAllCategories().map((cat) => (
                                  <option key={cat} value={cat}>
                                    {cat}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="flex-1">
                              <input
                                type="text"
                                value={ingredient.note}
                                onChange={(e) => updateIngredient(index, 'note', e.target.value)}
                                placeholder="備註"
                                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400"
                                disabled={isSubmitting}
                              />
                            </div>
                            {!isSubmitting && (
                              <Button
                                type="button"
                                onClick={() => removeIngredient(index)}
                                variant="outline"
                                size="sm"
                                className="text-red-600 hover:text-red-700"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))
              })()}
            </div>
          </section>

          {/* 步驟列表 */}
          <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">③ 步驟列表</h2>
              {!isSubmitting && (
                <Button
                  type="button"
                  onClick={addStep}
                  variant="outline"
                  size="sm"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  新增步驟
                </Button>
              )}
            </div>

            <div className="space-y-4">
              {steps.map((step, index) => (
                <div key={index} className="rounded-lg border border-gray-200 p-4 dark:border-gray-700 dark:bg-gray-800/50">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">步驟 {index + 1}</h3>
                    {!isSubmitting && (
                      <Button
                        type="button"
                        onClick={() => removeStepWithImages(index)}
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  
                  <textarea
                    value={step.instruction}
                    onChange={(e) => updateStep(index, 'instruction', e.target.value)}
                    rows={3}
                    placeholder="例如：將雞胸肉切成適口大小，撒上鹽與胡椒稍微醃 10 分鐘。"
                    className="mb-3 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400"
                    disabled={isSubmitting}
                  />

                  {/* 步驟圖片上傳 */}
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">步驟圖片（選填）</label>
                    <div
                      onClick={() => !isSubmitting && document.getElementById(`step-image-upload-${index}`)?.click()}
                      className={`relative flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-4 transition-colors dark:border-gray-600 dark:bg-gray-700 ${
                        isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary-500 hover:bg-gray-100 dark:hover:bg-gray-600'
                      }`}
                    >
                      {stepImagePreviews[index] || step.image_url ? (
                        <>
                          <img
                            src={stepImagePreviews[index] || step.image_url || ''}
                            alt={`步驟 ${index + 1}`}
                            className="h-32 w-full rounded-lg object-cover"
                          />
                          {!isSubmitting && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleStepImageChange(index, null)
                              }}
                              className="mt-2 rounded-md bg-red-500 px-3 py-1 text-sm text-white hover:bg-red-600"
                            >
                              移除圖片
                            </button>
                          )}
                        </>
                      ) : (
                        <>
                          <Upload className="mb-2 h-8 w-8 text-gray-400 dark:text-gray-500" />
                          <p className="text-xs text-gray-600 dark:text-gray-400">點擊上傳圖片</p>
                        </>
                      )}
                      <input
                        id={`step-image-upload-${index}`}
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            handleStepImageChange(index, file)
                          }
                        }}
                        className="hidden"
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">
                        預估時間（分鐘）
                      </label>
                      <input
                        type="number"
                        value={step.timer_minutes || ''}
                        onChange={(e) => updateStep(index, 'timer_minutes', parseInt(e.target.value) || 0)}
                        min="1"
                        placeholder="3"
                        className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400"
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 標籤 */}
          <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <h2 className="mb-4 text-xl font-bold">④ 標籤</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">常用標籤</label>
                <div className="flex flex-wrap gap-2">
                  {commonTags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => !isSubmitting && (tags.includes(tag) ? removeTag(tag) : addTag(tag))}
                      disabled={isSubmitting}
                      className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                        tags.includes(tag)
                          ? 'bg-primary-500 text-white dark:bg-primary-600'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                      } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">自訂標籤</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        if (tagInput.trim() && !isSubmitting) {
                          addTag(tagInput.trim())
                          setTagInput('')
                        }
                      }
                    }}
                    placeholder="輸入標籤並按 Enter"
                    className="flex-1 rounded-md border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800"
                    disabled={isSubmitting}
                  />
                  <Button
                    type="button"
                    onClick={() => {
                      if (tagInput.trim() && !isSubmitting) {
                        addTag(tagInput.trim())
                        setTagInput('')
                      }
                    }}
                    variant="outline"
                    disabled={isSubmitting}
                  >
                    新增
                  </Button>
                </div>
                {tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center rounded-full bg-primary-100 px-3 py-1 text-sm text-primary-800 dark:bg-primary-900/30 dark:text-primary-300"
                      >
                        #{tag}
                        {!isSubmitting && (
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="ml-2 text-primary-600 hover:text-primary-800"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* 底部按鈕 */}
          <div className="sticky bottom-0 z-10 rounded-lg border border-gray-200 bg-white p-4 shadow-lg dark:border-gray-700 dark:bg-gray-800">
            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isSubmitting}
              >
                取消
              </Button>
              <Button 
                type="submit" 
                isLoading={isSubmitting}
                className="min-w-[120px]"
              >
                {submissionState.step === 'success' ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    已發布
                  </>
                ) : isSubmitting ? (
                  '發布中...'
                ) : (
                  '發佈食譜'
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
