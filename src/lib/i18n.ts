import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from '@/locales/en.json';
import ja from '@/locales/ja.json';

const LANGUAGE_KEY = 'cryptopay_language';

// Get saved language or detect from browser
const getSavedLanguage = (): string => {
  const saved = localStorage.getItem(LANGUAGE_KEY);
  if (saved) return saved;

  // Detect browser language
  const browserLang = navigator.language.split('-')[0];
  return browserLang === 'ja' ? 'ja' : 'en';
};

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      ja: { translation: ja },
    },
    lng: getSavedLanguage(),
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

// Save language preference
export const changeLanguage = (lang: string) => {
  localStorage.setItem(LANGUAGE_KEY, lang);
  i18n.changeLanguage(lang);
};

export default i18n;
