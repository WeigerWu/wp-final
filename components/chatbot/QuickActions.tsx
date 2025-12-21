'use client'

interface QuickActionsProps {
  onSelect: (message: string) => void
  context?: 'initial' | 'after-recommendation' | 'no-results'
}

const INITIAL_ACTIONS = [
  { text: '食材推薦', message: '根據食材推薦食譜' },
  { text: '偏好篩選', message: '根據飲食偏好篩選' },
  { text: '時間推薦', message: '推薦時間較短的食譜' },
]

const AFTER_RECOMMENDATION_ACTIONS = [
  { text: '更多食譜', message: '推薦更多類似食譜' },
  { text: '調整條件', message: '我想調整搜尋條件' },
  { text: '其他推薦', message: '推薦其他類型的食譜' },
]

const NO_RESULTS_ACTIONS = [
  { text: '放寬條件', message: '放寬搜尋條件' },
  { text: '查看全部', message: '查看所有食譜' },
  { text: '重新搜尋', message: '重新搜尋' },
]

export function QuickActions({ onSelect, context = 'initial' }: QuickActionsProps) {
  let actions = INITIAL_ACTIONS
  
  if (context === 'after-recommendation') {
    actions = AFTER_RECOMMENDATION_ACTIONS
  } else if (context === 'no-results') {
    actions = NO_RESULTS_ACTIONS
  }

  return (
    <div className="border-t border-gray-200/50 bg-gradient-to-t from-gray-50/30 to-transparent p-3 dark:border-gray-700/50 dark:from-gray-800/30">
      <div className="flex flex-wrap gap-2">
        {actions.map((action, index) => (
          <button
            key={index}
            onClick={() => onSelect(action.message)}
            className="group relative overflow-hidden rounded-full border border-gray-300/60 bg-white/80 px-4 py-2 text-xs font-medium text-gray-700 shadow-sm backdrop-blur-sm transition-all duration-200 hover:border-primary-400 hover:bg-gradient-to-r hover:from-primary-50 hover:to-transparent hover:text-primary-600 hover:shadow-md hover:shadow-primary-500/10 active:scale-95 dark:border-gray-600/60 dark:bg-gray-700/80 dark:text-gray-300 dark:hover:border-primary-500 dark:hover:from-primary-900/30 dark:hover:text-primary-400"
          >
            <span className="relative z-10">{action.text}</span>
            <span className="absolute inset-0 -z-0 bg-gradient-to-r from-primary-500/0 via-primary-500/5 to-primary-500/0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"></span>
          </button>
        ))}
      </div>
    </div>
  )
}

