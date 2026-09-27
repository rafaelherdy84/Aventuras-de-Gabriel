import React from 'react';
import { ArrowLeft, ArrowRight, Zap, Sparkles } from 'lucide-react';
import { soundManager } from '../audio/soundManager';
import { InputType } from '../types';

interface VirtualControlsProps {
  onInput: (input: InputType, isDown: boolean) => void;
  isWaitingAtObstacle: boolean;
  biomeAccentColor?: string;
}

export const VirtualControls: React.FC<VirtualControlsProps> = ({
  onInput,
  isWaitingAtObstacle,
}) => {
  const createPointerHandlers = (input: InputType) => {
    return {
      onPointerDown: (e: React.PointerEvent) => {
        e.preventDefault();
        soundManager.unlock();
        try {
          (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        } catch {}
        onInput(input, true);
      },
      onPointerUp: (e: React.PointerEvent) => {
        e.preventDefault();
        try {
          (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
        } catch {}
        onInput(input, false);
      },
      onPointerCancel: (e: React.PointerEvent) => {
        e.preventDefault();
        onInput(input, false);
      },
      onContextMenu: (e: React.MouseEvent) => {
        e.preventDefault();
      },
    };
  };

  return (
    <div
      id="virtual-controls-container"
      className="w-full max-w-2xl mx-auto px-2 py-2 flex flex-col items-center justify-center select-none touch-none z-30"
      style={{ touchAction: 'none' }}
    >
      {/* 3 LARGE TOUCH BUTTONS: ESQUERDA, ATIRAR, DIREITA */}
      <div className="w-full grid grid-cols-3 gap-2 sm:gap-3 items-stretch">
        {/* 1. BOTAO ESQUERDA */}
        <button
          id="btn-control-left"
          type="button"
          aria-label="Mover para a Esquerda"
          {...createPointerHandlers('left')}
          className="h-18 sm:h-22 rounded-2xl sm:rounded-3xl border-b-6 border-sky-900 active:border-b-0 active:translate-y-1.5 transition-all flex flex-col items-center justify-center px-2 cursor-pointer relative overflow-hidden group shadow-xl bg-gradient-to-b from-sky-500 to-blue-700 text-white hover:brightness-110 active:brightness-90 select-none touch-none"
        >
          <div className="absolute inset-0 bg-white/10 opacity-0 group-active:opacity-100 transition-opacity pointer-events-none" />
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-white/20 flex items-center justify-center mb-0.5 shadow-inner">
            <ArrowLeft className="w-6 h-6 sm:w-8 sm:h-8 stroke-[3]" />
          </div>
          <span className="text-[12px] sm:text-sm font-black uppercase tracking-wider text-sky-100">
            ESQUERDA
          </span>
        </button>

        {/* 2. BOTAO ATIRAR (AÇÃO / DISPARO) */}
        <button
          id="btn-control-shoot"
          type="button"
          aria-label="Atirar / Disparar e Destruir Obstáculos"
          {...createPointerHandlers('shoot')}
          className={`h-18 sm:h-22 rounded-2xl sm:rounded-3xl border-b-6 active:border-b-0 active:translate-y-1.5 transition-all flex flex-col items-center justify-center px-2 cursor-pointer relative overflow-hidden group shadow-2xl select-none touch-none ${
            isWaitingAtObstacle
              ? 'bg-gradient-to-b from-amber-400 via-orange-500 to-red-600 border-red-950 text-white ring-4 ring-yellow-300 animate-pulse'
              : 'bg-gradient-to-b from-amber-500 via-orange-500 to-rose-600 border-amber-950 text-white hover:brightness-110 active:brightness-90'
          }`}
        >
          <div className="absolute inset-0 bg-white/15 opacity-0 group-active:opacity-100 transition-opacity pointer-events-none" />
          <div
            className={`w-9 h-9 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center mb-0.5 shadow-inner ${
              isWaitingAtObstacle ? 'bg-yellow-300 text-slate-950 animate-bounce' : 'bg-white/25 text-yellow-200'
            }`}
          >
            {isWaitingAtObstacle ? (
              <Zap className="w-6 h-6 sm:w-7 sm:h-7 stroke-[3] fill-current" />
            ) : (
              <Sparkles className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2.5]" />
            )}
          </div>
          <span className="text-[12px] sm:text-base font-black uppercase tracking-wider text-white drop-shadow">
            {isWaitingAtObstacle ? 'DESTRUIR!' : 'ATIRAR'}
          </span>
        </button>

        {/* 3. BOTAO DIREITA */}
        <button
          id="btn-control-right"
          type="button"
          aria-label="Mover para a Direita"
          {...createPointerHandlers('right')}
          className="h-18 sm:h-22 rounded-2xl sm:rounded-3xl border-b-6 border-emerald-950 active:border-b-0 active:translate-y-1.5 transition-all flex flex-col items-center justify-center px-2 cursor-pointer relative overflow-hidden group shadow-xl bg-gradient-to-b from-emerald-500 to-teal-700 text-white hover:brightness-110 active:brightness-90 select-none touch-none"
        >
          <div className="absolute inset-0 bg-white/10 opacity-0 group-active:opacity-100 transition-opacity pointer-events-none" />
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-white/20 flex items-center justify-center mb-0.5 shadow-inner">
            <ArrowRight className="w-6 h-6 sm:w-8 sm:h-8 stroke-[3]" />
          </div>
          <span className="text-[12px] sm:text-sm font-black uppercase tracking-wider text-emerald-100">
            DIREITA
          </span>
        </button>
      </div>

      {/* DICA DE ACESSIBILIDADE E TOQUE NA TELA */}
      <div className="w-full flex items-center justify-between text-[11px] text-slate-400 font-semibold mt-1 px-1">
        <span className="flex items-center gap-1">
          💡 <span className="text-slate-300">Toque no jogo</span> para pular
        </span>
        <span className="text-slate-500 hidden sm:inline">
          Teclado: <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">←</kbd> <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">Espaço</kbd> <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">→</kbd>
        </span>
      </div>
    </div>
  );
};

