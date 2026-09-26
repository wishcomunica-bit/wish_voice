import React from 'react';
import { Settings2, Volume2, Gauge, Activity, Sparkles, User, Globe2 } from 'lucide-react';
import { LanguageCode, VoiceId, VoiceSettings } from '../types';
import { VOICES } from '../data/voices';

interface VoiceControlsProps {
  settings: VoiceSettings;
  onChange: (updated: Partial<VoiceSettings>) => void;
  disabled?: boolean;
}

export const VoiceControls: React.FC<VoiceControlsProps> = ({
  settings,
  onChange,
  disabled = false,
}) => {
  const languages: { code: LanguageCode; label: string; flag: string }[] = [
    { code: 'pt-BR', label: 'Português (Brasil)', flag: '🇧🇷' },
    { code: 'pt-PT', label: 'Português (Portugal)', flag: '🇵🇹' },
    { code: 'en-US', label: 'Inglês (EUA)', flag: '🇺🇸' },
    { code: 'es-ES', label: 'Espanhol', flag: '🇪🇸' },
  ];

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 md:p-6 shadow-xl backdrop-blur-md">
      {/* Title */}
      <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Settings2 className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              Configurações da voz
            </h2>
            <p className="text-xs text-slate-400">
              Personalize idioma, timbre do locutor e parâmetros acústicos
            </p>
          </div>
        </div>

        {/* Reset settings button */}
        <button
          onClick={() =>
            onChange({
              speed: 1.0,
              pitch: 0,
              intensity: 75,
              expressiveness: 80,
              pauseStyle: 'natural',
            })
          }
          disabled={disabled}
          className="text-xs text-slate-500 hover:text-slate-300 transition"
        >
          Redefinir padrões
        </button>
      </div>

      <div className="space-y-5">
        {/* Idioma */}
        <div>
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Globe2 className="w-3.5 h-3.5 text-indigo-400" />
            <span>Idioma da locução</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {languages.map((lang) => {
              const isSelected = settings.language === lang.code;
              return (
                <button
                  key={lang.code}
                  type="button"
                  disabled={disabled}
                  onClick={() => onChange({ language: lang.code })}
                  className={`p-2.5 rounded-xl border text-xs font-medium text-left transition flex items-center gap-2 ${
                    isSelected
                      ? 'bg-amber-500/15 border-amber-500/60 text-amber-200 shadow-sm'
                      : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  <span className="text-base">{lang.flag}</span>
                  <span className="truncate">{lang.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Seletor de Vozes */}
        <div>
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-amber-400" />
              <span>Locutor & Perfil Vocal</span>
            </span>
            <span className="text-[11px] text-slate-500 normal-case">
              Personalidade modulada pela Direção
            </span>
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
            {VOICES.map((v) => {
              const isSelected = settings.voice === v.id;
              return (
                <button
                  key={v.id}
                  type="button"
                  disabled={disabled}
                  onClick={() => onChange({ voice: v.id })}
                  className={`p-3 rounded-xl border text-left transition flex flex-col justify-between relative group ${
                    isSelected
                      ? 'bg-amber-500/10 border-amber-500 text-slate-100 ring-1 ring-amber-500/40 shadow-lg shadow-amber-950/30'
                      : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:bg-slate-800/70 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  {/* Top: Avatar & Name */}
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className={`w-7 h-7 rounded-lg bg-gradient-to-br ${v.avatarColor} flex items-center justify-center text-white text-xs font-bold shadow-sm`}
                    >
                      {v.name[0]}
                    </div>
                    <div>
                      <div className="font-bold text-sm text-slate-100 leading-tight">
                        {v.name}
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium">
                        {v.gender} • {v.pitch}
                      </div>
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="space-y-1 mt-1">
                    <div className="text-[11px] text-slate-300 font-medium line-clamp-1">
                      {v.style}
                    </div>
                    <div className="text-[10px] text-slate-500 line-clamp-1">
                      {v.recommendedFor}
                    </div>
                  </div>

                  {/* Active indicator badge */}
                  {isSelected && (
                    <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-amber-400 shadow-sm shadow-amber-400" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Sliders Grid: Velocidade, Tom, Intensidade, Expressividade, Pausas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-2 border-t border-slate-800/80">
          {/* Velocidade */}
          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/70">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                <Gauge className="w-3.5 h-3.5 text-amber-400" />
                Velocidade
              </span>
              <span className="font-mono text-xs font-semibold text-amber-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                {settings.speed.toFixed(2)}x
              </span>
            </div>
            <input
              type="range"
              min="0.5"
              max="1.5"
              step="0.05"
              value={settings.speed}
              disabled={disabled}
              onChange={(e) => onChange({ speed: parseFloat(e.target.value) })}
              className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
              <span>0.5x</span>
              <span>1.0x (Padrão)</span>
              <span>1.5x</span>
            </div>
          </div>

          {/* Tom / Pitch */}
          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/70">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-blue-400" />
                Tom / Pitch
              </span>
              <span className="font-mono text-xs font-semibold text-blue-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                {settings.pitch > 0 ? `+${settings.pitch}` : settings.pitch}
              </span>
            </div>
            <input
              type="range"
              min="-10"
              max="10"
              step="1"
              value={settings.pitch}
              disabled={disabled}
              onChange={(e) => onChange({ pitch: parseInt(e.target.value, 10) })}
              className="w-full accent-blue-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
              <span>Mais Grave</span>
              <span>Natural</span>
              <span>Mais Agudo</span>
            </div>
          </div>

          {/* Intensidade */}
          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/70">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-rose-400" />
                Intensidade
              </span>
              <span className="font-mono text-xs font-semibold text-rose-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                {settings.intensity}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={settings.intensity}
              disabled={disabled}
              onChange={(e) => onChange({ intensity: parseInt(e.target.value, 10) })}
              className="w-full accent-rose-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
              <span>Suave</span>
              <span>Equilibrada</span>
              <span>Marcante (100)</span>
            </div>
          </div>

          {/* Expressividade */}
          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/70">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                Expressividade
              </span>
              <span className="font-mono text-xs font-semibold text-purple-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                {settings.expressiveness}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={settings.expressiveness}
              disabled={disabled}
              onChange={(e) => onChange({ expressiveness: parseInt(e.target.value, 10) })}
              className="w-full accent-purple-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
              <span>Sóbria</span>
              <span>Articulada</span>
              <span>Teatral (100)</span>
            </div>
          </div>
        </div>

        {/* Pausas interpretativas */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 bg-slate-950/40 p-3 rounded-xl border border-slate-800/50">
          <div className="text-xs text-slate-300">
            <span className="font-medium text-slate-200">Duração das Pausas Interpretativas:</span>
            <span className="text-slate-500 text-[11px] ml-2">
              Controla o tempo de silêncio e respiro nas quebras e pontuações
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {[
              { id: 'natural', label: 'Naturais' },
              { id: 'dramatic', label: 'Dramáticas (Prolongadas)' },
              { id: 'dynamic', label: 'Dinâmicas (Rápidas)' },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                disabled={disabled}
                onClick={() => onChange({ pauseStyle: p.id as any })}
                className={`text-xs px-2.5 py-1 rounded-lg border transition ${
                  settings.pauseStyle === p.id
                    ? 'bg-amber-500/20 border-amber-500 text-amber-200 font-medium'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
