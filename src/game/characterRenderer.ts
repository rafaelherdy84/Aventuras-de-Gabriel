import { ActivePowerUp, CharacterAction, PowerUpType } from '../types';

export interface RenderPlayerParams {
  ctx: CanvasRenderingContext2D;
  x: number;
  y: number;
  width: number;
  height: number;
  action: CharacterAction;
  facing: 1 | -1; // 1 = right, -1 = left
  animTime: number;
  squashX: number;
  squashY: number;
  waitingForObstacle: boolean;
  activePowerUps?: Partial<Record<PowerUpType, ActivePowerUp>>;
}

/**
 * Procedural 3D-styled Vector Renderer for Gabriel closely matching the attached image:
 * - Stylized lush 3D layered black swept hair with soft highlights
 * - Warm expressive face, large animated brown eyes with double catchlights, rosy cheeks
 * - Black tech-hoodie with golden graffiti doodles (crowns, wings, "ALIVE", smileys)
 * - Holding the illuminated blue handheld console with dynamic glow on chest & face
 * - 3D orbiting gold rings floating near his chest & hips
 * - Dark joggers with orange athletic side stripes
 * - High-top royal blue & vibrant orange sneakers with white midsoles and orange laces
 * - Power-up visual effects (Shield bubble, Magnetic flux, Energy Wings, Turbo trails)
 */
