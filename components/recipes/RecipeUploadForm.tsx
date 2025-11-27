'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createRecipe } from '@/lib/actions/recipes'
import { uploadImage } from '@/lib/cloudinary'
import { Button } from '@/components/ui/Button'
import { RecipeCard } from '@/components/recipes/RecipeCard'
import { Recipe } from '@/types/recipe'
import { 
  Plus, 
  X, 
  Upload, 
  ArrowLeft, 
  ChevronUp, 
  ChevronDown,
  Save,
  Eye,
  EyeOff,
  Clock
} from 'lucide-react'
import { formatTime } from '@/lib/utils'
import Link from 'next/link'

// 擴展 Ingredient 類型以包含備註
const ingredientSchema = z.object({
  name: z.string().min(1, '食材名稱為必填'),
  amount: z.string().optional(),
  unit: z.string().optional(),
  note: z.string().optional(), // 備註欄位
})

const stepSchema = z.object({
  step_number: z.number(),
  instruction: z.string().min(1, '步驟說明為必填'),
  image_url: z.string().optional(),
  timer_minutes: z.number().optional(),
})

const recipeSchema = z.object({
  title: z.string().min(1, '標題為必填'),
  description: z.string().optional(),
  servings: z.number().min(1).optional(),
  prep_time: z.number().min(1).optional(),
  cook_time: z.number().min(1).optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  category_id: z.string().optional(),
  tags: z.array(z.string()).default([]),
  ingredients: z.array(ingredientSchema).min(1, '至少需要 1 個食材'),
  steps: z.array(stepSchema).min(1, '至少需要 1 個步驟'),
})

type RecipeFormData = z.infer<typeof recipeSchema>

interface RecipeUploadFormProps {
  initialRecipe?: Recipe | null
  mode?: 'create' | 'edit'
}

const DRAFT_KEY = 'recipe-draft'

