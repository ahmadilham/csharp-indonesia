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
      theme: 'night-owl',
      wrap: true,
    },
  },
});
