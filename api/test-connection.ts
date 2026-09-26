import type { Request, Response } from 'express';
import { processTestConnection } from '../src/server/speechHandler';

export default async function handler(req: Request, res: Response) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-gemini-key');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const userKey = (req.headers['x-gemini-key'] as string) || req.body?.apiKey;
    const result = await processTestConnection(userKey);
    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error?.message || 'Falha ao conectar com o serviço Gemini TTS.',
    });
  }
}