export function RecipeUploadForm({ initialRecipe, mode = 'create' }: RecipeUploadFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPreview, setShowPreview] = useState(true)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [isAutoSaving, setIsAutoSaving] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(
    initialRecipe?.image_url || null
  )
  const [stepImages, setStepImages] = useState<{ [key: number]: File | null }>({})
  const [stepImagePreviews, setStepImagePreviews] = useState<{ [key: number]: string | null }>({})
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    control,
    trigger,
  } = useForm<RecipeFormData>({
    resolver: zodResolver(recipeSchema),
    defaultValues: {
      title: initialRecipe?.title || '',
      description: initialRecipe?.description || '',
      servings: initialRecipe?.servings || undefined,
      prep_time: initialRecipe?.prep_time || undefined,
      cook_time: initialRecipe?.cook_time || undefined,
      difficulty: initialRecipe?.difficulty || undefined,
      tags: initialRecipe?.tags || [],
      ingredients: initialRecipe?.ingredients?.length 
        ? initialRecipe.ingredients.map((ing: any) => ({
            name: ing.name || '',
            amount: ing.amount || '',
            unit: ing.unit || '',
            note: ing.note || '',
          }))
        : [
            { name: '雞胸肉', amount: '200', unit: 'g', note: '去皮切條' },
            { name: '', amount: '', unit: '', note: '' },
            { name: '', amount: '', unit: '', note: '' },
          ],
      steps: initialRecipe?.steps?.length 
        ? initialRecipe.steps.map((step: any) => ({
            step_number: step.step_number || 0,
            instruction: step.instruction || '',
            image_url: step.image_url || undefined,
            timer_minutes: step.timer_minutes || undefined,
          }))
        : [{ step_number: 1, instruction: '' }],
    },
  })

  const { fields: ingredientFields, append: appendIngredient, remove: removeIngredient, move: moveIngredient } = useFieldArray({
    control,
    name: 'ingredients',
  })

  const { fields: stepFields, append: appendStep, remove: removeStep, move: moveStep } = useFieldArray({
    control,
    name: 'steps',
  })

  const watchedValues = watch()
  const ingredients = watch('ingredients')
  const steps = watch('steps')
  const tags = watch('tags') || []

  // 載入草稿
  useEffect(() => {
    if (mode === 'create' && typeof window !== 'undefined') {
      const draft = localStorage.getItem(DRAFT_KEY)
      if (draft) {
        try {
          const draftData = JSON.parse(draft)
          // 載入草稿資料
          Object.keys(draftData).forEach((key) => {
            if (key === 'ingredients' || key === 'steps' || key === 'tags') {
              setValue(key as any, draftData[key])
            } else {
              setValue(key as any, draftData[key])
            }
          })
          if (draftData.imagePreview) {
            setImagePreview(draftData.imagePreview)
          }
          console.log('✅ 已載入草稿')
        } catch (error) {
          console.error('載入草稿失敗:', error)
        }
      }
    }
  }, [mode, setValue])

  // 自動儲存草稿
  const saveDraft = useCallback(async () => {
    if (mode === 'edit') return // 編輯模式不使用草稿功能
    
    setIsAutoSaving(true)
    const formData = {
      ...watchedValues,
      imagePreview,
    }
    
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(formData))
      setLastSaved(new Date())
      console.log('💾 草稿已自動儲存')
    } catch (error) {
      console.error('儲存草稿失敗:', error)
    } finally {
      setIsAutoSaving(false)
    }
  }, [watchedValues, imagePreview, mode])

  // 監聽表單變化，自動儲存
  useEffect(() => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current)
    }

    autoSaveTimerRef.current = setTimeout(() => {
      saveDraft()
    }, 10000) // 10秒後自動儲存

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current)
      }
    }
  }, [watchedValues, imagePreview, saveDraft])

  // 清除草稿
  const clearDraft = () => {
    localStorage.removeItem(DRAFT_KEY)
    setLastSaved(null)
  }

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

  const handleStepImageChange = (stepIndex: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setStepImages({ ...stepImages, [stepIndex]: file })
      const reader = new FileReader()
      reader.onloadend = () => {
        setStepImagePreviews({ ...stepImagePreviews, [stepIndex]: reader.result as string })
      }
      reader.readAsDataURL(file)
    }
  }

  // 移除步驟圖片
  const removeStepImage = (stepIndex: number) => {
    const newStepImages = { ...stepImages }
    const newPreviews = { ...stepImagePreviews }
    delete newStepImages[stepIndex]
    delete newPreviews[stepIndex]
    setStepImages(newStepImages)
    setStepImagePreviews(newPreviews)
    setValue(`steps.${stepIndex}.image_url`, undefined)
  }

  // 標籤管理
  const addTag = (tag: string) => {
    if (tag && !tags.includes(tag)) {
      setValue('tags', [...tags, tag])
    }
  }

  const removeTag = (tag: string) => {
    setValue('tags', tags.filter((t) => t !== tag))
  }

  // 常用標籤
  const commonTags = ['家常', '快速', '減脂', '素食', '無麩質', '學生宿舍', '電鍋', '10分鐘內']

  // 生成預覽用的 Recipe 對象
  const generatePreviewRecipe = (): Recipe => {
    const totalTime = (watchedValues.prep_time || 0) + (watchedValues.cook_time || 0)
    return {
      id: 'preview',
      user_id: 'preview',
      title: watchedValues.title || '食譜標題',
      description: watchedValues.description || null,
      image_url: imagePreview || null,
      servings: watchedValues.servings || null,
      prep_time: watchedValues.prep_time || null,
      cook_time: watchedValues.cook_time || null,
      difficulty: watchedValues.difficulty || null,
      tags: watchedValues.tags || [],
      ingredients: (watchedValues.ingredients || []).map(ing => ({
        name: ing.name || '',
        amount: ing.amount || '',
        unit: ing.unit,
        note: ing.note,
      })),
      steps: watchedValues.steps || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      average_rating: 0,
      rating_count: 0,
      favorite_count: 0,
    }
  }

  // 表單提交
  const onSubmit = async (data: RecipeFormData) => {
    setIsSubmitting(true)
    
    try {
      // 驗證至少有一個食材和一個步驟
      if (!data.ingredients || data.ingredients.length === 0) {
        alert('請至少新增一個食材')
        setIsSubmitting(false)
        return
      }
      if (!data.steps || data.steps.length === 0) {
        alert('請至少新增一個步驟')
        setIsSubmitting(false)
        return
      }

      // 上傳封面圖片
      let imageUrl = initialRecipe?.image_url || null
      if (imageFile) {
        imageUrl = await uploadImage(imageFile, 'recipes')
      }

      // 上傳步驟圖片
      const stepsWithImages = await Promise.all(
        data.steps.map(async (step, index) => {
          if (stepImages[index]) {
            const stepImageUrl = await uploadImage(stepImages[index]!, 'recipe-steps')
            return { ...step, image_url: stepImageUrl }
          }
          return step
        })
      )

      // 重新編號步驟
      const numberedSteps = stepsWithImages.map((step, index) => ({
        ...step,
        step_number: index + 1,
      }))

      const recipeData = {
        ...data,
        image_url: imageUrl,
        steps: numberedSteps,
      }

      await createRecipe(recipeData)

      // 清除草稿
      clearDraft()

      router.push('/recipes')
      router.refresh()
    } catch (error) {
      console.error('Error saving recipe:', error)
      alert('儲存失敗，請稍後再試')
    } finally {
      setIsSubmitting(false)
    }
  }

  // 儲存草稿（手動）
  const handleSaveDraft = async () => {
    const isValid = await trigger()
    if (isValid) {
      saveDraft()
      alert('草稿已儲存！')
    }
  }

  // 錯誤時滾動到第一個錯誤
  const scrollToFirstError = () => {
    const firstError = document.querySelector('.error-message, [aria-invalid="true"]')
    if (firstError) {
      firstError.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link 
              href="/recipes" 
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>返回食譜列表</span>
            </Link>
            <div className="flex items-center space-x-4">
              {lastSaved && (
                <span className="text-sm text-gray-500">
                  {isAutoSaving ? '儲存中...' : `已自動儲存 ${lastSaved.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })}`}
                </span>
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowPreview(!showPreview)}
                className="md:hidden"
              >
                {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">上傳食譜</h1>
          <p className="mt-2 text-gray-600">分享你的美味料理，讓更多人發現你的好手藝</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit, scrollToFirstError)}>
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* 左側：表單 */}
            <div className="lg:col-span-2 space-y-6">
              {/* ① 基本資訊 */}
              <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-xl font-bold">① 基本資訊</h2>
                
                {/* 標題 */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    食譜標題 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    {...register('title')}
                    placeholder="例如：奶油蒜香雞胸"
                    className="w-full rounded-md border border-gray-300 px-4 py-3 text-lg focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  {errors.title && (
                    <p className="mt-1 text-sm text-red-600 error-message">{errors.title.message}</p>
                  )}
                </div>

                {/* 簡短介紹 */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    簡短介紹
                  </label>
                  <textarea
                    {...register('description')}
                    rows={3}
                    placeholder="例如：上班族 15 分鐘就能完成的奶油蒜香雞胸。"
                    className="w-full rounded-md border border-gray-300 px-4 py-3 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                {/* 封面圖片 */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    封面圖片
                  </label>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="relative flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-8 hover:border-primary-500 hover:bg-gray-100 transition-colors"
                  >
                    {imagePreview ? (
                      <>
                        <img
                          src={imagePreview}
                          alt="預覽"
                          className="h-48 w-full rounded-lg object-cover"
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setImagePreview(null)
                            setImageFile(null)
                            if (fileInputRef.current) fileInputRef.current.value = ''
                          }}
                          className="mt-4 rounded-md bg-red-500 px-4 py-2 text-white hover:bg-red-600"
                        >
                          移除圖片
                        </button>
                      </>
                    ) : (
                      <>
                        <Upload className="mb-4 h-12 w-12 text-gray-400" />
                        <p className="text-sm text-gray-600">拖曳上傳或點此選擇檔案</p>
                        <p className="mt-1 text-xs text-gray-500">建議尺寸：1200x800px</p>
                      </>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </div>
                </div>

                {/* 份量與時間 */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      份量（人份）
                    </label>
                    <input
                      type="number"
                      {...register('servings', { valueAsNumber: true })}
                      min="1"
                      placeholder="2"
                      className="w-full rounded-md border border-gray-300 px-4 py-3 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      準備時間（分鐘）
                    </label>
                    <input
                      type="number"
                      {...register('prep_time', { valueAsNumber: true })}
                      min="1"
                      placeholder="10"
                      className="w-full rounded-md border border-gray-300 px-4 py-3 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      料理時間（分鐘）
                    </label>
                    <input
                      type="number"
                      {...register('cook_time', { valueAsNumber: true })}
                      min="1"
                      placeholder="15"
                      className="w-full rounded-md border border-gray-300 px-4 py-3 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>

                {/* 難度 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    難度
                  </label>
                  <div className="flex gap-2">
                    {(['easy', 'medium', 'hard'] as const).map((difficulty) => (
                      <button
                        key={difficulty}
                        type="button"
                        onClick={() => setValue('difficulty', difficulty)}
                        className={`flex-1 rounded-md px-4 py-3 font-medium transition-colors ${
                          watchedValues.difficulty === difficulty
                            ? 'bg-primary-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {difficulty === 'easy' ? '簡單' : difficulty === 'medium' ? '中等' : '困難'}
                      </button>
                    ))}
                  </div>
                </div>
              </section>

              {/* ② 食材列表 */}
              <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-xl font-bold">② 食材列表</h2>
                  <Button
                    type="button"
                    onClick={() => appendIngredient({ name: '', amount: '', unit: '', note: '' })}
                    variant="outline"
                    size="sm"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    新增食材
                  </Button>
                </div>

                <div className="space-y-3">
                  {ingredientFields.map((field, index) => (
                    <div key={field.id} className="flex gap-2 items-start">
                      <div className="flex-1">
                        <input
                          type="text"
                          {...register(`ingredients.${index}.name`)}
                          placeholder="食材名稱"
                          className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && index === ingredientFields.length - 1) {
                              e.preventDefault()
                              appendIngredient({ name: '', amount: '', unit: '', note: '' })
                            }
                          }}
                        />
                        {errors.ingredients?.[index]?.name && (
                          <p className="mt-1 text-xs text-red-600 error-message">
                            {errors.ingredients[index]?.name?.message}
                          </p>
                        )}
                      </div>
                      <div className="w-20">
                        <input
                          type="text"
                          {...register(`ingredients.${index}.amount`)}
                          placeholder="數量"
                          className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                      <div className="w-24">
                        <select
                          {...register(`ingredients.${index}.unit`)}
                          className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                          <option value="">單位</option>
                          <option value="g">g</option>
                          <option value="ml">ml</option>
                          <option value="小匙">小匙</option>
                          <option value="大匙">大匙</option>
                          <option value="顆">顆</option>
                          <option value="片">片</option>
                          <option value="瓣">瓣</option>
                          <option value="根">根</option>
                          <option value="條">條</option>
                        </select>
                      </div>
                      <div className="flex-1">
                        <input
                          type="text"
                          {...register(`ingredients.${index}.note`)}
                          placeholder="備註（切碎、常溫、去皮等）"
                          className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                      <Button
                        type="button"
                        onClick={() => removeIngredient(index)}
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                {errors.ingredients && (
                  <p className="mt-2 text-sm text-red-600 error-message">
                    {errors.ingredients.message}
                  </p>
                )}
              </section>

              {/* ③ 步驟列表 */}
              <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-xl font-bold">③ 步驟列表</h2>
                  <Button
                    type="button"
                    onClick={() => appendStep({ step_number: stepFields.length + 1, instruction: '' })}
                    variant="outline"
                    size="sm"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    新增步驟
                  </Button>
                </div>

                <div className="space-y-4">
                  {stepFields.map((field, index) => (
                    <div key={field.id} className="rounded-lg border border-gray-200 p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900">步驟 {index + 1}</h3>
                        <div className="flex gap-2">
                          {index > 0 && (
                            <Button
                              type="button"
                              onClick={() => moveStep(index, index - 1)}
                              variant="outline"
                              size="sm"
                            >
                              <ChevronUp className="h-4 w-4" />
                            </Button>
                          )}
                          {index < stepFields.length - 1 && (
                            <Button
                              type="button"
                              onClick={() => moveStep(index, index + 1)}
                              variant="outline"
                              size="sm"
                            >
                              <ChevronDown className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            type="button"
                            onClick={() => removeStep(index)}
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <textarea
                        {...register(`steps.${index}.instruction`)}
                        rows={3}
                        placeholder="例如：將雞胸肉切成適口大小，撒上鹽與胡椒稍微醃 10 分鐘。"
                        className="mb-3 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                      {errors.steps?.[index]?.instruction && (
                        <p className="mb-3 text-xs text-red-600 error-message">
                          {errors.steps[index]?.instruction?.message}
                        </p>
                      )}

                      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            預估時間（分鐘）
                          </label>
                          <input
                            type="number"
                            {...register(`steps.${index}.timer_minutes`, { valueAsNumber: true })}
                            min="1"
                            placeholder="3"
                            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            步驟圖片
                          </label>
                          {stepImagePreviews[index] ? (
                            <div className="relative">
                              <img
                                src={stepImagePreviews[index]!}
                                alt={`步驟 ${index + 1}`}
                                className="h-24 w-full rounded-md object-cover"
                              />
                              <button
                                type="button"
                                onClick={() => removeStepImage(index)}
                                className="absolute right-2 top-2 rounded-full bg-red-500 p-1 text-white hover:bg-red-600"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ) : (
                            <label className="flex cursor-pointer items-center justify-center rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm hover:bg-gray-100">
                              <Upload className="mr-2 h-4 w-4" />
                              上傳圖片
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleStepImageChange(index, e)}
                                className="hidden"
                              />
                            </label>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {errors.steps && (
                  <p className="mt-2 text-sm text-red-600 error-message">
                    {errors.steps.message}
                  </p>
                )}
                <p className="mt-4 text-sm text-gray-500">
                  💡 建議每個步驟只寫一個動作，讓烹飪模式更清楚。
                </p>
              </section>

              {/* ④ 標籤與分類 */}
              <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-xl font-bold">④ 標籤與分類</h2>
                
                {/* 常用標籤 */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    常用標籤
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {commonTags.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => {
                          if (tags.includes(tag)) {
                            removeTag(tag)
                          } else {
                            addTag(tag)
                          }
                        }}
                        className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                          tags.includes(tag)
                            ? 'bg-primary-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        #{tag}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 自訂標籤 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    自訂標籤
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="輸入標籤並按 Enter"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          const input = e.target as HTMLInputElement
                          if (input.value.trim()) {
                            addTag(input.value.trim())
                            input.value = ''
                          }
                        }
                      }}
                      className="flex-1 rounded-md border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  {tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center rounded-full bg-primary-100 px-3 py-1 text-sm text-primary-800"
                        >
                          #{tag}
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="ml-2 text-primary-600 hover:text-primary-800"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </section>

              {/* 底部按鈕 */}
              <div className="sticky bottom-0 z-10 rounded-lg border border-gray-200 bg-white p-4 shadow-lg">
                <div className="flex justify-between gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleSaveDraft}
                    disabled={mode === 'edit'}
                  >
                    <Save className="mr-2 h-4 w-4" />
                    儲存草稿
                  </Button>
                  <div className="flex gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.back()}
                    >
                      取消
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? '發佈中...' : '發佈食譜'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* 右側：預覽區 */}
            <div className={`lg:col-span-1 ${showPreview ? 'block' : 'hidden'} lg:block`}>
              <div className="sticky top-4">
                <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                  <h3 className="mb-4 text-lg font-bold">即時預覽</h3>
                  <div className="space-y-4">
                    <RecipeCard recipe={generatePreviewRecipe()} />
                    
                    {/* 提示 */}
                    <div className="rounded-lg bg-blue-50 p-4">
                      <h4 className="mb-2 font-semibold text-blue-900">💡 上傳小提醒</h4>
                      <ul className="space-y-1 text-sm text-blue-800">
                        <li>• 封面圖片建議尺寸 1200x800px</li>
                        <li>• 步驟圖片有助於理解</li>
                        <li>• 詳細的說明更容易獲得收藏</li>
                        <li>• 標籤可幫助其他用戶找到你的食譜</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

