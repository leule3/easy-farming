import { createI18n } from 'vue-i18n'
import en from './en.json'
import am from './am.json'

// Check local storage for saved language, default to English
const savedLanguage = localStorage.getItem('language') || 'en'

const i18n = createI18n({
    legacy: false, // Use Composition API mode (required for Vue 3 best practices)
    locale: savedLanguage,
    fallbackLocale: 'en',
    messages: {
        en,
        am
    }
})

export default i18n
