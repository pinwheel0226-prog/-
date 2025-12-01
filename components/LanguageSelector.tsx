import React from 'react';
import { SupportedLanguage, LanguageOption } from '../types';

interface LanguageSelectorProps {
  selectedLanguage: SupportedLanguage;
  onSelect: (lang: SupportedLanguage) => void;
  disabled?: boolean;
}

const LANGUAGES: LanguageOption[] = [
  { id: SupportedLanguage.CHINESE_TRADITIONAL, label: '繁體中文', flag: '🇹🇼' },
  { id: SupportedLanguage.ENGLISH, label: 'English', flag: '🇺🇸' },
  { id: SupportedLanguage.JAPANESE, label: '日本語', flag: '🇯🇵' },
  { id: SupportedLanguage.SPANISH, label: 'Español', flag: '🇪🇸' },
];

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  selectedLanguage,
  onSelect,
  disabled = false,
}) => {
  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {LANGUAGES.map((lang) => (
        <button
          key={lang.id}
          onClick={() => onSelect(lang.id)}
          disabled={disabled}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200
            ${
              selectedLanguage === lang.id
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 scale-105'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white border border-slate-700'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          <span className="text-lg">{lang.flag}</span>
          <span>{lang.label}</span>
        </button>
      ))}
    </div>
  );
};