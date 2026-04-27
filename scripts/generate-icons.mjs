import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const assetsDir = path.join(__dirname, '..', 'assets', 'images');

const BG_COLOR = '#0d0d0d';
const RED = '#e94560';
const WHITE = '#ffffff';

function generateIconSvg(size) {
  // Scale factors relative to 1024
  const s = size / 1024;
  const fontSize = Math.round(180 * s);
  const textY = Math.round(380 * s);

  // Dumbbell dimensions
  const barY = Math.round(480 * s);
  const barW = Math.round(240 * s);
  const barH = Math.round(60 * s);
  const barX = (size - barW) / 2;
  const barR = Math.round(15 * s);

  const plateW = Math.round(70 * s);
  const plateH = Math.round(220 * s);
  const plateR = Math.round(20 * s);
  const plateY = barY - (plateH - barH) / 2;

  const outerPlateW = Math.round(40 * s);
  const outerPlateH = Math.round(160 * s);
  const outerPlateR = Math.round(15 * s);
  const outerPlateY = barY - (outerPlateH - barH) / 2;

  const innerPlateX1 = barX - plateW + Math.round(10 * s);
  const innerPlateX2 = barX + barW - Math.round(10 * s);
  const outerPlateX1 = innerPlateX1 - outerPlateW - Math.round(5 * s);
  const outerPlateX2 = innerPlateX2 + plateW + Math.round(5 * s);

  return `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="${BG_COLOR}"/>
  <text x="${size / 2}" y="${textY}" text-anchor="middle" font-family="Helvetica Neue, Arial, sans-serif" font-size="${fontSize}" font-weight="900" fill="${WHITE}" letter-spacing="${Math.round(12 * s)}">JIM</text>
  <!-- Bar -->
  <rect x="${barX}" y="${barY}" width="${barW}" height="${barH}" rx="${barR}" fill="${WHITE}"/>
  <!-- Inner plates -->
  <rect x="${innerPlateX1}" y="${plateY}" width="${plateW}" height="${plateH}" rx="${plateR}" fill="${RED}"/>
  <rect x="${innerPlateX2}" y="${plateY}" width="${plateW}" height="${plateH}" rx="${plateR}" fill="${RED}"/>
  <!-- Outer plates -->
  <rect x="${outerPlateX1}" y="${outerPlateY}" width="${outerPlateW}" height="${outerPlateH}" rx="${outerPlateR}" fill="${RED}" opacity="0.7"/>
  <rect x="${outerPlateX2}" y="${outerPlateY}" width="${outerPlateW}" height="${outerPlateH}" rx="${outerPlateR}" fill="${RED}" opacity="0.7"/>
</svg>`;
}

function generateSplashSvg(width, height) {
  const fontSize = Math.round(width * 0.18);
  const lineW = Math.round(width * 0.15);
  const lineH = 6;
  const textY = height / 2;
  const lineY = textY + Math.round(fontSize * 0.3);

  return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${width}" height="${height}" fill="${BG_COLOR}"/>
  <text x="${width / 2}" y="${textY}" text-anchor="middle" font-family="Helvetica Neue, Arial, sans-serif" font-size="${fontSize}" font-weight="900" fill="${WHITE}" letter-spacing="${Math.round(fontSize * 0.08)}">JIM</text>
  <rect x="${(width - lineW) / 2}" y="${lineY}" width="${lineW}" height="${lineH}" rx="3" fill="${RED}"/>
</svg>`;
}

async function generate() {
  // App icon — 1024x1024
  const iconSvg = Buffer.from(generateIconSvg(1024));
  await sharp(iconSvg).png().toFile(path.join(assetsDir, 'icon.png'));
  console.log('Generated icon.png (1024x1024)');

  // Adaptive icon foreground — 1024x1024
  await sharp(iconSvg).png().toFile(path.join(assetsDir, 'adaptive-icon.png'));
  console.log('Generated adaptive-icon.png (1024x1024)');

  // Splash icon — 1284x2778
  const splashSvg = Buffer.from(generateSplashSvg(1284, 2778));
  await sharp(splashSvg).png().toFile(path.join(assetsDir, 'splash-icon.png'));
  console.log('Generated splash-icon.png (1284x2778)');

  // Favicon — 48x48
  const faviconSvg = Buffer.from(generateIconSvg(48));
  await sharp(faviconSvg).png().toFile(path.join(assetsDir, 'favicon.png'));
  console.log('Generated favicon.png (48x48)');
}

generate().catch(console.error);
