import { create } from 'zustand'
import { getAccessToken, themeApi } from '@/lib/api'

interface ThemeStore {
  isDarkMode: boolean
  hydrateTheme: () => Promise<void>
  toggleTheme: () => Promise<void>
}

const getInitialTheme = () => {
  if (typeof window !== 'undefined' && window.localStorage) {
    const storedPrefs = window.localStorage.getItem('color-theme')
    if (typeof storedPrefs === 'string') {
      return storedPrefs === 'dark'
    }
    const userMedia = window.matchMedia('(prefers-color-scheme: dark)')
    if (userMedia.matches) {
      return true
    }
  }
  return true // Default to dark mode for CyberSocial
}

export const useThemeStore = create<ThemeStore>((set) => ({
  isDarkMode: getInitialTheme(),
  hydrateTheme: async () => {
    if (!getAccessToken()) return

    try {
      const { theme } = await themeApi.get()
      if (theme === 'SYSTEM') return
      const isDarkMode = theme === 'DARK'
      localStorage.setItem('color-theme', isDarkMode ? 'dark' : 'light')
      document.documentElement.classList.toggle('dark', isDarkMode)
      set({ isDarkMode })
    } catch {
      // Local theme remains the fallback when the backend is unavailable.
    }
  },
  toggleTheme: async () => {
    const nextTheme = !useThemeStore.getState().isDarkMode
    localStorage.setItem('color-theme', nextTheme ? 'dark' : 'light')
    document.documentElement.classList.toggle('dark', nextTheme)
    set({ isDarkMode: nextTheme })

    if (!getAccessToken()) return

    try {
      await themeApi.update(nextTheme ? 'DARK' : 'LIGHT')
    } catch {
      // Keep the optimistic local change; the next session can resync.
    }
  },
}))
