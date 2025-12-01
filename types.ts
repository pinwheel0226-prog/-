export enum SupportedLanguage {
  CHINESE_TRADITIONAL = 'Traditional Chinese',
  ENGLISH = 'English',
  SPANISH = 'Spanish',
  JAPANESE = 'Japanese',
}

export const TARGET_LANGUAGES = [
  SupportedLanguage.CHINESE_TRADITIONAL,
  SupportedLanguage.ENGLISH,
  SupportedLanguage.JAPANESE,
  SupportedLanguage.SPANISH,
];

export interface TranslationState {
  original: string;
  translations: Record<SupportedLanguage, string>;
  isStreaming: boolean;
  error: string | null;
}

export interface LanguageOption {
  id: SupportedLanguage;
  label: string;
  flag: string; // Emoji flag
}
