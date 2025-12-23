'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createRecipe, updateRecipe } from '@/lib/actions/recipes'
import { uploadImage } from '@/lib/cloudinary'
import { Button } from '@/components/ui/Button'
import { Plus, X, Upload } from 'lucide-react'
import { Recipe } from '@/types/recipe'

// 創建驗證 schema 的函數，根據模式決定驗證規則
const createRecipeSchema = (mode: 'create' | 'edit' = 'create') => {
  // 在編輯模式下，所有欄位都是可選的
  if (mode === 'edit') {
    return z.object({
      title: z.string().optional(),
      description: z.string().optional(),
      servings: z.number().min(1).optional().nullable(),
      prep_time: z.number().min(1).optional().nullable(),
      cook_time: z.number().min(1).optional().nullable(),
      difficulty: z.enum(['easy', 'medium', 'hard']).optional().nullable(),
      tags: z.array(z.string()).optional(),
      ingredients: z.array(
        z.object({
          name: z.string().optional(),
          amount: z.string().optional(),
          unit: z.string().optional(),
        })
      ).optional(),
      steps: z.array(
        z.object({
          step_number: z.number(),
          instruction: z.string().optional(),
          image_url: z.string().optional().nullable(),
          timer_minutes: z.number().optional().nullable(),
        })
      ).optional(),
    })
  }
  
  // 創建模式下的驗證規則（保持原有規則）
  return z.object({
    title: z.string().min(1, '標題為必填'),
    description: z.string().optional(),
    servings: z.number().min(1).optional(),
    prep_time: z.number().min(1).optional(),
    cook_time: z.number().min(1).optional(),
    difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
    tags: z.array(z.string()).optional(),
    ingredients: z.array(
      z.object({
        name: z.string().min(1, '食材名稱為必填'),
        amount: z.string().min(1, '數量為必填'),
        unit: z.string().optional(),
      })
    ),
    steps: z.array(
      z.object({
        step_number: z.number(),
        instruction: z.string().min(1, '步驟說明為必填'),
        image_url: z.string().optional(),
        timer_minutes: z.number().optional(),
      })
    ),
  })
}

type RecipeFormData = z.infer<ReturnType<typeof createRecipeSchema>>

interface RecipeFormProps {
  recipe?: Recipe
  mode?: 'create' | 'edit'
}

