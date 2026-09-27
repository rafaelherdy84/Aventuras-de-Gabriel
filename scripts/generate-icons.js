import fs from 'fs';
import zlib from 'zlib';

function createPNG(width, height, drawFn) {
  // RGBA buffer (4 bytes per pixel) + 1 filter byte per scanline
  const scanlineLength = width * 4 + 1;
  const rawData = Buffer.alloc(scanlineLength * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * scanlineLength;
    rawData[rowOffset] = 0; // Filter type 0 (None)
    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * 4;
      const [r, g, b, a] = drawFn(x, y, width, height);
      rawData[pixelOffset] = r;
      rawData[pixelOffset + 1] = g;
      rawData[pixelOffset + 2] = b;
      rawData[pixelOffset + 3] = a;
    }
  }

  const compressed = zlib.deflateSync(rawData);

  // PNG Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // Bit depth: 8
  ihdr[9] = 6; // Color type: 6 (RGBA)
  ihdr[10] = 0; // Compression
  ihdr[11] = 0; // Filter
  ihdr[12] = 0; // Interlace
  const ihdrChunk = createChunk('IHDR', ihdr);

  // IDAT chunk
  const idatChunk = createChunk('IDAT', compressed);

  // IEND chunk
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
  const length = data.length;
  const buffer = Buffer.alloc(12 + length);
  buffer.writeUInt32BE(length, 0);
  buffer.write(type, 4, 4, 'ascii');
  data.copy(buffer, 8);
  const crc = crc32(buffer.subarray(4, 8 + length));
  buffer.writeUInt32BE(crc, 8 + length);
  return buffer;
}

// Standard CRC32 table
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

