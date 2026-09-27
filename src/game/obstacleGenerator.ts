import { BiomeType, Collectible, CollectibleType, Obstacle, ObstacleType, Platform, PowerUpType } from '../types';
import { BIOME_SEQUENCE, DISTANCE_PER_BIOME, GAME_CONSTANTS, POWERUP_CONFIG } from './constants';

export class ObstacleGenerator {
  private obstacles: Obstacle[] = [];
  private collectibles: Collectible[] = [];
  private platforms: Platform[] = [];
  private lastGeneratedX = 350;
  private obstacleCounter = 0;
  private lastPowerUpDistance = 0;

  constructor() {
    this.reset();
  }

  public reset() {
    this.obstacles = [];
    this.collectibles = [];
    this.platforms = [];
    this.lastGeneratedX = 420;
    this.obstacleCounter = 0;
    this.lastPowerUpDistance = 0;

    // Initial welcoming set of golden coins to grab immediately!
    for (let i = 0; i < 6; i++) {
      this.collectibles.push({
        id: `start_coin_${i}`,
        type: 'COIN',
        x: 180 + i * 45,
        y: GAME_CONSTANTS.GROUND_Y - 45,
        radius: 12,
        collected: false,
        bobOffset: i * 0.4,
        value: 10,
      });
    }

    // Pre-populate forward chunks
    this.update(0, true, 'FLORESTA_ENSOLARADA');
  }

  public getObstacles(): Obstacle[] {
    return this.obstacles;
  }

  public getCollectibles(): Collectible[] {
    return this.collectibles;
  }

  public getPlatforms(): Platform[] {
    return this.platforms;
  }

  public update(playerX: number, isModoGabriel: boolean, currentBiome: BiomeType = 'FLORESTA_ENSOLARADA') {
    const horizonX = playerX + GAME_CONSTANTS.CANVAS_WIDTH + 700;
    const minSpacing = isModoGabriel 
      ? GAME_CONSTANTS.MIN_OBSTACLE_SPACING_GABRIEL 
      : GAME_CONSTANTS.MIN_OBSTACLE_SPACING_NORMAL;

    // Procedurally generate new safe chunks ahead
    while (this.lastGeneratedX < horizonX) {
      // Pick obstacles suited to current biome
      const chosenType = this.pickObstacleForBiome(currentBiome, this.obstacleCounter);
      const obstacleX = this.lastGeneratedX + minSpacing + Math.random() * 110;
      
      const obstacle = this.createObstacle(chosenType, obstacleX, currentBiome);
      this.obstacles.push(obstacle);

      // Create an arc of 4-5 golden coins / gems directly above the obstacle to guide the leap
      this.spawnArcCollectibles(obstacleX + obstacle.width / 2, obstacle.height, currentBiome);

      // Procedurally spawn Power-Up capsules every ~280-380 meters
      const currentMeters = Math.floor(obstacleX / 36);
      if (currentMeters - this.lastPowerUpDistance > 260) {
        this.lastPowerUpDistance = currentMeters;
        this.spawnPowerUpCapsule(obstacleX - 180);
      }

      // 45% chance to generate a raised platform with rare gems (Ruby, Emerald, Diamond)
      if (Math.random() > 0.55) {
        const platX = obstacleX + 200;
        const platY = GAME_CONSTANTS.GROUND_Y - 95;
        const platW = 150;
        this.platforms.push({
          id: `plat_${this.obstacleCounter}`,
          x: platX,
          y: platY,
          width: platW,
          height: 18,
          biomeId: currentBiome,
        });

        // Collectibles on top of platform: Gems!
        const gemTypes: CollectibleType[] = ['GEM_RUBY', 'GEM_EMERALD', 'GEM_DIAMOND'];
        const chosenGem = gemTypes[Math.floor(Math.random() * gemTypes.length)];
        const gemValue = chosenGem === 'GEM_DIAMOND' ? 100 : chosenGem === 'GEM_EMERALD' ? 75 : 50;

        this.collectibles.push({
          id: `gem_plat_${this.obstacleCounter}`,
          type: chosenGem,
          x: platX + platW / 2,
          y: platY - 28,
          radius: 14,
          collected: false,
          bobOffset: 0,
          value: gemValue,
        });

        // Complementary coins flanking the gem
        [-38, 38].forEach((offset, idx) => {
          this.collectibles.push({
            id: `coin_plat_${this.obstacleCounter}_${idx}`,
            type: 'COIN',
            x: platX + platW / 2 + offset,
            y: platY - 24,
            radius: 11,
            collected: false,
            bobOffset: idx + 0.5,
            value: 10,
          });
        });
      }

      this.lastGeneratedX = obstacleX;
      this.obstacleCounter++;
    }

    // Clean up passed entities far behind camera
    const cleanupThreshold = playerX - 450;
    this.obstacles = this.obstacles.filter(o => o.x > cleanupThreshold);
    this.collectibles = this.collectibles.filter(c => c.x > cleanupThreshold && !c.collected);
    this.platforms = this.platforms.filter(p => p.x + p.width > cleanupThreshold);
  }

