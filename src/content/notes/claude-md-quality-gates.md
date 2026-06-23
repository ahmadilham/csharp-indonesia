---
title: "Definition of done yang bisa dijalankan agen: gerbang kualitas di CLAUDE.md"
ringkasan: "Agent gemar bilang 'selesai' tanpa benar-benar memverifikasi. Solusinya bukan memarahi, tapi menulis definition of done yang bisa dia jalankan sendiri."
tanggal: 2026-06-23
topik: "Claude Code"
draft: false
---

Masalah klasik agentic coding: agent menulis kode, bilang "selesai", lalu Anda
build dan ternyata gagal. Akar masalahnya bukan agent malas — tapi **"selesai"
tidak pernah didefinisikan secara mekanis.** Kalau "selesai" hanya ada di kepala
Anda, agent tidak punya cara memeriksanya.

Bagian CLAUDE.md ini mengubah "selesai" dari perasaan menjadi checklist yang
bisa dijalankan.

## Gerbang kualitas: hijau dulu, baru lapor

Tuliskan gate sebagai daftar yang konkret dan bisa dieksekusi:

```
## Definition of done (run before reporting "done")

- [ ] `dotnet build` passes with zero warnings (warnings-as-errors is on)
- [ ] `dotnet test` passes
- [ ] `dotnet format --verify-no-changes` is clean
- [ ] New public behavior has a test
- [ ] No secrets, connection strings, or PII in code, logs, or commits

Never report a task as complete without running the build and tests.
Workflow: implement → build → test → fix → re-run → only then report.
```

Baris terakhir itu yang paling penting. Tanpa instruksi eksplisit "jangan bilang
selesai sebelum build dan test hijau", agent akan optimis. Dengan instruksi itu,
dia menjalankan gerbangnya sendiri sebelum menyerahkan pekerjaan ke Anda.

Supaya `dotnet build` benar-benar jadi gerbang, aktifkan warnings-as-errors di
project Anda — agar peringatan tidak diam-diam lolos:

```xml
<PropertyGroup>
  <Nullable>enable</Nullable>
  <TreatWarningsAsErrors>true</TreatWarningsAsErrors>
</PropertyGroup>
```

## Aturan keras: hal yang tidak boleh dilanggar

Selain gate, ada aturan yang sifatnya mutlak. Ini berbeda dari konvensi gaya —
melanggarnya berarti bug atau celah keamanan, bukan sekadar tidak rapi:

```
## Hard rules

- Never throw bare `new Exception(...)` in domain code. Use a typed/domain
  exception or return `Result<T>`, so callers can classify the failure.
- All EF Core queries are parameterized. Never build SQL with string
  interpolation. Use `FromSqlInterpolated` (not `FromSqlRaw` + concatenation).
- In a multi-tenant table, every read/update/delete filters by TenantId —
  not by primary key alone. Prefer an EF Core global query filter.
- Never put raw user input or PII in exception messages or logs. Reference
  metadata only: field name, row index, error code — never the value itself.
```

Aturan-aturan ini saya angkat dari friksi nyata. Yang soal `TenantId`, misalnya,
muncul karena query yang hanya memfilter primary key terlihat benar saat
ditulis, tapi mengasumsikan pemanggil sudah memverifikasi kepemilikan — rantai
kepercayaan implisit yang patah begitu ada refactor. Lebih aman menuliskannya
sebagai aturan keras sekali, daripada mengandalkan setiap orang mengingatnya.

## Kenapa ini bekerja

Agent sebenarnya patuh — asal aturannya bisa dieksekusi dan tidak ambigu.
"Tulis kode yang berkualitas" tidak bisa dijalankan. "`dotnet build` harus nol
warning, lalu `dotnet test` harus hijau, baru lapor" bisa. Semakin definition of
done Anda berbentuk perintah yang bisa dijalankan, semakin jarang Anda menerima
"selesai" yang ternyata belum selesai.