export function RecipeForm({ recipe, mode = 'create' }: RecipeFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(
    recipe?.image_url || null
  )
  const [stepImages, setStepImages] = useState<{ [key: number]: File | null }>({})

  const recipeSchema = createRecipeSchema(mode)
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<RecipeFormData>({
    resolver: zodResolver(recipeSchema),
    defaultValues: {
      title: recipe?.title || '',
      description: recipe?.description || '',
      servings: recipe?.servings || undefined,
      prep_time: recipe?.prep_time || undefined,
      cook_time: recipe?.cook_time || undefined,
      difficulty: recipe?.difficulty || undefined,
      tags: recipe?.tags || [],
      ingredients: recipe?.ingredients && recipe.ingredients.length > 0 
        ? recipe.ingredients 
        : mode === 'create' ? [{ name: '', amount: '', unit: '' }] : [],
      steps: recipe?.steps && recipe.steps.length > 0
        ? recipe.steps
        : mode === 'create' ? [{ step_number: 1, instruction: '' }] : [],
    },
  })

  const ingredients = watch('ingredients') || []
  const steps = watch('steps') || []
  const tags = watch('tags') || []

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
    }
  }

  const addIngredient = () => {
    const currentIngredients = ingredients || []
    setValue('ingredients', [
      ...currentIngredients,
      { name: '', amount: '', unit: '' },
    ])
  }

  const removeIngredient = (index: number) => {
    const currentIngredients = ingredients || []
    setValue(
      'ingredients',
      currentIngredients.filter((_, i) => i !== index)
    )
  }

  const addStep = () => {
    const currentSteps = steps || []
    setValue('steps', [
      ...currentSteps,
      { step_number: currentSteps.length + 1, instruction: '' },
    ])
  }

  const removeStep = (index: number) => {
    const currentSteps = steps || []
    setValue(
      'steps',
      currentSteps.filter((_, i) => i !== index).map((step, i) => ({
        ...step,
        step_number: i + 1,
      }))
    )
  }

  const addTag = (tag: string) => {
    if (tag && !tags.includes(tag)) {
      setValue('tags', [...tags, tag])
    }
  }

  const removeTag = (tag: string) => {
    setValue('tags', tags.filter((t) => t !== tag))
  }

  const onSubmit = async (data: RecipeFormData) => {
    setIsSubmitting(true)
    try {
      // Upload main image
      let imageUrl = recipe?.image_url
      if (imageFile) {
        imageUrl = await uploadImage(imageFile, 'recipes')
      }

      // 處理步驟數據（在編輯模式下可能為空）
      const stepsToProcess = data.steps || recipe?.steps || []
      const stepsWithImages = await Promise.all(
        stepsToProcess.map(async (step, index) => {
          if (stepImages[index]) {
            const stepImageUrl = await uploadImage(stepImages[index]!, 'recipe-steps')
            return { ...step, image_url: stepImageUrl }
          }
          return step
        })
      )

      // 在編輯模式下，過濾掉空值，只提交有變更的欄位
      const recipeData: any = {
        ...data,
        image_url: imageUrl || recipe?.image_url,
        steps: stepsWithImages.length > 0 ? stepsWithImages : stepsToProcess,
      }

      // 過濾空的食材和步驟（在編輯模式下）
      if (mode === 'edit') {
        if (recipeData.ingredients && Array.isArray(recipeData.ingredients)) {
          recipeData.ingredients = recipeData.ingredients.filter(
            (ing: any) => ing && (ing.name || ing.amount)
          )
          // 如果過濾後為空，保留原來的食材
          if (recipeData.ingredients.length === 0 && recipe?.ingredients) {
            recipeData.ingredients = recipe.ingredients
          }
        } else if (!recipeData.ingredients && recipe?.ingredients) {
          recipeData.ingredients = recipe.ingredients
        }
        
        if (recipeData.steps && Array.isArray(recipeData.steps)) {
          recipeData.steps = recipeData.steps.filter(
            (step: any) => step && step.instruction
          )
          // 如果過濾後為空，保留原來的步驟
          if (recipeData.steps.length === 0 && recipe?.steps) {
            recipeData.steps = recipe.steps
          }
        } else if (!recipeData.steps && recipe?.steps) {
          recipeData.steps = recipe.steps
        }
      }

      if (mode === 'edit' && recipe) {
        await updateRecipe(recipe.id, recipeData)
      } else {
        await createRecipe(recipeData)
      }

      router.push('/recipes')
      router.refresh()
    } catch (error) {
      console.error('Error saving recipe:', error)
      alert('儲存失敗，請稍後再試')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Basic Info */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold dark:text-gray-100">基本資訊</h2>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            標題 {mode === 'create' && <span className="text-red-500">*</span>}
          </label>
          <input
            type="text"
            {...register('title')}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400"
          />
          {errors.title && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.title.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">描述</label>
          <textarea
            {...register('description')}
            rows={4}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">份量</label>
            <input
              type="number"
              {...register('servings', { valueAsNumber: true })}
              min="1"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">準備時間（分鐘）</label>
            <input
              type="number"
              {...register('prep_time', { valueAsNumber: true })}
              min="1"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">烹飪時間（分鐘）</label>
            <input
              type="number"
              {...register('cook_time', { valueAsNumber: true })}
              min="1"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">難度</label>
          <select
            {...register('difficulty')}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
          >
            <option value="">選擇難度</option>
            <option value="easy">簡單</option>
            <option value="medium">中等</option>
            <option value="hard">困難</option>
          </select>
        </div>

        {/* Image Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">封面圖片</label>
          <div className="mt-1 flex items-center space-x-4">
            {imagePreview && (
              <div className="relative h-32 w-32 overflow-hidden rounded-lg border border-gray-300 dark:border-gray-600">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="h-full w-full object-cover"
                />
              </div>
            )}
            <label className="flex cursor-pointer items-center space-x-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600">
              <Upload className="h-4 w-4" />
              <span>上傳圖片</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">標籤</label>
          <div className="mt-1 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center rounded-full bg-primary-100 px-3 py-1 text-sm text-primary-800 dark:bg-primary-900/30 dark:text-primary-300"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="ml-2 text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
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
            className="mt-2 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400"
          />
        </div>
      </section>

      {/* Ingredients */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold dark:text-gray-100">食材</h2>
          <Button type="button" onClick={addIngredient} variant="outline" size="sm">
            <Plus className="mr-2 h-4 w-4" />
            新增食材
          </Button>
        </div>
        {ingredients.map((ingredient, index) => (
          <div key={index} className="flex gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="數量"
                {...register(`ingredients.${index}.amount`)}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400"
              />
            </div>
            <div className="w-24">
              <input
                type="text"
                placeholder="單位"
                {...register(`ingredients.${index}.unit`)}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400"
              />
            </div>
            <div className="flex-1">
              <input
                type="text"
                placeholder="食材名稱"
                {...register(`ingredients.${index}.name`)}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400"
              />
            </div>
            <Button
              type="button"
              onClick={() => removeIngredient(index)}
              variant="outline"
              size="sm"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </section>

      {/* Steps */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold dark:text-gray-100">步驟</h2>
          <Button type="button" onClick={addStep} variant="outline" size="sm">
            <Plus className="mr-2 h-4 w-4" />
            新增步驟
          </Button>
        </div>
        {(steps || []).map((step, index) => (
          <div key={index} className="rounded-lg border border-gray-200 p-4 dark:border-gray-700 dark:bg-gray-800/50">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold dark:text-gray-100">步驟 {index + 1}</h3>
              <Button
                type="button"
                onClick={() => removeStep(index)}
                variant="outline"
                size="sm"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <textarea
              {...register(`steps.${index}.instruction`)}
              rows={3}
              placeholder="描述此步驟..."
              className="mb-2 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400"
            />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">計時（分鐘）</label>
                <input
                  type="number"
                  {...register(`steps.${index}.timer_minutes`, { valueAsNumber: true })}
                  min="1"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">步驟圖片</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleStepImageChange(index, e)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                />
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* Submit */}
      <div className="flex justify-end space-x-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
        >
          取消
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          {isSubmitting ? '儲存中...' : mode === 'edit' ? '更新' : '建立'}
        </Button>
      </div>
    </form>
  )
}


