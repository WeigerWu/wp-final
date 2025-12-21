'use client'

import { Recipe } from '@/types/recipe'
import Link from 'next/link'
import Image from 'next/image'

interface Message {
  role: 'user' | 'assistant'
  content: string
  recipes?: Recipe[]
}

export function ChatMessage({ message }: { message: Message }) {
  const isUser = message.role === 'user'

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} items-end gap-2`}>
      {!isUser && (
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-400 to-primary-500 text-white shadow-md">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
      )}
      <div className={`max-w-[80%] rounded-2xl px-4 py-3 shadow-sm transition-all duration-200 ${
        isUser
          ? 'bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-primary-500/30'
          : 'bg-white text-gray-900 shadow-gray-200/50 dark:bg-gray-700 dark:text-gray-100 dark:shadow-gray-900/50'
      }`}>
        <div className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</div>
        
        {/* 顯示推薦的食譜卡片 */}
        {!isUser && message.recipes && message.recipes.length > 0 && (
          <div className="mt-4 space-y-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              ✨ 推薦食譜
            </div>
            <div className="grid grid-cols-1 gap-3">
              {message.recipes.map(recipe => (
                <Link
                  key={recipe.id}
                  href={`/recipes/${recipe.id}`}
                  className="group block overflow-hidden rounded-xl border border-gray-200/60 bg-white/80 backdrop-blur-sm transition-all duration-300 hover:border-primary-400 hover:shadow-lg hover:shadow-primary-500/10 hover:-translate-y-0.5 dark:border-gray-600/60 dark:bg-gray-800/80 dark:hover:border-primary-500"
                >
                  <div className="flex gap-3 p-3">
                    {/* 食譜圖片 */}
                    {recipe.image_url ? (
                      <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md bg-gray-200 dark:bg-gray-700">
                        <Image
                          src={recipe.image_url}
                          alt={recipe.title}
                          fill
                          className="object-cover transition-transform group-hover:scale-105"
                          sizes="64px"
                        />
                      </div>
                    ) : (
                      <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-md bg-gray-200 text-xs text-gray-400 dark:bg-gray-700 dark:text-gray-500">
                        🍳
                      </div>
                    )}
                    
                    {/* 食譜資訊 */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors line-clamp-1">
                        {recipe.title}
                      </h4>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                        {recipe.difficulty && (
                          <span className="inline-flex items-center">
                            <span className="mr-1">📊</span>
                            {recipe.difficulty === 'easy' ? '簡單' : recipe.difficulty === 'medium' ? '中等' : '困難'}
                          </span>
                        )}
                        {recipe.prep_time && (
                          <span className="inline-flex items-center">
                            <span className="mr-1">⏱️</span>
                            {recipe.prep_time}分
                          </span>
                        )}
                        {recipe.cook_time && (
                          <span className="inline-flex items-center">
                            <span className="mr-1">🔥</span>
                            {recipe.cook_time}分
                          </span>
                        )}
                        {recipe.average_rating && (
                          <span className="inline-flex items-center text-yellow-600 dark:text-yellow-400">
                            <span className="mr-1">⭐</span>
                            {recipe.average_rating.toFixed(1)}
                          </span>
                        )}
                      </div>
                      {recipe.description && (
                        <p className="mt-1 line-clamp-2 text-xs text-gray-600 dark:text-gray-400">
                          {recipe.description}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

