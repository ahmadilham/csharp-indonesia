---
title: "Jangan taruh semua aturan di CLAUDE.md: rule yang ber-scope path"
ringkasan: "CLAUDE.md dibaca utuh di setiap sesi, jadi aturan migrasi ikut terbaca saat Anda hanya menyentuh controller. Aturan yang cuma berlaku di satu folder sebaiknya dimuat ketika folder itu disentuh."
tanggal: 2026-08-11
topik: "Claude Code"
sumber: "https://code.claude.com/docs/en/memory"
draft: false
---

Empat catatan sebelumnya semuanya bermuara pada satu file: CLAUDE.md. Wajar
kalau setelah beberapa bulan file itu menggemuk — tiap kali ada friksi baru,
Anda menambah satu paragraf. Sampai suatu titik Anda punya 600 baris yang
dibaca **utuh, di awal setiap sesi**, termasuk saat pekerjaan hari itu cuma
menambah satu endpoint.

Masalahnya bukan cuma boros token. Yang lebih halus: aturan penting jadi
tenggelam. Peringatan soal migrasi yang duduk di baris 380 punya bobot yang
sama dengan konvensi penamaan di baris 40 — dan agent membacanya di saat dia
belum punya alasan untuk peduli.

Dokumentasi Claude Code sendiri sekarang menyebut angkanya: **target di bawah
200 baris per file CLAUDE.md**, karena file yang lebih panjang memakan konteks
*dan* menurunkan kepatuhan. Dua-duanya, bukan salah satu. Jadi 600 baris itu
bukan cuma mahal — dia justru membuat aturan Anda lebih jarang diikuti.

## Pindahkan aturan bersyarat ke `.claude/rules/`

Claude Code bisa memuat file aturan **hanya ketika path tertentu disentuh**.
Letakkan filenya di `.claude/rules/`, lalu deklarasikan path-nya di frontmatter:

````markdown
---
paths:
  - "src/Shop.Data/Migrations/**"
  - "src/Shop.Data/ApplicationDbContext.cs"
---

# Migrasi harus jalan di SQL Server 2017

Database produksi masih **SQL Server 2017**, sementara dev lokal pakai 2022.
T-SQL yang lebih baru jalan mulus di lokal, lalu gagal saat deploy — itu
seluruh jebakannya.

| Konstruksi | Mulai ada di | Pakai ini |
|---|---|---|
| `GREATEST` / `LEAST` | 2022 | `CASE WHEN` |
| `IS DISTINCT FROM` | 2022 | `(a <> b) OR (a IS NULL AND b IS NOT NULL) OR (a IS NOT NULL AND b IS NULL)` |
| `GENERATE_SERIES` | 2022 | tabel angka atau CTE rekursif |

Migrasi juga **berurutan** — jangan pernah diparalelkan antar-agent.
````

Isi sepanjang itu tidak perlu masuk CLAUDE.md sama sekali. CLAUDE.md cukup
menyimpan satu baris penunjuk:

