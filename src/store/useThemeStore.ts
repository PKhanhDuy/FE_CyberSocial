import { create } from 'zustand'

interface ThemeStore {
  isDarkMode: boolean
  toggleTheme: () => void
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
  toggleTheme: () => set((state) => {
    const newTheme = !state.isDarkMode
    localStorage.setItem('color-theme', newTheme ? 'dark' : 'light')
    
    // Apply to html element immediately
    if (newTheme) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    
    return { isDarkMode: newTheme }
  }),
}))
