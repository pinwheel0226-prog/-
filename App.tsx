import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SupportedLanguage, TARGET_LANGUAGES } from './types';
import { streamTranslation } from './services/geminiService';
import { InputArea } from './components/InputArea';
import { OutputArea } from './components/OutputArea';

// Hook for debouncing values
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

const App: React.FC = () => {
  const [inputVal, setInputVal] = useState('');
  
  // Store translations for all languages
  const [translations, setTranslations] = useState<Record<SupportedLanguage, string>>({
    [SupportedLanguage.CHINESE_TRADITIONAL]: '',
    [SupportedLanguage.ENGLISH]: '',
    [SupportedLanguage.JAPANESE]: '',
    [SupportedLanguage.SPANISH]: '',
  });

  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debounce input to avoid API spamming
  const debouncedInput = useDebounce(inputVal, 800);
  
  // Track the current request ID to ignore stale responses
  const currentRequestId = useRef(0);

  const performTranslation = useCallback(async (text: string) => {
    if (!text.trim()) {
      setTranslations({
        [SupportedLanguage.CHINESE_TRADITIONAL]: '',
        [SupportedLanguage.ENGLISH]: '',
        [SupportedLanguage.JAPANESE]: '',
        [SupportedLanguage.SPANISH]: '',
      });
      setIsStreaming(false);
      return;
    }

    const requestId = ++currentRequestId.current;
    setIsStreaming(true);
    setError(null);
    
    // Clear previous translations
    setTranslations({
      [SupportedLanguage.CHINESE_TRADITIONAL]: '',
      [SupportedLanguage.ENGLISH]: '',
      [SupportedLanguage.JAPANESE]: '',
      [SupportedLanguage.SPANISH]: '',
    });

    try {
      // Fire all translation requests in parallel
      const promises = TARGET_LANGUAGES.map(async (lang) => {
        try {
          await streamTranslation(text, lang, (chunk) => {
            // Only update if this is still the most recent request
            if (currentRequestId.current === requestId) {
              setTranslations(prev => ({
                ...prev,
                [lang]: prev[lang] + chunk
              }));
            }
          });
        } catch (e) {
          console.error(`Error translating to ${lang}`, e);
          // Optional: Update state to show error for specific language
        }
      });

      await Promise.all(promises);

    } catch (err) {
      console.error(err);
      if (currentRequestId.current === requestId) {
        setError("One or more translations failed. Please try again.");
      }
    } finally {
      if (currentRequestId.current === requestId) {
        setIsStreaming(false);
      }
    }
  }, []);

  // Effect triggers when debounced input changes
  useEffect(() => {
    if (debouncedInput.trim()) {
      performTranslation(debouncedInput);
    } else {
      setTranslations({
        [SupportedLanguage.CHINESE_TRADITIONAL]: '',
        [SupportedLanguage.ENGLISH]: '',
        [SupportedLanguage.JAPANESE]: '',
        [SupportedLanguage.SPANISH]: '',
      });
      setIsStreaming(false);
    }
  }, [debouncedInput, performTranslation]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col items-center py-8 px-4 sm:px-6 lg:px-8">
      
      {/* Header */}
      <header className="mb-8 text-center max-w-3xl w-full">
        <div className="inline-flex items-center justify-center p-3 mb-4 rounded-full bg-blue-500/10 border border-blue-500/20">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
          </svg>
          <span className="font-bold text-blue-400 tracking-wide uppercase text-sm">Simultaneous Translator</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500 mb-4 tracking-tight">
          PolyglotStream
        </h1>
        <p className="text-slate-400 text-lg max-w-2xl mx-auto">
          Instant simultaneous translation into Chinese, English, Japanese, and Spanish powered by Gemini 2.5 Flash.
        </p>
      </header>

      {/* Main App Container */}
      <main className="w-full max-w-6xl flex flex-col gap-6">
        
        {/* Input Section */}
        <div className="w-full bg-slate-900 rounded-3xl p-1 shadow-2xl border border-slate-800">
           <div className="h-48 sm:h-56 bg-slate-900/50 rounded-[22px] p-4">
             <InputArea 
               value={inputVal} 
               onChange={setInputVal} 
               isStreaming={isStreaming} 
             />
           </div>
        </div>

        {/* Translation Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {TARGET_LANGUAGES.map((lang) => (
            <OutputArea
              key={lang}
              targetLang={lang}
              translation={translations[lang]}
              isLoading={isStreaming}
            />
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mx-auto mt-4 px-4 py-3 bg-red-900/20 border border-red-500/20 text-red-400 rounded-xl flex items-center gap-2 animate-fade-in">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span>{error}</span>
          </div>
        )}

      </main>

      <footer className="mt-12 mb-6 text-slate-600 text-sm">
        Powered by Google Gemini 2.5 Flash
      </footer>
    </div>
  );
};

export default App;
