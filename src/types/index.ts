export type LanguageCode = 'pt-BR' | 'pt-PT' | 'en-US' | 'es-ES';

export type VoiceId = 'Fenrir' | 'Charon' | 'Puck' | 'Kore' | 'Zephyr';

export interface VoiceOption {
  id: VoiceId;
  name: string;
  gender: 'Masculina' | 'Feminina';
  pitch: 'Grave' | 'Grave / Média' | 'Média' | 'Suave / Média' | 'Aguda';
  age: 'Jovem / Adulta' | 'Adulta' | 'Adulta / Madura' | 'Madura';
  style: string;
  recommendedFor: string;
  avatarColor: string;
}

export interface VoiceSettings {
  language: LanguageCode;
  voice: VoiceId;
  model: 'gemini-3.8-flash-lite-tts' | 'gemini-3.8-flash-tts';
  speed: number; // 0.5 to 1.5
  pitch: number; // -10 to +10
  intensity: number; // 0 to 100
  expressiveness: number; // 0 to 100
  pauseStyle: 'natural' | 'dramatic' | 'dynamic';
}

export interface AudioVersion {
  id: string;
  versionNumber: number;
  projectTitle: string;
  timestamp: number;
  duration: number; // in seconds
  audioUrl: string; // data:audio/wav;base64,... or blob URL
  text: string;
  cleanedText: string;
  direction: string;
  voice: VoiceId;
  language: LanguageCode;
  model: string;
  settingsSnapshot: VoiceSettings;
}

export interface HistoryRecord {
  id: string;
  projectTitle: string;
  timestamp: number;
  duration: number;
  audioUrl: string;
  text: string;
  direction: string;
  voice: VoiceId;
  language: LanguageCode;
  model: string;
  versionCount?: number;
}

export interface SpecialTag {
  tag: string;
  label: string;
  description: string;
  color: string;
  category: 'pausa' | 'intensidade' | 'emocao';
}
