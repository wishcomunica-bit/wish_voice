import React, { useState } from 'react';
import { History, X, Play, Pause, Download, Trash2, RotateCcw, Calendar, Clock, Mic, Search } from 'lucide-react';
import { HistoryRecord } from '../types';
import { formatTime } from '../utils/textParser';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: HistoryRecord[];
  onLoadItem: (item: HistoryRecord) => void;
  onDeleteItem: (id: string) => void;
  onClearAll: () => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  isOpen,
  onClose,
  history,
  onLoadItem,
  onDeleteItem,
  onClearAll,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [activeAudio, setActiveAudio] = useState<HTMLAudioElement | null>(null);

  if (!isOpen) return null;

  const filteredHistory = history.filter((item) => {
    const term = searchTerm.toLowerCase();
    return (
      item.projectTitle.toLowerCase().includes(term) ||
      item.text.toLowerCase().includes(term) ||
      (item.direction && item.direction.toLowerCase().includes(term)) ||
      item.voice.toLowerCase().includes(term)
    );
  });

  const handlePlayToggle = (item: HistoryRecord) => {
    if (playingId === item.id) {
      if (activeAudio) activeAudio.pause();
      setPlayingId(null);
    } else {
      if (activeAudio) activeAudio.pause();
      const audio = new Audio(item.audioUrl);
      audio.onended = () => setPlayingId(null);
      audio.play().then(() => {
        setActiveAudio(audio);
        setPlayingId(item.id);
      }).catch(console.error);
    }
  };

  const handleDownload = (item: HistoryRecord) => {
    const a = document.createElement('a');
    a.href = item.audioUrl;
    a.download = `wish-voice-${item.projectTitle.toLowerCase().replace(/[^a-z0-9]/g, '-')}.wav`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-lg text-slate-100 flex items-center gap-2">
                Histórico de Locuções
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                  {history.length} {history.length === 1 ? 'gravação' : 'gravações'}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Gerações salvas localmente no navegador (IndexedDB)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {history.length > 0 && (
              <button
                onClick={() => {
                  if (confirm('Deseja realmente limpar todo o histórico de locuções?')) {
                    onClearAll();
                  }
                }}
                className="text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 px-3 py-1.5 rounded-lg border border-rose-900/40 transition"
              >
                Limpar Tudo
              </button>
            )}
            <button
              onClick={() => {
                if (activeAudio) activeAudio.pause();
                setPlayingId(null);
                onClose();
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        {history.length > 0 && (
          <div className="p-4 border-b border-slate-800/80 bg-slate-950/30">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por título, texto ou locutor..."
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-amber-500/50"
              />
            </div>
          </div>
        )}

        {/* Content List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {history.length === 0 ? (
            <div className="text-center py-12 px-4">
              <div className="w-12 h-12 rounded-full bg-slate-800/80 mx-auto flex items-center justify-center text-slate-500 mb-3">
                <History className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-slate-300">
                Nenhuma locução gravada no histórico
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                Todas as locuções geradas nesta máquina ficarão salvas aqui com áudio completo para download ou reedição.
              </p>
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-sm">
              Nenhuma locução encontrada para a busca "{searchTerm}".
            </div>
          ) : (
            filteredHistory.map((item) => {
              const isPlaying = playingId === item.id;
              const dateStr = new Date(item.timestamp).toLocaleDateString([], { day: '2-digit', month: '2-digit', year: 'numeric' });
              const timeStr = new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

              return (
                <div
                  key={item.id}
                  className="bg-slate-950/70 border border-slate-800 hover:border-slate-700 rounded-xl p-4 transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-sm text-slate-100 truncate">
                        {item.projectTitle}
                      </h4>
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-amber-500/15 text-amber-300 border border-amber-500/25">
                        {item.voice}
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-400 font-mono">
                        {item.language}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 line-clamp-2 mb-2 italic">
                      "{item.text}"
                    </p>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                      <span className="flex items-center gap-1 font-mono">
                        <Calendar className="w-3 h-3 text-slate-600" />
                        {dateStr} às {timeStr}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 font-mono text-amber-400 font-medium">
                        <Clock className="w-3 h-3" />
                        {formatTime(item.duration)}
                      </span>
                      {item.direction && (
                        <>
                          <span>•</span>
                          <span className="truncate max-w-[200px] text-slate-400">
                            Dir: {item.direction}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-slate-800/80 shrink-0">
                    <button
                      onClick={() => handlePlayToggle(item)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                        isPlaying
                          ? 'bg-amber-500 text-slate-950'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                      }`}
                      title={isPlaying ? 'Pausar áudio' : 'Ouvir locução'}
                    >
                      {isPlaying ? (
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

                    <button
                      onClick={() => handleDownload(item)}
                      className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-emerald-400 transition"
                      title="Baixar áudio WAV"
                    >
                      <Download className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => {
                        onLoadItem(item);
                        onClose();
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-amber-400 text-xs flex items-center gap-1 transition"
                      title="Carregar de volta no estúdio para reedição"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Carregar</span>
                    </button>

                    <button
                      onClick={() => onDeleteItem(item.id)}
                      className="p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/20 transition"
                      title="Excluir do histórico"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
