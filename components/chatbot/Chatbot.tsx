'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { ChatMessage } from './ChatMessage'
import { ChatInput } from './ChatInput'
import { QuickActions } from './QuickActions'
import { Recipe } from '@/types/recipe'
import { chatWithRecipeAssistant, getConversationMessages } from '@/lib/actions/chatbot'
import Link from 'next/link'

interface Message {
  role: 'user' | 'assistant'
  content: string
  recipes?: Recipe[]
}

export function Chatbot() {
  const { user, loading: authLoading } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: '你好！我是食譜推薦助手 👨‍🍳\n\n我可以幫你：\n- 根據食材推薦食譜\n- 根據飲食偏好篩選\n- 根據難度和時間推薦\n\n請問你需要什麼幫助呢？'
    }
  ])
  const [isLoading, setIsLoading] = useState(false)
  const [conversationId, setConversationId] = useState<string | undefined>(undefined)

  // 載入對話歷史（如果有的話）
  useEffect(() => {
    if (isOpen && conversationId && messages.length === 1) {
      // 只在第一次打開且沒有載入歷史時才載入
      loadConversationHistory()
    }
  }, [isOpen, conversationId])

  const loadConversationHistory = async () => {
    if (!conversationId) return
    
    try {
      const historyMessages = await getConversationMessages(conversationId)
      if (historyMessages.length > 0) {
        // 轉換為 Message 格式
        const formattedMessages: Message[] = historyMessages.map((msg: any) => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
          recipes: msg.recipes && Array.isArray(msg.recipes) && msg.recipes.length > 0 
            ? msg.recipes as Recipe[] 
            : undefined
        }))
        
        // 保留歡迎訊息，然後添加歷史訊息
        setMessages([
          messages[0],
          ...formattedMessages
        ])
      }
    } catch (error) {
      console.error('Error loading conversation history:', error)
    }
  }

  const handleSend = async (message: string) => {
    if (!user) {
      return
    }

    // 添加用戶訊息
    const userMessage: Message = { role: 'user', content: message }
    setMessages(prev => [...prev, userMessage])
    setIsLoading(true)

    try {
      // 呼叫 AI
      const result = await chatWithRecipeAssistant(message, conversationId)

      // 添加 AI 回應
      const assistantMessage: Message = {
        role: 'assistant',
        content: result.response,
        recipes: result.recipes
      }
      setMessages(prev => [...prev, assistantMessage])

      // 如果是新對話，更新 conversationId
      if (result.newConversationId) {
        setConversationId(result.newConversationId)
      }
    } catch (error) {
      console.error('Chat error:', error)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '抱歉，發生了一些錯誤。請稍後再試。'
      }])
    } finally {
      setIsLoading(false)
    }
  }

  // 如果未登入，只顯示按鈕（點擊後會顯示登入提示）
  if (!authLoading && !user) {
    if (!isOpen) {
      return (
        <button
          onClick={() => setIsOpen(true)}
          className="group fixed bottom-6 right-6 z-50 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-2xl shadow-primary-500/50 transition-all duration-300 hover:scale-110 hover:shadow-primary-500/70 hover:from-primary-600 hover:to-primary-700"
          aria-label="開啟聊天"
        >
          <svg className="h-6 w-6 transition-transform duration-300 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary-400 opacity-75"></span>
            <span className="relative inline-flex h-4 w-4 rounded-full bg-primary-500"></span>
          </span>
        </button>
      )
    }
    // 如果已打開但未登入，繼續顯示聊天視窗（下面會顯示登入提示）
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="group fixed bottom-6 right-6 z-50 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-2xl shadow-primary-500/50 transition-all duration-300 hover:scale-110 hover:shadow-primary-500/70 hover:from-primary-600 hover:to-primary-700"
        aria-label="開啟聊天"
      >
        <svg className="h-6 w-6 transition-transform duration-300 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        <span className="absolute -top-1 -right-1 flex h-4 w-4">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary-400 opacity-75"></span>
          <span className="relative inline-flex h-4 w-4 rounded-full bg-primary-500"></span>
        </span>
      </button>
    )
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex h-[600px] w-[400px] flex-col overflow-hidden rounded-2xl border border-gray-200/50 bg-white/95 backdrop-blur-xl shadow-2xl shadow-gray-900/10 transition-all duration-300 dark:border-gray-700/50 dark:bg-gray-800/95">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200/50 bg-gradient-to-r from-primary-50 to-transparent px-5 py-4 dark:border-gray-700/50 dark:from-primary-900/20">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-lg">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">食譜推薦助手</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">隨時為您服務</p>
          </div>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="rounded-lg p-1.5 text-gray-400 transition-all duration-200 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-200"
          aria-label="關閉聊天"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        <style jsx>{`
          div::-webkit-scrollbar {
            width: 6px;
          }
          div::-webkit-scrollbar-track {
            background: transparent;
          }
          div::-webkit-scrollbar-thumb {
            background: rgba(156, 163, 175, 0.3);
            border-radius: 3px;
          }
          div::-webkit-scrollbar-thumb:hover {
            background: rgba(156, 163, 175, 0.5);
          }
          @media (prefers-color-scheme: dark) {
            div::-webkit-scrollbar-thumb {
              background: rgba(75, 85, 99, 0.3);
            }
            div::-webkit-scrollbar-thumb:hover {
              background: rgba(75, 85, 99, 0.5);
            }
          }
        `}</style>
        {messages.map((message, index) => (
          <div 
            key={index} 
            className="opacity-0 animate-[fadeIn_0.3s_ease-in-out_forwards]"
            style={{ animationDelay: `${Math.min(index * 50, 300)}ms` }}
          >
            <ChatMessage message={message} />
          </div>
        ))}
        {isLoading && (
          <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
            <div className="h-2.5 w-2.5 animate-bounce rounded-full bg-primary-500" style={{ animationDelay: '0ms' }}></div>
            <div className="h-2.5 w-2.5 animate-bounce rounded-full bg-primary-500" style={{ animationDelay: '150ms' }}></div>
            <div className="h-2.5 w-2.5 animate-bounce rounded-full bg-primary-500" style={{ animationDelay: '300ms' }}></div>
          </div>
        )}
      </div>

      {/* Quick Actions - 永遠顯示初始選項 */}
      {!isLoading && (
        <QuickActions 
          onSelect={handleSend} 
          context="initial"
        />
      )}

      {/* Input */}
      {user && (
        <ChatInput onSend={handleSend} disabled={isLoading} />
      )}

      {/* 未登入提示 */}
      {!user && !authLoading && (
        <div className="border-t border-gray-200 p-4 text-center dark:border-gray-700">
          <p className="mb-2 text-sm text-gray-600 dark:text-gray-400">
            請先登入以使用食譜推薦助手
          </p>
          <Link
            href="/auth/login"
            className="inline-block rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700"
          >
            登入
          </Link>
        </div>
      )}
    </div>
  )
}

