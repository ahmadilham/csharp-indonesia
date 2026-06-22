# csharp-indonesia.com

Catatan praktis tentang **C# modern & agentic coding**, dalam Bahasa Indonesia.
Dibangun dengan [Astro](https://astro.build).

Konten lama (tutorial 2013–2014) tetap tersedia sebagai arsip di
**archive.csharp-indonesia.com**.

## Prasyarat

- **Node.js 22.12+** (wajib untuk Astro 6). Cek: `node --version`.
- **npm** (ikut dengan Node). Cek: `npm --version`.

## Menjalankan secara lokal

```bash
npm install          # sekali di awal, atau setelah tarik perubahan
npm run dev          # server dev di http://localhost:4321 (auto-reload)
npm run build        # build situs statis ke folder dist/
npm run preview      # pratinjau hasil build
```

| Perintah | Fungsi |
|---|---|
| `npm install` | Pasang dependensi ke `node_modules/` |
| `npm run dev` | Server dev di `localhost:4321`, reload otomatis saat simpan |
| `npm run build` | Build situs statis ke `dist/` |
| `npm run preview` | Sajikan hasil `dist/` untuk pengecekan |

## Menambah catatan baru

Buat file Markdown di `src/content/notes/`. Gunakan frontmatter berikut:

```markdown
---
title: "Judul posisi/catatan Anda"
ringkasan: "Ringkasan satu kalimat (tampil di bawah judul & di daftar)."
tanggal: 2026-06-20
topik: "Agentic Coding"     # label singkat: Agentic Coding / Tooling / .NET
sumber: "https://..."        # opsional — tautan referensi
draft: false                 # set true untuk menyembunyikan
---

Isi catatan dalam Markdown. Blok kode mendapat highlighting C#:

\`\`\`csharp
Console.WriteLine("halo");
\`\`\`
```

Halaman depan otomatis menampilkan catatan terbaru di atas dan memberi nomor.

## Deploy (GitHub Pages)

Repo ini sudah berisi workflow GitHub Actions
(`.github/workflows/deploy.yml`) yang build + deploy otomatis setiap push
ke `main`. Astro harus di-*build* dulu, jadi sumbernya tidak bisa disajikan
langsung seperti HTML biasa.

1. Buat repo kosong di GitHub (mis. `csharp-indonesia`).
2. Push folder ini:
   ```bash
   git init
   git add .
   git commit -m "Situs C# Indonesia (Astro)"
   git branch -M main
   git remote add origin https://github.com/ahmadilham/csharp-indonesia.git
   git push -u origin main
   ```
3. Repo → Settings → Pages → Source → **GitHub Actions**.
4. Custom domain → `csharp-indonesia.com` (sudah ada di `public/CNAME`).
5. DNS di Rumahweb sudah mengarah ke GitHub Pages dari setup sebelumnya —
   tidak perlu diubah. Pastikan 4 A record + CNAME `www` masih ada.

> Setelah deploy pertama, setiap `git push` ke `main` otomatis build ulang —
> termasuk catatan baru yang Anda tambahkan.

## Struktur

```
src/
  content/notes/      ← catatan Anda (Markdown) di sini
  layouts/Base.astro  ← <head>, font, footer
  pages/index.astro   ← halaman depan (hero + daftar catatan)
  pages/notes/[slug]  ← template catatan
  styles/global.css   ← token desain (aksen violet)
public/                ← favicon, CNAME, aset statis
```
