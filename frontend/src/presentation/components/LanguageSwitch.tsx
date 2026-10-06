import React from 'react';
import { Globe } from 'lucide-react';
import { Language } from '../../domain/i18n';

interface LanguageSwitchProps {
  currentLang: Language;
  onToggle: (lang: Language) => void;
}

export const LanguageSwitch: React.FC<LanguageSwitchProps> = ({ currentLang, onToggle }) => {
  return (
    <button
      type="button"
      className="lang-switch"
      onClick={() => onToggle(currentLang === 'vi' ? 'en' : 'vi')}
      title="Toggle Language / Chuyển ngôn ngữ"
    >
      <Globe size={14} />
      <span className={currentLang === 'en' ? 'lang-active' : ''}>EN</span>
      <span>|</span>
      <span className={currentLang === 'vi' ? 'lang-active' : ''}>VI</span>
    </button>
  );
};
