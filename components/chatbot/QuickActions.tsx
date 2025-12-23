'use client'

interface QuickActionsProps {
  onSelect: (message: string) => void
  onDelete?: () => void
  showDelete?: boolean
}

const ACTIONS = [
  { text: '食材推薦', message: '根據食材推薦食譜' },
  { text: '偏好篩選', message: '根據飲食偏好篩選' },
  { text: '難易度推薦', message: '根據難易度推薦食譜' },
]

export function QuickActions({ onSelect, onDelete, showDelete = false }: QuickActionsProps) {
  return (
    <div className="border-t border-gray-200/50 bg-gradient-to-t from-gray-50/30 to-transparent p-3 dark:border-gray-700/50 dark:from-gray-800/30">
      <div className="flex flex-wrap gap-2">
        {ACTIONS.map((action, index) => (
          <button
            key={index}
            onClick={() => onSelect(action.message)}
            className="group relative overflow-hidden rounded-full border border-gray-300/60 bg-white/80 px-4 py-2 text-xs font-medium text-gray-700 shadow-sm backdrop-blur-sm transition-all duration-200 hover:border-primary-400 hover:bg-gradient-to-r hover:from-primary-50 hover:to-transparent hover:text-primary-600 hover:shadow-md hover:shadow-primary-500/10 active:scale-95 dark:border-gray-600/60 dark:bg-gray-700/80 dark:text-gray-300 dark:hover:border-primary-500 dark:hover:from-primary-900/30 dark:hover:text-primary-400"
          >
            <span className="relative z-10">{action.text}</span>
            <span className="absolute inset-0 -z-0 bg-gradient-to-r from-primary-500/0 via-primary-500/5 to-primary-500/0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"></span>
          </button>
        ))}
        {showDelete && onDelete && (
          <button
            onClick={onDelete}
            className="group relative overflow-hidden rounded-full border border-red-300/60 bg-white/80 px-4 py-2 text-xs font-medium text-red-600 shadow-sm backdrop-blur-sm transition-all duration-200 hover:border-red-400 hover:bg-gradient-to-r hover:from-red-50 hover:to-transparent hover:text-red-700 hover:shadow-md hover:shadow-red-500/10 active:scale-95 dark:border-red-600/60 dark:bg-gray-700/80 dark:text-red-400 dark:hover:border-red-500 dark:hover:from-red-900/30 dark:hover:text-red-300"
          >
            <span className="relative z-10 flex items-center gap-1.5">
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              刪除對話
            </span>
            <span className="absolute inset-0 -z-0 bg-gradient-to-r from-red-500/0 via-red-500/5 to-red-500/0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"></span>
          </button>
        )}
      </div>
    </div>
  )
}

