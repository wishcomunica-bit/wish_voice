import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '10mb' }));

// Helper to convert raw PCM buffer to WAV
function pcmToWav(pcmBuffer: Buffer, sampleRate = 24000, numChannels = 1, bitsPerSample = 16): Buffer {
  // If already a WAV file (starts with RIFF), return as is
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
  header.writeUInt32LE(16, 16); // Subchunk1Size (16 for PCM)
  header.writeUInt16LE(1, 20); // AudioFormat (1 for PCM)
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

// Health & Status endpoint
app.get('/api/health', (req, res) => {
  const hasEnvKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 0);
  res.json({
    status: 'ok',
    hasApiKey: hasEnvKey,
    defaultModel: 'gemini-3.8-flash-lite-tts',
    supportedModels: [
      { id: 'gemini-3.8-flash-lite-tts', name: 'Gemini 3.8 Flash Lite TTS', description: 'Alta velocidade, baixa latência, excelente para locuções em PT-BR' },
      { id: 'gemini-3.8-flash-tts', name: 'Gemini 3.8 Flash TTS', description: 'Modelo avançado para direção vocal expressiva e nuances cinematográficas' }
    ],
    supportedVoices: [
      { id: 'Fenrir', name: 'Fenrir', gender: 'Masculina', pitch: 'Grave', age: 'Adulta / Madura', style: 'Cinematográfica, épica, eventos e trailers' },
      { id: 'Charon', name: 'Charon', gender: 'Masculina', pitch: 'Grave / Média', age: 'Madura', style: 'Institucional, sóbria, autoridade e solene' },
      { id: 'Puck', name: 'Puck', gender: 'Masculina', pitch: 'Média', age: 'Jovem / Adulta', style: 'Dinâmica, comercial, expressiva e natural' },
      { id: 'Kore', name: 'Kore', gender: 'Feminina', pitch: 'Média', age: 'Jovem / Adulta', style: 'Clara, envolvente, moderna e publicitária' },
      { id: 'Zephyr', name: 'Zephyr', gender: 'Feminina', pitch: 'Suave / Média', age: 'Adulta', style: 'Sofisticada, elegante, narrativa e documentário' },
    ],
  });
});

// Test Connection endpoint
app.post('/api/test-connection', async (req, res) => {
  try {
    const userKey = (req.headers['x-gemini-key'] as string) || req.body?.apiKey;
    const apiKey = process.env.GEMINI_API_KEY || userKey;

    if (!apiKey) {
      return res.status(400).json({
        success: false,
        error: 'Nenhuma chave GEMINI_API_KEY configurada no servidor ou fornecida.',
      });
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
    // Test with a lightweight TTS call
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

    return res.json({
      success: true,
      latencyMs: latency,
      hasAudio,
      message: 'Conexão com a API Gemini TTS estabelecida com sucesso!',
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error?.message || 'Falha ao conectar com o serviço Gemini TTS.',
    });
  }
});

// TTS Generation endpoint
app.post('/api/generate-speech', async (req, res) => {
  try {
    const userKey = (req.headers['x-gemini-key'] as string) || req.body?.apiKey;
    const apiKey = process.env.GEMINI_API_KEY || userKey;

    if (!apiKey) {
      return res.status(400).json({
        error: 'Chave GEMINI_API_KEY não configurada. Configure a chave no menu de Configurações ou no painel Secrets do AI Studio.',
      });
    }

    const {
      text,
      direction,
      voice = 'Fenrir',
      model = 'gemini-3.8-flash-lite-tts',
      language = 'pt-BR',
      speed = 1.0,
      intensity = 70,
      expressiveness = 80,
      pauseStyle = 'natural',
    } = req.body;

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return res.status(400).json({ error: 'O texto da locução é obrigatório.' });
    }

    // Clean narration text: strip interpretation tags for spoken audio
    // Tags like [PAUSA], [PAUSA DRAMÁTICA], [ÊNFASE], etc.
    let cleanedText = text
      .replace(/\[(PAUSA|PAUSA\s+CURTA|PAUSA\s+DRAMÁTICA|PAUSA\s+LONGA|PAUSA\s+DRAMÁTICA\s+MAIS\s+LONGA|BREAK)\]/gi, ' ... ')
      .replace(/\[(ÊNFASE|MAIOR\s+INTENSIDADE|VOZ\s+MAIS\s+BAIXA|VOZ\s+BAIXA|VOZ\s+MAIS\s+FORTE|VOZ\s+FORTE|EMOÇÃO|ENTUSIASMO)\]/gi, '')
      .replace(/\s+/g, ' ')
      .trim();

    // Map language names for prompt clarity
    const langNames: Record<string, string> = {
      'pt-BR': 'Português Brasileiro (PT-BR) com pronúncia natural do Brasil',
      'pt-PT': 'Português de Portugal (PT-PT)',
      'en-US': 'Inglês Americano (EN-US)',
      'es-ES': 'Espanhol (ES)',
    };
    const langDescription = langNames[language] || 'Português Brasileiro (PT-BR)';

    // Build synthesized style directive
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
      // Check if text was returned instead (e.g. safety or refusal)
      const textOutput = response.text || '';
      return res.status(502).json({
        error: 'O modelo de voz não retornou dados de áudio.',
        details: textOutput || 'Nenhum candidate de áudio gerado.',
      });
    }

    const rawBuffer = Buffer.from(base64Data, 'base64');
    // Extract rate if present in mime
    let sampleRate = 24000;
    const rateMatch = returnedMime.match(/rate=(\d+)/);
    if (rateMatch && rateMatch[1]) {
      sampleRate = parseInt(rateMatch[1], 10);
    }

    // Convert to standard WAV buffer with RIFF header
    const wavBuffer = pcmToWav(rawBuffer, sampleRate, 1, 16);
    const wavBase64 = wavBuffer.toString('base64');
    const audioDataUrl = `data:audio/wav;base64,${wavBase64}`;

    // Calculate duration in seconds
    const durationSeconds = rawBuffer.length / (sampleRate * 2);

    return res.json({
      success: true,
      audioUrl: audioDataUrl,
      duration: Math.max(0.5, Number(durationSeconds.toFixed(2))),
      sampleRate,
      format: 'audio/wav',
      modelUsed: selectedModel,
      voiceUsed: selectedVoice,
      cleanedText,
    });
  } catch (error: any) {
    console.error('Error generating speech:', error);
    const errorMessage = error?.message || 'Falha ao processar síntese de voz na API.';
    return res.status(500).json({
      error: 'Erro na geração de voz pela IA.',
      details: errorMessage,
    });
  }
});

// Setup Vite or static serving
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Wish Voice AI server running at http://localhost:${PORT}`);
  });
}

if (!process.env.VERCEL) {
  startServer();
}

export default app;
