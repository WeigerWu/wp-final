'use client'

import { useState } from 'react'
import { Recipe } from '@/types/recipe'
import { Clock, X, Check, ChevronLeft, ChevronRight, CheckCircle2, PartyPopper } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import Image from 'next/image'

interface CookingModeProps {
  recipe: Recipe
  onExit: () => void
}

export function CookingMode({ recipe, onExit }: CookingModeProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set())
  const [timer, setTimer] = useState<number | null>(null)
  const [timeRemaining, setTimeRemaining] = useState<number>(0)
  const [isCompleting, setIsCompleting] = useState(false)
  const [showCompletionModal, setShowCompletionModal] = useState(false)
  const [animatedProgress, setAnimatedProgress] = useState<number | null>(null)

  const steps = recipe.steps
  const currentStepData = steps[currentStep]

  const toggleStepComplete = (stepIndex: number) => {
    const newCompleted = new Set(completedSteps)
    if (newCompleted.has(stepIndex)) {
      newCompleted.delete(stepIndex)
    } else {
      newCompleted.add(stepIndex)
    }
    setCompletedSteps(newCompleted)
  }

  const startTimer = (minutes: number) => {
    setTimer(minutes * 60)
    setTimeRemaining(minutes * 60)
    
    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          setTimer(null)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const goToNextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const goToPreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  // 根據當前步驟位置計算進度百分比
  // 如果正在完成動畫，使用動畫進度；如果是最後一步，顯示80%，否則顯示當前步驟/總步驟數
  const getProgress = () => {
    if (animatedProgress !== null) {
      return animatedProgress.toString()
    }
    if (currentStep === steps.length - 1) {
      return ((currentStep / steps.length) * 100).toFixed(0) // 最後一步顯示80%（4/5）
    }
    return ((currentStep / steps.length) * 100).toFixed(0)
  }
  
  const progress = getProgress()

  const handleComplete = () => {
    setIsCompleting(true)
    
    // 等待1秒後開始動畫
    setTimeout(() => {
      // 從80%動畫到100%
      const startProgress = (currentStep / steps.length) * 100
      const endProgress = 100
      const duration = 800 // 800ms動畫時間
      const animationFrames = 30 // 30幀
      const increment = (endProgress - startProgress) / animationFrames
      let current = startProgress
      
      const interval = setInterval(() => {
        current += increment
        if (current >= endProgress) {
          setAnimatedProgress(100)
          clearInterval(interval)
          
          // 顯示恭喜頁面
          setShowCompletionModal(true)
          
          // 2秒後跳回原本頁面
          setTimeout(() => {
            onExit()
          }, 2000)
        } else {
          setAnimatedProgress(current)
        }
      }, duration / animationFrames)
    }, 1000)
  }

  return (
    <div className="fixed inset-0 z-50 bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="border-b border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex-1">
            <h1 className="text-2xl font-bold dark:text-gray-100">{recipe.title}</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              步驟 {currentStep + 1} / {steps.length}
            </p>
          </div>
          <Button variant="outline" onClick={onExit} disabled={isCompleting}>
            <X className="mr-2 h-4 w-4" />
            退出
          </Button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="border-b border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-800">
        <div className="container mx-auto p-4">
          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
            <span>進度：{progress}%</span>
            <span>{currentStep + 1} / {steps.length} 步驟</span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
            <div
              className="h-full bg-primary-600 transition-all duration-800 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Timer */}
      {timer !== null && timeRemaining > 0 && (
        <div className="border-b border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-900/20">
          <div className="container mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              <span className="font-semibold text-yellow-800 dark:text-yellow-200">
                計時中：{formatTime(timeRemaining)}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setTimer(null)
                setTimeRemaining(0)
              }}
            >
              停止計時
            </Button>
          </div>
        </div>
      )}

      {/* Step Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-3xl">
          {/* Step Image */}
          {currentStepData.image_url && (
            <div className="mb-6 relative h-64 w-full overflow-hidden rounded-lg bg-gray-200 dark:bg-gray-700">
              <Image
                src={currentStepData.image_url}
                alt={`步驟 ${currentStep + 1}`}
                fill
                className="object-cover"
                sizes="100vw"
              />
            </div>
          )}

          {/* Step Instruction */}
          <div className="mb-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="mb-4">
              <h2 className="text-2xl font-bold dark:text-gray-100">步驟 {currentStep + 1}</h2>
            </div>
            <p className="text-lg text-gray-700 dark:text-gray-300">{currentStepData.instruction}</p>
            
            {/* Timer Button */}
            {currentStepData.timer_minutes && (
              <div className="mt-4">
                <Button
                  variant="outline"
                  onClick={() => startTimer(currentStepData.timer_minutes!)}
                  disabled={timer !== null}
                >
                  <Clock className="mr-2 h-4 w-4" />
                  開始計時 {currentStepData.timer_minutes} 分鐘
                </Button>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={goToPreviousStep}
              disabled={currentStep === 0}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              上一步
            </Button>
            {currentStep === steps.length - 1 ? (
              <Button
                onClick={handleComplete}
                disabled={isCompleting}
                className="bg-green-600 hover:bg-green-700 disabled:opacity-50"
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                完成
              </Button>
            ) : (
              <Button
                onClick={goToNextStep}
              >
                下一步
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Step List */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        <div className="container mx-auto">
          <div className="flex space-x-2 overflow-x-auto">
            {steps.map((step, index) => {
              const isCompleted = completedSteps.has(index)
              const isCurrent = index === currentStep
              
              // 如果步驟已完成，優先顯示為綠色（即使它是當前步驟）
              let buttonClass = 'flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 transition-colors '
              if (isCompleted) {
                buttonClass += 'border-green-500 bg-green-500 text-white'
              } else if (isCurrent) {
                buttonClass += 'border-primary-600 bg-primary-600 text-white'
              } else {
                buttonClass += 'border-gray-300 text-gray-600 hover:border-gray-400 dark:border-gray-600 dark:text-gray-400 dark:hover:border-gray-500'
              }
              
              return (
                <button
                  key={index}
                  onClick={() => setCurrentStep(index)}
                  className={buttonClass}
                >
                  {isCompleted ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* 恭喜完成彈窗 */}
      {showCompletionModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="mx-4 animate-in fade-in zoom-in-95 duration-300">
            <div className="rounded-2xl bg-white p-8 shadow-2xl dark:bg-gray-800">
              <div className="flex flex-col items-center space-y-4">
                <div className="rounded-full bg-green-100 p-4 dark:bg-green-900/30">
                  <PartyPopper className="h-12 w-12 text-green-600 dark:text-green-400" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  恭喜完成！
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-400">
                  您已經成功完成了「{recipe.title}」
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500">
                  享受您的美味料理吧！
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


