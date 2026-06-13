import { createI18n } from 'vue-i18n'
import en from '@/locales/en.json'
import my from '@/locales/my.json'

export type MessageSchema = typeof en

const LOCALE_KEY = 'flexicell_locale'

export const supportedLocales = ['en', 'my'] as const
export type SupportedLocale = (typeof supportedLocales)[number]

function getSavedLocale(): SupportedLocale {
  const saved = localStorage.getItem(LOCALE_KEY)
  if (saved && supportedLocales.includes(saved as SupportedLocale)) {
    return saved as SupportedLocale
  }
  return 'en'
}

const i18n = createI18n({
  legacy: false,
  locale: getSavedLocale(),
  fallbackLocale: 'en',
  messages: {
    en,
    my,
  },
})

export function setLocale(locale: SupportedLocale) {
  localStorage.setItem(LOCALE_KEY, locale)
  ;(i18n.global.locale as { value: SupportedLocale }).value = locale
}

export default i18n
