'use client'

import { useState } from 'react'
import { Recipe } from '@/types/recipe'
import { Clock, X, Check, ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react'
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

  const progress = ((completedSteps.size / steps.length) * 100).toFixed(0)
  const allStepsCompleted = completedSteps.size === steps.length

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
          <Button variant="outline" onClick={onExit}>
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
            <span>{completedSteps.size} / {steps.length} 步驟完成</span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
            <div
              className="h-full bg-primary-600 transition-all duration-300"
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
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold dark:text-gray-100">步驟 {currentStep + 1}</h2>
              <button
                onClick={() => toggleStepComplete(currentStep)}
                className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors ${
                  completedSteps.has(currentStep)
                    ? 'border-green-500 bg-green-500 text-white'
                    : 'border-gray-300 text-gray-400 hover:border-gray-400 dark:border-gray-600 dark:text-gray-500 dark:hover:border-gray-500'
                }`}
              >
                <Check className="h-5 w-5" />
              </button>
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
                onClick={onExit}
                disabled={!allStepsCompleted}
                className={
                  allStepsCompleted
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed'
                }
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
    </div>
  )
}


