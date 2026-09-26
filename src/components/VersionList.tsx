import React, { useState } from 'react';
import { Play, Pause, Download, Trash2, ArrowUpRight, Copy, Check, Clock, Radio } from 'lucide-react';
import { AudioVersion } from '../types';
import { formatTime } from '../utils/textParser';

interface VersionListProps {
  versions: AudioVersion[];
  activeVersionId?: string;
  onSelectVersion: (version: AudioVersion) => void;
  onDeleteVersion: (id: string) => void;
  onRestoreParameters?: (version: AudioVersion) => void;
}

export const VersionList: React.FC<VersionListProps> = ({
  versions,
  activeVersionId,
  onSelectVersion,
  onDeleteVersion,
  onRestoreParameters,
}) => {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [activeAudio, setActiveAudio] = useState<HTMLAudioElement | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (versions.length === 0) {
    return null;
  }

  const handlePlayToggle = (version: AudioVersion) => {
    if (playingId === version.id) {
      if (activeAudio) {
        activeAudio.pause();
      }
      setPlayingId(null);
    } else {
      if (activeAudio) {
        activeAudio.pause();
      }
      const audio = new Audio(version.audioUrl);
      audio.onended = () => {
        setPlayingId(null);
      };
      audio.play().then(() => {
        setActiveAudio(audio);
        setPlayingId(version.id);
      }).catch(console.error);
    }
  };

  const handleDownload = (version: AudioVersion) => {
    const a = document.createElement('a');
    a.href = version.audioUrl;
    a.download = `wish-voice-versao-${version.versionNumber}-${version.voice.toLowerCase()}.wav`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleCopyDirection = (direction: string, id: string) => {
    navigator.clipboard.writeText(direction);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 md:p-6 shadow-xl backdrop-blur-md">
      {/* Title */}
      <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Radio className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              Comparações de Versões (Takes da Sessão)
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-amber-400 border border-slate-700">
                {versions.length} {versions.length === 1 ? 'versão' : 'versões'}
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Ouça e compare diferentes interpretações e direções vocais da mesma locução
            </p>
          </div>
        </div>
      </div>

      {/* Grid of version cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {versions.map((ver) => {
          const isCurrentActive = ver.id === activeVersionId;
          const isCurrentlyPlaying = ver.id === playingId;
          const formattedDate = new Date(ver.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

          return (
            <div
              key={ver.id}
              className={`rounded-xl border p-4 transition-all flex flex-col justify-between ${
                isCurrentActive
                  ? 'bg-amber-500/10 border-amber-500/50 shadow-md shadow-amber-950/20 ring-1 ring-amber-500/30'
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/90'
              }`}
            >
              {/* Header */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Versão {ver.versionNumber}
                    </span>
                    <span className="text-xs font-medium text-slate-300">
                      Voz {ver.voice}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-500">
                    <Clock className="w-3 h-3" />
                    <span>{formattedDate}</span>
                  </div>
                </div>

                {/* Duration & Language info */}
                <div className="flex items-center gap-3 text-xs text-slate-400 mb-2">
                  <span>Duração: <strong className="text-slate-200 font-mono">{formatTime(ver.duration)}</strong></span>
                  <span className="text-slate-700">•</span>
                  <span>{ver.language}</span>
                  <span className="text-slate-700">•</span>
                  <span>{ver.settingsSnapshot?.speed || 1}x</span>
                </div>

                {/* Direction snippet */}
                {ver.direction && (
                  <div className="bg-slate-900/80 rounded-lg p-2 border border-slate-800 text-[11px] text-slate-300 mb-3 line-clamp-2 italic">
                    "{ver.direction}"
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800/80 mt-1">
                {/* Play button */}
                <button
                  onClick={() => handlePlayToggle(ver)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                    isCurrentlyPlaying
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                  }`}
                  title={isCurrentlyPlaying ? 'Pausar áudio' : 'Ouvir esta versão'}
                >
                  {isCurrentlyPlaying ? (
                    <>
                      <Pause className="w-3.5 h-3.5 fill-slate-950" />
                      <span>Pausar</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Ouvir</span>
                    </>
                  )}
                </button>

                <div className="flex items-center gap-1">
                  {/* Select as active player */}
                  <button
                    onClick={() => onSelectVersion(ver)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition"
                    title="Carregar no player principal"
                  >
                    <ArrowUpRight className="w-4 h-4" />
                  </button>

                  {/* Download */}
                  <button
                    onClick={() => handleDownload(ver)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition"
                    title="Baixar áudio WAV desta versão"
                  >
                    <Download className="w-4 h-4" />
                  </button>

                  {/* Restore parameters */}
                  {onRestoreParameters && (
                    <button
                      onClick={() => onRestoreParameters(ver)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-slate-800 transition"
                      title="Carregar parâmetros desta versão no editor"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  )}

                  {/* Delete */}
                  <button
                    onClick={() => onDeleteVersion(ver.id)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition"
                    title="Excluir esta versão da sessão"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
