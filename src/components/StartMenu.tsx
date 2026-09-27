import React, { useState } from 'react';
import { Play, Settings, Sparkles, Heart, Zap, Volume2 } from 'lucide-react';
import { BIOMES, BIOME_SEQUENCE } from '../game/constants';
import { soundManager } from '../audio/soundManager';
import { PWAInstallButton } from './PWAInstallButton';

interface StartMenuProps {
  onStart: () => void;
  onOpenSettings: () => void;
  highScore: number;
}

export const StartMenu: React.FC<StartMenuProps> = ({
  onStart,
  onOpenSettings,
  highScore,
}) => {
  const [testSoundPlayed, setTestSoundPlayed] = useState(false);

  const handlePlayTestSound = () => {
    soundManager.unlock();
    soundManager.playTestSound();
    setTestSoundPlayed(true);
    setTimeout(() => setTestSoundPlayed(false), 2000);
  };

  const handleStart = () => {
    soundManager.unlock();
    onStart();
  };
  return (
    <div
      id="start-menu-screen"
      className="absolute inset-0 z-40 bg-gradient-to-b from-sky-600 via-indigo-900 to-slate-950 flex flex-col items-center justify-between p-4 sm:p-6 overflow-y-auto"
    >
      {/* BACKGROUND DECORATIONS */}
      <div className="absolute top-8 left-10 text-yellow-300 text-3xl animate-bounce-soft opacity-60 pointer-events-none">
        ⭐
      </div>
      <div className="absolute top-20 right-14 text-yellow-400 text-4xl animate-pulse-glow opacity-70 pointer-events-none">
        🪙
      </div>
      <div className="absolute bottom-24 left-16 text-cyan-300 text-3xl opacity-50 pointer-events-none">
        💎
      </div>

      {/* HEADER WITH BADGE */}
      <div className="w-full max-w-md flex flex-col items-center text-center mt-2 sm:mt-4 z-10">
        <div className="inline-flex items-center gap-2 bg-yellow-400/20 text-yellow-300 px-4 py-1 rounded-full border border-yellow-400/40 text-xs sm:text-sm font-black uppercase tracking-wider mb-2 shadow-sm">
          <Sparkles className="w-4 h-4 text-yellow-300" />
          <span>Feito Especialmente para o Gabriel</span>
        </div>

        <h1
          id="game-title"
          className="text-4xl sm:text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-200 to-orange-400 drop-shadow-md tracking-tight uppercase"
        >
          Aventura do Gabriel
        </h1>
        <p className="text-slate-300 text-sm sm:text-base font-semibold mt-1 max-w-sm">
          Jogo de aventura móvel: salte obstáculos, explore 5 biomas épicos e colete power-ups incríveis!
        </p>
      </div>

      {/* HERO CHARACTER VISUAL (Gabriel vector presentation matching reference image) */}
      <div className="relative my-2 sm:my-3 flex flex-col items-center z-10">
        {/* Floating Ring halo */}
        <div className="absolute -top-3 -right-3 w-16 h-16 rounded-full border-4 border-yellow-400/80 shadow-[0_0_15px_rgba(250,204,21,0.6)] animate-bounce-soft" />

        {/* Character Card */}
        <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-full bg-gradient-to-b from-sky-400 via-indigo-600 to-indigo-950 p-2 shadow-2xl border-4 border-amber-400 flex items-center justify-center relative overflow-hidden">
          {/* Stylized SVG of Gabriel */}
          <svg viewBox="0 0 200 200" className="w-full h-full">
            {/* Background Glow */}
            <circle cx="100" cy="100" r="90" fill="url(#heroGlow)" />
            <defs>
              <radialGradient id="heroGlow">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#1e1b4b" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Gabriel's Head & Hair */}
            {/* Neck */}
            <rect x="92" y="115" width="16" height="18" fill="#fcd34d" rx="4" />

            {/* Jacket Shoulders */}
            <path d="M 55 145 C 55 125, 145 125, 145 145 L 155 190 L 45 190 Z" fill="#18181b" />
            {/* Orange zipper */}
            <line x1="100" y1="130" x2="100" y2="190" stroke="#f97316" strokeWidth="4" />
            {/* Gold crown on jacket */}
            <path d="M 72 145 L 72 140 L 76 143 L 80 139 L 84 143 L 88 140 L 88 145 Z" fill="#facc15" />
            {/* Gold smile on jacket */}
            <circle cx="120" cy="150" r="6" stroke="#facc15" strokeWidth="2" fill="none" />

            {/* Face */}
            <ellipse cx="100" cy="85" rx="38" ry="38" fill="#fde047" />
            {/* Cheeks */}
            <circle cx="75" cy="94" r="8" fill="#f43f5e" opacity="0.4" />
            <circle cx="125" cy="94" r="8" fill="#f43f5e" opacity="0.4" />

            {/* Eyes */}
            <ellipse cx="82" cy="80" rx="9" ry="12" fill="#ffffff" />
            <ellipse cx="118" cy="80" rx="9" ry="12" fill="#ffffff" />
            <ellipse cx="84" cy="81" rx="6.5" ry="9" fill="#451a03" />
            <ellipse cx="120" cy="81" rx="6.5" ry="9" fill="#451a03" />
            {/* Pupils */}
            <circle cx="85" cy="81" r="4.5" fill="#0f172a" />
            <circle cx="121" cy="81" r="4.5" fill="#0f172a" />
            {/* Eye sparkle */}
            <circle cx="82" cy="78" r="2.8" fill="#ffffff" />
            <circle cx="118" cy="78" r="2.8" fill="#ffffff" />
            <circle cx="86" cy="83" r="1.5" fill="#ffffff" />
            <circle cx="122" cy="83" r="1.5" fill="#ffffff" />

            {/* Eyebrows */}
            <path d="M 72 68 Q 83 66 92 70" stroke="#18181b" strokeWidth="3.5" fill="none" strokeLinecap="round" />
            <path d="M 128 68 Q 117 66 108 70" stroke="#18181b" strokeWidth="3.5" fill="none" strokeLinecap="round" />

            {/* Cute smile */}
            <path d="M 88 98 Q 100 110 112 98" stroke="#991b1b" strokeWidth="3.5" fill="#ef4444" strokeLinecap="round" />

            {/* Black Swept Hair */}
            <path
              d="M 60 75 C 55 40, 145 40, 140 75 C 145 60, 130 35, 100 32 C 70 32, 55 60, 60 75 Z"
              fill="#18181b"
            />
            <path
              d="M 62 70 C 70 50, 95 48, 105 55 C 115 50, 135 55, 138 72 C 128 60, 110 58, 95 64 C 80 58, 68 62, 62 70 Z"
              fill="#18181b"
            />
            {/* Hair highlight */}
            <path d="M 80 44 Q 100 38 115 42" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" opacity="0.3" fill="none" />
          </svg>
        </div>

        {/* Gabriel badge */}
        <div className="bg-slate-900/90 text-amber-300 font-extrabold px-4 py-1 rounded-full border border-amber-400 text-xs sm:text-sm mt-2 shadow-lg flex items-center gap-1.5">
          <Heart className="w-3.5 h-3.5 fill-red-500 text-red-500" />
          <span>Gabriel, o Aventureiro!</span>
        </div>
      </div>

      {/* BIOMES PREVIEW CAROUSEL PILLS */}
      <div className="w-full max-w-md flex flex-wrap items-center justify-center gap-1.5 my-1 z-10">
        {BIOME_SEQUENCE.map((bKey) => {
          const b = BIOMES[bKey];
          return (
            <div
              key={bKey}
              className="flex items-center gap-1 bg-slate-900/80 px-2.5 py-1 rounded-xl border border-slate-700/80 text-[11px] font-bold text-slate-200"
            >
              <span>{b.icon}</span>
              <span>{b.name}</span>
            </div>
          );
        })}
      </div>

      {/* CONTROLS OVERVIEW TUTORIAL: 3 BOTÕES TOUCH */}
      <div className="w-full max-w-sm bg-slate-900/80 backdrop-blur-md rounded-2xl p-3 border border-slate-700/60 text-center mb-2 z-10 shadow-lg">
        <div className="flex items-center justify-center gap-1.5 text-xs text-amber-300 font-extrabold uppercase tracking-wide mb-1">
          <Zap className="w-3.5 h-3.5" />
          <span>Controles Touch na Tela</span>
        </div>
        <p className="text-xs text-slate-300">
          Use os 3 botões grandes: <strong className="text-sky-300">◀ ESQUERDA</strong>, <strong className="text-amber-300">💥 ATIRAR</strong> (destrói obstáculos e marca pontos!) e <strong className="text-emerald-300">DIREITA ▶</strong>. Toque na tela para pular!
        </p>
      </div>

      {/* ACTION BUTTONS & PWA INSTALL */}
      <div className="w-full max-w-sm flex flex-col gap-2 z-10">
        <button
          id="btn-start-play"
          type="button"
          onClick={handleStart}
          className="w-full h-15 bg-gradient-to-r from-emerald-400 via-green-500 to-emerald-600 hover:from-emerald-300 hover:to-emerald-500 active:scale-98 text-slate-950 font-black text-xl sm:text-2xl rounded-3xl shadow-xl shadow-green-950/50 border-b-4 border-green-800 flex items-center justify-center gap-3 transition-all cursor-pointer group"
        >
          <Play className="w-7 h-7 sm:w-8 sm:h-8 fill-slate-950 text-slate-950 group-hover:scale-110 transition-transform" />
          <span>JOGAR AGORA</span>
        </button>

        {/* PWA INSTALL PROMPT IN START MENU */}
        <PWAInstallButton />

        <div className="grid grid-cols-2 gap-2">
          <button
            id="btn-start-sound-test"
            type="button"
            onClick={handlePlayTestSound}
            className={`h-11 px-3 rounded-2xl border flex items-center justify-center gap-2 text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              testSoundPlayed
                ? 'bg-emerald-500 text-slate-950 border-emerald-400 scale-102'
                : 'bg-slate-800/90 hover:bg-slate-700/90 text-amber-300 border-amber-500/50'
            }`}
          >
            <Volume2 className="w-4 h-4" />
            <span>{testSoundPlayed ? 'Tocando Som! 🎵' : 'Testar Som 🔊'}</span>
          </button>

          <button
            id="btn-start-settings"
            type="button"
            onClick={onOpenSettings}
            className="h-11 px-3 bg-slate-800/90 hover:bg-slate-700/90 text-slate-200 font-bold text-xs sm:text-sm rounded-2xl border border-slate-600 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Settings className="w-4 h-4 text-slate-300" />
            <span>AJUSTES</span>
          </button>
        </div>

        {/* MOBILE AUDIO HELPER TIP */}
        <p className="text-[11px] text-slate-400 text-center leading-tight">
          💡 <span className="text-amber-300 font-semibold">Dica celular:</span> Se não ouvir som, certifique-se de que o aparelho não está no modo silencioso/vibracall e aumente o volume.
        </p>

        {highScore > 0 && (
          <div className="text-center text-xs text-amber-300 font-bold">
            🏆 Recorde Pessoal Salvo: {highScore}m
          </div>
        )}
      </div>
    </div>
  );
};

