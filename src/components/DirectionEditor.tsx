import React from 'react';
import { Sliders, Sparkles, HelpCircle, X } from 'lucide-react';
import { DIRECTION_PRESETS } from '../data/voices';

interface DirectionEditorProps {
  direction: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export const DirectionEditor: React.FC<DirectionEditorProps> = ({
  direction,
  onChange,
  disabled = false,
}) => {
  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 md:p-6 shadow-xl relative flex flex-col h-full backdrop-blur-md">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              Direção da voz
              <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                Como falar
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Instruções de performance, tom, ritmo, energia e emoção
            </p>
          </div>
        </div>

        {direction && (
          <button
            onClick={() => onChange('')}
            disabled={disabled}
            className="text-xs text-slate-500 hover:text-slate-300 transition flex items-center gap-1 px-2 py-1 rounded hover:bg-slate-800"
            title="Limpar direção"
          >
            <X className="w-3.5 h-3.5" />
            Limpar
          </button>
        )}
      </div>

      {/* Presets Chips */}
      <div className="mb-3">
        <div className="flex items-center gap-1.5 mb-1.5">
          <Sparkles className="w-3 h-3 text-amber-400" />
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
            Estilos rápidos:
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {DIRECTION_PRESETS.map((preset) => (
            <button
              key={preset.title}
              type="button"
              disabled={disabled}
              onClick={() => onChange(preset.text)}
              className="text-xs px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-amber-300 border border-slate-700/60 transition flex items-center gap-1.5 shadow-sm active:scale-95 disabled:opacity-50"
              title={preset.text}
            >
              <span>{preset.title}</span>
              <span className="text-[9px] px-1 rounded bg-slate-900 text-slate-400">
                {preset.badge}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Textarea */}
      <div className="relative flex-1 flex flex-col">
        <textarea
          value={direction}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder="Descreva como o texto deve ser interpretado. Exemplo: voz masculina adulta, grave, encorpada, cinematográfica, profissional, com emoção crescente, pausas dramáticas..."
          className="w-full flex-1 min-h-[140px] md:min-h-[160px] bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 resize-none font-normal leading-relaxed transition"
        />

        {/* Footer info banner */}
        <div className="flex items-center justify-between mt-2 pt-1 text-xs text-slate-400">
          <div className="flex items-center gap-1.5 text-amber-400/90 text-[11px]">
            <HelpCircle className="w-3.5 h-3.5 shrink-0" />
            <span>A direção orienta a interpretação vocal e <strong>NUNCA</strong> será dita no áudio.</span>
          </div>
          <span className="font-mono text-[11px] text-slate-500">
            {direction.length} caracteres
          </span>
        </div>
      </div>
    </div>
  );
};
