/**
 * Sound synthesizer using HTML5 Web Audio API.
 * 100% self-contained, no external mp3 assets required.
 * Fully optimized for mobile browsers (iOS Safari, Android Chrome, Samsung Internet).
 */

class SoundManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private isSoundEnabled = true;
  private isMusicEnabled = true;
  private bgmTimer: number | null = null;
  private bgmCurrentStep = 0;
  private isPlayingBgm = false;
  private isUnlocked = false;

  constructor() {
    // AudioContext will be initialized on first user interaction
  }

  /**
   * Initializes AudioContext and audio processing chain.
   */
  private initContext(): AudioContext | null {
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        try {
          this.ctx = new AudioCtx();
        } catch (err) {
          console.warn('Could not initialize AudioContext:', err);
        }
      }
    }

    if (this.ctx) {
      // Create master gain and dynamics compressor for crisp, loud mobile speaker output
      if (!this.masterGain) {
        try {
          this.masterGain = this.ctx.createGain();
          this.masterGain.gain.setValueAtTime(1.0, this.ctx.currentTime);
        } catch {}
      }

      if (!this.compressor) {
        try {
          this.compressor = this.ctx.createDynamicsCompressor();
          this.compressor.threshold.setValueAtTime(-16, this.ctx.currentTime);
          this.compressor.knee.setValueAtTime(24, this.ctx.currentTime);
          this.compressor.ratio.setValueAtTime(4.5, this.ctx.currentTime);
          this.compressor.attack.setValueAtTime(0.003, this.ctx.currentTime);
          this.compressor.release.setValueAtTime(0.12, this.ctx.currentTime);

          if (this.masterGain) {
            this.masterGain.connect(this.compressor);
            this.compressor.connect(this.ctx.destination);
          }
        } catch {}
      }

      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
    }

    return this.ctx;
  }

  /**
   * Complete mobile audio unlock routine:
   * 1. Uses navigator.audioSession (iOS Safari 16.4+) to bypass silent switch.
   * 2. Plays a silent HTML5 audio tag (forces iOS media audio channel playback).
   * 3. Resumes AudioContext if suspended.
   * 4. Plays a 1-sample silent buffer on Web Audio destination.
   */
  public async unlock(): Promise<boolean> {
    // 1. Try modern navigator.audioSession API for iOS Safari to bypass physical mute switch
    if ('audioSession' in navigator && (navigator as unknown as { audioSession?: { type: string } }).audioSession) {
      try {
        (navigator as unknown as { audioSession: { type: string } }).audioSession.type = 'playback';
      } catch {}
    }

    // 2. Play a tiny silent HTML5 audio element (switches iOS audio session to media playback channel)
    try {
      const silentAudio = document.createElement('audio');
      silentAudio.setAttribute('x-webkit-airplay', 'deny');
      silentAudio.preload = 'auto';
      silentAudio.src =
        'data:audio/mp3;base64,//OExAAAAANIAAAAAExBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV';
      silentAudio.volume = 0.05;
      const playPromise = silentAudio.play();
      if (playPromise) {
        playPromise.catch(() => {});
      }
    } catch {}

    // 3. Initialize Web Audio Context
    const ctx = this.initContext();
    if (!ctx) return false;

    // 4. Resume context if suspended
    if (ctx.state === 'suspended') {
      try {
        await ctx.resume();
      } catch {}
    }

    // 5. Play silent 1-sample Web Audio buffer source node
    try {
      const buffer = ctx.createBuffer(1, 1, 22050);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start(0);
    } catch {}

    this.isUnlocked = true;

    // Resume BGM if it was set to playing but waiting for unlock
    if (this.isMusicEnabled && this.isPlayingBgm && !this.bgmTimer) {
      this.startBGM();
    }

    return true;
  }

  /**
   * Resumes audio if suspended (useful on visibilitychange when returning to tab).
   */
  public resumeIfSuspended() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx
        .resume()
        .then(() => {
          if (this.isMusicEnabled && this.isPlayingBgm && !this.bgmTimer) {
            this.startBGM();
          }
        })
        .catch(() => {});
    }
  }

  private getDestinationNode(): AudioNode | null {
    if (!this.ctx) return null;
    return this.masterGain || this.ctx.destination;
  }

  public setSoundEnabled(enabled: boolean) {
    this.isSoundEnabled = enabled;
  }

  public setMusicEnabled(enabled: boolean) {
    this.isMusicEnabled = enabled;
    if (!enabled) {
      this.stopBGM();
    } else {
      this.startBGM();
    }
  }

  public isAudioActive(): boolean {
    return !!(this.ctx && this.ctx.state === 'running');
  }

  // --- SOUND EFFECTS ---

  public playShoot() {
    if (!this.isSoundEnabled) return;
    this.initContext();
    if (!this.ctx) return;
    const dest = this.getDestinationNode();
    if (!dest) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      const now = this.ctx.currentTime;

      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(220, now + 0.12);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.14);

      osc.connect(gain);
      gain.connect(dest);

      osc.start(now);
      osc.stop(now + 0.15);
    } catch {
      // Audio fallback
    }
  }

  public playJump() {
    if (!this.isSoundEnabled) return;
    this.initContext();
    if (!this.ctx) return;
    const dest = this.getDestinationNode();
    if (!dest) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      const now = this.ctx.currentTime;

      osc.frequency.setValueAtTime(280, now);
      osc.frequency.exponentialRampToValueAtTime(620, now + 0.18);

      // Boosted gain for phone speakers
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);

      osc.connect(gain);
      gain.connect(dest);

      osc.start(now);
      osc.stop(now + 0.23);
    } catch {
      // Audio fallback
    }
  }

  public playLand() {
    if (!this.isSoundEnabled) return;
    this.initContext();
    if (!this.ctx) return;
    const dest = this.getDestinationNode();
    if (!dest) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      const now = this.ctx.currentTime;

      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(65, now + 0.09);

      gain.gain.setValueAtTime(0.28, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.11);

      osc.connect(gain);
      gain.connect(dest);

      osc.start(now);
      osc.stop(now + 0.12);
    } catch {
      // Audio fallback
    }
  }

  public playRing() {
    if (!this.isSoundEnabled) return;
    this.initContext();
    if (!this.ctx) return;
    const dest = this.getDestinationNode();
    if (!dest) return;

    try {
      const now = this.ctx.currentTime;
      [880, 1320].forEach((freq, i) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        const start = now + i * 0.055;

        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.26, start);
        gain.gain.exponentialRampToValueAtTime(0.005, start + 0.13);

        osc.connect(gain);
        gain.connect(dest);

        osc.start(start);
        osc.stop(start + 0.14);
      });
    } catch {
      // Audio fallback
    }
  }

  public playCoin() {
    this.playRing();
  }

  public playStar() {
    if (!this.isSoundEnabled) return;
    this.initContext();
    if (!this.ctx) return;
    const dest = this.getDestinationNode();
    if (!dest) return;

    try {
      const now = this.ctx.currentTime;
      // Cheerful major arpeggio (C6, E6, G6, C7)
      const freqs = [1046.5, 1318.5, 1567.98, 2093.0];
      freqs.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        const start = now + idx * 0.04;

        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.3, start);
        gain.gain.exponentialRampToValueAtTime(0.005, start + 0.16);

        osc.connect(gain);
        gain.connect(dest);

        osc.start(start);
        osc.stop(start + 0.17);
      });
    } catch {
      // Audio fallback
    }
  }

  public playCrystal() {
    if (!this.isSoundEnabled) return;
    this.initContext();
    if (!this.ctx) return;
    const dest = this.getDestinationNode();
    if (!dest) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1760, now);
      osc.frequency.exponentialRampToValueAtTime(2200, now + 0.1);

      gain.gain.setValueAtTime(0.28, now);
      gain.gain.exponentialRampToValueAtTime(0.005, now + 0.25);

      osc.connect(gain);
      gain.connect(dest);

      osc.start(now);
      osc.stop(now + 0.26);
    } catch {
      // Audio fallback
    }
  }

  public playObstacleCleared() {
    if (!this.isSoundEnabled) return;
    this.initContext();
    if (!this.ctx) return;
    const dest = this.getDestinationNode();
    if (!dest) return;

    try {
      const now = this.ctx.currentTime;
      // Joyful success fanfare notes: C5, E5, G5, C6
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, i) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        const start = now + i * 0.055;

        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.34, start);
        gain.gain.exponentialRampToValueAtTime(0.01, start + 0.19);

        osc.connect(gain);
        gain.connect(dest);

        osc.start(start);
        osc.stop(start + 0.21);
      });
    } catch {
      // Audio fallback
    }
  }

  public playPromptHint() {
    if (!this.isSoundEnabled) return;
    this.initContext();
    if (!this.ctx) return;
    const dest = this.getDestinationNode();
    if (!dest) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(660, now + 0.15);

      gain.gain.setValueAtTime(0.26, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);

      osc.connect(gain);
      gain.connect(dest);

      osc.start(now);
      osc.stop(now + 0.23);
    } catch {
      // Audio fallback
    }
  }

  public playBiomeChange() {
    if (!this.isSoundEnabled) return;
    this.initContext();
    if (!this.ctx) return;
    const dest = this.getDestinationNode();
    if (!dest) return;

    try {
      const now = this.ctx.currentTime;
      const chord = [440, 554.37, 659.25, 880];
      chord.forEach((freq) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.22, now);
        gain.gain.exponentialRampToValueAtTime(0.005, now + 0.85);

        osc.connect(gain);
        gain.connect(dest);

        osc.start(now);
        osc.stop(now + 0.9);
      });
    } catch {
      // Audio fallback
    }
  }

  public playPowerup() {
    if (!this.isSoundEnabled) return;
    this.initContext();
    if (!this.ctx) return;
    const dest = this.getDestinationNode();
    if (!dest) return;

    try {
      const now = this.ctx.currentTime;
      // Ascending celebratory fanfare: C5, E5, G5, C6, E6
      const freqs = [523.25, 659.25, 783.99, 1046.5, 1318.5];
      freqs.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        const start = now + idx * 0.05;

        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.35, start);
        gain.gain.exponentialRampToValueAtTime(0.005, start + 0.19);

        osc.connect(gain);
        gain.connect(dest);

        osc.start(start);
        osc.stop(start + 0.21);
      });
    } catch {
      // Audio fallback
    }
  }

  public playPowerUp() {
    this.playPowerup();
  }

  public playGem(gemType: 'ruby' | 'emerald' | 'diamond' | string = 'ruby') {
    if (!this.isSoundEnabled) return;
    this.initContext();
    if (!this.ctx) return;
    const dest = this.getDestinationNode();
    if (!dest) return;

    try {
      const now = this.ctx.currentTime;
      const baseFreq = gemType === 'diamond' ? 1760 : gemType === 'emerald' ? 1480 : 1200;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, now + 0.12);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.002, now + 0.25);

      osc.connect(gain);
      gain.connect(dest);

      osc.start(now);
      osc.stop(now + 0.26);
    } catch {
      // Audio fallback
    }
  }

  public playShieldBreak() {
    if (!this.isSoundEnabled) return;
    this.initContext();
    if (!this.ctx) return;
    const dest = this.getDestinationNode();
    if (!dest) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.22);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.24);

      osc.connect(gain);
      gain.connect(dest);

      osc.start(now);
      osc.stop(now + 0.25);
    } catch {
      // Audio fallback
    }
  }

  public playMagnetPulse() {
    if (!this.isSoundEnabled) return;
    this.initContext();
    if (!this.ctx) return;
    const dest = this.getDestinationNode();
    if (!dest) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.linearRampToValueAtTime(880, now + 0.08);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.005, now + 0.1);

      osc.connect(gain);
      gain.connect(dest);

      osc.start(now);
      osc.stop(now + 0.11);
    } catch {
      // Audio fallback
    }
  }

  public playTurbo() {
    if (!this.isSoundEnabled) return;
    this.initContext();
    if (!this.ctx) return;
    const dest = this.getDestinationNode();
    if (!dest) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(960, now + 0.25);

      gain.gain.setValueAtTime(0.36, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.28);

      osc.connect(gain);
      gain.connect(dest);

      osc.start(now);
      osc.stop(now + 0.3);
    } catch {
      // Audio fallback
    }
  }

  public playTestSound() {
    this.unlock().then(() => {
      this.playObstacleCleared();
    });
  }

  // --- BACKGROUND MUSIC (BGM) ---
  // A gentle, pleasant pentatonic melody suited for children
  public startBGM() {
    if (!this.isMusicEnabled || this.isPlayingBgm) return;
    this.initContext();
    this.isPlayingBgm = true;

    // A pleasant bright uplifting C Major / A Minor pentatonic sequence
    const melody = [
      523.25, 659.25, 783.99, 659.25,
      880.00, 783.99, 659.25, 523.25,
      587.33, 659.25, 783.99, 1046.5,
      880.00, 783.99, 587.33, 523.25,
    ];

    const bass = [
      130.81, 130.81, 174.61, 174.61,
      196.00, 196.00, 130.81, 130.81,
    ];

    const stepInterval = 280; // ms per beat

    const playStep = () => {
      if (!this.isPlayingBgm || !this.isMusicEnabled || !this.ctx) return;

      // If context is still suspended, try resuming and retry shortly
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
        this.bgmTimer = window.setTimeout(playStep, 500);
        return;
      }

      const dest = this.getDestinationNode();
      if (!dest) {
        this.bgmTimer = window.setTimeout(playStep, stepInterval);
        return;
      }

      try {
        const now = this.ctx.currentTime;
        const noteFreq = melody[this.bgmCurrentStep % melody.length];

        // Lead synth note - clear, melodic and audible on phone speakers
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(noteFreq, now);

        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.002, now + (stepInterval / 1000) * 0.85);

        osc.connect(gain);
        gain.connect(dest);

        osc.start(now);
        osc.stop(now + (stepInterval / 1000) * 0.9);

        // Warm bass note on every other beat
        if (this.bgmCurrentStep % 2 === 0) {
          const bassFreq = bass[Math.floor(this.bgmCurrentStep / 2) % bass.length];
          const bassOsc = this.ctx.createOscillator();
          const bassGain = this.ctx.createGain();

          bassOsc.type = 'sine';
          bassOsc.frequency.setValueAtTime(bassFreq, now);

          bassGain.gain.setValueAtTime(0.16, now);
          bassGain.gain.exponentialRampToValueAtTime(0.002, now + (stepInterval / 1000) * 1.8);

          bassOsc.connect(bassGain);
          bassGain.connect(dest);

          bassOsc.start(now);
          bassOsc.stop(now + (stepInterval / 1000) * 1.9);
        }

        this.bgmCurrentStep++;
      } catch {
        // Safe fall-through
      }

      this.bgmTimer = window.setTimeout(playStep, stepInterval);
    };

    playStep();
  }

  public stopBGM() {
    this.isPlayingBgm = false;
    if (this.bgmTimer) {
      clearTimeout(this.bgmTimer);
      this.bgmTimer = null;
    }
  }
}

export const soundManager = new SoundManager();