// Procedural Gabriel Icon renderer
function drawGabrielIcon(x, y, w, h, isMaskable = false) {
  const nx = x / w;
  const ny = y / h;

  // Normalized distance from center
  const dx = nx - 0.5;
  const dy = ny - 0.5;
  const dist = Math.sqrt(dx * dx + dy * dy);

  // 1. Background gradient (sky blue to indigo dark navy)
  const bgT = Math.min(1, Math.max(0, ny * 1.1 - 0.05));
  let r = Math.round(56 * (1 - bgT) + 15 * bgT);
  let g = Math.round(189 * (1 - bgT) + 23 * bgT);
  let b = Math.round(248 * (1 - bgT) + 75 * bgT);
  let a = 255;

  // Outer corner rounding if not maskable
  if (!isMaskable) {
    const rx = Math.max(0, Math.abs(dx) - 0.36);
    const ry = Math.max(0, Math.abs(dy) - 0.36);
    const cornerDist = Math.sqrt(rx * rx + ry * ry);
    if (cornerDist > 0.12) {
      return [0, 0, 0, 0];
    }
    // Gold border
    if (cornerDist > 0.09 || Math.abs(dx) > 0.46 || Math.abs(dy) > 0.46) {
      return [250, 204, 21, 255];
    }
  }

  // 2. Halo Glow behind head
  if (dist < 0.38) {
    const glowIntensity = (1 - dist / 0.38) * 0.4;
    r = Math.min(255, Math.round(r + 253 * glowIntensity));
    g = Math.min(255, Math.round(g + 224 * glowIntensity));
    b = Math.min(255, Math.round(b + 71 * glowIntensity));
  }

  // 3. Body & Black Jacket
  const bodyDy = ny - 0.82;
  const bodyDx = Math.abs(dx);
  if (bodyDy > 0 && bodyDx < 0.35 + bodyDy * 0.5) {
    // Zipper line in middle
    if (bodyDx < 0.018) {
      return [249, 115, 22, 255]; // Orange zipper
    }
    // Crown patch
    if (dx > -0.22 && dx < -0.10 && ny > 0.78 && ny < 0.86) {
      return [250, 204, 21, 255];
    }
    return [24, 24, 27, 255]; // Black jacket
  }

  // 4. Gabriel's Face (Yellow cute round face)
  const faceDx = dx;
  const faceDy = (ny - 0.48) * 1.15;
  const faceDist = Math.sqrt(faceDx * faceDx + faceDy * faceDy);

  if (faceDist < 0.22) {
    // Rosy cheeks
    const cheek1Dist = Math.sqrt((dx + 0.13) * (dx + 0.13) + (ny - 0.53) * (ny - 0.53));
    const cheek2Dist = Math.sqrt((dx - 0.13) * (dx - 0.13) + (ny - 0.53) * (ny - 0.53));
    if (cheek1Dist < 0.045 || cheek2Dist < 0.045) {
      return [244, 63, 94, 255]; // Rosy pink
    }

    // Eyes
    const eye1Dx = Math.abs(dx + 0.09);
    const eye2Dx = Math.abs(dx - 0.09);
    const eyeDy = Math.abs(ny - 0.44);

    // Left eye
    if (Math.sqrt(eye1Dx * eye1Dx + eyeDy * eyeDy * 0.7) < 0.04) {
      // Sparkle
      if (Math.sqrt((dx + 0.10) * (dx + 0.10) + (ny - 0.425) * (ny - 0.425)) < 0.012) {
        return [255, 255, 255, 255];
      }
      return [15, 23, 42, 255]; // Dark eye
    }

    // Right eye
    if (Math.sqrt(eye2Dx * eye2Dx + eyeDy * eyeDy * 0.7) < 0.04) {
      // Sparkle
      if (Math.sqrt((dx - 0.08) * (dx - 0.08) + (ny - 0.425) * (ny - 0.425)) < 0.012) {
        return [255, 255, 255, 255];
      }
      return [15, 23, 42, 255];
    }

    // Happy Mouth Smile
    const mouthDist = Math.sqrt(dx * dx + (ny - 0.53) * (ny - 0.53));
    if (mouthDist < 0.045 && ny > 0.53) {
      return [239, 68, 68, 255]; // Bright red smile
    }

    return [253, 224, 71, 255]; // Vibrant warm yellow face
  }

  // 5. Swept Hair (Black swoosh on top)
  const hairDx = dx;
  const hairDy = ny - 0.32;
  if (hairDy < 0.08 && Math.abs(hairDx) < 0.25 && (hairDy > -0.16 || (hairDy > -0.22 && Math.abs(hairDx) < 0.16))) {
    // Hair highlight streak
    if (hairDy > -0.14 && hairDy < -0.09 && dx > -0.08 && dx < 0.10) {
      return [100, 116, 139, 255]; // Hair reflection
    }
    return [24, 24, 27, 255];
  }

  // 6. Floating Star badge on bottom right
  const starDx = nx - 0.78;
  const starDy = ny - 0.78;
  const starDist = Math.sqrt(starDx * starDx + starDy * starDy);
  if (starDist < 0.14) {
    if (starDist > 0.11) {
      return [217, 119, 6, 255];
    }
    if (starDist < 0.06) {
      return [255, 255, 255, 255];
    }
    return [250, 204, 21, 255];
  }

  // Little twinkle stars
  const t1 = Math.sqrt((nx - 0.2) * (nx - 0.2) + (ny - 0.22) * (ny - 0.22));
  if (t1 < 0.02) return [255, 255, 255, 255];
  const t2 = Math.sqrt((nx - 0.8) * (nx - 0.8) + (ny - 0.28) * (ny - 0.28));
  if (t2 < 0.025) return [250, 204, 21, 255];

  return [r, g, b, a];
}

// Generate the icons!
fs.mkdirSync('public', { recursive: true });

console.log('Generating PWA icons...');

// 1. 192x192 PNG
const png192 = createPNG(192, 192, (x, y, w, h) => drawGabrielIcon(x, y, w, h, false));
fs.writeFileSync('public/pwa-192x192.png', png192);
fs.writeFileSync('public/icon-192.png', png192);

// 2. 512x512 PNG
const png512 = createPNG(512, 512, (x, y, w, h) => drawGabrielIcon(x, y, w, h, false));
fs.writeFileSync('public/pwa-512x512.png', png512);
fs.writeFileSync('public/icon-512.png', png512);

// 3. 512x512 Maskable PNG (full bleed background for Android squircles)
const pngMaskable = createPNG(512, 512, (x, y, w, h) => drawGabrielIcon(x, y, w, h, true));
fs.writeFileSync('public/pwa-maskable-512x512.png', pngMaskable);

// 4. 180x180 Apple Touch Icon (iOS Safari home screen icon)
const appleIcon = createPNG(180, 180, (x, y, w, h) => drawGabrielIcon(x, y, w, h, false));
fs.writeFileSync('public/apple-touch-icon.png', appleIcon);

// 5. 64x64 favicon
const favPng = createPNG(64, 64, (x, y, w, h) => drawGabrielIcon(x, y, w, h, false));
fs.writeFileSync('public/favicon.ico', favPng);

console.log('All icons generated successfully!');
