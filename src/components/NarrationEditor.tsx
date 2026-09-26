import React, { useRef } from 'react';
import { Mic, Clock, Type, ShieldCheck, PlayCircle, X, Tag } from 'lucide-react';
import { AVAILABLE_TAGS, estimateDurationSec, formatTime, getWordCount } from '../utils/textParser';

interface NarrationEditorProps {
  text: string;
  onChange: (value: string) => void;
  speed?: number;
  onPreviewSnippet?: () => void;
  isPreviewGenerating?: boolean;
  disabled?: boolean;
}

export const NarrationEditor: React.FC<NarrationEditorProps> = ({
  text,
  onChange,
  speed = 1.0,
  onPreviewSnippet,
  isPreviewGenerating = false,
  disabled = false,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Insert tag at cursor position
  const insertTag = (tagToInsert: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      onChange(text ? `${text}\n${tagToInsert}\n` : `${tagToInsert}\n`);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const before = text.substring(0, start);
    const after = text.substring(end);

    const spaceBefore = before.length > 0 && !before.endsWith('\n') && !before.endsWith(' ') ? ' ' : '';
    const spaceAfter = after.length > 0 && !after.startsWith('\n') && !after.startsWith(' ') ? ' ' : '';

    const newText = `${before}${spaceBefore}${tagToInsert}${spaceAfter}${after}`;
    onChange(newText);

    // Reposition cursor after the inserted tag
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + spaceBefore.length + tagToInsert.length + spaceAfter.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 10);
  };

  const wordCount = getWordCount(text);
  const estimatedSec = estimateDurationSec(text, speed);

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 md:p-6 shadow-xl relative flex flex-col h-full backdrop-blur-md">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Mic className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              Texto da locução
              <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                O que falar
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Conteúdo exato a ser falado pela IA. Textos longos são suportados.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onPreviewSnippet && (
            <button
              onClick={onPreviewSnippet}
              disabled={disabled || isPreviewGenerating || !text.trim()}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-amber-500/40 transition flex items-center gap-1.5 shadow-sm active:scale-95 disabled:opacity-40"
              title="Gera uma prévia do início para testar o timbre e economizar tempo"
            >
              <PlayCircle className={`w-3.5 h-3.5 text-amber-400 ${isPreviewGenerating ? 'animate-spin' : ''}`} />
              <span>{isPreviewGenerating ? 'Gerando prévia...' : 'Testar Trecho'}</span>
            </button>
          )}

          {text && (
            <button
              onClick={() => onChange('')}
              disabled={disabled}
              className="text-xs text-slate-500 hover:text-slate-300 transition flex items-center gap-1 px-2 py-1 rounded hover:bg-slate-800"
              title="Limpar texto"
            >
              <X className="w-3.5 h-3.5" />
              Limpar
            </button>
          )}
        </div>
      </div>

      {/* Special tags bar (Direção Avançada) */}
      <div className="mb-3 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5">
            <Tag className="w-3 h-3 text-cyan-400" />
            <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
              Direção Avançada & Marcações no Texto
            </span>
          </div>
          <span className="text-[10px] text-slate-500">
            Clique para inserir no cursor (não são faladas)
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {AVAILABLE_TAGS.map((item) => (
            <button
              key={item.tag}
              type="button"
              disabled={disabled}
              onClick={() => insertTag(item.tag)}
              className={`text-xs px-2.5 py-1 rounded-md font-mono border transition shadow-sm hover:scale-105 active:scale-95 disabled:opacity-50 ${item.color}`}
              title={`${item.description} - Clique para inserir no texto`}
            >
              {item.tag}
            </button>
          ))}
        </div>
      </div>

      {/* Textarea */}
      <div className="relative flex-1 flex flex-col">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder="Digite ou cole aqui o texto que deverá ser falado..."
          className="w-full flex-1 min-h-[220px] md:min-h-[260px] bg-slate-950/70 border border-slate-800 rounded-xl p-4 text-sm md:text-[15px] text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 resize-none font-normal leading-relaxed transition"
        />

        {/* Footer info: Counts & Duration & Strict Rule indicator */}
        <div className="flex flex-wrap items-center justify-between gap-3 mt-2.5 pt-1 text-xs">
          <div className="flex items-center gap-3 text-slate-400">
            <span className="flex items-center gap-1 font-mono text-[11px]">
              <Type className="w-3.5 h-3.5 text-slate-500" />
              <strong className="text-slate-200">{wordCount}</strong> palavras
            </span>
            <span className="text-slate-700">•</span>
            <span className="font-mono text-[11px]">
              <strong className="text-slate-200">{text.length}</strong> caracteres
            </span>
            <span className="text-slate-700">•</span>
            <span className="flex items-center gap-1 font-mono text-[11px] text-amber-400">
              <Clock className="w-3.5 h-3.5" />
              Tempo estimado: <strong>~{formatTime(estimatedSec)}</strong>
            </span>
          </div>

          <div className="flex items-center gap-1 text-[11px] text-emerald-400/90 font-medium">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Texto preservado integralmente</span>
          </div>
        </div>
      </div>
    </div>
  );
};
