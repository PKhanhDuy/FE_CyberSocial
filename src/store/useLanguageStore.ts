import { create } from "zustand"
import i18n, { getStoredLanguage, LANGUAGE_STORAGE_KEY, type Language } from "@/i18n"

interface LanguageStore {
  language: Language
  setLanguage: (language: Language) => void
}

export const useLanguageStore = create<LanguageStore>((set) => ({
  language: getStoredLanguage(),
  setLanguage: (language) => {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language)
    void i18n.changeLanguage(language)
    document.documentElement.lang = language
    set({ language })
  },
}))
