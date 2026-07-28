// Emit the Flutter app's launcher icons from the site's mark (public/favicon.svg
// — an orange tile with a cart-wheeled "P"), so the app and the web shop carry
// the identical logo.
//
//   icon.png             full-bleed orange tile + mark → iOS / legacy Android
//   icon_background.png  plain orange gradient         → Android adaptive back layer
//   icon_foreground.png  mark alone on transparent     → Android adaptive front layer
//
// Android masks the adaptive foreground to a circle and crops the outer ~18% on
// each side, so that layer draws the mark smaller — the lesson from the
// BullDozer icon, whose full-bleed foreground lost its corners.
//
// Run from the site project (that is where sharp lives):
//   node scripts/make_app_icons.mjs
// then, in the app project: dart run flutter_launcher_icons
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, '..', '..', 'papashopa_app', 'assets', 'icon');
mkdirSync(OUT, { recursive: true });

const S = 1024;
const ACCENT = '#e07b28';
const ACCENT_DARK = '#b85a12';

const background = () => `
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${ACCENT}"/>
      <stop offset="100%" stop-color="${ACCENT_DARK}"/>
    </linearGradient>
  </defs>
  <rect width="${S}" height="${S}" fill="url(#g)"/>`;

/// The mark: a cart handle sweeping into a bold P, riding on two wheels.
/// `scale` is the fraction of the tile the mark may occupy.
const mark = (scale) => {
  const size = S * scale;
  const o = (S - size) / 2;
  const u = size / 100; // mark-local units
  return `
  <g transform="translate(${o} ${o})" fill="none" stroke="#fff"
     stroke-width="${9 * u}" stroke-linecap="round" stroke-linejoin="round">
    <path d="M ${8 * u} ${14 * u} h ${11 * u} l ${5 * u} ${18 * u}"/>
    <path d="M ${24 * u} ${32 * u} h ${62 * u} l ${-9 * u} ${34 * u} h ${-45 * u} Z"/>
    <path d="M ${44 * u} ${40 * u} v ${20 * u} m 0 ${-20 * u} h ${11 * u}
             a ${6 * u} ${6 * u} 0 0 1 0 ${12 * u} h ${-11 * u}"
          stroke-width="${7 * u}"/>
  </g>
  <g transform="translate(${o} ${o})" fill="#fff">
    <circle cx="${36 * u}" cy="${80 * u}" r="${7.5 * u}"/>
    <circle cx="${72 * u}" cy="${80 * u}" r="${7.5 * u}"/>
  </g>`;
};

const svg = (body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">${body}</svg>`;

const files = {
  'icon.png': svg(background() + mark(0.68)),
  'icon_background.png': svg(background()),
  // 0.5 keeps the mark inside the ~66% safe circle the launcher mask leaves.
  'icon_foreground.png': svg(mark(0.5)),
};

for (const [name, markup] of Object.entries(files)) {
  await sharp(Buffer.from(markup)).resize(S, S).png().toFile(join(OUT, name));
  console.log(`wrote ${name} (${S}px) → papashopa_app/assets/icon/`);
}
