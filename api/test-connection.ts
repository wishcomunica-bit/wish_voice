import { GoogleGenAI } from '@google/genai';

export default async function handler(req: any, res: any) {
  // CORS support
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, x-gemini-key'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        // use as is
      }
    }
    body = body || {};

    const userKey = (req.headers && req.headers['x-gemini-key']) || body.apiKey;
    const apiKey = process.env.GEMINI_API_KEY || userKey;

    if (!apiKey) {
      return res.status(400).json({
        success: false,
        error: 'Nenhuma chave GEMINI_API_KEY configurada no servidor ou fornecida.',
        details: 'Adicione GEMINI_API_KEY nas variáveis de ambiente da Vercel ou insira sua chave no campo de chave API.',
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

    return res.status(200).json({
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
}
