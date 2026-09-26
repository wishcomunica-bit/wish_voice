import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, Download, Volume2, VolumeX, Sparkles, RefreshCw, AudioWaveform as WaveformIcon } from 'lucide-react';
import { formatTime } from '../utils/textParser';

interface AudioPlayerProps {
  audioUrl: string;
  duration?: number;
  title?: string;
  versionLabel?: string;
  voiceName?: string;
  onGenerateAgain?: () => void;
  onNewVersion?: () => void;
  isGenerating?: boolean;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  audioUrl,
  duration: initialDuration,
  title = 'Locução Studio',
  versionLabel,
  voiceName,
  onGenerateAgain,
  onNewVersion,
  isGenerating = false,
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(initialDuration || 0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [waveformPeaks, setWaveformPeaks] = useState<number[]>([]);
  const animationFrameRef = useRef<number | null>(null);

  // Sync duration when prop updates
  useEffect(() => {
    if (initialDuration && initialDuration > 0) {
      setDuration(initialDuration);
    }
  }, [initialDuration]);

  // Reset state when audioUrl changes
  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);

    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }

    // Generate waveform peaks from the audio data if possible
    generatePeaks(audioUrl);
  }, [audioUrl]);

  // Decode audio to draw realistic waveform bars
  const generatePeaks = async (url: string) => {
    try {
      if (!url) return;
      const res = await fetch(url);
      const arrayBuffer = await res.arrayBuffer();
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const decodedBuffer = await audioCtx.decodeAudioData(arrayBuffer);
      setDuration(decodedBuffer.duration);

      const rawData = decodedBuffer.getChannelData(0);
      const totalBars = 70;
      const step = Math.floor(rawData.length / totalBars);
      const peaks: number[] = [];

      for (let i = 0; i < totalBars; i++) {
        let max = 0;
        const start = i * step;
        for (let j = 0; j < step; j += 10) {
          const val = Math.abs(rawData[start + j] || 0);
          if (val > max) max = val;
        }
        // Normalize between 0.15 and 0.95
        peaks.push(Math.max(0.12, Math.min(0.98, max * 1.8)));
      }
      setWaveformPeaks(peaks);
    } catch {
      // Fallback synthetic visually appealing waveform
      const fallback: number[] = [];
      for (let i = 0; i < 70; i++) {
        fallback.push(0.2 + Math.abs(Math.sin(i * 0.15) * 0.5) + (Math.sin(i * 0.7) * 0.25));
      }
      setWaveformPeaks(fallback);
    }
  };

  // Draw waveform canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    if (waveformPeaks.length === 0) return;

    const barWidth = 3;
    const gap = (width - waveformPeaks.length * barWidth) / (waveformPeaks.length - 1);
    const progress = duration > 0 ? currentTime / duration : 0;
    const currentBarIdx = Math.floor(progress * waveformPeaks.length);

    waveformPeaks.forEach((peak, i) => {
      const x = i * (barWidth + gap);
      const barHeight = peak * (height - 8);
      const y = (height - barHeight) / 2;

      // Color based on playback progress
      if (i <= currentBarIdx) {
        // Played section (Studio Amber/Gold glow)
        const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
        gradient.addColorStop(0, '#fbbf24');
        gradient.addColorStop(1, '#f59e0b');
        ctx.fillStyle = gradient;
        ctx.shadowColor = 'rgba(245, 158, 11, 0.4)';
        ctx.shadowBlur = 4;
      } else {
        // Unplayed section
        ctx.fillStyle = '#334155';
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
      }

      // Rounded bars
      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, barHeight, 2);
      ctx.fill();
    });
  }, [waveformPeaks, currentTime, duration]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(console.error);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      if (audioRef.current.duration && !isNaN(audioRef.current.duration)) {
        setDuration(audioRef.current.duration);
      }
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || duration === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    const newTime = Math.max(0, Math.min(duration, pos * duration));
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleRestart = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
      if (!isPlaying) {
        audioRef.current.play().then(() => setIsPlaying(true)).catch(console.error);
      }
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (audioRef.current) {
      audioRef.current.volume = val;
    }
    setIsMuted(val === 0);
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    if (isMuted) {
      audioRef.current.volume = volume > 0 ? volume : 0.8;
      setIsMuted(false);
    } else {
      audioRef.current.volume = 0;
      setIsMuted(true);
    }
  };

  const cyclePlaybackRate = () => {
    const rates = [1.0, 1.25, 1.5, 0.75];
    const nextIdx = (rates.indexOf(playbackRate) + 1) % rates.length;
    const nextRate = rates[nextIdx];
    setPlaybackRate(nextRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextRate;
    }
  };

  const handleDownload = () => {
    if (!audioUrl) return;
    const a = document.createElement('a');
    a.href = audioUrl;
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const timeStr = new Date().toTimeString().slice(0, 5).replace(/:/g, '');
    const cleanTitle = (title || 'locucao').toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 30);
    a.download = `wish-voice-${cleanTitle}-${dateStr}-${timeStr}.wav`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="bg-slate-900/90 border border-amber-500/25 rounded-2xl p-5 md:p-6 shadow-2xl backdrop-blur-xl relative overflow-hidden group">
      {/* Decorative subtle ambient studio glow */}
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Hidden native audio tag */}
      <audio
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        preload="auto"
      />

      {/* Header Info */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner">
            <WaveformIcon className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-slate-100 text-sm md:text-base tracking-wide flex items-center gap-2">
                {title}
              </h3>
              {versionLabel && (
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {versionLabel}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
              <span>Voz: <strong className="text-slate-300">{voiceName || 'Fenrir'}</strong></span>
              <span className="text-slate-600">•</span>
              <span>Formato: <strong className="text-slate-300">WAV 24kHz Studio</strong></span>
            </p>
          </div>
        </div>

        {/* Action buttons right */}
        <div className="flex items-center gap-2">
          {onNewVersion && (
            <button
              onClick={onNewVersion}
              disabled={isGenerating}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition flex items-center gap-1.5 shadow-sm hover:border-slate-600 disabled:opacity-50"
              title="Gerar outra interpretação sem perder esta"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Nova Versão</span>
            </button>
          )}

          <button
            onClick={handleDownload}
            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 transition flex items-center gap-1.5 shadow-md shadow-amber-500/20 active:scale-95"
            title="Baixar arquivo de áudio WAV para seu computador"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Baixar Áudio (.wav)</span>
          </button>
        </div>
      </div>

      {/* Waveform Canvas Visualizer */}
      <div
        onClick={handleSeek}
        className="w-full h-16 bg-slate-950/60 rounded-xl border border-slate-800/80 p-2 cursor-pointer relative group/wave flex items-center justify-center hover:border-amber-500/40 transition mb-3"
        title="Clique em qualquer ponto para avançar ou retroceder"
      >
        <canvas
          ref={canvasRef}
          width={700}
          height={60}
          className="w-full h-full block"
        />

        {/* Scrub hover indicator */}
        <div className="absolute inset-0 bg-transparent pointer-events-none" />
      </div>

      {/* Progress timeline scrub bar */}
      <div
        onClick={handleSeek}
        className="w-full h-1.5 bg-slate-800 hover:h-2.5 rounded-full cursor-pointer relative mb-4 transition-all"
      >
        <div
          className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full relative"
          style={{ width: `${progressPercent}%` }}
        >
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-amber-300 rounded-full shadow-md shadow-amber-500/50 -mr-1.5 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>

      {/* Control Bar: Play/Pause, Time, Volume, Speed */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Playback Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={togglePlay}
            className="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-500/25 hover:scale-105 active:scale-95 transition"
            title={isPlaying ? 'Pausar áudio (Espaço)' : 'Reproduzir áudio (Espaço)'}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 fill-slate-950" />
            ) : (
              <Play className="w-5 h-5 fill-slate-950 ml-0.5" />
            )}
          </button>

          <button
            onClick={handleRestart}
            className="w-9 h-9 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition border border-slate-700/50"
            title="Reiniciar do começo"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Time Display */}
          <div className="font-mono text-sm tracking-wider text-slate-200 bg-slate-950/70 px-3 py-1.5 rounded-lg border border-slate-800">
            <span className="text-amber-400 font-semibold">{formatTime(currentTime)}</span>
            <span className="text-slate-600 mx-1.5">/</span>
            <span className="text-slate-400">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Speed, Volume, and Re-generate */}
        <div className="flex items-center gap-4">
          {/* Playback Speed Button */}
          <button
            onClick={cyclePlaybackRate}
            className="px-2.5 py-1 rounded-md text-xs font-mono font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
            title="Alterar velocidade de reprodução"
          >
            {playbackRate}x
          </button>

          {/* Volume Control */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleMute}
              className="text-slate-400 hover:text-slate-200 transition"
              title={isMuted ? 'Desmutar' : 'Mutar'}
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-4 h-4 text-rose-400" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-16 md:w-20 accent-amber-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              title="Ajustar volume"
            />
          </div>

          {onGenerateAgain && (
            <button
              onClick={onGenerateAgain}
              disabled={isGenerating}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-400 transition border border-slate-700/60 disabled:opacity-50"
              title="Gerar novamente"
            >
              <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin text-amber-400' : ''}`} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
