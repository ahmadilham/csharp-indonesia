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

# Migrations must run on SQL Server 2017

The deploy database is still **SQL Server 2017**; local dev runs 2022. Newer
T-SQL runs cleanly on your machine and fails on deploy — that is the whole trap.

| Construct | Added in | Use instead |
|---|---|---|
| `GREATEST` / `LEAST` | 2022 | `CASE WHEN` |
| `IS DISTINCT FROM` | 2022 | `(a <> b) OR (a IS NULL AND b IS NOT NULL) OR (a IS NOT NULL AND b IS NULL)` |
| `GENERATE_SERIES` | 2022 | a numbers table or a recursive CTE |

Migrations are also **sequential** — never parallelize them across agents.
````

Perhatikan isinya berbahasa Inggris. Sama seperti CLAUDE.md di catatan-catatan
sebelumnya: yang dibaca agent ditulis dalam Bahasa Inggris, narasi catatannya
saja yang Bahasa Indonesia.

Isi sepanjang itu tidak perlu masuk CLAUDE.md sama sekali. CLAUDE.md cukup
menyimpan satu baris penunjuk:

```markdown
- **Migrations must run on SQL Server 2017** (the deploy DB). Banned constructs
  and how to verify locally: the `migrations` rule, loaded automatically when
  you touch the Migrations folder or `ApplicationDbContext.cs`.
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

> Migration `20260214_AddUsageRollup` used `GREATEST`, passed every local test,
> then broke the deploy. Rewritten in PR #455.

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

Kalau Anda ingin memangkas CLAUDE.md yang sudah terlanjur gemuk, ada `/doctor`
di Claude Code — saya bahas alat itu dan seluruh soal pemangkasan di catatan 08.

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
