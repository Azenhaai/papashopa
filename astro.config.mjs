import { defineConfig } from 'astro/config';

// PapaShopa is served from https://shpara.com/papashopa (static demo storefront).
// Portfolio demo: noindex, no sitemap integration, no real payments.
export default defineConfig({
  site: 'https://shpara.com',
  base: '/papashopa',
  trailingSlash: 'ignore',
});