  private pickObstacleForBiome(biome: BiomeType, counter: number): ObstacleType {
    if (biome === 'CAVERNAS_CRISTAL') {
      const cavernTypes: ObstacleType[] = ['CRYSTAL_SPIKES', 'CRYSTAL_ROCK', 'QUARTZ_PILLAR'];
      return cavernTypes[counter % cavernTypes.length];
    } else if (biome === 'CIDADE_COSMICA') {
      const cosmicTypes: ObstacleType[] = ['NEON_BARRICADE', 'FLOATING_DROID', 'PLASMA_GATE'];
      return cosmicTypes[counter % cosmicTypes.length];
    } else if (biome === 'VALE_TECNOLOGICO') {
      const techTypes: ObstacleType[] = ['FRIENDLY_BOT', 'NEON_BARRICADE', 'BUBBLE_POD'];
      return techTypes[counter % techTypes.length];
    } else {
      // FLORESTA_ENSOLARADA and others
      const forestTypes: ObstacleType[] = ['LOG', 'MUSHROOM', 'WOODEN_FENCE'];
      return forestTypes[counter % forestTypes.length];
    }
  }

  private createObstacle(type: ObstacleType, x: number, biomeId: BiomeType): Obstacle {
    const id = `obs_${this.obstacleCounter}`;
    const groundY = GAME_CONSTANTS.GROUND_Y;

    switch (type) {
      case 'LOG':
        return {
          id,
          type,
          x,
          y: groundY - 42,
          width: 54,
          height: 42,
          name: 'Tronco Florido',
          cleared: false,
          waitingForJump: false,
          animationFrame: 0,
          biomeId,
        };
      case 'MUSHROOM':
        return {
          id,
          type,
          x,
          y: groundY - 44,
          width: 48,
          height: 44,
          name: 'Cogumelo Saltitante',
          cleared: false,
          waitingForJump: false,
          animationFrame: 0,
          biomeId,
        };
      case 'WOODEN_FENCE':
        return {
          id,
          type,
          x,
          y: groundY - 40,
          width: 52,
          height: 40,
          name: 'Cerca Florida',
          cleared: false,
          waitingForJump: false,
          animationFrame: 0,
          biomeId,
        };
      case 'CRYSTAL_SPIKES':
        return {
          id,
          type,
          x,
          y: groundY - 48,
          width: 50,
          height: 48,
          name: 'Cristais de Ametista',
          cleared: false,
          waitingForJump: false,
          animationFrame: 0,
          biomeId,
        };
      case 'CRYSTAL_ROCK':
        return {
          id,
          type,
          x,
          y: groundY - 46,
          width: 54,
          height: 46,
          name: 'Geodo de Rocha Mágica',
          cleared: false,
          waitingForJump: false,
          animationFrame: 0,
          biomeId,
        };
      case 'QUARTZ_PILLAR':
        return {
          id,
          type,
          x,
          y: groundY - 50,
          width: 44,
          height: 50,
          name: 'Pilar de Quartzo',
          cleared: false,
          waitingForJump: false,
          animationFrame: 0,
          biomeId,
        };
      case 'NEON_BARRICADE':
        return {
          id,
          type,
          x,
          y: groundY - 44,
          width: 52,
          height: 44,
          name: 'Barricada Neon',
          cleared: false,
          waitingForJump: false,
          animationFrame: 0,
          biomeId,
        };
      case 'FLOATING_DROID':
        return {
          id,
          type,
          x,
          y: groundY - 46,
          width: 46,
          height: 46,
          name: 'Droid Patrulheiro',
          cleared: false,
          waitingForJump: false,
          animationFrame: 0,
          biomeId,
        };
      case 'PLASMA_GATE':
        return {
          id,
          type,
          x,
          y: groundY - 48,
          width: 48,
          height: 48,
          name: 'Portão de Plasma',
          cleared: false,
          waitingForJump: false,
          animationFrame: 0,
          biomeId,
        };
      case 'FRIENDLY_BOT':
        return {
          id,
          type,
          x,
          y: groundY - 45,
          width: 46,
          height: 45,
          name: 'Robozinho Amigo',
          cleared: false,
          waitingForJump: false,
          animationFrame: 0,
          biomeId,
        };
      default:
        return {
          id,
          type: 'BUBBLE_POD',
          x,
          y: groundY - 44,
          width: 48,
          height: 44,
          name: 'Cápsula Mágica',
          cleared: false,
          waitingForJump: false,
          animationFrame: 0,
          biomeId,
        };
    }
  }

