import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const notes = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/notes' }),
  schema: z.object({
    // Judul catatan
    title: z.string(),
    // Ringkasan satu kalimat (tampil di bawah judul & di daftar)
    ringkasan: z.string(),
    tanggal: z.coerce.date(),
    // Label topik singkat, mis. "Agentic Coding", "Tooling", ".NET"
    topik: z.string(),
    // Opsional: tautan sumber/referensi
    sumber: z.string().url().optional(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { notes };
