import React, { useEffect, useRef } from 'react';
import { GameEngine } from '../game/engine';
import { GAME_CONSTANTS } from '../game/constants';
import { soundManager } from '../audio/soundManager';

interface GameCanvasProps {
  engineRef: React.MutableRefObject<GameEngine | null>;
  onStateUpdate: () => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  engineRef,
  onStateUpdate,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set internal resolution of the canvas
    canvas.width = GAME_CONSTANTS.CANVAS_WIDTH;
    canvas.height = GAME_CONSTANTS.CANVAS_HEIGHT;

    // Instantiate game engine
    const engine = new GameEngine(canvas);
    engine.setOnStateChange(onStateUpdate);
    engineRef.current = engine;

    // Keyboard listeners: Left, Right, Shoot, Jump
    const handleKeyDown = (e: KeyboardEvent) => {
      soundManager.unlock();
      if (['ArrowLeft', 'KeyA'].includes(e.code)) {
        e.preventDefault();
        engine.setInput('left', true);
      } else if (['ArrowRight', 'KeyD'].includes(e.code)) {
        e.preventDefault();
        engine.setInput('right', true);
      } else if (['KeyX', 'KeyF', 'KeyZ', 'Enter'].includes(e.code)) {
        e.preventDefault();
        engine.setInput('shoot', true);
      } else if (['Space', 'ArrowUp', 'KeyW'].includes(e.code)) {
        e.preventDefault();
        // If at obstacle, space also shoots through or jumps
        engine.setInput('jump', true);
        engine.setInput('shoot', true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'KeyA'].includes(e.code)) {
        e.preventDefault();
        engine.setInput('left', false);
      } else if (['ArrowRight', 'KeyD'].includes(e.code)) {
        e.preventDefault();
        engine.setInput('right', false);
      } else if (['KeyX', 'KeyF', 'KeyZ', 'Enter'].includes(e.code)) {
        e.preventDefault();
        engine.setInput('shoot', false);
      } else if (['Space', 'ArrowUp', 'KeyW'].includes(e.code)) {
        e.preventDefault();
        engine.setInput('jump', false);
        engine.setInput('shoot', false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      engine.pause();
    };
  }, [engineRef, onStateUpdate]);

  // Click or touch anywhere on the canvas triggers jump
  const handlePointerDown = (e: React.PointerEvent) => {
    soundManager.unlock();
    // Only left click or touches
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    if (engineRef.current) {
      engineRef.current.setInput('jump', true);
    }
  };

  const handlePointerUp = () => {
    if (engineRef.current) {
      engineRef.current.setInput('jump', false);
    }
  };

  return (
    <div
      ref={containerRef}
      id="game-canvas-wrapper"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className="relative w-full h-full flex items-center justify-center overflow-hidden bg-slate-950 cursor-pointer select-none touch-none"
    >
      <canvas
        ref={canvasRef}
        id="game-canvas"
        className="w-full h-full max-h-[82vh] object-contain shadow-2xl block"
        tabIndex={0}
      />
    </div>
  );
};