  private spawnArcCollectibles(centerX: number, obstacleHeight: number, biomeId: BiomeType) {
    // Parabolic arc of 4 items guiding the jump over the obstacle!
    const numItems = 4;
    const arcRadius = 78;
    const baseY = GAME_CONSTANTS.GROUND_Y - obstacleHeight - 36;

    for (let i = 0; i < numItems; i++) {
      const angle = Math.PI - (Math.PI / (numItems + 1)) * (i + 1);
      const itemX = centerX - Math.cos(angle) * arcRadius;
      const itemY = baseY - Math.sin(angle) * 58;

      // Peak item in the arc has a 40% chance of being a Gem!
      const isPeak = i === 1 || i === 2;
      let type: CollectibleType = 'COIN';
      let value = 10;

      if (isPeak && Math.random() > 0.6) {
        if (biomeId === 'CAVERNAS_CRISTAL') {
          type = 'GEM_DIAMOND';
          value = 100;
        } else if (biomeId === 'CIDADE_COSMICA') {
          type = 'GEM_EMERALD';
          value = 75;
        } else {
          type = 'GEM_RUBY';
          value = 50;
        }
      }

      this.collectibles.push({
        id: `arc_${this.obstacleCounter}_${i}`,
        type,
        x: itemX,
        y: itemY,
        radius: type === 'COIN' ? 12 : 14,
        collected: false,
        bobOffset: i * 0.35,
        value,
      });
    }
  }

  private spawnPowerUpCapsule(x: number) {
    const powerUps: PowerUpType[] = ['MAGNET', 'SHIELD', 'SUPER_JUMP', 'DOUBLE', 'TURBO'];
    const chosenPowerUp = powerUps[Math.floor(Math.random() * powerUps.length)];

    this.collectibles.push({
      id: `pwr_${this.obstacleCounter}`,
      type: 'POWERUP',
      powerUpType: chosenPowerUp,
      x,
      y: GAME_CONSTANTS.GROUND_Y - 60,
      radius: 20,
      collected: false,
      bobOffset: Math.random() * Math.PI,
      value: 150, // Bonus points on pickup!
    });
  }

