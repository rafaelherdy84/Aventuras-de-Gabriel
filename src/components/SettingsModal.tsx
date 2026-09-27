import React, { useState } from 'react';
import { GameSettings } from '../types';
import { Volume2, VolumeX, Music, Heart, Zap, Sparkles, X, Smartphone } from 'lucide-react';
import { soundManager } from '../audio/soundManager';

interface SettingsModalProps {
  settings: GameSettings;
  onUpdateSettings: (newSettings: Partial<GameSettings>) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onUpdateSettings,
  onClose,
}) => {
  const [tested, setTested] = useState(false);

  const handleTestSound = () => {
    soundManager.unlock();
    soundManager.playTestSound();
    setTested(true);
    setTimeout(() => setTested(false), 2000);
  };
  return (
    <div
      id="settings-modal-overlay"
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
    >
      <div
        id="settings-dialog-card"
        className="bg-slate-900 border-2 border-amber-400/60 rounded-3xl w-full max-w-md p-6 shadow-2xl text-white relative overflow-hidden"
      >
        {/* CLOSE BUTTON */}
        <button
          id="btn-close-settings"
          type="button"
          onClick={onClose}
          aria-label="Fechar configurações"
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* HEADER */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-400/40">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-amber-300">Configurações</h2>
            <p className="text-xs text-slate-300">Personalize o jogo para a melhor experiência!</p>
          </div>
        </div>

        {/* OPTIONS LIST */}
        <div className="space-y-4">
          {/* 1. MODO GABRIEL (ACESSIBILIDADE MÁXIMA) */}
          <div className="bg-gradient-to-r from-emerald-950/70 to-slate-800/80 border border-emerald-500/40 rounded-2xl p-4 flex items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 mt-0.5">
                <Heart className="w-5 h-5 fill-emerald-400 text-emerald-400" />
              </div>
              <div>
                <div className="font-extrabold text-sm text-emerald-300 flex items-center gap-1.5">
                  <span>Modo Gabriel (Acessível)</span>
                  <span className="text-[10px] bg-emerald-500 text-slate-950 px-2 py-0.5 rounded-full font-black uppercase">
                    Recomendado
                  </span>
                </div>
                <div className="text-xs text-slate-300 mt-0.5">
                  Velocidade suave, tempo extra para pular, sem Game Over e ajuda visual no obstáculo.
                </div>
              </div>
            </div>

            <button
              id="toggle-modo-gabriel"
              type="button"
              onClick={() => onUpdateSettings({ modoGabriel: !settings.modoGabriel })}
              className={`w-14 h-8 rounded-full p-1 transition-colors cursor-pointer flex items-center ${
                settings.modoGabriel ? 'bg-emerald-500 justify-end' : 'bg-slate-700 justify-start'
              }`}
            >
              <div className="w-6 h-6 rounded-full bg-white shadow-md transform transition-transform" />
            </button>
          </div>

          {/* 2. EFEITOS DE SOM */}
          <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-sky-500/20 text-sky-400">
                {settings.soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </div>
              <div>
                <div className="font-bold text-sm text-slate-200">Efeitos Sonoros (Sons)</div>
                <div className="text-xs text-slate-400">Pulos, moedas, fanfarras e aterrissagens</div>
              </div>
            </div>

            <button
              id="toggle-sound-fx"
              type="button"
              onClick={() => onUpdateSettings({ soundEnabled: !settings.soundEnabled })}
              className={`w-14 h-8 rounded-full p-1 transition-colors cursor-pointer flex items-center ${
                settings.soundEnabled ? 'bg-sky-500 justify-end' : 'bg-slate-700 justify-start'
              }`}
            >
              <div className="w-6 h-6 rounded-full bg-white shadow-md transform transition-transform" />
            </button>
          </div>

          {/* 3. MÚSICA DE FUNDO */}
          <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                <Music className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-sm text-slate-200">Música de Fundo</div>
                <div className="text-xs text-slate-400">Melodia alegre e relaxante de aventura</div>
              </div>
            </div>

            <button
              id="toggle-music"
              type="button"
              onClick={() => onUpdateSettings({ musicEnabled: !settings.musicEnabled })}
              className={`w-14 h-8 rounded-full p-1 transition-colors cursor-pointer flex items-center ${
                settings.musicEnabled ? 'bg-amber-500 justify-end' : 'bg-slate-700 justify-start'
              }`}
            >
              <div className="w-6 h-6 rounded-full bg-white shadow-md transform transition-transform" />
            </button>
          </div>

          {/* BOTÃO TESTAR SOM */}
          <div className="flex items-center justify-between gap-3 bg-slate-800/40 border border-slate-700/80 rounded-2xl p-3">
            <div className="text-xs text-slate-300">
              Quer verificar se o áudio está funcionando no seu aparelho?
            </div>
            <button
              id="btn-test-sound-modal"
              type="button"
              onClick={handleTestSound}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                tested
                  ? 'bg-emerald-500 text-slate-950 font-black'
                  : 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold'
              }`}
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>{tested ? 'Tocando Som! ✨' : 'Testar Som 🔊'}</span>
            </button>
          </div>

          {/* MOBILE AUDIO HELPER NOTICE */}
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3 flex items-start gap-2.5">
            <Smartphone className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-[11px] text-slate-300 leading-snug">
              <strong className="text-amber-300">Atenção no Celular / iPhone:</strong> Se nenhum som for reproduzido, confira se o aparelho não está com a chavinha física de silêncio ativada, desative o modo "Não Perturbe" e aumente o volume de mídia pelas teclas laterais.
            </div>
          </div>

          {/* 4. VELOCIDADE DA CORRIDA */}
          <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-3.5">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-orange-400" />
              <span className="font-bold text-sm text-slate-200">Ritmo da Corrida:</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                id="btn-speed-soft"
                type="button"
                onClick={() => onUpdateSettings({ baseSpeed: 1 })}
                className={`py-2 px-1 rounded-xl text-xs font-black cursor-pointer transition-all ${
                  settings.baseSpeed === 1
                    ? 'bg-emerald-500 text-slate-950 ring-2 ring-emerald-300'
                    : 'bg-slate-700/80 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Suave (Calmo)
              </button>
              <button
                id="btn-speed-normal"
                type="button"
                onClick={() => onUpdateSettings({ baseSpeed: 2 })}
                className={`py-2 px-1 rounded-xl text-xs font-black cursor-pointer transition-all ${
                  settings.baseSpeed === 2
                    ? 'bg-sky-500 text-slate-950 ring-2 ring-sky-300'
                    : 'bg-slate-700/80 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Normal
              </button>
              <button
                id="btn-speed-fast"
                type="button"
                onClick={() => onUpdateSettings({ baseSpeed: 3 })}
                className={`py-2 px-1 rounded-xl text-xs font-black cursor-pointer transition-all ${
                  settings.baseSpeed === 3
                    ? 'bg-orange-500 text-white ring-2 ring-orange-300'
                    : 'bg-slate-700/80 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Rápido
              </button>
            </div>
          </div>
        </div>

        {/* FOOTER CONFIRM BUTTON */}
        <div className="mt-6">
          <button
            id="btn-save-settings"
            type="button"
            onClick={onClose}
            className="w-full h-12 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-black rounded-2xl text-base shadow-lg cursor-pointer active:scale-98 transition-all"
          >
            Pronto! Salvar Configurações
          </button>
        </div>
      </div>
    </div>
  );
};
