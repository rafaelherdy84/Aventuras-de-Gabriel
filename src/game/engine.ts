import { soundManager } from '../audio/soundManager';
import {
  ActivePowerUp,
  BiomeType,
  CelebrationMessage,
  CharacterAction,
  Collectible,
  GameProgress,
  GameSettings,
  InputType,
  Obstacle,
  Particle,
  PowerUpType,
  Projectile,
} from '../types';
import { drawGabriel } from './characterRenderer';
import { BIOME_SEQUENCE, BIOMES, DISTANCE_PER_BIOME, GAME_CONSTANTS, POWERUP_CONFIG } from './constants';
import { ObstacleGenerator } from './obstacleGenerator';
import { ParallaxRenderer } from './parallaxRenderer';

export class GameEngine {
  // Canvas & Context
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  // Subsystems
  private parallax: ParallaxRenderer;
  private obstacleGen: ObstacleGenerator;

  // Player State
  public playerX = 120;
  public playerY = GAME_CONSTANTS.GROUND_Y;
  public playerVx = 0;
  public playerVy = 0;
  public playerFacing: 1 | -1 = 1;
  public playerAction: CharacterAction = 'IDLE';
  public isGrounded = true;
  public squashX = 1;
  public squashY = 1;
  public animTime = 0;

  // Waiting on obstacle state (Modo Gabriel)
  public isWaitingAtObstacle = false;
  public currentWaitingObstacle: Obstacle | null = null;
  private timeSpentWaiting = 0;
  private consecutiveWaitCount = 0;

  // Camera
  public cameraX = 0;

  // Inputs
  public jumpPressed = false;
  public leftPressed = false;
  public rightPressed = false;
  public shootPressed = false;
  private coyoteTimer = 0;
  private jumpBufferTimer = 0;

  // Projectiles
  public projectiles: Projectile[] = [];

  // Game Settings & Progress
  public settings: GameSettings = {
    soundEnabled: true,
    musicEnabled: true,
    modoGabriel: true,
    jumpHints: 'when_stopped',
    baseSpeed: 1, // 1 = Gabriel soft, 2 = normal, 3 = fast
  };

  public progress: GameProgress = {
    distance: 0,
    score: 0,
    coins: 0,
    gems: 0,
    rings: 0,
    stars: 0,
    crystals: 0,
    obstaclesCleared: 0,
    streak: 0,
    highestDistance: 0,
    currentBiome: 'FLORESTA_ENSOLARADA',
    activePowerUps: {},
  };

  // Particles & Floating feedback
  private particles: Particle[] = [];
  public celebrations: CelebrationMessage[] = [];
  private lastMilestoneDistance = 0;
  private lastBiomeIndex = 0;

  // Loop control
  private isRunning = false;
  private lastFrameTime = 0;
  private onStateChangeCallback?: () => void;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get 2D canvas context');
    this.ctx = ctx;