export function drawGabriel(params: RenderPlayerParams) {
  const { ctx, x, y, width, height, action, facing, animTime, squashX, squashY, waitingForObstacle, activePowerUps } = params;

  ctx.save();
  ctx.translate(x, y);

  // Power-up 1: Turbo trail afterimages behind player
  if (activePowerUps?.TURBO) {
    drawTurboTrails(ctx, facing, squashX, squashY, animTime);
  }

  ctx.scale(facing * squashX, squashY);

  // Animation cycle calculations
  const isRunning = action === 'RUN';
  const isWalking = action === 'WALK';
  const isJumping = action === 'JUMP';
  const isWaiting = action === 'WAITING_OBSTACLE' || waitingForObstacle;

  const runFreq = activePowerUps?.TURBO ? 24 : isRunning ? 16 : isWalking ? 10 : 3;
  const legCycle = Math.sin(animTime * runFreq);
  const armCycle = Math.cos(animTime * runFreq);
  const breathCycle = Math.sin(animTime * 3) * 2;
  const hairFloat = isJumping ? -5 : Math.sin(animTime * runFreq) * 2;

  // Base dimensions relative to center bottom (0, 0)
  const bodyY = -height * 0.48 + (isRunning ? Math.abs(Math.sin(animTime * runFreq)) * 3.8 : breathCycle * 0.4);
  const headY = bodyY - 32;

  // 1. SHADOW (Soft ellipse on ground)
  if (!isJumping) {
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.beginPath();
    ctx.ellipse(0, 0, width * 0.42 * squashX, 7.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Power-up 2: Golden Energy Wings for Super Jump (behind body)
  if (activePowerUps?.SUPER_JUMP) {
    drawEnergyWings(ctx, 0, bodyY - 10, animTime);
  }

  // 2. BACK LEG (Leg 1)
  drawLeg(ctx, {
    xOffset: -8,
    yBase: bodyY + 12,
    angle: isJumping ? 0.35 : (isRunning || isWalking) ? -legCycle * 0.75 : isWaiting ? 0.05 : 0,
    kneeBend: isJumping ? 0.5 : (isRunning ? Math.max(0, legCycle) * 0.65 : 0),
    isBack: true
  });

  // 3. BACK ARM
  drawArm(ctx, {
    xOffset: -12,
    yBase: bodyY - 14,
    angle: isJumping ? -0.8 : (isRunning || isWalking) ? armCycle * 0.7 : -0.2,
    holdingDevice: false,
    animTime,
    isBack: true
  });

  // 4. TORSO & HOODIE (Dark streetwear hoodie with gold graffiti decals)
  ctx.save();
  ctx.translate(0, bodyY);

  // Hoodie main body
  ctx.fillStyle = '#18181b'; // zinc-900 dark jacket
  ctx.beginPath();
  ctx.roundRect(-16, -22, 32, 36, [10, 10, 6, 6]);
  ctx.fill();

  // Subtle 3D volume gradient
  const jacketGrad = ctx.createLinearGradient(-16, -22, 16, 14);
  jacketGrad.addColorStop(0, 'rgba(255, 255, 255, 0.12)');
  jacketGrad.addColorStop(1, 'rgba(0, 0, 0, 0.28)');
  ctx.fillStyle = jacketGrad;
  ctx.fill();

  // Orange zipper & athletic trim
  ctx.strokeStyle = '#f97316'; // vibrant orange
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(0, -22);
  ctx.lineTo(0, 14);
  ctx.stroke();

  // Orange side diagonal strap
  ctx.strokeStyle = '#ea580c';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-14, -6);
  ctx.lineTo(6, 12);
  ctx.stroke();

  // Golden graffiti doodles (Crown 👑, "ALIVE", and wings inspired by attached image)
  ctx.save();
  ctx.strokeStyle = '#facc15';
  ctx.fillStyle = '#facc15';
  ctx.lineWidth = 1.4;

  // Tiny Crown doodle on left chest
  ctx.beginPath();
  ctx.moveTo(-12, -12);
  ctx.lineTo(-12, -16);
  ctx.lineTo(-9, -13);
  ctx.lineTo(-6, -17);
  ctx.lineTo(-3, -13);
  ctx.lineTo(0, -16);
  ctx.lineTo(0, -12);
  ctx.closePath();
  ctx.stroke();

  // Golden graffiti "ALIVE" text doodle on jacket
  ctx.font = 'bold 6px sans-serif';
  ctx.fillText('ALIVE', -13, 0);

  // Tiny golden wings doodle
  ctx.beginPath();
  ctx.moveTo(-11, 4);
  ctx.quadraticCurveTo(-6, 2, -2, 5);
  ctx.quadraticCurveTo(-7, 8, -11, 4);
  ctx.stroke();
  ctx.restore();

  // Golden Ring attachment on jacket hip loop (iconic to Gabriel reference)
  ctx.save();
  ctx.strokeStyle = '#eab308';
  ctx.lineWidth = 2.5;
  ctx.shadowColor = '#fde047';
  ctx.shadowBlur = 5;
  ctx.beginPath();
  ctx.arc(10, 10, 5.5, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // Hood folded back
  ctx.fillStyle = '#27272a';
  ctx.beginPath();
  ctx.ellipse(0, -22, 14, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 5. FRONT LEG (Leg 2)
  drawLeg(ctx, {
    xOffset: 6,
    yBase: bodyY + 12,
    angle: isJumping ? -0.4 : (isRunning || isWalking) ? legCycle * 0.75 : isWaiting ? (Math.sin(animTime * 8) * 0.15) : 0,
    kneeBend: isJumping ? 0.3 : (isRunning ? Math.max(0, -legCycle) * 0.65 : 0),
    isBack: false
  });

  // 6. FRONT ARM & HANDHELD GAME CONSOLE (with glowing screen illuminating Gabriel)
  drawArm(ctx, {
    xOffset: 10,
    yBase: bodyY - 14,
    angle: isJumping ? 0.45 : (isRunning || isWalking) ? -armCycle * 0.6 : 0.4,
    holdingDevice: true,
    animTime,
    isBack: false
  });

  // 7. 3D ORBITING GOLD RINGS (From Gabriel's reference image!)
  drawFloatingGoldRings(ctx, 4, bodyY - 4, animTime);

  // 8. HEAD & FACE
  ctx.save();
  ctx.translate(0, headY);

  // Neck
  ctx.fillStyle = '#fcd34d'; // warm skin tone
  ctx.fillRect(-5, 12, 10, 8);

  // Face head base with soft 3D shading
  ctx.fillStyle = '#fde047'; // warm kid skin
  ctx.beginPath();
  ctx.arc(0, 0, 19.5, 0, Math.PI * 2);
  ctx.fill();

  // Soft chin shadow / light gradient
  const faceShade = ctx.createRadialGradient(-3, -4, 2, 0, 0, 20);
  faceShade.addColorStop(0, 'rgba(255, 255, 255, 0.25)');
  faceShade.addColorStop(0.8, 'rgba(245, 158, 11, 0.12)');
  faceShade.addColorStop(1, 'rgba(180, 83, 9, 0.25)');
  ctx.fillStyle = faceShade;
  ctx.beginPath();
  ctx.arc(0, 0, 19.5, 0, Math.PI * 2);
  ctx.fill();

  // Cyan screen illumination on chin from handheld console!
  ctx.save();
  ctx.fillStyle = 'rgba(6, 182, 212, 0.18)';
  ctx.beginPath();
  ctx.arc(4, 12, 11, 0, Math.PI);
  ctx.fill();
  ctx.restore();

  // Rosy cheeks
  ctx.fillStyle = 'rgba(244, 63, 94, 0.38)'; // soft pink blush
  ctx.beginPath();
  ctx.arc(-11, 4, 4.8, 0, Math.PI * 2);
  ctx.arc(11, 4, 4.8, 0, Math.PI * 2);
  ctx.fill();

  // Eyes (Big expressive brown Pixar/anime eyes with double shine)
  const eyeBlink = Math.sin(animTime * 1.5) > 0.96;
  if (eyeBlink) {
    ctx.strokeStyle = '#1c1917';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(-7, -2, 5, 0.2, Math.PI - 0.2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(7, -2, 5, 0.2, Math.PI - 0.2);
    ctx.stroke();
  } else {
    [-7, 7].forEach((eyeX) => {
      // White sclera
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(eyeX, -2, 5.6, 7.2, 0, 0, Math.PI * 2);
      ctx.fill();

      // Brown Iris with amber gradient
      const irisGrad = ctx.createRadialGradient(eyeX + 1, -2, 1, eyeX + 1, -2, 5);
      irisGrad.addColorStop(0, '#78350f');
      irisGrad.addColorStop(0.7, '#451a03');
      irisGrad.addColorStop(1, '#1c1917');
      ctx.fillStyle = irisGrad;
      ctx.beginPath();
      ctx.ellipse(eyeX + 1, -1.5, 4.2, 5.4, 0, 0, Math.PI * 2);
      ctx.fill();

      // Pupil
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(eyeX + 1.2, -1.5, 2.6, 0, Math.PI * 2);
      ctx.fill();

      // Double Sparkle catchlights
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(eyeX + 0.2, -3.2, 2.0, 0, Math.PI * 2);
      ctx.arc(eyeX + 2.6, -0.4, 1.0, 0, Math.PI * 2);
      ctx.fill();
    });

    // Eyebrows
    ctx.strokeStyle = '#18181b';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    if (isWaiting) {
      ctx.arc(-7, -10, 6, -0.4, 0.4);
      ctx.arc(7, -11, 6, -0.2, 0.5);
    } else {
      ctx.arc(-7, -9.5, 6, -0.2, 0.4);
      ctx.arc(7, -9.5, 6, -0.4, 0.2);
    }
    ctx.stroke();
  }

  // Nose (cute soft button nose)
  ctx.fillStyle = '#f59e0b';
  ctx.beginPath();
  ctx.ellipse(0, 2.5, 2.2, 1.3, 0, 0, Math.PI * 2);
  ctx.fill();

  // Cheerful smile
  ctx.strokeStyle = '#991b1b';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  if (isJumping) {
    ctx.fillStyle = '#ef4444';
    ctx.arc(0, 5, 5.2, 0, Math.PI);
    ctx.fill();
    ctx.stroke();
  } else {
    ctx.arc(0, 5, 6.2, 0.15, Math.PI - 0.15);
    ctx.stroke();
  }

  // HAIR: Stylized 3D layered black swept hair with volume & shine
  ctx.fillStyle = '#18181b';
  ctx.beginPath();
  ctx.arc(0, -5 + hairFloat * 0.3, 21.5, Math.PI, 0); // top dome
  ctx.lineTo(22, 6);
  ctx.quadraticCurveTo(16, 2, 14, -6);
  ctx.quadraticCurveTo(8, 2, 0, -4); // center front fringe
  ctx.quadraticCurveTo(-8, 3, -15, -6);
  ctx.lineTo(-22, 6);
  ctx.closePath();
  ctx.fill();

  // Hair volume spikes & flow
  ctx.beginPath();
  ctx.moveTo(-18, -12);
  ctx.quadraticCurveTo(-24, -28 + hairFloat, -10, -29 + hairFloat);
  ctx.quadraticCurveTo(-4, -36 + hairFloat, 6, -32 + hairFloat);
  ctx.quadraticCurveTo(19, -33 + hairFloat, 21, -19 + hairFloat);
  ctx.quadraticCurveTo(25, -8, 22, 4);
  ctx.lineTo(16, -10);
  ctx.quadraticCurveTo(0, -22, -18, -12);
  ctx.closePath();
  ctx.fill();

  // Glossy 3D hair highlight arc
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.32)';
  ctx.lineWidth = 2.8;
  ctx.beginPath();
  ctx.arc(2, -22 + hairFloat, 13, -Math.PI * 0.72, -Math.PI * 0.18);
  ctx.stroke();

  // Power-up 3: Double Points Crown above head
  if (activePowerUps?.DOUBLE) {
    drawStarCrown(ctx, 0, -42 + hairFloat, animTime);
  }

  ctx.restore(); // Head

  // Power-up 4: Protective Hexagonal Energy Shield
  if (activePowerUps?.SHIELD) {
    drawHexShield(ctx, 0, bodyY, animTime);
  }

  // Power-up 5: Cosmic Magnet Aura
  if (activePowerUps?.MAGNET) {
    drawMagneticAura(ctx, 0, bodyY, animTime);
  }

  // 9. WAITING FOR OBSTACLE: Friendly indicator above head
  if (isWaiting) {
    drawJumpPrompt(ctx, 0, headY - 46, animTime);
  }

  ctx.restore();
}

/**
 * 3D Orbiting Gold Rings from the Gabriel reference image.
 */
function drawFloatingGoldRings(ctx: CanvasRenderingContext2D, x: number, y: number, animTime: number) {
  ctx.save();
  ctx.translate(x, y);

  // Ring 1: floating near chest/hands
  const ring1X = 14 + Math.sin(animTime * 3) * 6;
  const ring1Y = -4 + Math.cos(animTime * 3) * 4;
  const spin1 = Math.sin(animTime * 4);

  ctx.save();
  ctx.translate(ring1X, ring1Y);
  ctx.scale(Math.abs(spin1) * 0.7 + 0.3, 1);
  ctx.strokeStyle = '#facc15';
  ctx.lineWidth = 2.8;
  ctx.shadowColor = '#fde047';
  ctx.shadowBlur = 6;
  ctx.beginPath();
  ctx.arc(0, 0, 7.5, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // Ring 2: floating slightly higher
  const ring2X = -12 + Math.cos(animTime * 2.5) * 5;
  const ring2Y = -18 + Math.sin(animTime * 2.5) * 4;
  const spin2 = Math.cos(animTime * 3.5);

  ctx.save();
  ctx.translate(ring2X, ring2Y);
  ctx.scale(Math.abs(spin2) * 0.7 + 0.3, 1);
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 2.4;
  ctx.shadowColor = '#facc15';
  ctx.shadowBlur = 5;
  ctx.beginPath();
  ctx.arc(0, 0, 6, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  ctx.restore();
}

/**
 * Visual Hexagonal Holographic Shield Bubble.
 */
function drawHexShield(ctx: CanvasRenderingContext2D, x: number, y: number, animTime: number) {
  ctx.save();
  ctx.translate(x, y);

  const radius = 46;
  const pulse = Math.sin(animTime * 6) * 2;

  // Outer glowing aura
  ctx.shadowColor = '#818cf8';
  ctx.shadowBlur = 18;
  ctx.strokeStyle = 'rgba(129, 140, 248, 0.85)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, 0, radius + pulse, 0, Math.PI * 2);
  ctx.stroke();

  // Glassy spherical gradient
  const shieldGrad = ctx.createRadialGradient(0, 0, 10, 0, 0, radius + pulse);
  shieldGrad.addColorStop(0, 'rgba(99, 102, 241, 0.08)');
  shieldGrad.addColorStop(0.7, 'rgba(129, 140, 248, 0.18)');
  shieldGrad.addColorStop(1, 'rgba(168, 85, 247, 0.35)');
  ctx.fillStyle = shieldGrad;
  ctx.fill();

  // Specular light glint on top left
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.beginPath();
  ctx.ellipse(-16, -18, 12, 5, -0.6, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * Glowing Energy Wings for Super Jump.
 */
function drawEnergyWings(ctx: CanvasRenderingContext2D, x: number, y: number, animTime: number) {
  ctx.save();
  ctx.translate(x, y);

  const flap = Math.sin(animTime * 8) * 0.25;

  [-1, 1].forEach((side) => {
    ctx.save();
    ctx.scale(side, 1);
    ctx.rotate(flap);

    ctx.fillStyle = 'rgba(250, 204, 21, 0.55)';
    ctx.strokeStyle = '#fde047';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#facc15';
    ctx.shadowBlur = 12;

    ctx.beginPath();
    ctx.moveTo(8, 0);
    ctx.quadraticCurveTo(28, -25, 42, -18);
    ctx.quadraticCurveTo(32, -5, 26, 4);
    ctx.quadraticCurveTo(32, 10, 22, 18);
    ctx.quadraticCurveTo(14, 10, 8, 4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  });

  ctx.restore();
}

/**
 * Magnetic Flux rings around Gabriel.
 */
function drawMagneticAura(ctx: CanvasRenderingContext2D, x: number, y: number, animTime: number) {
  ctx.save();
  ctx.translate(x, y);

  for (let i = 0; i < 3; i++) {
    const ringRadius = 24 + ((animTime * 35 + i * 20) % 36);
    const alpha = Math.max(0, 1 - ringRadius / 60);

    ctx.strokeStyle = `rgba(56, 189, 248, ${alpha * 0.8})`;
    ctx.lineWidth = 2;
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(0, 0, ringRadius, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * Star Crown for Double Points.
 */
function drawStarCrown(ctx: CanvasRenderingContext2D, x: number, y: number, animTime: number) {
  ctx.save();
  ctx.translate(x, y + Math.sin(animTime * 5) * 3);

  ctx.fillStyle = '#facc15';
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.5;
  ctx.shadowColor = '#fde047';
  ctx.shadowBlur = 10;

  ctx.beginPath();
  ctx.moveTo(-14, 0);
  ctx.lineTo(-14, -12);
  ctx.lineTo(-7, -6);
  ctx.lineTo(0, -16);
  ctx.lineTo(7, -6);
  ctx.lineTo(14, -12);
  ctx.lineTo(14, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Floating "2X" text
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#ec4899';
  ctx.font = 'bold 11px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('2X', 0, -2);

  ctx.restore();
}

/**
 * Turbo motion trails behind runner.
 */
function drawTurboTrails(ctx: CanvasRenderingContext2D, facing: number, squashX: number, squashY: number, animTime: number) {
  ctx.save();
  for (let i = 1; i <= 3; i++) {
    ctx.save();
    ctx.translate(-i * 18 * facing, 0);
    ctx.scale(facing * squashX, squashY);
    ctx.globalAlpha = 0.35 / i;

    // Glowing speed lines
    ctx.strokeStyle = i % 2 === 0 ? '#38bdf8' : '#f97316';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-20, -30);
    ctx.lineTo(15, -30);
    ctx.moveTo(-28, -15);
    ctx.lineTo(10, -15);
    ctx.moveTo(-22, 0);
    ctx.lineTo(8, 0);
    ctx.stroke();

    ctx.restore();
  }
  ctx.restore();
}

/**
 * Draws Gabriel's leg with stylish joggers and electric blue + neon orange high-top sneakers.
 */
function drawLeg(
  ctx: CanvasRenderingContext2D,
  options: {
    xOffset: number;
    yBase: number;
    angle: number;
    kneeBend: number;
    isBack: boolean;
  }
) {
  const { xOffset, yBase, angle, kneeBend, isBack } = options;
  ctx.save();
  ctx.translate(xOffset, yBase);
  ctx.rotate(angle);

  // Thigh & Shin (Black jogger pants)
  ctx.fillStyle = isBack ? '#18181b' : '#27272a';
  ctx.beginPath();
  ctx.roundRect(-6, 0, 11, 24, 4);
  ctx.fill();

  // Orange athletic side stripe on front jogger
  if (!isBack) {
    ctx.strokeStyle = '#ea580c';
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.moveTo(3, 2);
    ctx.lineTo(3, 22);
    ctx.stroke();
  }

  // Shin section bending
  ctx.save();
  ctx.translate(0, 20);
  ctx.rotate(kneeBend);

  ctx.fillStyle = isBack ? '#18181b' : '#27272a';
  ctx.beginPath();
  ctx.roundRect(-5, 0, 10, 16, 3);
  ctx.fill();

  // High-top sneaker! (Royal Blue upper, bright orange sole and accents, white midsole)
  ctx.save();
  ctx.translate(0, 14);

  // Sneaker Upper (Vibrant Royal Blue #2563eb)
  ctx.fillStyle = isBack ? '#1d4ed8' : '#2563eb';
  ctx.beginPath();
  ctx.roundRect(-6, -4, 18, 14, [4, 6, 2, 2]);
  ctx.fill();

  // Orange tongue / collar
  ctx.fillStyle = '#f97316';
  ctx.fillRect(-4, -6, 8, 4);

  // White midsole
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(-7, 8, 20, 3);

  // Neon orange thick outsole
  ctx.fillStyle = '#ea580c';
  ctx.beginPath();
  ctx.roundRect(-8, 11, 22, 4, [0, 0, 3, 3]);
  ctx.fill();

  // Orange laces detail
  ctx.strokeStyle = '#fed7aa';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(-1, 0);
  ctx.lineTo(4, 0);
  ctx.moveTo(0, 3);
  ctx.lineTo(5, 3);
  ctx.stroke();

  ctx.restore(); // Sneaker
  ctx.restore(); // Shin
  ctx.restore(); // Leg base
}

/**
 * Draws Gabriel's arm with fingerless gloves and glowing handheld game console.
 */
function drawArm(
  ctx: CanvasRenderingContext2D,
  options: {
    xOffset: number;
    yBase: number;
    angle: number;
    holdingDevice: boolean;
    animTime: number;
    isBack: boolean;
  }
) {
  const { xOffset, yBase, angle, holdingDevice, animTime, isBack } = options;
  ctx.save();
  ctx.translate(xOffset, yBase);
  ctx.rotate(angle);

  // Arm sleeve (black jacket)
  ctx.fillStyle = isBack ? '#18181b' : '#27272a';
  ctx.beginPath();
  ctx.roundRect(-5, 0, 10, 20, 4);
  ctx.fill();

  // Forearm & Glove
  ctx.save();
  ctx.translate(0, 16);

  // Navy/dark fingerless glove with blue trim
  ctx.fillStyle = '#1e3a8a';
  ctx.beginPath();
  ctx.roundRect(-4, 0, 9, 10, 3);
  ctx.fill();

  // Skin tone fingers
  ctx.fillStyle = '#fcd34d';
  ctx.fillRect(-3, 8, 7, 5);

  // If front arm, draw the futuristic handheld device!
  if (holdingDevice) {
    ctx.save();
    ctx.translate(2, 6);

    // Mini console body (slate dark blue)
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.roundRect(-10, -8, 20, 14, 3);
    ctx.fill();

    // Glowing cyan screen
    ctx.fillStyle = '#06b6d4';
    ctx.shadowColor = '#22d3ee';
    ctx.shadowBlur = 10;
    ctx.fillRect(-8, -6, 12, 10);

    // Glowing buttons on console
    ctx.fillStyle = '#f97316';
    ctx.beginPath();
    ctx.arc(6, -2, 2.2, 0, Math.PI * 2);
    ctx.fill();

    // Directional D-Pad on left of console screen
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(-6, -2, 4, 2);
    ctx.fillRect(-5, -3, 2, 4);

    // Screen scanline animation
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    const scanY = -6 + ((animTime * 18) % 10);
    ctx.fillRect(-8, scanY, 12, 1.5);

    ctx.restore();
  }

  ctx.restore();
  ctx.restore();
}

/**
 * Visual bouncy "PULE! ⬆" prompt over Gabriel when waiting at an obstacle.
 */
function drawJumpPrompt(ctx: CanvasRenderingContext2D, x: number, y: number, animTime: number) {
  ctx.save();
  const bounce = Math.sin(animTime * 6) * 5;
  ctx.translate(x, y + bounce);

  // Glowing bubble container
  ctx.shadowColor = '#facc15';
  ctx.shadowBlur = 14;
  ctx.fillStyle = '#facc15';
  ctx.beginPath();
  ctx.roundRect(-38, -25, 76, 32, 16);
  ctx.fill();

  // Bubble border
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // Little speech triangle
  ctx.fillStyle = '#facc15';
  ctx.beginPath();
  ctx.moveTo(-6, 7);
  ctx.lineTo(6, 7);
  ctx.lineTo(0, 14);
  ctx.closePath();
  ctx.fill();

  // Text "PULE! ⬆"
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#78350f';
  ctx.font = 'bold 15px "Fredoka", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('PULE! ⬆', 0, -9);

  ctx.restore();
}

