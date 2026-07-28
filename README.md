# PapaShopa

A demo e-commerce storefront: catalog, cart, multi-step checkout, account with order history, and a loyalty card with tiers. Built as a static Astro site — the whole "backend" is your browser's localStorage. No real products, orders or payments.

Live at: https://shpara.com/papashopa (noindex — portfolio demo)

## Blocks

- **Storefront** — 24 mock products in 4 categories, client-side category filter, product pages with related items.
- **Cart** — quantity controls, loyalty discount preview.
- **Checkout** — 3 steps (address → delivery → review), no payment step by design; placing an order saves it to localStorage.
- **Account** — editable profile, order history, demo-data reset.
- **Loyalty** — Papa Club card with a generated number, decorative barcode, points (1 point per €1), and tiers: Bronze → Silver (150 pts, −3%) → Gold (400 pts, −5%). The tier discount is applied at checkout.

## Stack

- Astro (static output), no frameworks, vanilla JS for all interactivity.
- `src/data/products.json` — the catalog; `public/shop.js` — the localStorage store (`PS.*` API).
- Served under `base: /papashopa`, same setup as the other shpara.com sub-sites.

## Develop

```
npm install
npm run dev
```

## Build

```
npm run build
```

Output lands in `dist/`.
