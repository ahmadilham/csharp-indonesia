---
title: "Tujuh catatan menyuruh Anda menulis CLAUDE.md — catatan ini menyuruh Anda memangkasnya"
ringkasan: "Anthropic menghapus lebih dari 80% system prompt Claude Code tanpa penurunan terukur di evaluasi coding mereka. Aturan yang ditulis untuk mengekang model lemah jadi kebisingan untuk model yang lebih kuat — dan seri ini punya beberapa."
tanggal: 2026-08-13
topik: "Claude Code"
sumber: "https://claude.com/blog/the-new-rules-of-context-engineering-for-claude-5-generation-models"
draft: false
---

Tujuh catatan sebelumnya di seri ini punya satu bentuk yang sama: ada friksi,
tuliskan aturannya, taruh di konteks yang dibaca agent. Catatan 02 bahkan
menjadikannya metode — **tumbuhkan CLAUDE.md dari friksi nyata.**

Catatan 02 sebenarnya sudah menyuruh Anda membuang — *"buang yang sudah usang"*,
*"buang yang tidak lagi benar"*. Jadi tombol hapusnya ada. Yang salah adalah
barnya: **usang** menuntut sesuatu lebih dulu menjadi *salah* sebelum layak
dibuang. Yang baru saya pahami, aturan yang masih sepenuhnya benar pun bisa
merugikan — kalau agent akan sampai ke sana sendiri tanpa Anda tuliskan.

