import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// ponytail: GitHub Pages project site; change site/base when moving to the real domain.
export default defineConfig({
  site: 'https://abdelazizfarid.github.io',
  base: '/staron-egypt',
  trailingSlash: 'always',
  integrations: [sitemap()],
  build: { format: 'directory' },
});
