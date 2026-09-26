/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Settings,
  History,
  FileText,
  AlertCircle,
  CheckCircle2,
  Mic,
  Sliders,
  AudioWaveform,
  HelpCircle,
  Play,
  RotateCcw,
  Zap
} from 'lucide-react';
import { VoiceSettings, AudioVersion, HistoryRecord, LanguageCode, VoiceId } from './types';
import { VOICES, INITIAL_EXAMPLE_DIRECTION, INITIAL_EXAMPLE_TEXT } from './data/voices';
import { DirectionEditor } from './components/DirectionEditor';
import { NarrationEditor } from './components/NarrationEditor';
import { VoiceControls } from './components/VoiceControls';
import { AudioPlayer } from './components/AudioPlayer';
import { VersionList } from './components/VersionList';
import { HistoryModal } from './components/HistoryModal';
import { SettingsModal } from './components/SettingsModal';
import { WishLogo } from './components/WishLogo';
import { extractTestSnippet, cleanNarrationText } from './utils/textParser';
import { getAllHistory, saveHistoryItem, deleteHistoryItem, clearAllHistory } from './utils/storage';

export default function App() {
  // Primary Studio State
  const [direction, setDirection] = useState<string>(INITIAL_EXAMPLE_DIRECTION);
  const [text, setText] = useState<string>(INITIAL_EXAMPLE_TEXT);
  const [projectTitle, setProjectTitle] = useState<string>('Expo Três Corações 2026');

  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>({
    language: 'pt-BR',
    voice: 'Fenrir',
    model: 'gemini-3.8-flash-lite-tts',
    speed: 1.0,
    pitch: 0,
    intensity: 75,
    expressiveness: 80,
    pauseStyle: 'natural',
  });

  // Versions and History
  const [currentVersion, setCurrentVersion] = useState<AudioVersion | null>(null);
  const [sessionVersions, setSessionVersions] = useState<AudioVersion[]>([]);
  const [history, setHistory] = useState<HistoryRecord[]>([]);

  // Modals & Drawers
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // API & Server State
  const [serverHasKey, setServerHasKey] = useState(false);
  const [apiKey, setApiKey] = useState<string>(() => localStorage.getItem('gemini_custom_key') || '');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingPhase, setGeneratingPhase] = useState<string>('Criando sua locução...');
  const [isPreviewGenerating, setIsPreviewGenerating] = useState(false);

  // Alerts
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Check health and server key on load
  useEffect(() => {
    checkServerHealth();
    loadHistoryData();
  }, []);

  const checkServerHealth = async () => {
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        const data = await res.json();
        setServerHasKey(data.hasApiKey);
      }
    } catch (err) {
      console.error('Could not verify server health:', err);
    }
  };

  const loadHistoryData = async () => {
    const records = await getAllHistory();
    setHistory(records);
  };

  const handleApiKeyChange = (key: string) => {
    setApiKey(key);
    if (key) {
      localStorage.setItem('gemini_custom_key', key);
    } else {
      localStorage.removeItem('gemini_custom_key');
    }
    setSuccessToast('Chave de API salva com sucesso.');
    setTimeout(() => setSuccessToast(null), 3500);
  };

  const handleSettingsChange = (updated: Partial<VoiceSettings>) => {
    setVoiceSettings((prev) => ({ ...prev, ...updated }));
  };

  // Load example provided in user brief
  const handleLoadExample = () => {
    setDirection(INITIAL_EXAMPLE_DIRECTION);
    setText(INITIAL_EXAMPLE_TEXT);
    setProjectTitle('Expo Três Corações 2026');
    setVoiceSettings({
      language: 'pt-BR',
      voice: 'Fenrir',
      model: 'gemini-3.8-flash-lite-tts',
      speed: 1.0,
      pitch: 0,
      intensity: 85,
      expressiveness: 90,
      pauseStyle: 'dramatic',
    });
    setSuccessToast('Exemplo profissional de locução cinematográfica carregado!');
    setTimeout(() => setSuccessToast(null), 3000);
  };

  // Main Speech Generation
  const handleGenerateSpeech = async (overrideText?: string, isPreview = false) => {
    const textToSpeak = (overrideText || text).trim();
    if (!textToSpeak) {
      setErrorMessage('Por favor, insira o texto que deverá ser falado pela locução.');
      return;
    }

    setErrorMessage(null);
    if (isPreview) {
      setIsPreviewGenerating(true);
    } else {
      setIsGenerating(true);
      setGeneratingPhase('Criando sua locução...');
    }

    try {
      if (!isPreview) {
        setTimeout(() => setGeneratingPhase('Interpretando direção vocal e marcações...'), 1200);
        setTimeout(() => setGeneratingPhase('Sintetizando áudio neural com Gemini TTS...'), 2400);
      }

      const response = await fetch('/api/generate-speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-gemini-key': apiKey,
        },
        body: JSON.stringify({
          text: textToSpeak,
          direction,
          voice: voiceSettings.voice,
          model: voiceSettings.model,
          language: voiceSettings.language,
          speed: voiceSettings.speed,
          intensity: voiceSettings.intensity,
          expressiveness: voiceSettings.expressiveness,
          pauseStyle: voiceSettings.pauseStyle,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || data.details || 'Falha ao processar síntese de voz na IA.');
      }

      const versionNum = sessionVersions.length + 1;
      const title = isPreview ? `${projectTitle || 'Locução'} (Prévia)` : `${projectTitle || 'Locução'}`;

      const newVersion: AudioVersion = {
        id: `take_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        versionNumber: versionNum,
        projectTitle: title,
        timestamp: Date.now(),
        duration: data.duration,
        audioUrl: data.audioUrl,
        text: textToSpeak,
        cleanedText: data.cleanedText,
        direction,
        voice: voiceSettings.voice,
        language: voiceSettings.language,
        model: data.modelUsed,
        settingsSnapshot: { ...voiceSettings },
      };

      setCurrentVersion(newVersion);
      setSessionVersions((prev) => [newVersion, ...prev]);

      // Save to IndexedDB
      const historyItem: HistoryRecord = {
        id: newVersion.id,
        projectTitle: newVersion.projectTitle,
        timestamp: newVersion.timestamp,
        duration: newVersion.duration,
        audioUrl: newVersion.audioUrl,
        text: newVersion.text,
        direction: newVersion.direction,
        voice: newVersion.voice,
        language: newVersion.language,
        model: newVersion.model,
      };
      await saveHistoryItem(historyItem);
      await loadHistoryData();

      setSuccessToast(isPreview ? 'Trecho prévio gerado!' : `Versão ${versionNum} gerada com sucesso!`);
      setTimeout(() => setSuccessToast(null), 4000);
    } catch (err: any) {
      console.error('Generation error:', err);
      const msg = err?.message || 'Erro inesperado ao gerar locução.';
      if (msg.includes('GEMINI_API_KEY') || msg.includes('Chave')) {
        setErrorMessage('Chave de API não configurada. Por favor, adicione sua chave Gemini no menu de Configurações (ícone de engrenagem) ou nos Secrets do AI Studio.');
        setIsSettingsOpen(true);
      } else {
        setErrorMessage(msg);
      }
    } finally {
      setIsGenerating(false);
      setIsPreviewGenerating(false);
    }
  };

  const handlePreviewSnippet = () => {
    const snippet = extractTestSnippet(text);
    if (!snippet) {
      setErrorMessage('Digite algum texto antes de testar o trecho.');
      return;
    }
    handleGenerateSpeech(snippet, true);
  };

  const handleDeleteVersion = (id: string) => {
    setSessionVersions((prev) => prev.filter((v) => v.id !== id));
    if (currentVersion?.id === id) {
      const remaining = sessionVersions.filter((v) => v.id !== id);
      setCurrentVersion(remaining.length > 0 ? remaining[0] : null);
    }
  };

  const handleRestoreParameters = (ver: AudioVersion) => {
    setDirection(ver.direction);
    setText(ver.text);
    if (ver.settingsSnapshot) {
      setVoiceSettings(ver.settingsSnapshot);
    }
    setSuccessToast(`Parâmetros da Versão ${ver.versionNumber} restaurados no editor.`);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  const handleLoadHistoryItem = (item: HistoryRecord) => {
    setText(item.text);
    if (item.direction) setDirection(item.direction);
    if (item.voice) setVoiceSettings((prev) => ({ ...prev, voice: item.voice }));
    if (item.language) setVoiceSettings((prev) => ({ ...prev, language: item.language }));
    setProjectTitle(item.projectTitle);

    // Also mount it into the current player
    const restoredVersion: AudioVersion = {
      id: item.id,
      versionNumber: sessionVersions.length + 1,
      projectTitle: item.projectTitle,
      timestamp: item.timestamp,
      duration: item.duration,
      audioUrl: item.audioUrl,
      text: item.text,
      cleanedText: cleanNarrationText(item.text),
      direction: item.direction,
      voice: item.voice,
      language: item.language,
      model: item.model,
      settingsSnapshot: { ...voiceSettings, voice: item.voice, language: item.language },
    };
    setCurrentVersion(restoredVersion);
    setSuccessToast(`Locução "${item.projectTitle}" carregada com sucesso!`);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  const handleDeleteHistoryItem = async (id: string) => {
    await deleteHistoryItem(id);
    await loadHistoryData();
  };

  const handleClearAllHistory = async () => {
    await clearAllHistory();
    await loadHistoryData();
  };

  return (
    <div className="min-h-screen bg-[#070a11] text-slate-100 flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-200">
      {/* Top Studio Navigation Bar */}
      <header className="sticky top-0 z-40 bg-[#0b0f17]/90 backdrop-blur-md border-b border-slate-800/80 px-4 lg:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          {/* Wish Logo & Brand Title */}
          <div className="flex items-center gap-3">
            <WishLogo size="md" showText={true} />
          </div>

          {/* Studio Quick Actions */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={handleLoadExample}
              disabled={isGenerating}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-500/30 hover:border-amber-500/60 transition flex items-center gap-1.5 shadow-sm active:scale-95 disabled:opacity-50"
              title="Carregar exemplo completo de locução para grande evento"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Carregar Exemplo</span>
              <span className="sm:hidden">Exemplo</span>
            </button>

            <button
              onClick={() => setIsHistoryOpen(true)}
              className="px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 hover:border-slate-700 transition flex items-center gap-1.5 shadow-sm active:scale-95"
              title="Ver histórico de gravações salvas no navegador"
            >
              <History className="w-3.5 h-3.5 text-slate-400" />
              <span>Histórico</span>
              {history.length > 0 && (
                <span className="w-4 h-4 rounded-full bg-slate-800 text-[10px] text-amber-400 font-mono font-bold flex items-center justify-center border border-slate-700">
                  {history.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700 transition shadow-sm relative active:scale-95"
              title="Configurações de API, Modelo e Áudio"
            >
              <Settings className="w-4 h-4" />
              {(!serverHasKey && !apiKey) && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 lg:p-8 space-y-6">
        {/* Toast / Banner Messages */}
        {(!serverHasKey && !apiKey) && (
          <div className="bg-amber-950/40 border border-amber-500/30 text-amber-200 px-4 py-3 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs shadow-lg backdrop-blur-md">
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              <span>
                <strong>Pronto para síntese neural:</strong> Insira sua chave Gemini API para ativar o estúdio de voz ao vivo ou configure <code className="text-amber-300 bg-amber-950/60 px-1 rounded">GEMINI_API_KEY</code> no painel Secrets do AI Studio.
              </span>
            </div>
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition shadow-sm"
            >
              Configurar Chave
            </button>
          </div>
        )}

        {errorMessage && (
          <div className="bg-rose-950/80 border border-rose-800/80 text-rose-200 px-4 py-3 rounded-2xl flex items-start justify-between gap-3 text-sm shadow-xl backdrop-blur-md animate-in fade-in duration-200">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="font-semibold text-rose-100">Atenção na Locução</div>
                <div className="text-xs text-rose-300 leading-relaxed">{errorMessage}</div>
              </div>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-rose-400 hover:text-rose-100 p-1"
            >
              &times;
            </button>
          </div>
        )}

        {successToast && (
          <div className="bg-emerald-950/80 border border-emerald-800/80 text-emerald-200 px-4 py-3 rounded-2xl flex items-center justify-between gap-3 text-sm shadow-xl backdrop-blur-md animate-in fade-in duration-200">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span className="text-xs md:text-sm font-medium">{successToast}</span>
            </div>
            <button
              onClick={() => setSuccessToast(null)}
              className="text-emerald-400 hover:text-emerald-100 p-1"
            >
              &times;
            </button>
          </div>
        )}

        {/* Project Title Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 border border-slate-800/80 px-4 py-3 rounded-2xl">
          <div className="flex items-center gap-2.5 flex-1 min-w-[200px]">
            <FileText className="w-4 h-4 text-amber-400" />
            <input
              type="text"
              value={projectTitle}
              onChange={(e) => setProjectTitle(e.target.value)}
              placeholder="Nome do Projeto ou Locução..."
              className="bg-transparent text-sm font-bold text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-0 border-none w-full"
            />
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-400 font-medium">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Modelo: <strong className="text-slate-200">{voiceSettings.model}</strong>
            </span>
            <span className="text-slate-700">•</span>
            <span>Voz Ativa: <strong className="text-amber-400">{voiceSettings.voice}</strong></span>
          </div>
        </div>

        {/* Section 1 & 2: Main Studio Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          {/* ÁREA 1: DIREÇÃO DA VOZ */}
          <div className="flex flex-col h-full">
            <DirectionEditor
              direction={direction}
              onChange={setDirection}
              disabled={isGenerating}
            />
          </div>

          {/* ÁREA 2: TEXTO DA LOCUÇÃO */}
          <div className="flex flex-col h-full">
            <NarrationEditor
              text={text}
              onChange={setText}
              speed={voiceSettings.speed}
              onPreviewSnippet={handlePreviewSnippet}
              isPreviewGenerating={isPreviewGenerating}
              disabled={isGenerating}
            />
          </div>
        </div>

        {/* CONTROLES DE VOZ */}
        <VoiceControls
          settings={voiceSettings}
          onChange={handleSettingsChange}
          disabled={isGenerating}
        />

        {/* BOTÃO PRINCIPAL DE GERAÇÃO */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-900/95 to-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm md:text-base font-bold text-slate-100 flex items-center gap-2">
                Pronto para Gravar a Locução
              </h3>
              <p className="text-xs text-slate-400">
                A IA interpretará as instruções de direção vocal sem falar as marcações.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={() => handleGenerateSpeech()}
              disabled={isGenerating || !text.trim()}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-sm md:text-base bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 flex items-center justify-center gap-2.5 shadow-xl shadow-amber-500/20 active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none"
            >
              {isGenerating ? (
                <>
                  <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Criando sua locução...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 fill-slate-950" />
                  <span>GERAR LOCUÇÃO</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* LOADING ANIMATION OVERLAY / STATUS */}
        {isGenerating && (
          <div className="bg-slate-900/90 border border-amber-500/30 rounded-2xl p-6 shadow-2xl backdrop-blur-md flex flex-col items-center justify-center text-center animate-pulse">
            <div className="w-14 h-14 rounded-full bg-amber-500/15 border border-amber-500/40 flex items-center justify-center text-amber-400 mb-3 shadow-inner">
              <AudioWaveform className="w-7 h-7 animate-bounce" />
            </div>
            <h4 className="text-lg font-bold text-slate-100">
              {generatingPhase}
            </h4>
            <p className="text-xs text-slate-400 mt-1 max-w-md">
              Processando entonação, pausas interpretativas e expressividade em alta definição com o modelo de voz Gemini TTS.
            </p>
          </div>
        )}

        {/* ÁREA DO PLAYER DE ÁUDIO */}
        {currentVersion && (
          <div className="space-y-4">
            <AudioPlayer
              audioUrl={currentVersion.audioUrl}
              duration={currentVersion.duration}
              title={currentVersion.projectTitle}
              versionLabel={`Versão ${currentVersion.versionNumber}`}
              voiceName={currentVersion.voice}
              onGenerateAgain={() => handleGenerateSpeech()}
              onNewVersion={() => handleGenerateSpeech()}
              isGenerating={isGenerating}
            />
          </div>
        )}

        {/* COMPARAÇÃO DE VERSÕES DA SESSÃO */}
        <VersionList
          versions={sessionVersions}
          activeVersionId={currentVersion?.id}
          onSelectVersion={(ver) => setCurrentVersion(ver)}
          onDeleteVersion={handleDeleteVersion}
          onRestoreParameters={handleRestoreParameters}
        />
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800/80 bg-[#090d15] py-6 px-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-slate-400 font-medium">
            <span className="font-bold text-slate-200">WISH VOICE AI</span>
            <span>—</span>
            <span>Estúdio Profissional de Locução por IA</span>
          </div>
          <div className="text-[11px] text-slate-500">
            Português Brasileiro (PT-BR) • Broadcast WAV 24kHz Studio Master • Gemini TTS
          </div>
        </div>
      </footer>

      {/* Modals */}
      <HistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onLoadItem={handleLoadHistoryItem}
        onDeleteItem={handleDeleteHistoryItem}
        onClearAll={handleClearAllHistory}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        selectedModel={voiceSettings.model}
        onModelChange={(model) => setVoiceSettings((prev) => ({ ...prev, model }))}
        apiKey={apiKey}
        onApiKeyChange={handleApiKeyChange}
        serverHasKey={serverHasKey}
      />
    </div>
  );
}