Anthropic baru saja menerbitkan [apa yang mereka pelajari setelah menghapus
lebih dari 80% system prompt Claude
Code](https://claude.com/blog/the-new-rules-of-context-engineering-for-claude-5-generation-models)
untuk model-model terbarunya — **tanpa penurunan yang terukur di evaluasi coding
mereka.** Itu bukan angka tentang efisiensi token. Itu angka tentang seberapa
banyak instruksi yang selama ini kita tulis ternyata tidak melakukan apa-apa.

Catatan ini bukan pencabutan seri sebelumnya. Tapi beberapa bagiannya memang
tidak selamat, dan lebih baik saya yang bilang.

## Kenapa aturan bisa berubah jadi beban

Prinsip pertama artikel itu: **rules → judgment.** Aturan eksplisit dulu ditulis
untuk mencegah skenario terburuk dari model yang penilaiannya lemah. Model yang
penilaiannya sudah baik tidak butuh pagar yang sama — dan pagar yang tidak
dibutuhkan bukan sekadar netral.

Ada dua biaya yang sering tidak terlihat. Pertama, tiap baris mengencerkan baris
lain; aturan yang paling Anda butuhkan dibaca bersama 599 baris yang tidak.
Kedua — dan ini yang lebih jahat — dokumentasi Claude Code menyebutnya terang:
kalau dua aturan saling bertentangan, **agent bisa memilih salah satunya secara
sembarang.** File yang cuma tumbuh, tanpa pernah dipangkas, pada akhirnya pasti
mengandung kontradiksi. Anda tidak akan tahu yang mana yang menang.

## Satu tes: bisakah agent menyimpulkan ini sendiri?

Ini pertanyaan yang saya pakai sekarang untuk tiap baris di CLAUDE.md:

> Kalau baris ini saya hapus, apakah agent yang membaca kode di sekitarnya akan
> sampai ke kesimpulan yang sama sendiri?

Kalau ya — hapus. Dia sudah ada di repo, dalam bentuk yang selalu lebih mutakhir
daripada file Anda. Kalau tidak, biasanya karena satu dari dua alasan, dan
keduanya layak dipertahankan:

- **Fakta tentang dunia di luar repo.** Versi SQL Server di server produksi.
  Ke mana deploy-nya. Siapa yang kena panggil kalau rusak. Tidak ada satu baris
  kode pun yang memberi tahu ini.
- **Niat tentang kode yang belum ada.** Agent membaca kode dan melihat apa yang
  *ada*, bukan apa yang *boleh*. Dua hal yang berbeda, dan perbedaannya justru
  muncul saat dia menulis file baru.

## Bagian seri ini yang tidak selamat

**Catatan 03 (peta proyek) hasilnya terbelah**, dan tidak di tempat yang saya
duga. Dua dari tiga bagiannya selamat — justru dua yang dulu saya perlakukan
sebagai pelengkap:

```
Rule: dependencies point inward. Domain must never reference Application,
Infrastructure, or Api. If you need a dependency to point outward, you need
an interface in Application, implemented in Infrastructure.
```

Agent yang membaca solution Anda melihat referensi yang *sudah ada* — dia tidak
punya cara tahu mana yang terlarang. Blok itu sekilas tampak seperti deskripsi
struktur, padahal tiap barisnya sebenarnya batasan: *"Depends on NOTHING."* Yang
kedua, tabel "kalau membangun X, taruh di Y", selamat karena isinya keputusan
untuk kode yang belum ditulis. Peta yang menggambarkan keadaan: buang. Peta yang
menyatakan batas: simpan.

Yang **gugur** justru bagian ketiga, yang tidak saya duga: konvensi penamaan.
`record` untuk DTO, `sealed class` untuk service, suffix `Async`, file-scoped
namespace — semuanya sudah terbaca dari sepuluh file pertama yang agent buka.
Itu contoh paling murni dari aturan yang benar tapi tidak perlu ditulis. Dan
godaan yang catatan 03 sendiri sudah peringatkan — mendaftar project satu per
satu, alih-alih menjelaskan arah referensinya — memang termasuk yang pertama
dipangkas `/doctor`.

**Catatan 04 (definition of done) selamat, tapi ada tempat yang lebih baik
untuknya.** Gate seperti `dotnet build` dan `dotnet test` memang harus jalan,
tapi CLAUDE.md itu konteks, bukan penegakan — agent membacanya dan *berusaha*
patuh. Untuk sesuatu yang wajib jalan di titik tertentu, dokumentasinya menyarankan
**hook**: perintah shell di lifecycle event yang tetap jalan apa pun yang agent
putuskan. Aturan yang naik jadi hook boleh turun dari CLAUDE.md. Yang tersisa di
sana cukup alasannya, bukan checklist-nya.

**Catatan 05 (git dan otonomi) selamat hampir utuh.** Gerbang konfirmasi dan
batas otonomi lolos telak, tepat sesuai tes di atas: apakah sebuah push bisa
ditarik kembali di organisasi Anda bukan hal yang bisa disimpulkan dari membaca
kode. Itu fakta tentang lingkungan, bukan selera. Yang tidak lolos justru dua
baris paling tidak berbahaya di sana — pola penamaan branch dan daftar
conventional commits. Tiga puluh detik membaca `git log` sudah cukup untuk
menyimpulkan keduanya.

**Aturan keras di catatan 04 juga selamat** — filter `TenantId`, PII yang tidak
boleh masuk log. Artikel itu sendiri memberi pengecualian untuk area yang
"sangat penting". Kebocoran data lintas tenant memenuhi syarat.

## Lima prinsip lain, singkat

Selain *rules → judgment*, ada lima pergeseran lain di artikel itu. Yang paling
langsung terpakai untuk repo .NET:

- **Progressive disclosure** — muat saat dibutuhkan, bukan semua di depan. Ini
  yang saya bahas panjang di catatan 06: `.claude/rules/` dengan `paths`.
- **Repetisi → deskripsi tool yang sederhana.** Prinsip aslinya spesifik soal
  tool: instruksinya cukup hidup di deskripsi tool itu sendiri, tidak perlu
  diulang lagi di system prompt. Ekstrapolasi saya — bukan klaim mereka — kalau
  aturan yang sama muncul di CLAUDE.md, di rule, dan di skill, Anda tidak
  menegaskannya tiga kali; Anda membuat tiga tempat yang bisa saling
  bertentangan nanti.
- **Manual memory → auto memory.** Agent menulis sendiri apa yang layak diingat;
  Anda tidak perlu lagi mencatat manual hal seperti perintah build. Perbedaannya
  dengan log agen saya bahas di catatan 07.
- **Contoh → desain antarmuka**, dan **spec sederhana → referensi kaya.**
  Keduanya lebih relevan kalau Anda membangun agent sendiri daripada kalau Anda
  memakai Claude Code.

## Mulai dari `/doctor`

Jangan pangkas dengan tangan kalau tidak perlu. Jalankan `/doctor` di Claude
Code: dia membaca CLAUDE.md Anda dan mengusulkan pemangkasan — membuang yang
bisa disimpulkan sendiri dari kode, menyisakan jebakan, alasan, dan konvensi
yang menyimpang dari default. Perlakukan hasilnya seperti review: baca usulannya,
tolak yang salah.

Angka targetnya sudah saya sebut di catatan 06 — **di bawah 200 baris per file
CLAUDE.md.** Yang perlu ditambahkan di sini cuma cara membaca angka itu: dia
bukan anggaran biaya, dia ambang kepatuhan. Di atasnya, Anda membayar lebih
banyak untuk diikuti lebih jarang.

## Intinya

Catatan 02 menyuruh Anda menumbuhkan CLAUDE.md dari friksi. Itu masih benar,
tapi setengah aturan. Setengahnya lagi: **jadwalkan pemangkasan.** Tiap kali
Anda menambah, sesekali tanyakan pada yang sudah ada — apakah agent akan sampai
ke sini sendiri?

Cara paling mudah salah membaca catatan ini adalah menyimpulkan "berarti konteks
tidak penting". Kebalikannya. Anthropic menghapus 80% justru supaya 20% yang
tersisa benar-benar dibaca. Yang berubah bukan nilai konteks — yang berubah
adalah bahwa panjang tidak lagi bisa Anda pakai sebagai bukti bahwa Anda sudah
berusaha.
