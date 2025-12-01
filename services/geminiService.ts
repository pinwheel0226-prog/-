import { GoogleGenAI } from "@google/genai";
import { SupportedLanguage } from '../types';

// Initialize Gemini Client
// CRITICAL: process.env.API_KEY is injected by the environment.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const streamTranslation = async (
  text: string,
  targetLanguage: SupportedLanguage,
  onChunk: (chunkText: string) => void
): Promise<void> => {
  if (!text.trim()) return;

  try {
    const modelId = 'gemini-2.5-flash'; // Fast model for real-time feel

    let langInstruction = "";
    if (targetLanguage === SupportedLanguage.JAPANESE) {
      langInstruction = "Output strictly in Japanese (Kanji, Hiragana, Katakana). DO NOT use Romaji. DO NOT provide English explanations.";
    } else if (targetLanguage === SupportedLanguage.CHINESE_TRADITIONAL) {
      langInstruction = "Output strictly in Traditional Chinese (繁體中文). Do not use Simplified Chinese.";
    }

    const systemInstruction = `
      You are a professional, real-time simultaneous interpreter. 
      Your task is to translate the provided text into ${targetLanguage}.
      
      Rules:
      1. ${langInstruction}
      2. Provide ONLY the translated text. Do not include notes, explanations, or "Here is the translation".
      3. Maintain the tone, nuance, and formatting of the original text.
      4. If the source text is already in the target language, return it as is or refine it slightly for better flow.
    `;

    const chat = ai.chats.create({
      model: modelId,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.3, // Lower temperature for more accurate translation
      },
    });

    const resultStream = await chat.sendMessageStream({
      message: text,
    });

    for await (const chunk of resultStream) {
      const chunkText = chunk.text;
      if (chunkText) {
        onChunk(chunkText);
      }
    }

  } catch (error) {
    console.error("Translation error:", error);
    throw error;
  }
};

export const transcribeAudio = async (audioBase64: string, mimeType: string): Promise<string> => {
  try {
    // gemini-2.5-flash is excellent for audio understanding
    const modelId = 'gemini-2.5-flash';
    
    const result = await ai.models.generateContent({
      model: modelId,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: audioBase64
            }
          },
          {
            text: "Transcribe the spoken audio exactly. Return ONLY the transcript text without any additional commentary. Detect the language automatically."
          }
        ]
      }
    });

    return result.text || "";
  } catch (error) {
    console.error("Transcription error:", error);
    throw error;
  }
};