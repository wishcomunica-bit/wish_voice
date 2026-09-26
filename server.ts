import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { processSpeechGeneration, processTestConnection } from './src/server/speechHandler';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '10mb' }));

// Health & Status endpoint
app.get('/api/health', (_req, res) => {
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
    const result = await processTestConnection(userKey);
    return res.json(result);
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
    const body = req.body || {};

    const result = await processSpeechGeneration({
      ...body,
      apiKey: userKey || body.apiKey,
    });

    return res.json(result);
  } catch (error: any) {
    console.error('Error generating speech:', error);
    const errorMessage = error?.message || 'Falha ao processar síntese de voz na API.';
    return res.status(500).json({
      success: false,
      error: 'Erro na geração de voz pela IA.',
      details: errorMessage,
    });
  }
});

// Setup Vite or static serving
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd && !process.env.VERCEL) {
    const { createServer: createViteServer } = await import('vite');
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