  public render(
    ctx: CanvasRenderingContext2D,
    cameraX: number,
    animTime: number
  ) {
    // 1. RENDER PLATFORMS
    this.platforms.forEach((plat) => {
      const screenX = plat.x - cameraX;
      if (screenX < -200 || screenX > GAME_CONSTANTS.CANVAS_WIDTH + 200) return;

      ctx.save();
      if (plat.biomeId === 'CAVERNAS_CRISTAL') {
        // Crystal / Obsidian Platform
        ctx.fillStyle = '#6366f1';
        ctx.beginPath();
        ctx.roundRect(screenX, plat.y, plat.width, plat.height, [8, 8, 4, 4]);
        ctx.fill();

        ctx.fillStyle = '#1e1b4b';
        ctx.beginPath();
        ctx.roundRect(screenX, plat.y + 4, plat.width, plat.height - 4, [0, 0, 4, 4]);
        ctx.fill();

        ctx.strokeStyle = '#c084fc';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(screenX + 2, plat.y + 2);
        ctx.lineTo(screenX + plat.width - 2, plat.y + 2);
        ctx.stroke();
      } else if (plat.biomeId === 'CIDADE_COSMICA') {
        // High-tech Cyber Neon Glass Platform
        ctx.fillStyle = '#06b6d4';
        ctx.beginPath();
        ctx.roundRect(screenX, plat.y, plat.width, plat.height, [8, 8, 4, 4]);
        ctx.fill();

        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.roundRect(screenX, plat.y + 4, plat.width, plat.height - 4, [0, 0, 4, 4]);
        ctx.fill();

        ctx.strokeStyle = '#ec4899';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(screenX + 2, plat.y + 2);
        ctx.lineTo(screenX + plat.width - 2, plat.y + 2);
        ctx.stroke();
      } else {
        // Lush Forest wooden platform with grass trim
        ctx.fillStyle = '#15803d';
        ctx.beginPath();
        ctx.roundRect(screenX, plat.y, plat.width, plat.height, [8, 8, 4, 4]);
        ctx.fill();

        ctx.fillStyle = '#78350f';
        ctx.beginPath();
        ctx.roundRect(screenX, plat.y + 4, plat.width, plat.height - 4, [0, 0, 4, 4]);
        ctx.fill();

        ctx.strokeStyle = '#4ade80';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(screenX + 2, plat.y + 2);
        ctx.lineTo(screenX + plat.width - 2, plat.y + 2);
        ctx.stroke();
      }
      ctx.restore();
    });

    // 2. RENDER OBSTACLES
    this.obstacles.forEach((obs) => {
      const screenX = obs.x - cameraX;
      if (screenX < -150 || screenX > GAME_CONSTANTS.CANVAS_WIDTH + 150) return;

      ctx.save();
      ctx.translate(screenX, obs.y);

      this.drawObstacleGraphic(ctx, obs, animTime);

      // If Gabriel is currently stopped and waiting before this obstacle:
      // Show glowing arrow hint above the obstacle!
      if (obs.waitingForJump) {
        ctx.save();
        const pulse = Math.sin(animTime * 8) * 6;
        ctx.fillStyle = '#fde047';
        ctx.strokeStyle = '#eab308';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#facc15';
        ctx.shadowBlur = 12;

        ctx.beginPath();
        ctx.moveTo(obs.width / 2, -30 + pulse);
        ctx.lineTo(obs.width / 2 - 14, -15 + pulse);
        ctx.lineTo(obs.width / 2 - 5, -15 + pulse);
        ctx.lineTo(obs.width / 2 - 5, 0 + pulse);
        ctx.lineTo(obs.width / 2 + 5, 0 + pulse);
        ctx.lineTo(obs.width / 2 + 5, -15 + pulse);
        ctx.lineTo(obs.width / 2 + 14, -15 + pulse);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }

      ctx.restore();
    });

    // 3. RENDER COLLECTIBLES & POWER-UPS
    this.collectibles.forEach((item) => {
      if (item.collected) return;
      const screenX = item.x - cameraX;
      if (screenX < -100 || screenX > GAME_CONSTANTS.CANVAS_WIDTH + 100) return;

      const bob = Math.sin(animTime * 4 + item.bobOffset) * 4.5;

      ctx.save();
      ctx.translate(screenX, item.y + bob);

      if (item.type === 'COIN') {
        this.drawCoin(ctx, item.radius, animTime, item.bobOffset);
      } else if (item.type === 'GEM_RUBY') {
        this.drawFacetedGem(ctx, item.radius, '#ef4444', '#f87171', '#991b1b', animTime);
      } else if (item.type === 'GEM_EMERALD') {
        this.drawFacetedGem(ctx, item.radius, '#10b981', '#34d399', '#065f46', animTime);
      } else if (item.type === 'GEM_DIAMOND') {
        this.drawFacetedGem(ctx, item.radius, '#06b6d4', '#67e8f9', '#0e7490', animTime);
      } else if (item.type === 'POWERUP' && item.powerUpType) {
        this.drawPowerUpOrb(ctx, item.powerUpType, item.radius, animTime);
      }

      ctx.restore();
    });
  }

