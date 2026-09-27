import { BiomeConfig, BiomeType, PowerUpType } from '../types';

export const GAME_CONSTANTS = {
  CANVAS_WIDTH: 960,
  CANVAS_HEIGHT: 540,
  GROUND_Y: 420,
  
  // Physics constants
  GRAVITY: 0.56,
  JUMP_FORCE: -13.8,
  SUPER_JUMP_FORCE: -17.2, // When Super Jump powerup is active
  HIGH_JUMP_FORCE: -15.5,  // used when launching over waiting obstacles
  MAX_FALL_SPEED: 14,
  
  // Base running speeds
  SPEED_MODO_GABRIEL: 4.5,
  SPEED_NORMAL: 5.8,
  SPEED_FAST: 7.2,
  SPEED_TURBO: 9.6, // When Turbo powerup is active
  ACCELERATION: 0.38,
  DECELERATION: 0.45,

  // Safety & spacing
  MIN_OBSTACLE_SPACING_GABRIEL: 480, // ample reaction time
  MIN_OBSTACLE_SPACING_NORMAL: 380,
  OBSTACLE_WAIT_PROXIMITY: 52,       // distance before obstacle to safely stop Gabriel
  COYOTE_TIME_FRAMES: 8,
  JUMP_BUFFER_FRAMES: 8,

  // Magnet radius
  MAGNET_RADIUS: 240,
};

export const POWERUP_CONFIG: Record<PowerUpType, { name: string; duration: number; icon: string; color: string; desc: string }> = {
  MAGNET: {
    name: 'Ímã Cósmico',
    duration: 12,
    icon: '🧲',
    color: '#38bdf8',
    desc: 'Atrai moedas e gemas próximas!'
  },
  SHIELD: {
    name: 'Escudo Estelar',
    duration: 16,
    icon: '🛡️',
    color: '#818cf8',
    desc: 'Protege contra 1 obstáculo sem parar!'
  },
  SUPER_JUMP: {
    name: 'Super Salto',
    duration: 10,
    icon: '🪽',
    color: '#facc15',
    desc: 'Salto mais alto com asas de energia!'
  },
  DOUBLE: {
    name: 'Pontos em Dobro (2X)',
    duration: 15,
    icon: '✖️2',
    color: '#ec4899',
    desc: 'Dobra todos os pontos e bônus!'
  },
  TURBO: {
    name: 'Turbo Sônico',
    duration: 7,
    icon: '⚡',
    color: '#f97316',
    desc: 'Super velocidade com invulnerabilidade!'
  }
};

export const BIOMES: Record<BiomeType, BiomeConfig> = {
  FLORESTA_ENSOLARADA: {
    id: 'FLORESTA_ENSOLARADA',
    name: 'Floresta Ensolarada',
    icon: '🌲',
    skyTop: '#38bdf8',
    skyBottom: '#bae6fd',
    mountainsColor: '#7dd3fc',
    hillsColor: '#4ade80',
    groundColor: '#78350f',
    grassColor: '#22c55e',
    accentColor: '#fbbf24',
    ambientParticle: 'leaf',
    description: 'Dia radiante, árvores verdejantes e caminhos floridos!'
  },
  CAVERNAS_CRISTAL: {
    id: 'CAVERNAS_CRISTAL',
    name: 'Cavernas de Cristal',
    icon: '💎',
    skyTop: '#1e1b4b',
    skyBottom: '#4338ca',
    mountainsColor: '#312e81',
    hillsColor: '#6366f1',
    groundColor: '#0f172a',
    grassColor: '#a855f7',
    accentColor: '#c084fc',
    ambientParticle: 'crystal',
    description: 'Gruta mágica iluminada por ametistas e cristais reluzentes!'
  },
  CIDADE_COSMICA: {
    id: 'CIDADE_COSMICA',
    name: 'Cidade Cósmica',
    icon: '🚀',
    skyTop: '#030712',
    skyBottom: '#31104b',
    mountainsColor: '#3b0764',
    hillsColor: '#701a75',
    groundColor: '#0f172a',
    grassColor: '#06b6d4',
    accentColor: '#ec4899',
    ambientParticle: 'star',
    description: 'Metrópole futurista sob as estrelas com prédios neon!'
  },
  MONTANHAS_COLORIDAS: {
    id: 'MONTANHAS_COLORIDAS',
    name: 'Montanhas do Pôr do Sol',
    icon: '🌄',
    skyTop: '#f97316',
    skyBottom: '#fde047',
    mountainsColor: '#c084fc',
    hillsColor: '#e11d48',
    groundColor: '#881337',
    grassColor: '#fb923c',
    accentColor: '#facc15',
    ambientParticle: 'petal',
    description: 'Cordilheiras douradas sob o espetáculo do entardecer!'
  },
  VALE_TECNOLOGICO: {
    id: 'VALE_TECNOLOGICO',
    name: 'Vale Tecnológico',
    icon: '⚡',
    skyTop: '#0284c7',
    skyBottom: '#67e8f9',
    mountainsColor: '#0ea5e9',
    hillsColor: '#06b6d4',
    groundColor: '#0f172a',
    grassColor: '#10b981',
    accentColor: '#38bdf8',
    ambientParticle: 'sparks',
    description: 'Circuito cibernético com energia limpa e pontes flutuantes!'
  }
};

export const BIOME_SEQUENCE: BiomeType[] = [
  'FLORESTA_ENSOLARADA',
  'CAVERNAS_CRISTAL',
  'CIDADE_COSMICA',
  'MONTANHAS_COLORIDAS',
  'VALE_TECNOLOGICO'
];

export const DISTANCE_PER_BIOME = 420; // meters per biome stage before smooth transition

