import { defineConfig } from 'astro/config';

// PapaShopa is served from https://azenha.ai/papashopa (static demo storefront).
// Portfolio demo: noindex, no sitemap integration, no real payments.
export default defineConfig({
  site: 'https://azenha.ai',
  base: '/papashopa',
  trailingSlash: 'ignore',
});
