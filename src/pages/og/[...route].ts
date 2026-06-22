import { getCollection } from 'astro:content';
import { OGImageRoute } from 'astro-og-canvas';

const notes = await getCollection('notes', ({ data }) => !data.draft);

// Keys become the image path: `/og/<key>.png`.
const pages: Record<string, { title: string; ringkasan: string }> = {
  home: {
    title: 'C# Indonesia',
    ringkasan:
      'Catatan praktis tentang C# modern dan agentic coding, dalam Bahasa Indonesia.',
  },
  ...Object.fromEntries(notes.map(({ id, data }) => [id, data])),
};

export const { getStaticPaths, GET } = await OGImageRoute({
  param: 'route',
  pages,
  getImageOptions: (_path, page) => ({
    title: page.title,
    description: page.ringkasan,
    bgGradient: [
      [16, 16, 16],
      [24, 18, 32],
    ],
    border: { color: [139, 92, 246], width: 12, side: 'inline-start' },
    padding: 70,
    font: {
      title: { color: [240, 240, 240], size: 60, weight: 'Bold', lineHeight: 1.2 },
      description: { color: [165, 165, 165], size: 30, weight: 'Normal', lineHeight: 1.4 },
    },
  }),
});
