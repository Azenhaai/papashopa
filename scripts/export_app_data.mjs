// Export the app-facing JSON endpoints to public/data/, so the Flutter client
// (papashopa_app) reads the same catalog and the same shop rules the site
// renders. Same pattern as AlfaCat's scripts/export_app_data.mjs — the app is a
// thin client over static JSON, there is no backend.
//
// src/data/* are build inputs and are NOT served; this copies the pieces the app
// needs into public/, which Astro emits as-is:
//
//   /papashopa/data/products.json   full catalog (24 items, 4 categories)
//   /papashopa/data/config.json     currency, loyalty tiers, delivery options
//   /papashopa/data/meta.json       freshness (generatedAt, counts)
//
// The site's own shop rules live in public/shop.js (TIERS) and in
// src/pages/checkout.astro (SHIP). The app re-implements that logic in Dart, so
// the two can silently drift apart — that is the whole risk of a parallel
// implementation. To make drift loud, this script parses both site sources and
// refuses to export if they disagree with src/data/shop-config.json.
//
// Usage: node scripts/export_app_data.mjs   (wired into `npm run export:app`
// and into `npm run build`, so a plain build can never ship a stale catalog)
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DATA = join(ROOT, 'src', 'data');
const OUT = join(ROOT, 'public', 'data');

const read = (...p) => readFileSync(join(ROOT, ...p), 'utf8');
const readJson = (...p) => JSON.parse(read(...p));

const products = readJson('src', 'data', 'products.json');
const config = readJson('src', 'data', 'shop-config.json');

// --- drift guard: site sources vs shop-config.json -------------------------

// Lift a JS literal out of a source file and evaluate it. Both literals are our
// own hand-written code (unquoted keys, single quotes), so JSON.parse won't do.
function literal(source, label, startMarker, open, close) {
  const at = source.indexOf(startMarker);
  if (at < 0) throw new Error(`export: could not find ${label} in the site source`);
  let i = source.indexOf(open, at);
  let depth = 0;
  for (let j = i; j < source.length; j++) {
    if (source[j] === open) depth++;
    else if (source[j] === close && --depth === 0) {
      return new Function(`return (${source.slice(i, j + 1)})`)();
    }
  }
  throw new Error(`export: unterminated ${label} literal`);
}

function assertSame(what, siteValue, configValue) {
  const a = JSON.stringify(siteValue);
  const b = JSON.stringify(configValue);
  if (a !== b) {
    throw new Error(
      `export: ${what} drifted between the site and src/data/shop-config.json\n` +
        `  site:   ${a}\n  config: ${b}\n` +
        `  Fix one of them — the app reads config.json and would otherwise ` +
        `charge different money than the site.`,
    );
  }
}

const siteTiers = literal(read('public', 'shop.js'), 'TIERS', 'var TIERS', '[', ']');
assertSame(
  'loyalty tiers',
  siteTiers.map((t) => [t.id, t.name, t.min, t.discount]),
  config.tiers.map((t) => [t.id, t.name, t.min, t.discount]),
);

const siteShip = literal(read('src', 'pages', 'checkout.astro'), 'SHIP', 'var SHIP', '{', '}');
assertSame(
  'delivery options',
  Object.entries(siteShip).map(([id, s]) => [id, s.label, s.cost]),
  config.shipping.map((s) => [s.id, s.label, s.cost]),
);

// --- export ----------------------------------------------------------------

mkdirSync(OUT, { recursive: true });

const categories = [...new Set(products.map((p) => p.category))];
const write = (name, json) => writeFileSync(join(OUT, name), JSON.stringify(json));

write('products.json', products);
write('config.json', { ...config, categories });
write('meta.json', {
  generatedAt: new Date().toISOString(),
  products: products.length,
  categories: categories.length,
  site: 'https://azenha.ai/papashopa',
  note: 'Demo storefront data. No real products, orders or payments.',
});

console.log(
  `export_app_data: ${products.length} products, ${categories.length} categories, ` +
    `${config.tiers.length} tiers, ${config.shipping.length} delivery options → public/data/`,
);
