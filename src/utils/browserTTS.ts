import { GoogleGenAI } from '@google/genai';
import { cleanNarrationText } from './textParser';

// Pure browser PCM 24kHz 16-bit to WAV converter
export function browserPcmToWav(rawBytes: Uint8Array, sampleRate = 24000, numChannels = 1, bitsPerSample = 16): string {
  // If already a WAV file (starts with RIFF), convert directly to blob
  if (rawBytes.length >= 12) {
    const headerStr = String.fromCharCode(rawBytes[0], rawBytes[1], rawBytes[2], rawBytes[3]);
    if (headerStr === 'RIFF') {
      const blob = new Blob([rawBytes.buffer as ArrayBuffer], { type: 'audio/wav' });
      return URL.createObjectURL(blob);
    }
  }

  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const wavHeader = new ArrayBuffer(44);
  const view = new DataView(wavHeader);

  // RIFF identifier
  view.setUint32(0, 0x52494646, false); // "RIFF"
  view.setUint32(4, 36 + rawBytes.length, true);
  view.setUint32(8, 0x57415645, false); // "WAVE"

  // fmt subchunk
  view.setUint32(12, 0x666d7420, false); // "fmt "
  view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
  view.setUint16(20, 1, true); // AudioFormat (1 for PCM)
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);

  // data subchunk
  view.setUint32(36, 0x64617461, false); // "data"
  view.setUint32(40, rawBytes.length, true);

  const combined = new Uint8Array(wavHeader.byteLength + rawBytes.byteLength);
  combined.set(new Uint8Array(wavHeader), 0);
  combined.set(rawBytes, wavHeader.byteLength);

  const blob = new Blob([combined.buffer as ArrayBuffer], { type: 'audio/wav' });
  return URL.createObjectURL(blob);
}

export interface ClientGenerateOptions {
  apiKey: string;
  text: string;
  direction?: string;
  voice?: string;
  model?: string;
  language?: string;
  speed?: number;
  intensity?: number;
  expressiveness?: number;
  pauseStyle?: string;
}

export async function generateClientSpeech(opts: ClientGenerateOptions) {
  const {
    apiKey,
    text,
    direction = '',
    voice = 'Fenrir',
    model = 'gemini-3.8-flash-lite-tts',
    language = 'pt-BR',
    speed = 1.0,
    intensity = 70,
    expressiveness = 80,
    pauseStyle = 'natural',
  } = opts;

  if (!apiKey) {
    throw new Error('Chave de API não informada para geração direta.');
  }

  const cleanedText = cleanNarrationText(text);

  const langNames: Record<string, string> = {
    'pt-BR': 'Português Brasileiro (PT-BR) com pronúncia natural do Brasil',
    'pt-PT': 'Português de Portugal (PT-PT)',
    'en-US': 'Inglês Americano (EN-US)',
    'es-ES': 'Espanhol (ES)',
  };
  const langDescription = langNames[language] || 'Português Brasileiro (PT-BR)';

  const styleParts: string[] = [];
  styleParts.push(`Language & accent: ${langDescription}.`);
  if (direction && direction.trim().length > 0) {
    styleParts.push(`Vocal Performance & Direction: ${direction.trim()}`);
  }
  styleParts.push(`Pacing speed factor: ${speed}x.`);
  styleParts.push(`Emotional intensity: ${intensity}/100.`);
  styleParts.push(`Expressiveness: ${expressiveness}/100.`);
  styleParts.push(`Pause style: ${pauseStyle}.`);
  styleParts.push(`Crucial Instruction: Speak ONLY the provided text naturally with exact pronunciation. Do NOT narrate instructions, headers or metadata.`);

  const compositeStyle = styleParts.join(' ');

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  const selectedModel = model === 'gemini-3.8-flash-tts' ? 'gemini-3.8-flash-tts' : 'gemini-3.8-flash-lite-tts';
  const selectedVoice = ['Fenrir', 'Puck', 'Charon', 'Kore', 'Zephyr'].includes(voice) ? voice : 'Fenrir';

  const response = await ai.models.generateContent({
    model: selectedModel,
    contents: [
      {
        role: 'user',
        parts: [
          {
            text: cleanedText,
            speechMetadata: {
              style: compositeStyle,
            },
          },
        ],
      },
    ],
    config: {
      responseModalities: ['AUDIO'],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: selectedVoice },
        },
      },
    },
  });

  const audioPart = response.candidates?.[0]?.content?.parts?.[0];
  const base64Data = audioPart?.inlineData?.data;
  const returnedMime = audioPart?.inlineData?.mimeType || 'audio/pcm;rate=24000';

  if (!base64Data) {
    throw new Error('O modelo não retornou áudio.');
  }

  // Base64 decode in browser
  const binaryString = atob(base64Data);
  const rawBytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    rawBytes[i] = binaryString.charCodeAt(i);
  }

  let sampleRate = 24000;
  const rateMatch = returnedMime.match(/rate=(\d+)/);
  if (rateMatch && rateMatch[1]) {
    sampleRate = parseInt(rateMatch[1], 10);
  }

  const audioUrl = browserPcmToWav(rawBytes, sampleRate, 1, 16);
  const durationSeconds = rawBytes.length / (sampleRate * 2);

  return {
    success: true,
    audioUrl,
    duration: Math.max(0.5, Number(durationSeconds.toFixed(2))),
    sampleRate,
    format: 'audio/wav',
    modelUsed: selectedModel,
    voiceUsed: selectedVoice,
    cleanedText,
  };
}
