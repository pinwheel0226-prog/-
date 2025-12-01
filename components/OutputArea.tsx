import React, { useState } from 'react';
import { SupportedLanguage } from '../types';
import { playTextToSpeech } from '../services/ttsService';

interface OutputAreaProps {
  translation: string;
  targetLang: SupportedLanguage;
  isLoading: boolean;
}

const FLAG_MAP: Record<SupportedLanguage, string> = {
  [SupportedLanguage.CHINESE_TRADITIONAL]: '🇹🇼',
  [SupportedLanguage.ENGLISH]: '🇺🇸',
  [SupportedLanguage.JAPANESE]: '🇯🇵',
  [SupportedLanguage.SPANISH]: '🇪🇸',
};

export const OutputArea: React.FC<OutputAreaProps> = ({ translation, targetLang, isLoading }) => {
  const [isSpeaking, setIsSpeaking] = useState(false);

  const handleCopy = () => {
    if (translation) {
      navigator.clipboard.writeText(translation);
    }
  };

  const handleSpeak = async () => {
    if (!translation || isSpeaking) return;
    
    setIsSpeaking(true);
    try {
      await playTextToSpeech(translation, targetLang);
    } catch (e) {
      console.error("Failed to play audio", e);
    } finally {
      setIsSpeaking(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 rounded-2xl border border-slate-800 shadow-xl overflow-hidden group hover:border-blue-500/30 transition-colors duration-300">
      <div className="flex justify-between items-center px-4 py-3 bg-slate-800/50 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="text-xl">{FLAG_MAP[targetLang]}</span>
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            {targetLang}
          </label>
        </div>
        
        {/* Buttons are now always visible (removed opacity-0 group-hover:opacity-100) */}
        <div className="flex items-center gap-1">
          {translation && (
            <>
              <button
                onClick={handleSpeak}
                disabled={isSpeaking}
                className={`p-1.5 rounded-md transition-colors ${
                  isSpeaking 
                    ? 'text-blue-400 bg-blue-400/10 cursor-wait' 
                    : 'text-slate-400 hover:text-blue-400 hover:bg-slate-700'
                }`}
                title="Listen"
              >
                {isSpeaking ? (
                   <span className="flex h-4 w-4 relative">
                     <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                     <span className="relative inline-flex rounded-full h-4 w-4 bg-blue-500"></span>
                   </span>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
              
              <button
                onClick={handleCopy}
                className="p-1.5 rounded-md text-slate-400 hover:text-blue-400 hover:bg-slate-700 transition-colors"
                title="Copy to clipboard"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                  <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                </svg>
              </button>
            </>
          )}
        </div>
      </div>
      
      <div className="relative flex-grow min-h-[160px] bg-slate-900/50">
         {/* Loading Indicator Overlay */}
         {isLoading && !translation && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
              </div>
            </div>
         )}

        <div className="w-full h-full p-4 overflow-y-auto text-lg leading-relaxed">
           {translation ? (
             <p className="text-slate-100 whitespace-pre-wrap">{translation}</p>
           ) : (
             !isLoading && <p className="text-slate-700 italic text-sm">Waiting for input...</p>
           )}
        </div>
      </div>
    </div>
  );
};