import { GoogleGenAI } from "@google/genai";
import { SupportedLanguage } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Map languages to specific voice personas for variety
const VOICE_MAP: Record<SupportedLanguage, string> = {
  [SupportedLanguage.CHINESE_TRADITIONAL]: 'Puck', // Neutral/Masculine
  [SupportedLanguage.ENGLISH]: 'Kore',             // Neutral/Feminine
  [SupportedLanguage.JAPANESE]: 'Kore',            // Kore often handles Asian languages well
  [SupportedLanguage.SPANISH]: 'Charon',           // Deeper tone
};

// Helper: Base64 decoding
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Helper: Audio Data Decoding
async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number = 24000,
  numChannels: number = 1,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      // Convert Int16 to Float32 [-1.0, 1.0]
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

let audioContext: AudioContext | null = null;

export const playTextToSpeech = async (text: string, language: SupportedLanguage): Promise<void> => {
  if (!text.trim()) return;

  try {
    // 1. Initialize AudioContext on user gesture
    if (!audioContext) {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }

    const voiceName = VOICE_MAP[language] || 'Kore';

    // 2. Prepare Prompt with Language Directive
    // The Gemini TTS model follows instructions. We explicitly tell it the language 
    // to avoid ambiguity (e.g., reading Japanese Kanji as Chinese).
    let promptText = text;
    switch (language) {
      case SupportedLanguage.JAPANESE:
        promptText = `Speak the following Japanese text naturally: ${text}`;
        break;
      case SupportedLanguage.CHINESE_TRADITIONAL:
        promptText = `Speak the following Traditional Chinese text naturally: ${text}`;
        break;
      case SupportedLanguage.SPANISH:
        promptText = `Speak the following Spanish text naturally: ${text}`;
        break;
      case SupportedLanguage.ENGLISH:
        // English is usually default, but explicit is fine
        promptText = `Speak the following English text naturally: ${text}`;
        break;
    }

    // 3. Call Gemini API
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: promptText }] }],
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!base64Audio) {
      throw new Error("No audio data received");
    }

    // 4. Decode and Play
    const audioBytes = decode(base64Audio);
    const audioBuffer = await decodeAudioData(audioBytes, audioContext);

    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContext.destination);
    source.start();

  } catch (error) {
    console.error("TTS Error:", error);
    throw error;
  }
};