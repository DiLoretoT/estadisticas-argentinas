/**
 * Genera los iconos maskable del PWA a partir de la marca Datalogía (3 barras +
 * peak dot), la misma del navbar (components/SiteMark.tsx).
 *
 * Los iconos "any" (icon-192/512.png) y apple-touch-icon.png ya existen en
 * public/branding con esquinas redondeadas. Acá generamos las variantes
 * MASKABLE: fondo a sangre (full-bleed) y la marca dentro de la "safe zone"
 * (80% central) para que Android pueda aplicar su propia máscara sin recortar.
 *
 * Uso:  node scripts/generate-pwa-icons.mjs
 */
import sharp from "sharp";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "..", "public", "branding");

/** SVG de la marca centrada sobre fondo oscuro a sangre. `scale` = fracción del lienzo que ocupa la marca (safe zone ≈ 0.8). */
function markSvg(size) {
  // La marca vive en un viewBox 100x100; su bbox real es x[14,82] y[4,94].
  // La escalamos al ~62% del lienzo y la centramos para respetar la safe zone.
  const markBox = 62; // % del lienzo
  const s = (size * markBox) / 100 / 100; // escala desde unidades de 100
  const markW = 100 * s;
  const markH = 100 * s;
  const tx = (size - markW) / 2;
  const ty = (size - markH) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#262019"/>
      <stop offset="1" stop-color="#0d0b09"/>
    </linearGradient>
    <linearGradient id="mark" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffffff"/>
      <stop offset="1" stop-color="#e7ded4"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" fill="url(#bg)"/>
  <g transform="translate(${tx} ${ty}) scale(${s})" fill="url(#mark)">
    <rect x="14" y="60" width="20" height="34" rx="2"/>
    <rect x="38" y="44" width="20" height="50" rx="2"/>
    <rect x="62" y="24" width="20" height="70" rx="2"/>
    <circle cx="72" cy="12" r="8"/>
  </g>
</svg>`;
}

async function render(size, name) {
  const svg = Buffer.from(markSvg(size));
  await sharp(svg).png().toFile(join(OUT, name));
  console.log(`✓ ${name} (${size}x${size})`);
}

await render(512, "icon-maskable-512.png");
await render(192, "icon-maskable-192.png");
console.log("Listo.");
