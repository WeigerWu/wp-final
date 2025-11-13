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

const recipeSchema = z.object({
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

type RecipeFormData = z.infer<typeof recipeSchema>

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
      ingredients: recipe?.ingredients || [{ name: '', amount: '', unit: '' }],
      steps: recipe?.steps || [{ step_number: 1, instruction: '' }],
    },
  })

  const ingredients = watch('ingredients')
  const steps = watch('steps')
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
    setValue('ingredients', [
      ...ingredients,
      { name: '', amount: '', unit: '' },
    ])
  }

  const removeIngredient = (index: number) => {
    setValue(
      'ingredients',
      ingredients.filter((_, i) => i !== index)
    )
  }

  const addStep = () => {
    setValue('steps', [
      ...steps,
      { step_number: steps.length + 1, instruction: '' },
    ])
  }

  const removeStep = (index: number) => {
    setValue(
      'steps',
      steps.filter((_, i) => i !== index).map((step, i) => ({
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

      // Upload step images
      const stepsWithImages = await Promise.all(
        data.steps.map(async (step, index) => {
          if (stepImages[index]) {
            const stepImageUrl = await uploadImage(stepImages[index]!, 'recipe-steps')
            return { ...step, image_url: stepImageUrl }
          }
          return step
        })
      )

      const recipeData = {
        ...data,
        image_url: imageUrl,
        steps: stepsWithImages,
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
        <h2 className="text-2xl font-bold">基本資訊</h2>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            標題 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            {...register('title')}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
          {errors.title && (
            <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">描述</label>
          <textarea
            {...register('description')}
            rows={4}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">份量</label>
            <input
              type="number"
              {...register('servings', { valueAsNumber: true })}
              min="1"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">準備時間（分鐘）</label>
            <input
              type="number"
              {...register('prep_time', { valueAsNumber: true })}
              min="1"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">烹飪時間（分鐘）</label>
            <input
              type="number"
              {...register('cook_time', { valueAsNumber: true })}
              min="1"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">難度</label>
          <select
            {...register('difficulty')}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          >
            <option value="">選擇難度</option>
            <option value="easy">簡單</option>
            <option value="medium">中等</option>
            <option value="hard">困難</option>
          </select>
        </div>

        {/* Image Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700">封面圖片</label>
          <div className="mt-1 flex items-center space-x-4">
            {imagePreview && (
              <div className="relative h-32 w-32 overflow-hidden rounded-lg border border-gray-300">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="h-full w-full object-cover"
                />
              </div>
            )}
            <label className="flex cursor-pointer items-center space-x-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
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
          <label className="block text-sm font-medium text-gray-700">標籤</label>
          <div className="mt-1 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center rounded-full bg-primary-100 px-3 py-1 text-sm text-primary-800"
              >
                {tag}
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
            className="mt-2 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>
      </section>

      {/* Ingredients */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">食材</h2>
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
                className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
            <div className="w-24">
              <input
                type="text"
                placeholder="單位"
                {...register(`ingredients.${index}.unit`)}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
            <div className="flex-1">
              <input
                type="text"
                placeholder="食材名稱"
                {...register(`ingredients.${index}.name`)}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
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
          <h2 className="text-2xl font-bold">步驟</h2>
          <Button type="button" onClick={addStep} variant="outline" size="sm">
            <Plus className="mr-2 h-4 w-4" />
            新增步驟
          </Button>
        </div>
        {steps.map((step, index) => (
          <div key={index} className="rounded-lg border border-gray-200 p-4">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold">步驟 {index + 1}</h3>
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
              className="mb-2 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">計時（分鐘）</label>
                <input
                  type="number"
                  {...register(`steps.${index}.timer_minutes`, { valueAsNumber: true })}
                  min="1"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">步驟圖片</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleStepImageChange(index, e)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
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
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? '儲存中...' : mode === 'edit' ? '更新' : '建立'}
        </Button>
      </div>
    </form>
  )
}


