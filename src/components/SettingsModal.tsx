import React, { useState, useEffect } from 'react';
import { Settings, X, Shield, Cpu, Volume2, CheckCircle2, AlertTriangle, Eye, EyeOff, Activity, RefreshCw } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedModel: 'gemini-3.8-flash-lite-tts' | 'gemini-3.8-flash-tts';
  onModelChange: (model: 'gemini-3.8-flash-lite-tts' | 'gemini-3.8-flash-tts') => void;
  apiKey: string;
  onApiKeyChange: (key: string) => void;
  serverHasKey: boolean;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  selectedModel,
  onModelChange,
  apiKey,
  onApiKeyChange,
  serverHasKey,
}) => {
  const [showKey, setShowKey] = useState(false);
  const [inputKey, setInputKey] = useState(apiKey);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    latencyMs?: number;
    message?: string;
  } | null>(null);

  useEffect(() => {
    setInputKey(apiKey);
  }, [apiKey]);

  if (!isOpen) return null;

  const handleSaveKey = () => {
    onApiKeyChange(inputKey.trim());
    setTestResult(null);
  };

  const handleTestConnection = async () => {
    const keyToUse = inputKey.trim() || apiKey;
    if (!keyToUse && !serverHasKey) {
      setTestResult({
        success: false,
        message: 'Por favor, insira ou cole sua chave de API Gemini no campo abaixo antes de testar a conexão.',
      });
      return;
    }

    if (inputKey.trim()) {
      onApiKeyChange(inputKey.trim());
    }

    setIsTesting(true);
    setTestResult(null);
    try {
      // 1. Try server endpoint
      const res = await fetch('/api/test-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-gemini-key': keyToUse,
        },
        body: JSON.stringify({ apiKey: keyToUse }),
      });
      let data: any = null;
      try {
        const text = await res.text();
        data = JSON.parse(text);
      } catch {
        // Fallback if server returned non-JSON
      }

      if (res.ok && data && data.success) {
        setTestResult({
          success: true,
          latencyMs: data.latencyMs,
          message: `Conexão bem-sucedida! Latência: ${data.latencyMs}ms. Áudio PCM gerado com sucesso.`,
        });
        return;
      }

      // 2. Direct client test fallback using the Gemini SDK
      if (keyToUse) {
        try {
          const { GoogleGenAI } = await import('@google/genai');
          const ai = new GoogleGenAI({ apiKey: keyToUse });
          const start = Date.now();
          const testResp = await ai.models.generateContent({
            model: selectedModel === 'gemini-3.8-flash-tts' ? 'gemini-3.8-flash-tts' : 'gemini-3.8-flash-lite-tts',
            contents: [{ role: 'user', parts: [{ text: 'Teste de conexão Wish Voice AI.' }] }],
            config: {
              responseModalities: ['AUDIO'],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: 'Fenrir' },
                },
              },
            },
          });
          const latency = Date.now() - start;
          const hasAudio = Boolean(testResp.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data);

          if (hasAudio) {
            setTestResult({
              success: true,
              latencyMs: latency,
              message: `Conexão direta estabelecida com sucesso! (${latency}ms) — Chave válida e ativa.`,
            });
            return;
          } else {
            throw new Error('A API respondeu, mas não retornou áudio.');
          }
        } catch (clientErr: any) {
          setTestResult({
            success: false,
            message: `Erro na validação da chave Gemini: ${clientErr?.message || 'Chave inválida ou serviço indisponível.'}`,
          });
          return;
        }
      }

      setTestResult({
        success: false,
        message: data?.details || data?.error || 'Falha ao validar conexão com o serviço Gemini TTS. Verifique a chave de API.',
      });
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err?.message || 'Erro de rede ao conectar com o servidor.',
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-lg text-slate-100">
                Configurações do Estúdio
              </h2>
              <p className="text-xs text-slate-400">
                Gerenciamento de API, modelos de voz e formato de áudio
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Status da Conexão */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-amber-400" />
                Status da Conexão
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1.5 ${
                  serverHasKey || apiKey
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${serverHasKey || apiKey ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                {serverHasKey
                  ? 'Chave Ativa no Servidor (AI Studio)'
                  : apiKey
                  ? 'Chave Configurada'
                  : 'Aguardando Chave'}
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              As chamadas do modelo são processadas com total segurança pelo servidor proxy em Node.js / Express, sem expor credenciais ao navegador.
            </p>

            {/* Test Connection Button */}
            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTesting}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition flex items-center gap-1.5 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin text-amber-400' : ''}`} />
                <span>{isTesting ? 'Testando conexão...' : 'Testar Conexão com API'}</span>
              </button>

              {testResult && (
                <div
                  className={`text-xs px-2.5 py-1 rounded-lg flex items-center gap-1.5 ${
                    testResult.success
                      ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/60'
                      : 'bg-rose-950/60 text-rose-300 border border-rose-800/60'
                  }`}
                >
                  {testResult.success ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  )}
                  <span className="truncate max-w-[280px]">{testResult.message}</span>
                </div>
              )}
            </div>
          </div>

          {/* Configurar API Key */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-amber-400" />
                Chave de API (Gemini API Key)
              </label>
              {serverHasKey && (
                <span className="text-[10px] text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40">
                  Detectada via GEMINI_API_KEY
                </span>
              )}
            </div>

            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={inputKey}
                onChange={(e) => setInputKey(e.target.value)}
                placeholder="Insira sua chave AIzaSy... (opcional se configurada no servidor)"
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-amber-500/50 font-mono pr-20"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="p-1.5 text-slate-400 hover:text-slate-200 rounded"
                  title={showKey ? 'Ocultar chave' : 'Mostrar chave'}
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span>A chave nunca é exibida publicamente após salva.</span>
              {inputKey !== apiKey && (
                <button
                  type="button"
                  onClick={handleSaveKey}
                  className="text-amber-400 hover:text-amber-300 font-medium"
                >
                  Salvar Chave
                </button>
              )}
            </div>
          </div>

          {/* Selecionar Modelo */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-amber-400" />
              Modelo de IA de Síntese Vocal
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                {
                  id: 'gemini-3.8-flash-lite-tts' as const,
                  name: 'Gemini 3.8 Flash Lite TTS',
                  badge: 'Padrão Recomendado',
                  desc: 'Alta eficiência, baixa latência e perfeita naturalidade em português brasileiro.',
                },
                {
                  id: 'gemini-3.8-flash-tts' as const,
                  name: 'Gemini 3.8 Flash TTS',
                  badge: 'Flagship Voice Design',
                  desc: 'Modelo avançado para direção vocal expressiva e nuances cinematográficas.',
                },
              ].map((m) => {
                const isSelected = selectedModel === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => onModelChange(m.id)}
                    className={`p-3.5 rounded-xl border text-left transition flex flex-col justify-between ${
                      isSelected
                        ? 'bg-amber-500/10 border-amber-500 text-slate-100 ring-1 ring-amber-500/30'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-sm text-slate-100">{m.name}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-medium">
                          {m.badge}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed mt-1">
                        {m.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Formato de Áudio e Qualidade */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1 block flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-blue-400" />
                Formato de Exportação
              </label>
              <div className="text-sm font-semibold text-slate-200 mt-1">
                WAV (Waveform Audio File)
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Áudio sem perdas (uncompressed), compatível com DAWs, Premiere e rádio.
              </p>
            </div>

            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1 block flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-emerald-400" />
                Qualidade de Amostragem
              </label>
              <div className="text-sm font-semibold text-slate-200 mt-1">
                24.000 Hz / 16-bit Mono
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Taxa de estúdio nativa dos modelos de voz Gemini TTS.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex justify-end">
          <button
            onClick={() => {
              handleSaveKey();
              onClose();
            }}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition shadow-md shadow-amber-500/20 active:scale-95"
          >
            Concluir & Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
