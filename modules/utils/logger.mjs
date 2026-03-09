// modules/utils/logger.mjs
// Centralized logging system with LOG_LEVEL support

// Log levels: SILENT < ERROR < WARN < INFO < DEBUG
const LOG_LEVELS = {
  SILENT: 0,
  ERROR: 1,
  WARN: 2,
  INFO: 3,
  DEBUG: 4
}

// Get log level from environment variable or localStorage
function getLogLevel() {
  // Check localStorage first (allows runtime override)
  if (typeof window !== 'undefined' && window.localStorage) {
    const stored = localStorage.getItem('LOG_LEVEL')
    if (stored && LOG_LEVELS[stored] !== undefined) {
      return LOG_LEVELS[stored]
    }
  }

  // Check import.meta.env (Vite environment variable)
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    const envLevel = import.meta.env.VITE_LOG_LEVEL
    if (envLevel && LOG_LEVELS[envLevel] !== undefined) {
      return LOG_LEVELS[envLevel]
    }
  }

  // Default to WARN in production, DEBUG in development
  const isDev = typeof import.meta !== 'undefined' && import.meta.env?.DEV
  return isDev ? LOG_LEVELS.DEBUG : LOG_LEVELS.WARN
}

let currentLogLevel = getLogLevel()

// Allow runtime log level changes
export function setLogLevel(level) {
  if (typeof level === 'string') {
    level = LOG_LEVELS[level]
  }
  if (level !== undefined) {
    currentLogLevel = level
    if (typeof window !== 'undefined' && window.localStorage) {
      const levelName = Object.keys(LOG_LEVELS).find(k => LOG_LEVELS[k] === level)
      if (levelName) {
        localStorage.setItem('LOG_LEVEL', levelName)
      }
    }
  }
}

export function getActiveLogLevel() {
  return currentLogLevel
}

// Logger functions
export const logger = {
  error: (...args) => {
    if (currentLogLevel >= LOG_LEVELS.ERROR) {
      console.error(...args)
    }
  },

  warn: (...args) => {
    if (currentLogLevel >= LOG_LEVELS.WARN) {
      console.warn(...args)
    }
  },

  info: (...args) => {
    if (currentLogLevel >= LOG_LEVELS.INFO) {
      console.info(...args)
    }
  },

  debug: (...args) => {
    if (currentLogLevel >= LOG_LEVELS.DEBUG) {
      console.debug(...args)
    }
  },

  // Always log (ignores log level)
  log: (...args) => {
    console.log(...args)
  }
}

// Export LOG_LEVELS for external use
export { LOG_LEVELS }

// Make logger available globally for debugging
if (typeof window !== 'undefined') {
  window.setLogLevel = setLogLevel
  window.getLogLevel = () => {
    const levelName = Object.keys(LOG_LEVELS).find(k => LOG_LEVELS[k] === currentLogLevel)
    return { level: currentLogLevel, name: levelName }
  }
}
