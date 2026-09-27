import { BiomeConfig, BiomeType } from '../types';
import { BIOMES, BIOME_SEQUENCE, DISTANCE_PER_BIOME, GAME_CONSTANTS } from './constants';

export class ParallaxRenderer {
  private clouds: { x: number; y: number; scale: number; speed: number }[] = [];
  private stars: { x: number; y: number; size: number; alpha: number; twinkleSpeed: number }[] = [];

  constructor() {
    // Generate initial decorative clouds
    for (let i = 0; i < 8; i++) {
      this.clouds.push({
        x: Math.random() * GAME_CONSTANTS.CANVAS_WIDTH * 1.5,
        y: 40 + Math.random() * 120,
        scale: 0.6 + Math.random() * 0.8,
        speed: 0.2 + Math.random() * 0.4,
      });
    }

    // Generate starry night / cosmic stars
    for (let i = 0; i < 60; i++) {
      this.stars.push({
        x: Math.random() * GAME_CONSTANTS.CANVAS_WIDTH,
        y: Math.random() * 260,
        size: 1 + Math.random() * 2.5,
        alpha: 0.3 + Math.random() * 0.7,
        twinkleSpeed: 2 + Math.random() * 4,
      });
    }
  }

  public getCurrentBiome(distance: number): { current: BiomeConfig; next: BiomeConfig; factor: number } {
    const totalDistance = Math.max(0, distance);
    const biomeIndex = Math.floor(totalDistance / DISTANCE_PER_BIOME);
    const currentType: BiomeType = BIOME_SEQUENCE[biomeIndex % BIOME_SEQUENCE.length];
    const nextType: BiomeType = BIOME_SEQUENCE[(biomeIndex + 1) % BIOME_SEQUENCE.length];

    // Transition factor in the last 80 meters of a biome
    const distanceIntoCurrent = totalDistance % DISTANCE_PER_BIOME;
    const transitionStart = DISTANCE_PER_BIOME - 80;
    let factor = 0;
    if (distanceIntoCurrent > transitionStart) {
      factor = (distanceIntoCurrent - transitionStart) / 80;
    }

    return {
      current: BIOMES[currentType],
      next: BIOMES[nextType],
      factor,
    };
  }

  public render(
    ctx: CanvasRenderingContext2D,
    cameraX: number,
    distance: number,
    animTime: number,
    _overrideBiome?: BiomeType
  ) {
    const { current, next, factor } = this.getCurrentBiome(distance);
    const width = GAME_CONSTANTS.CANVAS_WIDTH;
    const height = GAME_CONSTANTS.CANVAS_HEIGHT;
    const groundY = GAME_CONSTANTS.GROUND_Y;

    // 1. SKY GRADIENT
    const skyTop = this.lerpColor(current.skyTop, next.skyTop, factor);
    const skyBottom = this.lerpColor(current.skyBottom, next.skyBottom, factor);

    const skyGrad = ctx.createLinearGradient(0, 0, 0, groundY);
    skyGrad.addColorStop(0, skyTop);
    skyGrad.addColorStop(1, skyBottom);
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, width, height);

