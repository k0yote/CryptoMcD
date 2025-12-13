import { useTranslation } from 'react-i18next';
import { changeLanguage } from '@/lib/i18n';
import { Globe } from 'lucide-react';

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const currentLang = i18n.language;

  const toggleLanguage = () => {
    const newLang = currentLang === 'ja' ? 'en' : 'ja';
    changeLanguage(newLang);
  };

  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-sm"
      title={currentLang === 'ja' ? 'Switch to English' : '日本語に切り替え'}
    >
      <Globe className="w-4 h-4" />
      <span className="hidden sm:inline">{currentLang === 'ja' ? 'EN' : 'JA'}</span>
    </button>
  );
}
