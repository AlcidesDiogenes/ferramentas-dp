import fs from 'fs';
import path from 'path';
import { PNG } from 'pngjs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function createIconPNG(size, isMaskable = false) {
  const png = new PNG({ width: size, height: size });

  const cx = size / 2;
  const cy = size / 2;
  const radius = size * (isMaskable ? 0.5 : 0.42);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (size * y + x) << 2;

      // Distance from center
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Gradient background (Deep Slate / Navy)
      const tY = y / size;
      const rBg = Math.round(15 + (2 - 15) * tY);
      const gBg = Math.round(23 + (6 - 23) * tY);
      const bBg = Math.round(42 + (23 - 42) * tY);

      if (isMaskable || dist <= radius) {
        // Inner Card or Full Maskable Area
        const isInnerCard = Math.abs(dx) < size * 0.32 && Math.abs(dy) < size * 0.32;
        
        // Calculator screen region
        const isScreen = Math.abs(dx) < size * 0.25 && dy > -size * 0.1 && dy < size * 0.1;
        
        // DP Badge Circle
        const badgeDist = Math.sqrt(dx * dx + (dy + size * 0.22) * (dy + size * 0.22));
        const isBadge = badgeDist < size * 0.12;

        if (isBadge) {
          // Emerald Gold Badge
          png.data[idx] = 16;     // R
          png.data[idx + 1] = 185; // G
          png.data[idx + 2] = 129; // B
          png.data[idx + 3] = 255;
        } else if (isScreen) {
          // Dark Screen
          png.data[idx] = 15;
          png.data[idx + 1] = 23;
          png.data[idx + 2] = 42;
          png.data[idx + 3] = 255;
        } else if (isInnerCard) {
          // Card Bg
          png.data[idx] = 30;
          png.data[idx + 1] = 41;
          png.data[idx + 2] = 59;
          png.data[idx + 3] = 255;
        } else {
          // Accent Gradient (Blue)
          png.data[idx] = 59;
          png.data[idx + 1] = 130;
          png.data[idx + 2] = 246;
          png.data[idx + 3] = 255;
        }
      } else if (dist <= radius + 2) {
        // Anti-aliased border
        png.data[idx] = 59;
        png.data[idx + 1] = 130;
        png.data[idx + 2] = 246;
        png.data[idx + 3] = 180;
      } else {
        // Transparent outside radius for standard icons
        png.data[idx] = 0;
        png.data[idx + 1] = 0;
        png.data[idx + 2] = 0;
        png.data[idx + 3] = 0;
      }
    }
  }

  const iconsDir = path.join(__dirname, 'icons');
  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
  }

  const filename = isMaskable
    ? `icon-maskable-${size}.png`
    : `icon-${size}.png`;
  
  const filePath = path.join(iconsDir, filename);
  png.pack().pipe(fs.createWriteStream(filePath)).on('finish', () => {
    console.log(`Successfully generated ${filePath}`);
  });
}

createIconPNG(192, false);
createIconPNG(512, false);
createIconPNG(512, true);
