import { SpecialTag } from '../types';

export const AVAILABLE_TAGS: SpecialTag[] = [
  { tag: '[PAUSA]', label: 'Pausa Natural', description: 'Pausa breve para respiração e ritmo', color: 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60', category: 'pausa' },
  { tag: '[PAUSA CURTA]', label: 'Pausa Curta', description: 'Micro-pausa de cadência', color: 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60', category: 'pausa' },
  { tag: '[PAUSA DRAMÁTICA]', label: 'Pausa Dramática', description: 'Pausa expressiva com suspense', color: 'bg-amber-950/80 text-amber-300 border-amber-700/60', category: 'pausa' },
  { tag: '[PAUSA LONGA]', label: 'Pausa Longa', description: 'Silêncio prolongado para transição de ato', color: 'bg-amber-950/80 text-amber-300 border-amber-700/60', category: 'pausa' },
  { tag: '[ÊNFASE]', label: 'Ênfase', description: 'Destaca a próxima palavra ou frase com peso', color: 'bg-cyan-950/80 text-cyan-300 border-cyan-700/60', category: 'intensidade' },
  { tag: '[MAIOR INTENSIDADE]', label: 'Maior Intensidade', description: 'Eleva a presença vocal e projeção', color: 'bg-rose-950/80 text-rose-300 border-rose-700/60', category: 'intensidade' },
  { tag: '[VOZ MAIS BAIXA]', label: 'Voz Mais Baixa', description: 'Tom íntimo, grave e confidencial', color: 'bg-indigo-950/80 text-indigo-300 border-indigo-700/60', category: 'intensidade' },
  { tag: '[VOZ MAIS FORTE]', label: 'Voz Mais Forte', description: 'Projeção encorpada e imponente', color: 'bg-orange-950/80 text-orange-300 border-orange-700/60', category: 'intensidade' },
  { tag: '[EMOÇÃO]', label: 'Emoção', description: 'Carga dramática e comoção vocal', color: 'bg-purple-950/80 text-purple-300 border-purple-700/60', category: 'emocao' },
  { tag: '[ENTUSIASMO]', label: 'Entusiasmo', description: 'Energia vibrante e grandiosidade', color: 'bg-yellow-950/80 text-yellow-300 border-yellow-700/60', category: 'emocao' },
];

/**
 * Strips all bracket tags from the text so the AI speaks clean narration without saying the tag names.
 */
export function cleanNarrationText(rawText: string): string {
  if (!rawText) return '';
  return rawText
    .replace(/\[(PAUSA|PAUSA\s+CURTA|PAUSA\s+DRAMÁTICA|PAUSA\s+LONGA|PAUSA\s+DRAMÁTICA\s+MAIS\s+LONGA|BREAK)\]/gi, ' ... ')
    .replace(/\[(ÊNFASE|MAIOR\s+INTENSIDADE|VOZ\s+MAIS\s+BAIXA|VOZ\s+BAIXA|VOZ\s+MAIS\s+FORTE|VOZ\s+FORTE|EMOÇÃO|ENTUSIASMO)\]/gi, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s\.\.\.\s/g, ' ... ')
    .trim();
}

/**
 * Counts words in a string.
 */
export function getWordCount(text: string): number {
  if (!text) return 0;
  const clean = text.replace(/\[.*?\]/g, ' ').trim();
  if (!clean) return 0;
  return clean.split(/\s+/).filter(Boolean).length;
}

/**
 * Estimates reading duration in seconds based on word count and speed factor.
 * Average Portuguese speech rate is ~130 words per minute at 1.0x speed.
 */
export function estimateDurationSec(text: string, speed = 1.0): number {
  const words = getWordCount(text);
  if (words === 0) return 0;
  const baseWpm = 130 * speed;
  const seconds = (words / baseWpm) * 60;
  return Math.ceil(seconds);
}

/**
 * Formats seconds into MM:SS format.
 */
export function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Extracts a test snippet (e.g. first sentence or paragraph up to ~150 characters)
 */
export function extractTestSnippet(text: string): string {
  if (!text) return '';
  // Check for first paragraph
  const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 0);
  if (paragraphs.length > 0) {
    return paragraphs[0].trim();
  }
  // Otherwise take first 150 chars
  return text.slice(0, 150).trim();
}
