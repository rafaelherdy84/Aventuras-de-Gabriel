import { useCallback, useEffect, useRef, useState } from 'react';
import { soundManager } from './audio/soundManager';
import { GameCanvas } from './components/GameCanvas';
import { GameHUD } from './components/GameHUD';
import { SettingsModal } from './components/SettingsModal';
import { StartMenu } from './components/StartMenu';
import { VirtualControls } from './components/VirtualControls';
import { OfflineIndicator } from './components/OfflineIndicator';
import { BIOMES, BIOME_SEQUENCE, DISTANCE_PER_BIOME } from './game/constants';
import { GameEngine } from './game/engine';
import { CelebrationMessage, GameProgress, GameScreen, GameSettings, InputType } from './types';

const SETTINGS_STORAGE_KEY = 'aventura_gabriel_settings_v1';
const PROGRESS_STORAGE_KEY = 'aventura_gabriel_progress_v1';

export default function App() {
  const [screen, setScreen] = useState<GameScreen>('MENU');
  const [isPaused, setIsPaused] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Load saved high score from localStorage
  const loadSavedProgress = (): { highestDistance: number; coins: number; gems: number } => {
    try {
      const saved = localStorage.getItem(PROGRESS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          highestDistance: parsed.highestDistance || 0,
          coins: parsed.coins || 0,
          gems: parsed.gems || 0,
        };
      }
    } catch {}
    return { highestDistance: 0, coins: 0, gems: 0 };
  };

  // Load saved settings from localStorage
  const loadSavedSettings = (): GameSettings => {
    const defaults: GameSettings = {
      soundEnabled: true,
      musicEnabled: true,
      modoGabriel: true,
      jumpHints: 'when_stopped',
      baseSpeed: 1,
    };
    try {
      const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (saved) {
        return { ...defaults, ...JSON.parse(saved) };
      }
    } catch {}
    return defaults;
  };

  const initialSaved = loadSavedProgress();

  // Synced states from engine for React UI
  const [isWaitingAtObstacle, setIsWaitingAtObstacle] = useState(false);
  const [progress, setProgress] = useState<GameProgress>({
    distance: 0,
    score: 0,
    coins: initialSaved.coins,
    gems: initialSaved.gems,
    rings: 0,
    stars: 0,
    crystals: 0,
    obstaclesCleared: 0,
    streak: 0,
    highestDistance: initialSaved.highestDistance,
    currentBiome: 'FLORESTA_ENSOLARADA',
    activePowerUps: {},
  });
  const [celebrations, setCelebrations] = useState<CelebrationMessage[]>([]);
  const [settings, setSettings] = useState<GameSettings>(loadSavedSettings());

  const engineRef = useRef<GameEngine | null>(null);

  // Sync engine state to React periodically or on change and persist local high scores
  const handleEngineStateUpdate = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;

    setIsWaitingAtObstacle(engine.isWaitingAtObstacle);
    
    // Update local storage if new highest distance reached
    if (engine.progress.distance > engine.progress.highestDistance) {
      engine.progress.highestDistance = engine.progress.distance;
    }

    try {
      localStorage.setItem(
        PROGRESS_STORAGE_KEY,
        JSON.stringify({
          highestDistance: Math.max(engine.progress.highestDistance, initialSaved.highestDistance),
          coins: engine.progress.coins,
          gems: engine.progress.gems,
        })
      );
    } catch {}

    setProgress({ ...engine.progress });
    setCelebrations([...engine.celebrations]);
  }, [initialSaved.highestDistance]);

  // Sync settings whenever updated & persist to localStorage
  const handleUpdateSettings = (newSettings: Partial<GameSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      try {
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(updated));
      } catch {}

      if (engineRef.current) {
        engineRef.current.settings = updated;
      }
      if (newSettings.soundEnabled !== undefined) {
        soundManager.setSoundEnabled(newSettings.soundEnabled);
      }
      if (newSettings.musicEnabled !== undefined) {
        soundManager.setMusicEnabled(newSettings.musicEnabled);
      }
      return updated;
    });
  };

  const handleStartGame = () => {
    soundManager.unlock();
    if (settings.musicEnabled) {
      soundManager.startBGM();
    }
    if (engineRef.current) {
      engineRef.current.settings = settings;
      engineRef.current.progress.highestDistance = Math.max(progress.highestDistance, initialSaved.highestDistance);
      engineRef.current.resetGame();
      engineRef.current.start();
    }
    setScreen('PLAYING');
    setIsPaused(false);
  };

  const handleTogglePause = () => {
    if (!engineRef.current) return;
    if (isPaused) {
      engineRef.current.resume();
      setIsPaused(false);
    } else {
      engineRef.current.pause();
      setIsPaused(true);
    }
  };

  const handleToggleSound = () => {
    handleUpdateSettings({ soundEnabled: !settings.soundEnabled });
  };

  const handleToggleMusic = () => {
    handleUpdateSettings({ musicEnabled: !settings.musicEnabled });
  };

  // Prevent accidental zoom and page bounce scrolling on mobile devices
  useEffect(() => {
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 1) {
        e.preventDefault(); // Prevent pinch zoom
      }
    };

    const handleGestureStart = (e: Event) => {
      e.preventDefault(); // Prevent iOS gesture zooming
    };

    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('gesturestart', handleGestureStart, { passive: false });

    return () => {
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('gesturestart', handleGestureStart);
    };
  }, []);

  // Global mobile audio unlock listeners and lifecycle management
  useEffect(() => {
    const handleGlobalUserGesture = () => {
      soundManager.unlock();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        soundManager.resumeIfSuspended();
      }
    };

    window.addEventListener('touchstart', handleGlobalUserGesture, { capture: true, passive: true });
    window.addEventListener('touchend', handleGlobalUserGesture, { capture: true, passive: true });
    window.addEventListener('pointerdown', handleGlobalUserGesture, { capture: true, passive: true });
    window.addEventListener('click', handleGlobalUserGesture, { capture: true });
    window.addEventListener('keydown', handleGlobalUserGesture, { capture: true });
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('touchstart', handleGlobalUserGesture, { capture: true });
      window.removeEventListener('touchend', handleGlobalUserGesture, { capture: true });
      window.removeEventListener('pointerdown', handleGlobalUserGesture, { capture: true });
      window.removeEventListener('click', handleGlobalUserGesture, { capture: true });
      window.removeEventListener('keydown', handleGlobalUserGesture, { capture: true });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const handleVirtualInput = (input: InputType, isDown: boolean) => {
    soundManager.unlock();
    if (engineRef.current) {
      engineRef.current.setInput(input, isDown);
    }
  };

  // Compute active biome display name based on distance
  const currentBiomeIndex = Math.floor(progress.distance / DISTANCE_PER_BIOME);
  const currentBiomeType = BIOME_SEQUENCE[currentBiomeIndex % BIOME_SEQUENCE.length];
  const biomeName = BIOMES[currentBiomeType]?.name || 'Floresta Ensolarada';

  // Keyboard shortcut to pause with Esc or P
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (screen === 'PLAYING') {
        if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
          handleTogglePause();
        }
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [screen, isPaused]);

  return (
    <main
      id="game-root-viewport"
      className="relative w-screen h-screen h-[100dvh] overflow-hidden flex flex-col justify-between bg-slate-950 font-sans select-none touch-none overscroll-none"
      style={{ touchAction: 'none' }}
    >
      {/* OFFLINE STATUS NOTIFICATION */}
      <OfflineIndicator />

      {/* CANVAS RENDERING AREA */}
      <div className="relative flex-1 w-full h-full min-h-0 flex items-center justify-center overflow-hidden touch-none select-none">
        <GameCanvas
          engineRef={engineRef}
          onStateUpdate={handleEngineStateUpdate}
        />

        {/* IN-GAME HUD OVERLAY (when playing) */}
        {screen === 'PLAYING' && (
          <GameHUD
            progress={progress}
            settings={settings}
            isPaused={isPaused}
            biomeName={biomeName}
            celebrations={celebrations}
            onToggleSound={handleToggleSound}
            onToggleMusic={handleToggleMusic}
            onTogglePause={handleTogglePause}
            onOpenSettings={() => setShowSettings(true)}
          />
        )}
      </div>

      {/* BOTTOM CONTROLS: THE 3 LARGE MOBILE CONTROLS (ESQUERDA, ATIRAR, DIREITA) */}
      {screen === 'PLAYING' && (
        <div className="w-full bg-slate-950/95 border-t border-slate-800/80 backdrop-blur-md pb-safe select-none touch-none">
          <VirtualControls
            onInput={handleVirtualInput}
            isWaitingAtObstacle={isWaitingAtObstacle}
          />
        </div>
      )}

      {/* START SCREEN MENU */}
      {screen === 'MENU' && (
        <StartMenu
          onStart={handleStartGame}
          onOpenSettings={() => setShowSettings(true)}
          highScore={progress.highestDistance}
        />
      )}

      {/* SETTINGS MODAL */}
      {showSettings && (
        <SettingsModal
          settings={settings}
          onUpdateSettings={handleUpdateSettings}
          onClose={() => setShowSettings(false)}
        />
      )}
    </main>
  );
}

