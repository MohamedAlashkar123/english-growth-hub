export function safeJsonParse(value, fallback) {
  try {
    return value ? JSON.parse(value) : fallback
  } catch {
    return fallback
  }
}

export function cloneData(value) {
  if (typeof structuredClone === 'function') {
    return structuredClone(value)
  }

  return JSON.parse(JSON.stringify(value))
}

export function readFromLocalStorage(storageKey, fallback) {
  if (typeof window === 'undefined') return fallback

  try {
    return safeJsonParse(window.localStorage.getItem(storageKey), fallback)
  } catch {
    return fallback
  }
}

export function writeToLocalStorage(storageKey, value) {
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

export function removeFromLocalStorage(storageKey) {
  try {
    window.localStorage.removeItem(storageKey)
    return true
  } catch {
    return false
  }
}
