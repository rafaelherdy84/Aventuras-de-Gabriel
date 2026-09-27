export type GameScreen = 'MENU' | 'PLAYING' | 'PAUSED' | 'SETTINGS';

export type InputType = 'left' | 'right' | 'shoot' | 'jump';

export interface Projectile {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  life: number;
  maxLife: number;
  facing: 1 | -1;
}

export type CharacterAction = 
  | 'IDLE' 
  | 'WALK' 
  | 'RUN' 
  | 'JUMP' 
  | 'LAND' 
  | 'WAITING_OBSTACLE';

export interface GameSettings {
  soundEnabled: boolean;
  musicEnabled: boolean;
  modoGabriel: boolean; // Accessible mode: slower speed, safe obstacles, no penalties, jump prompts
  jumpHints: 'always' | 'when_stopped' | 'off';
  baseSpeed: number; // 1 = soft, 2 = normal, 3 = fast
}

export type BiomeType = 
  | 'FLORESTA_ENSOLARADA' 
  | 'CAVERNAS_CRISTAL' 
  | 'CIDADE_COSMICA'
  | 'MONTANHAS_COLORIDAS'
  | 'VALE_TECNOLOGICO';

export interface BiomeConfig {
  id: BiomeType;
  name: string;
  icon?: string;
  skyTop: string;
  skyBottom: string;
  mountainsColor: string;
  hillsColor: string;
  groundColor: string;
  grassColor: string;
  accentColor: string;
  ambientParticle: 'leaf' | 'petal' | 'sparks' | 'neon' | 'firefly' | 'star' | 'crystal';
  description: string;
}

export type ObstacleType = 
  | 'LOG'            // Tronco com flores (Floresta)
  | 'MUSHROOM'       // Cogumelo saltitante (Floresta)
  | 'WOODEN_FENCE'   // Cerca de madeira rústica (Floresta)
  | 'CRYSTAL_SPIKES' // Espinhos de ametista reluzente (Caverna de Cristal)
  | 'CRYSTAL_ROCK'   // Geodo com cristais (Caverna de Cristal)
  | 'QUARTZ_PILLAR'  // Pilar de quartzo brilhante (Caverna de Cristal)
  | 'NEON_BARRICADE' // Barricada holográfica neon (Cidade Cósmica)
  | 'FLOATING_DROID' // Droid patrulheiro flutuante (Cidade Cósmica)
  | 'PLASMA_GATE'    // Portal / cerca de plasma cósmico (Cidade Cósmica)
  | 'FRIENDLY_BOT'   // Robozinho amigável
  | 'BUBBLE_POD';    // Cápsula brilhante

export interface Obstacle {
  id: string;
  type: ObstacleType;
  x: number;
  y: number;
  width: number;
  height: number;
  name: string;
  cleared: boolean;
  waitingForJump: boolean;
  animationFrame: number;
  biomeId?: BiomeType;
}

export type PowerUpType = 
  | 'MAGNET'       // Ímã de moedas
  | 'SHIELD'       // Escudo protetor contra 1 impacto
  | 'SUPER_JUMP'   // Pulo mais alto e flutuação graciosa
  | 'DOUBLE'       // Multiplicador 2X de pontuação
  | 'TURBO';       // Velocidade aumentada e invulnerabilidade temporária

export interface ActivePowerUp {
  type: PowerUpType;
  remainingSeconds: number; // seconds remaining
  totalSeconds: number;     // initial total duration
  remainingTime?: number;
  maxDuration?: number;
}

export type CollectibleType = 
  | 'COIN'          // Anel / Moeda Dourada (+10 pts)
  | 'GEM_RUBY'      // Gema Rubi Vermelha (+50 pts)
  | 'GEM_EMERALD'   // Gema Esmeralda Verde (+75 pts)
  | 'GEM_DIAMOND'   // Gema Diamante Azul (+100 pts)
  | 'POWERUP';      // Cápsula de Power-Up especial

export interface Collectible {
  id: string;
  type: CollectibleType;
  powerUpType?: PowerUpType;
  x: number;
  y: number;
  radius: number;
  collected: boolean;
  bobOffset: number;
  value: number;
  rotation?: number;
}

export interface Platform {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  biomeId?: BiomeType;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  shape: 'circle' | 'star' | 'spark' | 'ring' | 'leaf' | 'text' | 'crystal' | 'trail';
  text?: string;
  alpha: number;
}

export interface GameProgress {
  distance: number;       // meters
  score: number;          // total points
  coins: number;          // moedas coletadas
  gems: number;           // gemas coletadas
  rings: number;          // anéis
  stars: number;          // estrelas
  crystals: number;       // cristais
  obstaclesCleared: number;
  streak: number;
  highestDistance: number;
  activePowerUps: Partial<Record<PowerUpType, ActivePowerUp>>;
  currentBiome: BiomeType;
}

export interface CelebrationMessage {
  id: string;
  text: string;
  subtext?: string;
  icon?: string;
  timestamp: number;
  color?: string;
}

