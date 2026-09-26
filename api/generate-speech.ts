import type { Request, Response } from 'express';
import { processSpeechGeneration } from '../src/server/speechHandler';

export default async function handler(req: Request, res: Response) {
  // Support CORS for serverless
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-gemini-key');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const userKey = (req.headers['x-gemini-key'] as string) || req.body?.apiKey;
    const body = req.body || {};

    const result = await processSpeechGeneration({
      ...body,
      apiKey: userKey || body.apiKey,
    });

    return res.status(200).json(result);
  } catch (error: any) {
    console.error('Vercel serverless TTS error:', error);
    return res.status(500).json({
      success: false,
      error: error?.message || 'Falha ao processar síntese de voz na IA.',
    });
  }
}
