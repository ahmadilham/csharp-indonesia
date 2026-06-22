import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context) {
  const notes = (await getCollection('notes', ({ data }) => !data.draft)).sort(
    (a, b) => b.data.tanggal.valueOf() - a.data.tanggal.valueOf(),
  );

  return rss({
    title: 'C# Indonesia',
    description:
      'Catatan praktis tentang C# modern dan agentic coding, dalam Bahasa Indonesia.',
    site: context.site,
    items: notes.map((note) => ({
      title: note.data.title,
      description: note.data.ringkasan,
      pubDate: note.data.tanggal,
      link: `/notes/${note.id}/`,
      categories: note.data.topik ? [note.data.topik] : undefined,
    })),
  });
}
