import React from 'react';
import { Award, Gem, MapPin, Music, Pause, Play, Settings, Sparkles, Volume2, VolumeX } from 'lucide-react';
import { BIOMES, POWERUP_CONFIG } from '../game/constants';
import { CelebrationMessage, GameProgress, GameSettings, PowerUpType } from '../types';

interface GameHUDProps {
  progress: GameProgress;
  settings: GameSettings;
  isPaused: boolean;
  biomeName: string;
  celebrations: CelebrationMessage[];
  onToggleSound: () => void;
  onToggleMusic: () => void;
  onTogglePause: () => void;
  onOpenSettings: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  progress,
  settings,
  isPaused,
  biomeName,
  celebrations,
  onToggleSound,
  onToggleMusic,
  onTogglePause,
  onOpenSettings,
}) => {
  const currentBiomeConfig = BIOMES[progress.currentBiome || 'FLORESTA_ENSOLARADA'];
  const activePowerUpKeys = (Object.keys(progress.activePowerUps || {}) as PowerUpType[]).filter(
    (key) => progress.activePowerUps[key] && (progress.activePowerUps[key]?.remainingSeconds || 0) > 0
  );

  return (
    <div id="game-hud-overlay" className="absolute inset-0 pointer-events-none z-20 flex flex-col justify-between p-3 sm:p-4">
      {/* TOP HEADER STATUS BAR */}
      <div className="flex items-start justify-between gap-2 sm:gap-4 w-full">
        {/* LEFT STATS: Distância, Pontos, Moedas, Gemas */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 pointer-events-auto">
          {/* Distância */}
          <div
            id="hud-stat-distance"
            className="flex items-center gap-2 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-2xl border border-sky-400/30 shadow-lg text-white"
          >
            <div className="p-1 rounded-lg bg-sky-500/25 text-sky-400">
              <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
            <div>
              <div className="text-[9px] sm:text-[10px] text-sky-300 uppercase font-bold tracking-wider">
                Distância
              </div>
              <div className="text-sm sm:text-base font-black leading-none text-sky-100">
                {progress.distance}m
              </div>
            </div>
          </div>

          {/* Pontos */}
          <div
            id="hud-stat-score"
            className="flex items-center gap-2 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-2xl border border-yellow-400/30 shadow-lg text-white"
          >
            <div className="p-1 rounded-lg bg-yellow-500/25 text-yellow-400">
              <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
            <div>
              <div className="text-[9px] sm:text-[10px] text-yellow-300 uppercase font-bold tracking-wider">
                Pontos
              </div>
              <div className="text-sm sm:text-base font-black leading-none text-yellow-100">
                {progress.score}
              </div>
            </div>
          </div>

          {/* Moedas */}
          <div
            id="hud-stat-coins"
            className="flex items-center gap-2 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-2xl border border-amber-400/30 shadow-lg text-white"
          >
            <span className="text-base sm:text-lg">🪙</span>
            <div>
              <div className="text-[9px] sm:text-[10px] text-amber-300 uppercase font-bold tracking-wider">
                Moedas
              </div>
              <div className="text-sm sm:text-base font-black leading-none text-amber-100">
                {progress.coins || 0}
              </div>
            </div>
          </div>

          {/* Gemas */}
          <div
            id="hud-stat-gems"
            className="hidden xs:flex items-center gap-2 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-2xl border border-cyan-400/30 shadow-lg text-white"
          >
            <div className="p-1 rounded-lg bg-cyan-500/25 text-cyan-400">
              <Gem className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
            <div>
              <div className="text-[9px] sm:text-[10px] text-cyan-300 uppercase font-bold tracking-wider">
                Gemas
              </div>
              <div className="text-sm sm:text-base font-black leading-none text-cyan-100">
                {progress.gems || 0}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT CONTROLS: Biome badge & Sound / Pause buttons */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Biome Name Tag */}
          <div
            id="hud-biome-badge"
            className="hidden md:flex items-center gap-2 bg-slate-900/90 backdrop-blur-md px-3.5 py-1.5 rounded-2xl border shadow-lg text-white font-bold text-xs"
            style={{ borderColor: `${currentBiomeConfig?.accentColor || '#38bdf8'}40` }}
          >
            <span className="text-sm">{currentBiomeConfig?.icon || '🌲'}</span>
            <div className="flex flex-col text-left">
              <span className="text-[9px] uppercase tracking-wider text-slate-400">Bioma</span>
              <span className="text-xs font-black text-white">{biomeName}</span>
            </div>
          </div>

          {/* Sound FX Toggle */}
          <button
            id="btn-hud-sound"
            type="button"
            onClick={onToggleSound}
            aria-label={settings.soundEnabled ? 'Desativar som' : 'Ativar som'}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-slate-900/80 backdrop-blur-md border border-slate-700 hover:border-slate-500 flex items-center justify-center text-slate-200 hover:text-white transition-colors cursor-pointer shadow-md"
          >
            {settings.soundEnabled ? <Volume2 className="w-4 h-4 sm:w-5 sm:h-5 text-sky-400" /> : <VolumeX className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />}
          </button>

          {/* Music Toggle */}
          <button
            id="btn-hud-music"
            type="button"
            onClick={onToggleMusic}
            aria-label={settings.musicEnabled ? 'Desativar música' : 'Ativar música'}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-slate-900/80 backdrop-blur-md border border-slate-700 hover:border-slate-500 flex items-center justify-center text-slate-200 hover:text-white transition-colors cursor-pointer shadow-md"
          >
            <Music className={`w-4 h-4 sm:w-5 sm:h-5 ${settings.musicEnabled ? 'text-amber-400' : 'text-slate-400'}`} />
          </button>

          {/* Pause Toggle */}
          <button
            id="btn-hud-pause"
            type="button"
            onClick={onTogglePause}
            aria-label={isPaused ? 'Continuar jogo' : 'Pausar jogo'}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-slate-900/80 backdrop-blur-md border border-slate-700 hover:border-slate-500 flex items-center justify-center text-slate-200 hover:text-white transition-colors cursor-pointer shadow-md"
          >
            {isPaused ? <Play className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" /> : <Pause className="w-4 h-4 sm:w-5 sm:h-5 text-slate-200" />}
          </button>

          {/* Settings Button */}
          <button
            id="btn-hud-settings"
            type="button"
            onClick={onOpenSettings}
            aria-label="Abrir configurações"
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-slate-900/80 backdrop-blur-md border border-slate-700 hover:border-slate-500 flex items-center justify-center text-slate-200 hover:text-white transition-colors cursor-pointer shadow-md"
          >
            <Settings className="w-4 h-4 sm:w-5 sm:h-5 text-slate-300" />
          </button>
        </div>
      </div>

      {/* ACTIVE POWER-UPS BAR */}
      {activePowerUpKeys.length > 0 && (
        <div
          id="active-powerups-hud"
          className="self-start flex flex-wrap gap-2 mt-2 pointer-events-none"
        >
          {activePowerUpKeys.map((type) => {
            const powerUp = progress.activePowerUps[type];
            const cfg = POWERUP_CONFIG[type];
            if (!powerUp || !cfg) return null;
            const progressPct = Math.max(0, Math.min(100, (powerUp.remainingSeconds / powerUp.totalSeconds) * 100));

            return (
              <div
                key={type}
                className="flex items-center gap-2 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-2xl border shadow-xl animate-fade-in"
                style={{ borderColor: `${cfg.color}70` }}
              >
                <span className="text-lg">{cfg.icon}</span>
                <div className="flex flex-col">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-black uppercase tracking-wider text-white">
                      {cfg.name}
                    </span>
                    <span className="text-[10px] font-bold text-slate-300">
                      {Math.ceil(powerUp.remainingSeconds)}s
                    </span>
                  </div>
                  {/* Progress bar countdown */}
                  <div className="w-20 sm:w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden mt-0.5">
                    <div
                      className="h-full rounded-full transition-all duration-100 ease-linear"
                      style={{
                        width: `${progressPct}%`,
                        backgroundColor: cfg.color,
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CELEBRATION TOASTS FLOATING IN UPPER RIGHT */}
      <div id="celebrations-container" className="self-end flex flex-col gap-2 mt-2 pointer-events-none">
        {celebrations.map((c) => (
          <div
            key={c.id}
            className="bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black px-4 py-2 rounded-2xl shadow-xl flex items-center gap-2.5 animate-bounce-soft border-2 border-yellow-200"
          >
            <span className="text-xl">{c.icon || '🎉'}</span>
            <div>
              <div className="text-sm font-black leading-tight">{c.text}</div>
              {c.subtext && <div className="text-[11px] font-bold opacity-85 leading-tight">{c.subtext}</div>}
            </div>
          </div>
        ))}
      </div>

      {/* PAUSED BANNER OVERLAY */}
      {isPaused && (
        <div id="pause-banner" className="self-center bg-slate-950/90 backdrop-blur-md px-8 py-6 rounded-3xl border-2 border-amber-400 text-center pointer-events-auto shadow-2xl">
          <h2 className="text-2xl font-black text-amber-300 mb-1">Jogo Pausado ⏸️</h2>
          <p className="text-sm text-slate-300 mb-4">Aperte Continuar para seguir a corrida com o Gabriel!</p>
          <button
            id="btn-resume-game"
            type="button"
            onClick={onTogglePause}
            className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold rounded-2xl shadow-lg hover:brightness-110 active:scale-95 transition-all cursor-pointer"
          >
            ▶ Continuar Aventura
          </button>
        </div>
      )}
    </div>
  );
};
