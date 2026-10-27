import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { legacyRedirects } from './redirects.mjs';

export default defineConfig({
  site: 'https://csharp-indonesia.com',
  // Legacy Blogger URLs (2010–2014) now live on archive.csharp-indonesia.com.
  // Each emits a static HTTP-200 page with meta-refresh + canonical to the archive —
  // the closest GitHub Pages allows to a 301. See redirects.mjs. The 404 page
  // (src/pages/404.astro) catches any stray legacy path not listed here.
  redirects: legacyRedirects,
  integrations: [sitemap()],
  markdown: {
    shikiConfig: {
      // Two themes: the design ships a light default with a dark toggle.
      // Same pair as ahmadilham.dev, so code reads alike on both sites.
      themes: {
        light: 'github-light',
        dark: 'github-dark',
      },
      wrap: true,
    },
  },
});
