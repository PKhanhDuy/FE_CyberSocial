import i18n from "i18next"
import { initReactI18next } from "react-i18next"
import { resources } from "./resources"

export type Language = keyof typeof resources

export const LANGUAGE_STORAGE_KEY = "cybersocial_language"

export const isSupportedLanguage = (value: string | null): value is Language => {
  return value === "vi" || value === "en"
}

export const getStoredLanguage = (): Language => {
  if (typeof window === "undefined") return "vi"

  const storedLanguage = window.localStorage.getItem(LANGUAGE_STORAGE_KEY)
  if (isSupportedLanguage(storedLanguage)) return storedLanguage

  const browserLanguage = window.navigator.language.toLowerCase()
  return browserLanguage.startsWith("en") ? "en" : "vi"
}

i18n.use(initReactI18next).init({
  resources,
  lng: getStoredLanguage(),
  fallbackLng: "vi",
  interpolation: {
    escapeValue: false,
  },
})

if (typeof document !== "undefined") {
  document.documentElement.lang = i18n.language
}

export default i18n
