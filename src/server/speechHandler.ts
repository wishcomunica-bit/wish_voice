import { GoogleGenAI } from '@google/genai';

// Helper to convert raw PCM buffer to WAV
export function pcmToWav(pcmBuffer: Buffer, sampleRate = 24000, numChannels = 1, bitsPerSample = 16): Buffer {
  if (pcmBuffer.length >= 12 && pcmBuffer.subarray(0, 4).toString('ascii') === 'RIFF') {
    return pcmBuffer;
  }

  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const header = Buffer.alloc(44);

  // RIFF header
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + pcmBuffer.length, 4);
  header.write('WAVE', 8);

  // fmt subchunk
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);

  // data subchunk
  header.write('data', 36);
  header.writeUInt32LE(pcmBuffer.length, 40);

  return Buffer.concat([header, pcmBuffer]);
}

export function cleanNarration(text: string): string {
  if (!text) return '';
  return text
    .replace(/\[(PAUSA|PAUSA\s+CURTA|PAUSA\s+DRAMÁTICA|PAUSA\s+LONGA|PAUSA\s+DRAMÁTICA\s+MAIS\s+LONGA|BREAK)\]/gi, ' ... ')
    .replace(/\[(ÊNFASE|MAIOR\s+INTENSIDADE|VOZ\s+MAIS\s+BAIXA|VOZ\s+BAIXA|VOZ\s+MAIS\s+FORTE|VOZ\s+FORTE|EMOÇÃO|ENTUSIASMO)\]/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export interface SpeechParams {
  apiKey?: string;
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

export async function processSpeechGeneration(params: SpeechParams) {
  const apiKey = params.apiKey || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Chave GEMINI_API_KEY não configurada. Configure a chave no menu de Configurações ou nas variáveis de ambiente da Vercel.');
  }

  const {
    text,
    direction = '',
    voice = 'Fenrir',
    model = 'gemini-3.8-flash-lite-tts',
    language = 'pt-BR',
    speed = 1.0,
    intensity = 70,
    expressiveness = 80,
    pauseStyle = 'natural',
  } = params;

  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    throw new Error('O texto da locução é obrigatório.');
  }

  const cleanedText = cleanNarration(text);

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
    const textOutput = response.text || '';
    throw new Error(`O modelo de voz não retornou dados de áudio. ${textOutput}`);
  }

  const rawBuffer = Buffer.from(base64Data, 'base64');
  let sampleRate = 24000;
  const rateMatch = returnedMime.match(/rate=(\d+)/);
  if (rateMatch && rateMatch[1]) {
    sampleRate = parseInt(rateMatch[1], 10);
  }

  const wavBuffer = pcmToWav(rawBuffer, sampleRate, 1, 16);
  const wavBase64 = wavBuffer.toString('base64');
  const audioDataUrl = `data:audio/wav;base64,${wavBase64}`;
  const durationSeconds = rawBuffer.length / (sampleRate * 2);

  return {
    success: true,
    audioUrl: audioDataUrl,
    duration: Math.max(0.5, Number(durationSeconds.toFixed(2))),
    sampleRate,
    format: 'audio/wav',
    modelUsed: selectedModel,
    voiceUsed: selectedVoice,
    cleanedText,
  };
}

export async function processTestConnection(providedKey?: string) {
  const apiKey = process.env.GEMINI_API_KEY || providedKey;
  if (!apiKey) {
    throw new Error('Nenhuma chave GEMINI_API_KEY configurada no servidor ou fornecida.');
  }

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  const startTime = Date.now();
  const response = await ai.models.generateContent({
    model: 'gemini-3.8-flash-lite-tts',
    contents: [
      {
        role: 'user',
        parts: [{ text: 'Teste de conexão Wish Voice AI.' }],
      },
    ],
    config: {
      responseModalities: ['AUDIO'],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Fenrir' },
        },
      },
    },
  });

  const latency = Date.now() - startTime;
  const hasAudio = Boolean(response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data);

  return {
    success: true,
    latencyMs: latency,
    hasAudio,
    message: 'Conexão com a API Gemini TTS estabelecida com sucesso!',
  };
}
