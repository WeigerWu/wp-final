'use client'

import { useState, KeyboardEvent } from 'react'

export function ChatInput({ 
  onSend, 
  disabled 
}: { 
  onSend: (message: string) => void
  disabled?: boolean
}) {
  const [message, setMessage] = useState('')

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSend(message.trim())
      setMessage('')
    }
  }

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="border-t border-gray-200/50 bg-gradient-to-t from-gray-50/50 to-transparent p-4 dark:border-gray-700/50 dark:from-gray-800/50">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="輸入你的問題..."
            disabled={disabled}
            className="w-full rounded-xl border border-gray-300/60 bg-white/80 px-4 py-3 pr-12 text-sm shadow-sm backdrop-blur-sm transition-all duration-200 placeholder:text-gray-400 focus:border-primary-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600/60 dark:bg-gray-700/80 dark:text-gray-100 dark:placeholder-gray-500 dark:focus:border-primary-500 dark:focus:bg-gray-700"
          />
          {message.trim() && (
            <button
              onClick={handleSend}
              disabled={disabled}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-primary-500 transition-all hover:bg-primary-50 hover:text-primary-600 disabled:opacity-50 dark:hover:bg-primary-900/30"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          )}
        </div>
        <button
          onClick={handleSend}
          disabled={disabled || !message.trim()}
          className="flex items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 px-5 py-3 text-sm font-medium text-white shadow-lg shadow-primary-500/30 transition-all duration-200 hover:from-primary-600 hover:to-primary-700 hover:shadow-primary-500/40 hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:shadow-none dark:disabled:bg-gray-600"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </div>
    </div>
  )
}