  /**
   * 3D Rotating Golden Coin with Metallic Sheen and Specular Reflections.
   */
  private drawCoin(ctx: CanvasRenderingContext2D, radius: number, animTime: number, offset: number) {
    const spin = Math.sin(animTime * 4 + offset);
    ctx.save();
    ctx.scale(Math.abs(spin) * 0.75 + 0.25, 1);

    // Outer gold ring
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 4.2;
    ctx.shadowColor = '#fde047';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.stroke();

    // Inner gold fill
    ctx.fillStyle = '#eab308';
    ctx.beginPath();
    ctx.arc(0, 0, radius - 2, 0, Math.PI * 2);
    ctx.fill();

    // Specular shine glint
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, radius - 2.5, -Math.PI * 0.65, -Math.PI * 0.15);
    ctx.stroke();

    // Embossed star in center
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.35, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  /**
   * 3D Faceted Sparkling Gem (Ruby, Emerald, Diamond).
   */
  private drawFacetedGem(
    ctx: CanvasRenderingContext2D,
    radius: number,
    mainColor: string,
    lightColor: string,
    darkColor: string,
    animTime: number
  ) {
    ctx.save();
    ctx.rotate(Math.sin(animTime * 3) * 0.12);

    // Glowing aura
    ctx.shadowColor = lightColor;
    ctx.shadowBlur = 12;

    const r = radius;

    // Upper table facet
    ctx.fillStyle = lightColor;
    ctx.beginPath();
    ctx.moveTo(0, -r * 1.3);
    ctx.lineTo(r * 0.9, -r * 0.4);
    ctx.lineTo(0, -r * 0.1);
    ctx.lineTo(-r * 0.9, -r * 0.4);
    ctx.closePath();
    ctx.fill();

    // Lower pavilion left facet
    ctx.fillStyle = mainColor;
    ctx.beginPath();
    ctx.moveTo(-r * 0.9, -r * 0.4);
    ctx.lineTo(0, -r * 0.1);
    ctx.lineTo(0, r * 1.3);
    ctx.closePath();
    ctx.fill();

    // Lower pavilion right facet
    ctx.fillStyle = darkColor;
    ctx.beginPath();
    ctx.moveTo(r * 0.9, -r * 0.4);
    ctx.lineTo(0, -r * 0.1);
    ctx.lineTo(0, r * 1.3);
    ctx.closePath();
    ctx.fill();

    // Specular sparkle flare
    const sparkAlpha = Math.abs(Math.sin(animTime * 6));
    ctx.fillStyle = `rgba(255, 255, 255, ${sparkAlpha * 0.9})`;
    ctx.beginPath();
    ctx.arc(-r * 0.3, -r * 0.6, 2.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  /**
   * Holographic Power-Up Orb with Floating Animated Icon.
   */
  private drawPowerUpOrb(
    ctx: CanvasRenderingContext2D,
    powerUpType: PowerUpType,
    radius: number,
    animTime: number
  ) {
    const config = POWERUP_CONFIG[powerUpType];
    ctx.save();

    // Outer pulsing holographic ring
    const pulse = Math.sin(animTime * 5) * 3;
    ctx.strokeStyle = config.color;
    ctx.lineWidth = 2.5;
    ctx.shadowColor = config.color;
    ctx.shadowBlur = 16;
    ctx.beginPath();
    ctx.arc(0, 0, radius + pulse, 0, Math.PI * 2);
    ctx.stroke();

    // Translucent gradient sphere body
    const orbGrad = ctx.createRadialGradient(-4, -4, 2, 0, 0, radius);
    orbGrad.addColorStop(0, 'rgba(255, 255, 255, 0.7)');
    orbGrad.addColorStop(0.5, config.color);
    orbGrad.addColorStop(1, 'rgba(15, 23, 42, 0.85)');
    ctx.fillStyle = orbGrad;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();

    // Orbiting electron sparkle
    const orbitAngle = animTime * 4;
    const orbitX = Math.cos(orbitAngle) * (radius + 6);
    const orbitY = Math.sin(orbitAngle) * (radius + 6) * 0.45;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(orbitX, orbitY, 2.8, 0, Math.PI * 2);
    ctx.fill();

    // Icon in center
    ctx.shadowBlur = 0;
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(config.icon, 0, 1);

    ctx.restore();
  }

  private drawObstacleGraphic(ctx: CanvasRenderingContext2D, obs: Obstacle, animTime: number) {
    const { width, height, type } = obs;

    if (type === 'LOG') {
      // Friendly wooden log with flowers and moss
      ctx.fillStyle = '#78350f';
      ctx.beginPath();
      ctx.roundRect(0, 0, width, height, [10, 10, 6, 6]);
      ctx.fill();

      // Wood bark grooves
      ctx.strokeStyle = '#451a03';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(6, 12);
      ctx.lineTo(width - 6, 12);
      ctx.moveTo(10, 24);
      ctx.lineTo(width - 10, 24);
      ctx.stroke();

      // Green moss patch
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.ellipse(width * 0.35, 4, 12, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      // Bright flowers on top
      ctx.fillStyle = '#f43f5e';
      ctx.beginPath();
      ctx.arc(14, -2, 5, 0, Math.PI * 2);
      ctx.arc(38, -3, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.arc(14, -2, 2, 0, Math.PI * 2);
      ctx.arc(38, -3, 2.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (type === 'MUSHROOM') {
      // Cute bouncy spotted mushroom
      const bounce = Math.sin(animTime * 4) * 2;
      // Stem
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.roundRect(width * 0.35, 16, width * 0.3, height - 16, 4);
      ctx.fill();

      // Cap
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(width * 0.5, 18 + bounce, width * 0.48, Math.PI, 0);
      ctx.fill();

      // White polka dots
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(width * 0.3, 10 + bounce, 4, 0, Math.PI * 2);
      ctx.arc(width * 0.5, 5 + bounce, 4.5, 0, Math.PI * 2);
      ctx.arc(width * 0.7, 10 + bounce, 3.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (type === 'WOODEN_FENCE') {
      // Rustic flower fence
      ctx.fillStyle = '#b45309';
      [8, 26, 44].forEach((px) => {
        ctx.beginPath();
        ctx.moveTo(px - 5, height);
        ctx.lineTo(px - 5, 8);
        ctx.lineTo(px, 0);
        ctx.lineTo(px + 5, 8);
        ctx.lineTo(px + 5, height);
        ctx.closePath();
        ctx.fill();
      });
      ctx.fillStyle = '#92400e';
      ctx.fillRect(0, 18, width, 8);

      // Sunflower
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(26, 18, 6.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#78350f';
      ctx.beginPath();
      ctx.arc(26, 18, 3.2, 0, Math.PI * 2);
      ctx.fill();
    } else if (type === 'CRYSTAL_SPIKES') {
      // Sharp glowing amethyst crystal cluster
      ctx.save();
      ctx.shadowColor = '#c084fc';
      ctx.shadowBlur = 10;

      // Dark geode base
      ctx.fillStyle = '#1e1b4b';
      ctx.beginPath();
      ctx.roundRect(2, height - 12, width - 4, 12, 4);
      ctx.fill();

      // 3 crystal spires
      const spires = [
        { x: 12, h: height * 0.75, w: 10, color: '#a855f7' },
        { x: 26, h: height * 0.95, w: 12, color: '#c084fc' },
        { x: 38, h: height * 0.65, w: 9, color: '#818cf8' },
      ];

      spires.forEach(s => {
        ctx.fillStyle = s.color;
        ctx.beginPath();
        ctx.moveTo(s.x - s.w / 2, height - 10);
        ctx.lineTo(s.x, height - s.h);
        ctx.lineTo(s.x + s.w / 2, height - 10);
        ctx.closePath();
        ctx.fill();

        // Shimmer face
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.beginPath();
        ctx.moveTo(s.x - s.w / 2, height - 10);
        ctx.lineTo(s.x, height - s.h);
        ctx.lineTo(s.x, height - 10);
        ctx.closePath();
        ctx.fill();
      });
      ctx.restore();
    } else if (type === 'CRYSTAL_ROCK') {
      // Stylized rock with glowing crystals
      ctx.fillStyle = '#475569';
      ctx.beginPath();
      ctx.moveTo(0, height);
      ctx.lineTo(8, 14);
      ctx.lineTo(width * 0.5, 0);
      ctx.lineTo(width - 6, 18);
      ctx.lineTo(width, height);
      ctx.closePath();
      ctx.fill();

      // Glowing amethyst crystals poking out
      ctx.fillStyle = '#c084fc';
      ctx.shadowColor = '#e879f9';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.moveTo(18, 12);
      ctx.lineTo(24, -8);
      ctx.lineTo(30, 12);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;
    } else if (type === 'QUARTZ_PILLAR') {
      // Luminescent Quartz Pillar
      ctx.save();
      ctx.shadowColor = '#818cf8';
      ctx.shadowBlur = 8;
      ctx.fillStyle = '#e0e7ff';
      ctx.beginPath();
      ctx.roundRect(6, 4, width - 12, height - 4, 6);
      ctx.fill();

      // Internal light core
      ctx.fillStyle = '#6366f1';
      ctx.fillRect(14, 12, width - 28, height - 20);

      // Glass shine
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.fillRect(8, 6, 4, height - 10);
      ctx.restore();
    } else if (type === 'NEON_BARRICADE') {
      // Cyber neon laser barricade
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(4, 8, 10, height - 8);
      ctx.fillRect(width - 14, 8, 10, height - 8);

      // Pulsing neon laser beams
      ctx.save();
      ctx.shadowColor = '#06b6d4';
      ctx.shadowBlur = 12;
      ctx.strokeStyle = '#22d3ee';
      ctx.lineWidth = 3.5;
      [14, 26, 38].forEach(by => {
        ctx.beginPath();
        ctx.moveTo(12, by);
        ctx.lineTo(width - 12, by);
        ctx.stroke();
      });
      ctx.restore();
    } else if (type === 'FLOATING_DROID') {
      // Hovering patrol droid with glowing eye
      const floatY = Math.sin(animTime * 6) * 4;
      ctx.save();
      ctx.translate(0, floatY);

      // Metal sphere body
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.arc(width / 2, height / 2, width * 0.42, 0, Math.PI * 2);
      ctx.fill();

      // Glowing blue central visor eye
      ctx.fillStyle = '#38bdf8';
      ctx.shadowColor = '#0284c7';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(width / 2, height / 2, 8, 0, Math.PI * 2);
      ctx.fill();

      // Thruster flame beneath
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.moveTo(width / 2 - 6, height / 2 + 18);
      ctx.lineTo(width / 2, height / 2 + 28);
      ctx.lineTo(width / 2 + 6, height / 2 + 18);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    } else if (type === 'PLASMA_GATE') {
      // Cosmic Plasma energy gate
      ctx.save();
      ctx.fillStyle = '#312e81';
      ctx.fillRect(6, 4, width - 12, height - 4);

      ctx.strokeStyle = '#ec4899';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#f43f5e';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(width / 2, height / 2, width * 0.35, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    } else if (type === 'FRIENDLY_BOT') {
      // Friendly rolling mini robot with happy digital screen
      ctx.fillStyle = '#0284c7';
      ctx.beginPath();
      ctx.roundRect(4, 8, width - 8, height - 16, 8);
      ctx.fill();

      // Robot screen
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.roundRect(10, 14, width - 20, 16, 4);
      ctx.fill();

      // Happy digital eyes (^_^)
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('^‿^', width / 2, 26);

      // Antenna with blinking light
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(width / 2, 8);
      ctx.lineTo(width / 2, 0);
      ctx.stroke();

      ctx.fillStyle = Math.sin(animTime * 6) > 0 ? '#22c55e' : '#facc15';
      ctx.beginPath();
      ctx.arc(width / 2, -1, 3.5, 0, Math.PI * 2);
      ctx.fill();

      // Rolling base wheels
      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.arc(12, height - 4, 6, 0, Math.PI * 2);
      ctx.arc(width - 12, height - 4, 6, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // BUBBLE_POD (Magical floating energy crystal)
      ctx.fillStyle = 'rgba(56, 189, 248, 0.4)';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = '#06b6d4';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(width / 2, height / 2, width * 0.42, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(width / 2 - 6, height / 2 - 6, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }
}