    // Cosmic / Night Stars
    const isNightOrCosmic = current.id === 'CAVERNAS_CRISTAL' || current.id === 'CIDADE_COSMICA' ||
      (next.id === 'CIDADE_COSMICA' && factor > 0.2);
    if (isNightOrCosmic) {
      ctx.save();
      this.stars.forEach((star) => {
        const twinkle = 0.5 + Math.sin(animTime * star.twinkleSpeed) * 0.5;
        ctx.fillStyle = `rgba(255, 255, 255, ${star.alpha * twinkle})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();
    }

    // Sun / Moon / Celestial Orb
    this.drawCelestialBody(ctx, current.id, animTime);

    // 2. DRIFTING CLOUDS (Parallax Layer 0.5)
    ctx.save();
    this.clouds.forEach((c) => {
      c.x -= c.speed;
      if (c.x < -150) c.x = width + 100;
      this.drawCloud(ctx, c.x, c.y, c.scale, isNightOrCosmic);
    });
    ctx.restore();

    // 3. DISTANT MOUNTAINS / SKYLINE (Parallax Factor 0.12)
    const mountainColor = this.lerpColor(current.mountainsColor, next.mountainsColor, factor);
    this.drawMountains(ctx, cameraX * 0.12, mountainColor, groundY, current.id);

    // 4. MIDGROUND HILLS & VEGETATION (Parallax Factor 0.35)
    const hillsColor = this.lerpColor(current.hillsColor, next.hillsColor, factor);
    this.drawHills(ctx, cameraX * 0.35, hillsColor, groundY, current.id, animTime);

    // 5. FOREGROUND FLORA & DETAILS (Parallax Factor 0.65)
    this.drawMidgroundProps(ctx, cameraX * 0.65, groundY, current.id, animTime);

    // 6. MAIN GROUND PLATFORM (Parallax Factor 1.0)
    const groundColor = this.lerpColor(current.groundColor, next.groundColor, factor);
    const grassColor = this.lerpColor(current.grassColor, next.grassColor, factor);
    this.drawGround(ctx, cameraX, groundY, width, height, groundColor, grassColor, animTime);
  }

  private drawCelestialBody(ctx: CanvasRenderingContext2D, biomeId: BiomeType, animTime: number) {
    ctx.save();
    if (biomeId === 'FLORESTA_ENSOLARADA' || biomeId === 'MONTANHAS_COLORIDAS') {
      // Warm glowing sun with subtle pulse
      const sunX = 760;
      const sunY = 90;
      const pulse = Math.sin(animTime * 2) * 4;

      ctx.fillStyle = 'rgba(254, 240, 138, 0.3)';
      ctx.beginPath();
      ctx.arc(sunX, sunY, 48 + pulse, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.arc(sunX, sunY, 32, 0, Math.PI * 2);
      ctx.fill();
    } else if (biomeId === 'CAVERNAS_CRISTAL') {
      // Crescent glowing moon
      const moonX = 760;
      const moonY = 80;

      ctx.fillStyle = 'rgba(199, 210, 254, 0.25)';
      ctx.beginPath();
      ctx.arc(moonX, moonY, 36, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#e0e7ff';
      ctx.beginPath();
      ctx.arc(moonX, moonY, 26, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#090d16';
      ctx.beginPath();
      ctx.arc(moonX - 10, moonY - 6, 22, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Futuristic / Cosmic Energy Ring
      const orbX = 760;
      const orbY = 95;

      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(orbX, orbY, 28, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = '#818cf8';
      ctx.beginPath();
      ctx.arc(orbX, orbY, 16, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  private drawCloud(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, isNight: boolean) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.fillStyle = isNight ? 'rgba(30, 41, 59, 0.45)' : 'rgba(255, 255, 255, 0.75)';

    ctx.beginPath();
    ctx.arc(0, 0, 25, 0, Math.PI * 2);
    ctx.arc(22, -8, 20, 0, Math.PI * 2);
    ctx.arc(44, 0, 22, 0, Math.PI * 2);
    ctx.arc(22, 10, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  private drawMountains(
    ctx: CanvasRenderingContext2D,
    offsetX: number,
    color: string,
    groundY: number,
    biomeId: BiomeType
  ) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.85;

    const width = GAME_CONSTANTS.CANVAS_WIDTH;
    const period = 360;
    const startX = -((offsetX % period) + period) % period;

    ctx.beginPath();
    ctx.moveTo(startX - 200, groundY);

    for (let x = startX - 200; x <= width + 200; x += period) {
      if (biomeId === 'VALE_TECNOLOGICO' || biomeId === 'CIDADE_COSMICA') {
        // Geometric futuristic spires
        ctx.lineTo(x + 50, groundY - 140);
        ctx.lineTo(x + 90, groundY - 190);
        ctx.lineTo(x + 130, groundY - 140);
        ctx.lineTo(x + 220, groundY - 170);
        ctx.lineTo(x + 280, groundY - 120);
        ctx.lineTo(x + period, groundY);
      } else {
        // Rolling majestic mountain peaks
        ctx.lineTo(x + 80, groundY - 160);
        ctx.lineTo(x + 160, groundY - 120);
        ctx.lineTo(x + 240, groundY - 210);
        ctx.lineTo(x + 320, groundY - 140);
        ctx.lineTo(x + period, groundY);
      }
    }

    ctx.lineTo(width + 200, groundY);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  private drawHills(
    ctx: CanvasRenderingContext2D,
    offsetX: number,
    color: string,
    groundY: number,
    _biomeId: BiomeType,
    animTime: number
  ) {
    ctx.save();
    ctx.fillStyle = color;

    const width = GAME_CONSTANTS.CANVAS_WIDTH;
    const period = 280;
    const startX = -((offsetX % period) + period) % period;

    ctx.beginPath();
    ctx.moveTo(startX - 100, groundY);

    for (let x = startX - 100; x <= width + 100; x += period) {
      ctx.quadraticCurveTo(x + 70, groundY - 95, x + 140, groundY - 45);
      ctx.quadraticCurveTo(x + 210, groundY - 110, x + period, groundY);
    }

    ctx.lineTo(width + 100, groundY);
    ctx.closePath();
    ctx.fill();

    // Stylized trees on midground hills
    for (let x = startX - 100; x <= width + 100; x += 140) {
      this.drawTree(ctx, x + 40, groundY - 50, 0.6, animTime);
    }

    ctx.restore();
  }

  private drawTree(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, animTime: number) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    // Tree trunk
    ctx.fillStyle = '#5c2b14';
    ctx.fillRect(-5, 0, 10, 30);

    // Lush foliage with gentle sway
    const sway = Math.sin(animTime * 2 + x * 0.05) * 3;
    ctx.fillStyle = '#15803d';
    ctx.beginPath();
    ctx.arc(sway, -15, 24, 0, Math.PI * 2);
    ctx.arc(sway - 12, -4, 18, 0, Math.PI * 2);
    ctx.arc(sway + 12, -4, 18, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  private drawMidgroundProps(
    ctx: CanvasRenderingContext2D,
    offsetX: number,
    groundY: number,
    _biomeId: BiomeType,
    animTime: number
  ) {
    const width = GAME_CONSTANTS.CANVAS_WIDTH;
    const spacing = 190;
    const startX = -((offsetX % spacing) + spacing) % spacing;

    for (let x = startX - 50; x <= width + 50; x += spacing) {
      const propType = Math.abs(Math.floor(x / spacing)) % 3;
      if (propType === 0) {
        // Glowing little flowers
        ctx.fillStyle = '#ec4899';
        const bounce = Math.sin(animTime * 4 + x) * 2;
        ctx.beginPath();
        ctx.arc(x, groundY - 8 + bounce, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, groundY);
        ctx.lineTo(x, groundY - 8 + bounce);
        ctx.stroke();
      } else if (propType === 1) {
        // Small rustic rock
        ctx.fillStyle = '#94a3b8';
        ctx.beginPath();
        ctx.ellipse(x, groundY - 4, 12, 6, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  private drawGround(
    ctx: CanvasRenderingContext2D,
    cameraX: number,
    groundY: number,
    width: number,
    height: number,
    groundColor: string,
    grassColor: string,
    animTime: number
  ) {
    ctx.save();

    // Deep underground earth
    ctx.fillStyle = groundColor;
    ctx.fillRect(0, groundY, width, height - groundY);

    // Textured earth strata line
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fillRect(0, groundY + 24, width, height - groundY - 24);

    // Vibrant top grass / platform trim
    ctx.fillStyle = grassColor;
    ctx.beginPath();
    ctx.rect(0, groundY - 8, width, 18);
    ctx.fill();

    // Wavy grass blades along the surface
    const step = 20;
    const shift = -((cameraX % step) + step) % step;

    ctx.fillStyle = grassColor;
    ctx.beginPath();
    for (let x = shift - step; x <= width + step; x += step) {
      const bladeHeight = 6 + Math.sin(x * 0.1 + animTime * 3) * 3;
      ctx.moveTo(x, groundY - 8);
      ctx.lineTo(x + step / 2, groundY - 8 - bladeHeight);
      ctx.lineTo(x + step, groundY - 8);
    }
    ctx.fill();

    // Decorative pebbles in dirt
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    for (let x = shift; x <= width; x += 45) {
      ctx.beginPath();
      ctx.arc(x + 10, groundY + 36, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  private lerpColor(c1: string, c2: string, t: number): string {
    if (t <= 0) return c1;
    if (t >= 1) return c2;

    const rgb1 = this.hexToRgb(c1);
    const rgb2 = this.hexToRgb(c2);
    if (!rgb1 || !rgb2) return c1;

    const r = Math.round(rgb1.r + (rgb2.r - rgb1.r) * t);
    const g = Math.round(rgb1.g + (rgb2.g - rgb1.g) * t);
    const b = Math.round(rgb1.b + (rgb2.b - rgb1.b) * t);
    return `rgb(${r}, ${g}, ${b})`;
  }

  private hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const clean = hex.replace('#', '');
    if (clean.length === 3) {
      return {
        r: parseInt(clean[0] + clean[0], 16),
        g: parseInt(clean[1] + clean[1], 16),
        b: parseInt(clean[2] + clean[2], 16)
      };
    }
    if (clean.length === 6) {
      return {
        r: parseInt(clean.substring(0, 2), 16),
        g: parseInt(clean.substring(2, 4), 16),
        b: parseInt(clean.substring(4, 6), 16)
      };
    }
    return null;
  }
}
