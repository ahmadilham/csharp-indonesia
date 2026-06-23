---
title: "CLAUDE.md: manual operasi proyek yang dibaca agen setiap sesi"
ringkasan: "CLAUDE.md bukan dokumentasi biasa — ini konteks permanen yang Claude Code baca di awal tiap sesi, dan paling berguna kalau ditumbuhkan dari friksi nyata, bukan ditulis sempurna di awal."
tanggal: 2026-06-21
topik: "Claude Code"
sumber: "https://github.com/ahmadilham/dotnet-claude-md-starter"
draft: false
---

Di catatan sebelumnya saya bilang konteks lebih menentukan daripada prompt.
Pertanyaan lanjutannya: **di mana konteks itu disimpan supaya agent membacanya
otomatis?** Untuk Claude Code, jawabannya adalah `CLAUDE.md` — sebuah file di
root repo yang dibaca di awal setiap sesi, sebelum Anda mengetik apa pun.

Anggap saja ini **manual operasi proyek untuk anggota tim yang ingatannya
ter-reset tiap kali mulai kerja.** Agent tidak ingat sesi kemarin. CLAUDE.md
adalah onboarding yang dia baca ulang setiap pagi: stack apa yang dipakai, di
mana kode diletakkan, aturan yang tidak boleh dilanggar, dan kapan dia boleh
bertindak sendiri.

## Jangan ditulis sempurna di awal

Kesalahan paling umum: duduk satu jam mencoba menulis CLAUDE.md yang lengkap,
lalu file itu jadi usang dalam seminggu. CLAUDE.md yang bagus **ditumbuhkan,
bukan dikarang.**

Pola yang saya pakai:

1. **Bootstrap** dengan perintah `/init` di Claude Code. Ini memindai repo dan
   menghasilkan draf awal — stack, struktur, perintah build.
2. **Tumbuhkan dari friksi.** Setiap kali agent melakukan hal yang sama-salah
   berulang, itu sinyal untuk menambahkan satu aturan. Bukan menegur agent di
   chat — tapi menuliskannya di CLAUDE.md supaya tidak terulang sesi depan.

Contohnya, kalau agent terus membuat file 800 baris padahal tim Anda memecah di
300, Anda tidak mengulang teguran tiap kali. Anda menambahkan satu baris:

```
- Maximum 400 lines per file (split at 300). Run `wc -l` before adding to a file.
```

Sejak itu, aturannya jadi bagian dari konteks permanen.

## Anatomi CLAUDE.md yang sehat

Dari CLAUDE.md proyek nyata yang saya kelola, bagian yang benar-benar terpakai
biasanya ini:

- **Overview & philosophy** — satu paragraf: proyek ini apa, prinsip desainnya apa.
- **Tech stack & versions** — .NET 9, EF Core, library yang sudah dipakai. Tanpa ini
  agent menyarankan paket yang tidak Anda butuhkan.
- **Project map** — struktur solution dan di mana kode baru diletakkan.
- **Commands** — `dotnet build`, `dotnet test`, cara menjalankan app.
- **Conventions** — penamaan, gaya error handling, `record` vs `class`.
- **Hard rules (guardrails)** — hal yang tidak boleh dilanggar.
- **Definition of done** — apa yang harus hijau sebelum bilang "selesai".

Tiga bagian terakhir yang paling sering diabaikan, padahal justru di situ
nilainya. Saya akan bahas masing-masing di catatan terpisah dalam seri ini.

## Yang justru tidak boleh masuk

CLAUDE.md dibaca **setiap sesi**, jadi setiap baris memakan budget konteks dan
perhatian agent. Karena itu:

- **Jangan menyalin seluruh arsitektur.** Cukup tautkan ke spec yang detail
  ("source of truth ada di `docs/specs/ARCHITECTURE.md` — baca bagian yang
  relevan saja"). Biar agent membaca on-demand, bukan memikul semuanya tiap sesi.
- **Jangan duplikasi yang sudah jelas dari kode.** Kalau struktur folder sudah
  terbaca sendiri, tidak perlu dijabarkan baris per baris.
- **Jangan menaruh secret.** File ini ikut ter-commit; perlakukan seperti kode
  publik.
- **Buang yang sudah usang.** CLAUDE.md yang menyesatkan lebih buruk daripada
  yang pendek.

> Catatan: isi CLAUDE.md saya tulis dalam Bahasa Inggris — sama seperti prompt,
> instruksi untuk Claude Code bekerja paling baik dalam Bahasa Inggris. Narasi
> catatan ini tetap Bahasa Indonesia, tapi file yang dibaca agent berbahasa
> Inggris.

## Contoh lengkap yang bisa Anda salin

Semua bagian di atas saya rangkai jadi satu CLAUDE.md contoh untuk proyek .NET
Clean Architecture, di repo
[`dotnet-claude-md-starter`](https://github.com/ahmadilham/dotnet-claude-md-starter).
Salin filenya ke root repo Anda, ganti placeholder-nya, lalu sesuaikan.

Repo itu sengaja saya rawat sebagai **contoh yang hidup.** Karena CLAUDE.md
memang tumbuh dari friksi, isinya akan terus saya perbarui — dan ke depan saya
berencana menambahkan hal-hal yang biasa menemaninya: template pull request,
folder `docs/`, serta alur kerja untuk tool MCP seperti integrasi JIRA. Jadi
perlakukan catatan ini sebagai penjelasan prinsipnya, dan repo itu sebagai versi
terbaru yang berjalan.

## Intinya

CLAUDE.md adalah investasi konteks dengan leverage tertinggi: ditulis sekali,
dipakai tiap sesi, oleh Anda dan siapa pun di tim. Tapi nilainya bukan dari
panjangnya — melainkan dari seberapa jujur ia merekam friksi nyata proyek Anda.
Mulai kecil, tumbuhkan tiap kali agent salah, dan buang yang tidak lagi benar.