```markdown
- **Migrasi harus jalan di SQL Server 2017** (DB deploy). Konstruksi terlarang
  dan cara mengeceknya di lokal: rule `migrations`, dimuat otomatis saat Anda
  menyentuh `src/Shop.Data/Migrations/**`.
```

## Kenapa ini bukan sekadar rapi-rapi

Aturan yang muncul **tepat saat relevan** dibaca dengan konteks yang benar.
Agent yang sedang membuka file migrasi sudah punya alasan untuk peduli pada
dialek SQL; agent yang sedang menulis controller tidak. Aturan yang sama,
dibaca di dua momen berbeda, punya efek yang jauh berbeda.

Efek sampingnya menyenangkan: karena tidak lagi bersaing memperebutkan ruang di
CLAUDE.md, rule ber-scope boleh **lebih spesifik** daripada yang pantas Anda
taruh di file utama. Muat tabelnya, muat perintah verifikasinya, muat rujukan ke
PR tempat bug-nya pertama muncul.

Yang paling berdampak di situ adalah rujukan ke insiden nyata. Larangan tanpa
alasan gampang dinegosiasikan; larangan dengan korban tidak. Bentuknya kira-kira
begini — **ganti dengan kejadian dari proyek Anda sendiri, jangan pakai contoh
ini apa adanya**:

> Migrasi `20260214_AddUsageRollup` memakai `GREATEST`, lolos semua tes lokal,
> lalu menghancurkan deploy. Ditulis ulang di PR #455.

Satu kalimat seperti itu memberi agent alasan untuk patuh, bukan sekadar
perintah. Tapi kalimat itu hanya bekerja kalau benar: aturan yang mengarang
insiden akan Anda percayai lebih sedikit setiap kali Anda membacanya kembali.

Sekalian sertakan cara memverifikasinya sendiri:

```bash
docker run --rm -d --name sql2017check -e ACCEPT_EULA=Y \
  -e SA_PASSWORD=Local_dev_1 -p 1499:1433 \
  mcr.microsoft.com/mssql/server:2017-latest
dotnet ef database update --connection "Server=localhost,1499;..."
docker rm -f sql2017check
```

## Sekarang ini bukan lagi sekadar preferensi saya

Sewaktu catatan ini ditulis, Anthropic menerbitkan [apa yang mereka pelajari
setelah menghapus lebih dari 80% system prompt Claude
Code](https://claude.com/blog/the-new-rules-of-context-engineering-for-claude-5-generation-models)
untuk model-model terbarunya — tanpa penurunan yang terukur di evaluasi coding
mereka. Salah satu dari enam prinsip yang mereka sebutkan persis pola di atas:
**progressive disclosure**, muat informasi saat dibutuhkan, bukan semuanya di
depan. Anjuran mereka untuk CLAUDE.md singkat: buat file itu ringan, isi dengan
hal yang khas repo Anda, dan pakai progressive disclosure sebanyak mungkin.

Ada satu prinsip lain di artikel itu yang harus Anda baca berbarengan, karena
dia menarik ke arah berlawanan: **rules → judgment.** Aturan yang dulu ditulis
untuk mencegah model lemah berbuat bodoh sekarang cuma jadi kebisingan.
Konsekuensinya untuk catatan ini: memindahkan aturan ke `.claude/rules/` jangan
dijadikan alasan untuk *menyimpan lebih banyak aturan*. Pertanyaannya tetap
"apakah aturan ini perlu ada", baru setelah itu "di mana dia tinggal". Yang
layak dipertahankan biasanya yang tidak bisa disimpulkan sendiri oleh agent dari
membaca kode di sekitarnya — versi SQL Server di server produksi termasuk;
"pakai `var` kalau tipenya jelas" tidak.

Untuk mengeceknya, ada `/doctor` di Claude Code. Dia membaca CLAUDE.md Anda dan
mengusulkan pemangkasan: membuang yang bisa disimpulkan sendiri dari kode
(struktur folder, daftar dependensi, ringkasan arsitektur), menyisakan jebakan,
alasan, dan konvensi yang menyimpang dari default.

Satu pembeda yang gampang tertukar sekalian: **rule bukan skill.** Rule
ber-scope path dimuat begitu agent menyentuh file yang cocok — dia tidak tahu
apa yang sedang Anda kerjakan, cuma file apa yang sedang dibuka. Skill dimuat
saat Anda memanggilnya atau saat agent menilai dia relevan dengan permintaan
Anda. Aturan yang terikat pada *file* (dialek SQL di folder migrasi) jadi rule;
prosedur yang terikat pada *pekerjaan* (langkah rilis, cara verifikasi) jadi
skill.

## Tes untuk memutuskan di mana sebuah aturan tinggal

Sederhana: **apakah aturan ini berlaku untuk seluruh repo, atau cuma untuk
sebagian file?**

- Berlaku di mana-mana — attribution commit, definition of done, batas
  otonomi, peta proyek → **CLAUDE.md**.
- Cuma relevan di satu folder — dialek SQL migrasi, konvensi komponen UI,
  aturan wiring di dua entry point → **`.claude/rules/`** dengan `paths`.
- Prosedur multi-langkah yang terikat pada jenis pekerjaan, bukan pada file —
  langkah rilis, cara menjalankan E2E → **skill**.

Kalau ragu, balik pertanyaannya: kalau agent tidak pernah membuka folder itu
sepanjang sesi, apakah dia rugi karena tidak membaca aturan ini? Kalau
jawabannya tidak, aturan itu tidak perlu ada di konteks setiap sesi.

Satu peringatan penutup. Rule ber-scope memuat diri saat file disentuh —
**bukan** saat agent sedang merencanakan perubahan yang nanti akan menyentuh
file itu. Untuk aturan yang mengubah desain, bukan sekadar implementasi, tetap
taruh satu kalimat ringkasnya di CLAUDE.md dan biarkan rule memegang detailnya.
