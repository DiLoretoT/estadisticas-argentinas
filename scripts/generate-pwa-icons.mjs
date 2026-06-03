/**
 * Genera todos los iconos de marca (PWA + favicon) a partir del SiteMark v5
 * (3 barras + peak dot achatado). Mantiene el estilo del set anterior:
 * cuadrado oscuro con la marca en crema y leve sombra.
 *
 * Salidas:
 *   app/icon.png                          256  (favicon, redondeado)
 *   public/branding/icon-192.png          192  (any, redondeado)
 *   public/branding/icon-512.png          512  (any, redondeado)
 *   public/branding/apple-touch-icon.png  180  (redondeado)
 *   public/branding/icon-maskable-192.png 192  (full-bleed)
 *   public/branding/icon-maskable-512.png 512  (full-bleed)
 *
 * Uso:  node scripts/generate-pwa-icons.mjs
 */
import sharp from "sharp";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const BRANDING = join(ROOT, "public", "branding");

// Glifo SiteMark v5 (viewBox 100x100, tinta centrada en y[19,81]).
const GLYPH_H = 62; // alto de tinta en unidades del viewBox
const GLYPH = `
  <rect x="16" y="57" width="20" height="24" rx="2.5"/>
  <rect x="40" y="47" width="20" height="34" rx="2.5"/>
  <rect x="64" y="35" width="20" height="46" rx="2.5"/>
  <circle cx="74" cy="27" r="8"/>`;

/**
 * @param size  lado del lienzo en px
 * @param opts.bleed  true = fondo a sangre (maskable); false = redondeado
 * @param opts.inkFrac  fracción del lienzo que ocupa el alto de tinta de la marca
 */
function iconSvg(size, { bleed, inkFrac }) {
  const s = (size * inkFrac) / GLYPH_H; // escala desde unidades de 100
  const t = (size - 100 * s) / 2; // centrar la caja 100x100
  const radius = bleed ? 0 : Math.round(size * 0.225);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#1c1c1c"/>
      <stop offset="1" stop-color="#050505"/>
    </linearGradient>
    <linearGradient id="mk" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffffff"/>
      <stop offset="1" stop-color="#dcd6cf"/>
    </linearGradient>
    <linearGradient id="sh" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="black" stop-opacity="0"/>
      <stop offset="1" stop-color="black" stop-opacity="0.18"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${radius}" fill="url(#bg)"/>
  <g transform="translate(${t} ${t}) scale(${s})">
    <g fill="url(#mk)">${GLYPH}</g>
    <g fill="url(#sh)">${GLYPH}</g>
  </g>
</svg>`;
}

async function render(size, file, opts) {
  await sharp(Buffer.from(iconSvg(size, opts))).png().toFile(file);
  console.log(`✓ ${file.replace(ROOT, "").replace(/\\/g, "/")} (${size})`);
}

// "any" + favicon + apple → redondeados, marca al 52% del alto
await render(256, join(ROOT, "app", "icon.png"), { bleed: false, inkFrac: 0.52 });
await render(192, join(BRANDING, "icon-192.png"), { bleed: false, inkFrac: 0.52 });
await render(512, join(BRANDING, "icon-512.png"), { bleed: false, inkFrac: 0.52 });
await render(180, join(BRANDING, "apple-touch-icon.png"), { bleed: false, inkFrac: 0.52 });
// maskable → full-bleed, marca al 44% (safe zone)
await render(192, join(BRANDING, "icon-maskable-192.png"), { bleed: true, inkFrac: 0.44 });
await render(512, join(BRANDING, "icon-maskable-512.png"), { bleed: true, inkFrac: 0.44 });
console.log("Listo.");
