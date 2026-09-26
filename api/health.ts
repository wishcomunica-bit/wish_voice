export default function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const hasEnvKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 0);

  return res.status(200).json({
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
}
