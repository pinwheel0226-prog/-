import React, { useEffect, useState, useRef } from 'react';
import { transcribeAudio } from '../services/geminiService';

interface InputAreaProps {
  value: string;
  onChange: (value: string) => void;
  isStreaming: boolean;
}

export const InputArea: React.FC<InputAreaProps> = ({ value, onChange, isStreaming }) => {
  const [localValue, setLocalValue] = useState(value);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Sync external value changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    onChange(newValue);
  };

  const handleClear = () => {
    setLocalValue('');
    onChange('');
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        setIsTranscribing(true);
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());

        try {
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = async () => {
            const base64Audio = (reader.result as string).split(',')[1];
            // 'audio/webm' is standard for MediaRecorder in Chrome/Firefox
            const text = await transcribeAudio(base64Audio, 'audio/webm');
            
            if (text) {
              const newValue = localValue ? localValue + " " + text : text;
              setLocalValue(newValue);
              onChange(newValue);
            }
            setIsTranscribing(false);
          };
        } catch (error) {
          console.error("Transcription failed", error);
          setIsTranscribing(false);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Microphone access denied or not available.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <div className="relative group h-full flex flex-col">
      <div className="flex justify-between items-center mb-2 px-1">
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Source Text (Auto-Detect)
        </label>
        {localValue && (
          <button
            onClick={handleClear}
            className="text-xs text-slate-500 hover:text-red-400 transition-colors"
          >
            Clear
          </button>
        )}
      </div>
      <div className="relative flex-grow">
        <textarea
          ref={textareaRef}
          value={localValue}
          onChange={handleChange}
          disabled={isRecording || isTranscribing}
          placeholder={isRecording ? "Listening..." : "Enter text or click mic to speak..."}
          className={`w-full h-full p-4 bg-slate-800/50 border border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none text-lg transition-all
            ${isRecording ? 'text-slate-400 animate-pulse' : 'text-slate-200'}
            ${isTranscribing ? 'opacity-50' : 'opacity-100'}
          `}
          spellCheck="false"
        />
        
        {/* Streaming Indicator */}
        {isStreaming && !isRecording && !isTranscribing && (
          <div className="absolute top-2 right-2">
            <span className="flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
            </span>
          </div>
        )}

        {/* Microphone Button */}
        <div className="absolute bottom-4 right-4">
          <button
            onClick={toggleRecording}
            disabled={isTranscribing}
            className={`p-3 rounded-full shadow-lg transition-all duration-300 flex items-center justify-center
              ${isRecording 
                ? 'bg-red-500 text-white hover:bg-red-600 ring-4 ring-red-500/30 scale-110' 
                : 'bg-blue-600 text-white hover:bg-blue-500 hover:scale-105'
              }
              ${isTranscribing ? 'bg-slate-700 cursor-wait opacity-80' : ''}
            `}
            title={isRecording ? "Stop Recording" : "Start Voice Input"}
          >
            {isTranscribing ? (
               <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                 <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                 <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
               </svg>
            ) : (
              isRecording ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 002 0V8a1 1 0 00-1-1zm4 0a1 1 0 00-1 1v4a1 1 0 002 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                </svg>
              )
            )}
          </button>
        </div>
      </div>
    </div>
  );
};