    this.parallax = new ParallaxRenderer();
    this.obstacleGen = new ObstacleGenerator();
  }

  public setOnStateChange(cb: () => void) {
    this.onStateChangeCallback = cb;
  }

  public notifyStateChange() {
    if (this.onStateChangeCallback) {
      this.onStateChangeCallback();
    }
  }

  public start() {
    this.isRunning = true;
    this.lastFrameTime = performance.now();
    soundManager.setSoundEnabled(this.settings.soundEnabled);
    soundManager.setMusicEnabled(this.settings.musicEnabled);
    requestAnimationFrame(this.gameLoop);
  }

  public pause() {
    this.isRunning = false;
    soundManager.stopBGM();
  }

  public resume() {
    if (!this.isRunning) {
      this.isRunning = true;
      this.lastFrameTime = performance.now();
      if (this.settings.musicEnabled) {
        soundManager.startBGM();
      }
      requestAnimationFrame(this.gameLoop);
    }
  }

  public resetGame() {
    this.playerX = 120;
    this.playerY = GAME_CONSTANTS.GROUND_Y;
    this.playerVx = 0;
    this.playerVy = 0;
    this.playerFacing = 1;
    this.playerAction = 'IDLE';
    this.isGrounded = true;
    this.squashX = 1;
    this.squashY = 1;
    this.cameraX = 0;
    this.animTime = 0;

    this.isWaitingAtObstacle = false;
    this.currentWaitingObstacle = null;
    this.timeSpentWaiting = 0;
    this.consecutiveWaitCount = 0;

    this.progress = {
      distance: 0,
      score: 0,
      coins: 0,
      gems: 0,
      rings: 0,
      stars: 0,
      crystals: 0,
      obstaclesCleared: 0,
      streak: 0,
      highestDistance: Math.max(this.progress.highestDistance, this.progress.distance),
      currentBiome: 'FLORESTA_ENSOLARADA',
      activePowerUps: {},
    };

    this.particles = [];
    this.projectiles = [];
    this.celebrations = [];
    this.lastMilestoneDistance = 0;
    this.lastBiomeIndex = 0;
    this.leftPressed = false;
    this.rightPressed = false;
    this.shootPressed = false;

    this.obstacleGen.reset();
    this.notifyStateChange();
  }

  // --- CONTROLS: 3 MOBILE-READY CONTROLS (ESQUERDA, ATIRAR, DIREITA + JUMP) ---

  public setInput(input: InputType, isDown: boolean) {
    if (input === 'jump') {
      if (isDown && !this.jumpPressed) {
        this.onJumpTriggered();
      }
      this.jumpPressed = isDown;
    } else if (input === 'left') {
      this.leftPressed = isDown;
    } else if (input === 'right') {
      this.rightPressed = isDown;
    } else if (input === 'shoot') {
      if (isDown && !this.shootPressed) {
        this.onShootTriggered();
      }
      this.shootPressed = isDown;
    }
  }

  public onShootTriggered() {
    soundManager.playShoot();
    this.squashX = 1.15;
    this.squashY = 0.88;

    // If waiting at an obstacle: shoot and obliterate it immediately!
    if (this.isWaitingAtObstacle && this.currentWaitingObstacle) {
      const obs = this.currentWaitingObstacle;
      obs.waitingForJump = false;
      obs.cleared = true;
      this.isWaitingAtObstacle = false;
      this.currentWaitingObstacle = null;

      soundManager.playObstacleCleared();
      this.spawnSparkBurst(obs.x + obs.width / 2, obs.y + obs.height / 2, '#38bdf8');
      this.addFloatingText('💥 TIRO CERTEIRO!', obs.x, obs.y - 45, '#38bdf8');

      const multiplier = this.progress.activePowerUps.DOUBLE ? 2 : 1;
      this.progress.score += 150 * multiplier;
      this.progress.obstaclesCleared++;
      this.progress.streak++;

      this.addCelebration('Tiro Perfeito!', `+${150 * multiplier} Pontos`, '⚡');
      this.notifyStateChange();
      return;
    }

    // Launch glowing energy projectile
    const dir = this.playerFacing;
    const spawnX = this.playerX + (dir === 1 ? 28 : -28);
    const spawnY = this.playerY - 28;

    this.projectiles.push({
      id: `${Date.now()}_${Math.random()}`,
      x: spawnX,
      y: spawnY,
      vx: dir * 680,
      vy: 0,
      radius: 9,
      color: '#38bdf8',
      life: 0,
      maxLife: 1.4,
      facing: dir,
    });

    this.spawnSparkBurst(spawnX, spawnY, '#38bdf8');
  }

  public onJumpTriggered() {
    // Check if Super Jump power-up is active
    const hasSuperJump = !!this.progress.activePowerUps.SUPER_JUMP;
    const baseJump = hasSuperJump ? GAME_CONSTANTS.SUPER_JUMP_FORCE : GAME_CONSTANTS.JUMP_FORCE;
    const highJump = hasSuperJump ? GAME_CONSTANTS.SUPER_JUMP_FORCE * 1.15 : GAME_CONSTANTS.HIGH_JUMP_FORCE;

    // If waiting at an obstacle: empowered leap forward!
    if (this.isWaitingAtObstacle && this.currentWaitingObstacle) {
      this.playerVy = highJump;
      this.playerVx = this.getTargetSpeed() * 1.15;
      this.isGrounded = false;
      this.isWaitingAtObstacle = false;
      this.playerAction = 'JUMP';
      this.squashX = 0.82;
      this.squashY = 1.25;

      const obs = this.currentWaitingObstacle;
      obs.waitingForJump = false;
      obs.cleared = true;
      this.currentWaitingObstacle = null;

      soundManager.playJump();
      this.spawnDust(this.playerX, this.playerY, 8);
      this.addFloatingText('SALTOU! ⬆', this.playerX, this.playerY - 60, '#fde047');

      // Points calculation (affected by 2X power-up)
      const multiplier = this.progress.activePowerUps.DOUBLE ? 2 : 1;
      this.progress.score += 100 * multiplier;
      this.progress.obstaclesCleared++;
      this.progress.streak++;

      soundManager.playObstacleCleared();
      this.addCelebration('Salto Incrível!', `+${100 * multiplier} Pontos`, '⭐');
      this.notifyStateChange();
      return;
    }

    // Standard Jump or Air Jump buffer
    if (this.isGrounded || this.coyoteTimer > 0) {
      this.playerVy = baseJump;
      this.isGrounded = false;
      this.coyoteTimer = 0;
      this.playerAction = 'JUMP';
      this.squashX = 0.85;
      this.squashY = 1.2;

      soundManager.playJump();
      this.spawnDust(this.playerX, this.playerY, 6);
    } else {
      this.jumpBufferTimer = GAME_CONSTANTS.JUMP_BUFFER_FRAMES;
    }
  }

  // --- GAME LOOP ---

  private gameLoop = (currentTime: number) => {
    if (!this.isRunning) return;

    const dt = Math.min((currentTime - this.lastFrameTime) / 1000, 0.05);
    this.lastFrameTime = currentTime;

    this.update(dt);
    this.render();

    requestAnimationFrame(this.gameLoop);
  };

  private getTargetSpeed(): number {
    let speed = GAME_CONSTANTS.SPEED_NORMAL;
    if (this.settings.modoGabriel) {
      speed = GAME_CONSTANTS.SPEED_MODO_GABRIEL;
      if (this.consecutiveWaitCount >= 2) {
        speed *= 0.88;
      }
    } else if (this.settings.baseSpeed === 3) {
      speed = GAME_CONSTANTS.SPEED_FAST;
    }

    // Turbo Power-Up Speed Boost
    if (this.progress.activePowerUps.TURBO) {
      speed *= 1.42;
    }

    return speed;
  }

  // --- UPDATE LOGIC ---

  private update(dt: number) {
    this.animTime += dt;

    // 1. UPDATE ACTIVE POWER-UPS TIMERS
    this.updatePowerUps(dt);

    // 2. HORIZONTAL MOVEMENT WITH ESQUERDA, DIREITA OR AUTO-RUN
    const maxSpeed = this.getTargetSpeed();

    if (this.isWaitingAtObstacle) {
      this.playerVx = 0;
      this.playerAction = 'WAITING_OBSTACLE';
      this.timeSpentWaiting += dt;

      if (this.timeSpentWaiting > 2.0 && Math.floor(this.timeSpentWaiting * 2) % 6 === 0) {
        soundManager.playPromptHint();
      }
    } else {
      if (this.leftPressed && !this.rightPressed) {
        this.playerFacing = -1;
        this.playerVx = -maxSpeed * 0.85;
      } else if (this.rightPressed && !this.leftPressed) {
        this.playerFacing = 1;
        this.playerVx = maxSpeed * 1.35;
      } else {
        // Smooth runner auto-acceleration towards target speed
        this.playerFacing = 1;
        this.playerVx = Math.min(this.playerVx + GAME_CONSTANTS.ACCELERATION * 0.85, maxSpeed);
      }

      if (!this.isGrounded) {
        this.playerAction = 'JUMP';
      } else if (Math.abs(this.playerVx) > 2) {
        this.playerAction = 'RUN';
      } else if (Math.abs(this.playerVx) > 0.3) {
        this.playerAction = 'WALK';
      } else {
        this.playerAction = 'IDLE';
      }
    }

    // Apply horizontal velocity
    this.playerX += this.playerVx;

    // Update Distance & Biomes
    const currentMeters = Math.max(0, Math.floor((this.playerX - 120) / 36));
    if (currentMeters > this.progress.distance) {
      const addedMeters = currentMeters - this.progress.distance;
      this.progress.distance = currentMeters;
      const multiplier = this.progress.activePowerUps.DOUBLE ? 2 : 1;
      this.progress.score += addedMeters * 2 * multiplier;

      // Update Biome Progression
      this.checkBiomeProgression(currentMeters);

      // Distance milestones every 100m
      if (currentMeters - this.lastMilestoneDistance >= 100) {
        this.lastMilestoneDistance = currentMeters;
        this.progress.score += 250 * multiplier;
        soundManager.playBiomeChange();
        this.addCelebration(`Distância: ${currentMeters}m!`, `+${250 * multiplier} Bônus`, '🏆');
        this.notifyStateChange();
      }
    }

    // 3. VERTICAL PHYSICS & GRAVITY
    if (!this.isGrounded) {
      this.playerVy += GAME_CONSTANTS.GRAVITY;
      if (this.playerVy > GAME_CONSTANTS.MAX_FALL_SPEED) {
        this.playerVy = GAME_CONSTANTS.MAX_FALL_SPEED;
      }
    }

    this.playerY += this.playerVy;

    // Platform collisions
    let landedOnPlatform = false;
    const platforms = this.obstacleGen.getPlatforms();
    platforms.forEach((plat) => {
      if (
        this.playerVy >= 0 &&
        this.playerX >= plat.x - 10 &&
        this.playerX <= plat.x + plat.width + 10 &&
        this.playerY >= plat.y &&
        this.playerY - this.playerVy <= plat.y + 14
      ) {
        this.playerY = plat.y;
        this.playerVy = 0;
        landedOnPlatform = true;
      }
    });

    // Ground collision
    if (this.playerY >= GAME_CONSTANTS.GROUND_Y) {
      this.playerY = GAME_CONSTANTS.GROUND_Y;
      this.playerVy = 0;
      landedOnPlatform = true;
    }

    // Landing feedback
    if (landedOnPlatform && !this.isGrounded) {
      this.isGrounded = true;
      this.squashX = 1.22;
      this.squashY = 0.82;
      soundManager.playLand();
      this.spawnDust(this.playerX, this.playerY, 5);

      if (this.jumpBufferTimer > 0) {
        this.jumpBufferTimer = 0;
        this.onJumpTriggered();
      }
    } else if (!landedOnPlatform && this.isGrounded) {
      this.isGrounded = false;
      this.coyoteTimer = GAME_CONSTANTS.COYOTE_TIME_FRAMES;
    }

    // Timers
    if (this.coyoteTimer > 0) this.coyoteTimer--;
    if (this.jumpBufferTimer > 0) this.jumpBufferTimer--;

    // Squash & Stretch recovery
    this.squashX += (1 - this.squashX) * 0.18;
    this.squashY += (1 - this.squashY) * 0.18;

    // 4. OBSTACLES & POWER-UP SHIELD INTERACTION
    this.handleObstacleCollisions();

    // 5. COLLECTIBLES & MAGNET ATTRACTION
    this.handleCollectibleCollisions();

    // 6. UPDATE PROCEDURAL GENERATOR
    this.obstacleGen.update(this.playerX, this.settings.modoGabriel, this.progress.currentBiome);

    // 7. SMOOTH CAMERA
    const targetCameraX = Math.max(0, this.playerX - GAME_CONSTANTS.CANVAS_WIDTH * 0.28);
    this.cameraX += (targetCameraX - this.cameraX) * 0.14;

    // 8. PROJECTILES UPDATE & OBSTACLE COLLISION
    this.updateProjectiles(dt);

    // 9. PARTICLES UPDATE
    this.updateParticles(dt);

    // 10. CELEBRATION TOASTS EXPIRY
    const now = performance.now();
    this.celebrations = this.celebrations.filter((c) => now - c.timestamp < 3500);
  }

  private updateProjectiles(dt: number) {
    const obstacles = this.obstacleGen.getObstacles();

    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life += dt;

      // Spawn glowing trail particles
      if (Math.random() < 0.7) {
        this.particles.push({
          x: p.x + (Math.random() * 6 - 3),
          y: p.y + (Math.random() * 6 - 3),
          vx: -p.vx * 0.04 + (Math.random() * 2 - 1),
          vy: (Math.random() * 2 - 1) * 0.8,
          life: 0,
          maxLife: 0.28,
          size: 3.5,
          color: p.color,
          shape: 'spark',
          alpha: 0.9,
        });
      }

      // Check collision with obstacles
      let hit = false;
      for (const obs of obstacles) {
        if (obs.cleared) continue;

        if (
          p.x >= obs.x - 10 &&
          p.x <= obs.x + obs.width + 10 &&
          p.y >= obs.y - 10 &&
          p.y <= obs.y + obs.height + 10
        ) {
          obs.cleared = true;
          obs.waitingForJump = false;
          if (this.currentWaitingObstacle === obs) {
            this.isWaitingAtObstacle = false;
            this.currentWaitingObstacle = null;
          }

          soundManager.playObstacleCleared();
          this.spawnSparkBurst(obs.x + obs.width / 2, obs.y + obs.height / 2, '#38bdf8');
          this.addFloatingText('+100 ACERTOU! 💥', obs.x + obs.width / 2, obs.y - 30, '#38bdf8');

          const multiplier = this.progress.activePowerUps.DOUBLE ? 2 : 1;
          this.progress.score += 100 * multiplier;
          this.progress.obstaclesCleared++;
          this.progress.streak++;
          this.notifyStateChange();

          hit = true;
          break;
        }
      }

      // Despawn projectile if hit or expired
      if (hit || p.life >= p.maxLife || Math.abs(p.x - this.playerX) > 1200) {
        this.projectiles.splice(i, 1);
      }
    }
  }

  /**
   * Updates Biome based on distance travelled and triggers visual/audio transitions.
   */
  private checkBiomeProgression(meters: number) {
    const biomeIndex = Math.floor(meters / DISTANCE_PER_BIOME) % BIOME_SEQUENCE.length;
    const newBiome = BIOME_SEQUENCE[biomeIndex];

    if (newBiome !== this.progress.currentBiome) {
      this.progress.currentBiome = newBiome;
      this.lastBiomeIndex = biomeIndex;
      const biomeConfig = BIOMES[newBiome];

      soundManager.playBiomeChange();
      this.addCelebration(`Novo Bioma: ${biomeConfig.name}!`, biomeConfig.description, '✨');
      this.spawnSparkBurst(this.playerX, this.playerY - 30, biomeConfig.accentColor);
      this.notifyStateChange();
    }
  }

  /**
   * Decrements power-up active durations and cleans up expired power-ups.
   */
  private updatePowerUps(dt: number) {
    const powerUps = this.progress.activePowerUps;
    let stateChanged = false;

    (Object.keys(powerUps) as PowerUpType[]).forEach((type) => {
      const p = powerUps[type];
      if (p) {
        p.remainingSeconds -= dt;
        if (p.remainingSeconds <= 0) {
          delete powerUps[type];
          stateChanged = true;
        }
      }
    });

    if (stateChanged) {
      this.notifyStateChange();
    }
  }

  /**
   * Activates a picked-up power-up!
   */
  private activatePowerUp(type: PowerUpType) {
    const config = POWERUP_CONFIG[type];
    this.progress.activePowerUps[type] = {
      type,
      totalSeconds: config.duration,
      remainingSeconds: config.duration,
    };

    soundManager.playPowerUp();
    this.spawnSparkBurst(this.playerX, this.playerY - 30, config.color);
    this.addCelebration(config.name, config.desc, config.icon);
    this.addFloatingText(`${config.icon} ${config.name}!`, this.playerX, this.playerY - 50, config.color);
    this.notifyStateChange();
  }

  /**
   * Obstacle collisions:
   * - If Shield is active, Gabriel smashes through smoothly with bonus points!
   * - In Modo Gabriel, Gabriel stops politely right before the obstacle, waiting for jump.
   */
  private handleObstacleCollisions() {
    const obstacles = this.obstacleGen.getObstacles();

    for (const obs of obstacles) {
      if (obs.cleared) continue;

      const stopDistance = GAME_CONSTANTS.OBSTACLE_WAIT_PROXIMITY;
      const distanceToObstacle = obs.x - this.playerX;

      // Check Shield Smash!
      if (this.progress.activePowerUps.SHIELD && Math.abs(distanceToObstacle) < 35) {
        obs.cleared = true;
        obs.waitingForJump = false;
        soundManager.playShieldBreak();
        this.spawnSparkBurst(obs.x + obs.width / 2, obs.y + obs.height / 2, '#818cf8');
        this.addFloatingText('ESCUDO! 🛡️', obs.x, obs.y - 30, '#818cf8');
        this.progress.score += 150;
        this.progress.obstaclesCleared++;
        this.notifyStateChange();
        continue;
      }

      // If Gabriel is on the ground, moving right towards the obstacle:
      if (this.isGrounded && distanceToObstacle > 0 && distanceToObstacle <= stopDistance) {
        this.playerX = obs.x - stopDistance;
        this.playerVx = 0;
        this.isWaitingAtObstacle = true;
        this.currentWaitingObstacle = obs;
        obs.waitingForJump = true;
        this.timeSpentWaiting = 0;
        this.consecutiveWaitCount++;
        this.notifyStateChange();
        break;
      }

      // If Gabriel jumped and cleared the obstacle horizontally:
      if (this.playerX > obs.x + obs.width + 10) {
        if (!obs.cleared) {
          obs.cleared = true;
          obs.waitingForJump = false;
          if (this.currentWaitingObstacle === obs) {
            this.isWaitingAtObstacle = false;
            this.currentWaitingObstacle = null;
          }
          this.consecutiveWaitCount = 0;
          this.progress.obstaclesCleared++;
          const multiplier = this.progress.activePowerUps.DOUBLE ? 2 : 1;
          this.progress.score += 50 * multiplier;
          soundManager.playObstacleCleared();
          this.addFloatingText(`+${50 * multiplier} Superado!`, obs.x, obs.y - 30, '#4ade80');
          this.notifyStateChange();
        }
      }
    }
  }

  /**
   * Collectible collisions & Magnet suction logic:
   */
  private handleCollectibleCollisions() {
    const collectibles = this.obstacleGen.getCollectibles();
    const playerCenterY = this.playerY - 28;
    const hasMagnet = !!this.progress.activePowerUps.MAGNET;
    const multiplier = this.progress.activePowerUps.DOUBLE ? 2 : 1;

    for (const item of collectibles) {
      if (item.collected) continue;

      const dx = this.playerX - item.x;
      const dy = playerCenterY - item.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Cosmic Magnet Attraction: Draw items towards Gabriel if within range!
      if (hasMagnet && dist < 190 && item.type !== 'POWERUP') {
        item.x += (this.playerX - item.x) * 0.18;
        item.y += (playerCenterY - item.y) * 0.18;
      }

      // Collection hit threshold
      if (dist < item.radius + 26) {
        item.collected = true;
        const awardedPoints = item.value * multiplier;
        this.progress.score += awardedPoints;

        if (item.type === 'COIN') {
          this.progress.coins++;
          soundManager.playCoin();
          this.spawnCoinBurst(item.x, item.y);
          this.addFloatingText(`+${awardedPoints}`, item.x, item.y - 18, '#facc15');
        } else if (item.type === 'GEM_RUBY') {
          this.progress.gems++;
          soundManager.playGem();
          this.spawnSparkBurst(item.x, item.y, '#ef4444');
          this.addFloatingText(`+${awardedPoints} 💎 Rubi`, item.x, item.y - 20, '#ef4444');
        } else if (item.type === 'GEM_EMERALD') {
          this.progress.gems++;
          soundManager.playGem();
          this.spawnSparkBurst(item.x, item.y, '#10b981');
          this.addFloatingText(`+${awardedPoints} 💎 Esmeralda`, item.x, item.y - 20, '#10b981');
        } else if (item.type === 'GEM_DIAMOND') {
          this.progress.gems++;
          soundManager.playGem();
          this.spawnSparkBurst(item.x, item.y, '#06b6d4');
          this.addFloatingText(`+${awardedPoints} 💎 Diamante`, item.x, item.y - 20, '#06b6d4');
        } else if (item.type === 'POWERUP' && item.powerUpType) {
          this.activatePowerUp(item.powerUpType);
        }

        this.notifyStateChange();
      }
    }
  }

  // --- PARTICLE HELPERS ---

  private spawnDust(x: number, y: number, count: number) {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: x + (Math.random() * 20 - 10),
        y: y - 2,
        vx: (Math.random() * 2 - 1) * 1.5,
        vy: -Math.random() * 2,
        life: 0,
        maxLife: 0.35 + Math.random() * 0.2,
        size: 3 + Math.random() * 4,
        color: '#e2e8f0',
        shape: 'circle',
        alpha: 0.7,
      });
    }
  }

  private spawnCoinBurst(x: number, y: number) {
    for (let i = 0; i < 7; i++) {
      const angle = (Math.PI * 2 / 7) * i;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * (2 + Math.random() * 2),
        vy: Math.sin(angle) * (2 + Math.random() * 2),
        life: 0,
        maxLife: 0.45,
        size: 3.5,
        color: '#facc15',
        shape: 'spark',
        alpha: 1,
      });
    }
  }

  private spawnSparkBurst(x: number, y: number, color: string) {
    for (let i = 0; i < 10; i++) {
      const angle = Math.random() * Math.PI * 2;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * 3,
        vy: Math.sin(angle) * 3,
        life: 0,
        maxLife: 0.5,
        size: 3.5,
        color,
        shape: 'spark',
        alpha: 1,
      });
    }
  }

  private addFloatingText(text: string, x: number, y: number, color: string) {
    this.particles.push({
      x,
      y,
      vx: 0,
      vy: -1.4,
      life: 0,
      maxLife: 0.8,
      size: 16,
      color,
      shape: 'text',
      text,
      alpha: 1,
    });
  }

  public addCelebration(text: string, subtext?: string, icon?: string) {
    this.celebrations.unshift({
      id: `${Date.now()}_${Math.random()}`,
      text,
      subtext,
      icon,
      timestamp: performance.now(),
    });
    if (this.celebrations.length > 3) {
      this.celebrations.pop();
    }
  }

  private updateParticles(dt: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += dt;
      p.x += p.vx;
      p.y += p.vy;
      p.alpha = Math.max(0, 1 - p.life / p.maxLife);

      if (p.life >= p.maxLife) {
        this.particles.splice(i, 1);
      }
    }
  }

  // --- RENDER LOGIC ---

  private render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, GAME_CONSTANTS.CANVAS_WIDTH, GAME_CONSTANTS.CANVAS_HEIGHT);

    // 1. Parallax background layers with current biome
    this.parallax.render(ctx, this.cameraX, this.progress.distance, this.animTime, this.progress.currentBiome);

    // 2. Obstacles, platforms, and collectibles
    this.obstacleGen.render(ctx, this.cameraX, this.animTime);

    // 3. Render Gabriel (Main Hero with Power-Up effects)
    drawGabriel({
      ctx,
      x: this.playerX - this.cameraX,
      y: this.playerY,
      width: 48,
      height: 64,
      action: this.playerAction,
      facing: this.playerFacing,
      animTime: this.animTime,
      squashX: this.squashX,
      squashY: this.squashY,
      waitingForObstacle: this.isWaitingAtObstacle,
      activePowerUps: this.progress.activePowerUps,
    });

    // 4. Render Projectiles (Star Blaster energy projectiles)
    ctx.save();
    this.projectiles.forEach((p) => {
      const screenX = p.x - this.cameraX;
      
      // Radiant energy glow
      const glow = ctx.createRadialGradient(screenX, p.y, 1, screenX, p.y, p.radius * 2);
      glow.addColorStop(0, '#ffffff');
      glow.addColorStop(0.4, '#38bdf8');
      glow.addColorStop(1, 'rgba(56, 189, 248, 0)');
      
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(screenX, p.y, p.radius * 2, 0, Math.PI * 2);
      ctx.fill();

      // Sharp central star core
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(screenX, p.y, p.radius * 0.55, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();

    // 5. Render Particles & Floating texts
    ctx.save();
    this.particles.forEach((p) => {
      const screenX = p.x - this.cameraX;
      ctx.globalAlpha = p.alpha;

      if (p.shape === 'text' && p.text) {
        ctx.fillStyle = p.color;
        ctx.font = 'bold 16px "Fredoka", sans-serif';
        ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 4;
        ctx.fillText(p.text, screenX, p.y);
      } else {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(screenX, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
    });
    ctx.restore();
  }
}
