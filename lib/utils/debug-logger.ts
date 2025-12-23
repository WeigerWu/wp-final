/**
 * 生產環境調試日誌工具
 * 用於追蹤組件行為和數據流
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug'

interface LogEntry {
  timestamp: string
  level: LogLevel
  component: string
  action: string
  data?: any
  error?: any
}

class DebugLogger {
  private logs: LogEntry[] = []
  private maxLogs = 100
  private enabled = true

  constructor() {
    // 在生產環境中也啟用日誌（可以通過環境變量控制）
    this.enabled = process.env.NODE_ENV === 'production' || process.env.NEXT_PUBLIC_DEBUG === 'true'
    
    // 如果是瀏覽器環境，將日誌也輸出到 window 對象，方便在控制台查看
    if (typeof window !== 'undefined') {
      const win = window as any
      win.__debugLogs = this.logs
      win.__getDebugLogs = () => this.getLogs()
      win.__clearDebugLogs = () => this.clearLogs()
    }
  }

  private addLog(level: LogLevel, component: string, action: string, data?: any, error?: any) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      component,
      action,
      data,
      error: error ? {
        message: error?.message,
        stack: error?.stack,
        name: error?.name,
      } : undefined,
    }

    this.logs.push(entry)
    
    // 限制日誌數量
    if (this.logs.length > this.maxLogs) {
      this.logs.shift()
    }

    // 同時輸出到控制台
    const logMessage = `[${entry.timestamp}] [${level.toUpperCase()}] [${component}] ${action}`
    
    if (this.enabled) {
      if (level === 'error') {
        console.error(logMessage, data || '', error || '')
      } else if (level === 'warn') {
        console.warn(logMessage, data || '')
      } else {
        console.log(logMessage, data || '')
      }
    }
  }

  info(component: string, action: string, data?: any) {
    this.addLog('info', component, action, data)
  }

  warn(component: string, action: string, data?: any) {
    this.addLog('warn', component, action, data)
  }

  error(component: string, action: string, error?: any, data?: any) {
    this.addLog('error', component, action, data, error)
  }

  debug(component: string, action: string, data?: any) {
    this.addLog('debug', component, action, data)
  }

  getLogs(): LogEntry[] {
    return [...this.logs]
  }

  getLogsAsString(): string {
    return JSON.stringify(this.logs, null, 2)
  }

  clearLogs() {
    this.logs = []
    if (typeof window !== 'undefined') {
      const win = window as any
      win.__debugLogs = this.logs
    }
  }

  exportLogs(): string {
    return this.getLogsAsString()
  }
}

// 導出單例
export const debugLogger = new DebugLogger()

// 導出便捷函數
export const logInfo = (component: string, action: string, data?: any) => {
  debugLogger.info(component, action, data)
}

export const logWarn = (component: string, action: string, data?: any) => {
  debugLogger.warn(component, action, data)
}

export const logError = (component: string, action: string, error?: any, data?: any) => {
  debugLogger.error(component, action, error, data)
}

export const logDebug = (component: string, action: string, data?: any) => {
  debugLogger.debug(component, action, data)
}

