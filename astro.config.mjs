import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://csharp-indonesia.com',
  markdown: {
    shikiConfig: {
      theme: 'github-dark',
      wrap: true,
    },
  },
});
