---
title: "Agentic coding di proyek C#: konteks lebih penting daripada prompt"
ringkasan: "Hasil agentic coding di proyek .NET lebih ditentukan oleh konteks yang Anda berikan daripada seberapa pintar prompt-nya."
tanggal: 2026-06-20
topik: "Agentic Coding"
draft: false
---

Banyak orang mengira kunci agentic coding ada pada prompt yang sempurna.
Setelah dipakai di proyek C#/.NET nyata, saya justru menemukan hal yang
berbeda: **kualitas konteks** yang Anda berikan jauh lebih menentukan hasil
daripada seberapa pintar kalimat prompt Anda.

Agent yang tidak tahu struktur solution Anda, konvensi penamaan tim, atau
versi .NET yang dipakai akan menghasilkan kode yang "benar secara umum" tapi
salah untuk proyek Anda. Sebaliknya, agent dengan konteks yang cukup sering
hanya butuh instruksi singkat.

## Apa yang saya maksud dengan "konteks"

Dalam praktik, konteks yang paling berdampak biasanya:

- **Struktur proyek** — solution, project, dan bagaimana mereka saling
  bergantung. Agent perlu tahu di mana kode seharusnya diletakkan.
- **Konvensi tim** — pola penamaan, gaya error handling, apakah pakai
  `record` atau `class`, async di mana, dan seterusnya.
- **Versi & dependensi** — .NET 8 vs .NET 9, library yang sudah dipakai.
  Tanpa ini, agent menyarankan paket yang tidak Anda perlukan.
- **Definition of done** — apakah perlu unit test? Konvensi commit?

## Contoh konkret

Tanpa konteks, permintaan seperti "buatkan endpoint untuk ambil data user"
menghasilkan controller generik yang mungkin tidak cocok dengan arsitektur
Anda. Dengan konteks minimal — misalnya:

```
This project uses Minimal API on .NET 9, the Result<T> pattern for error
handling, and a repository already exists at IUserRepository. Add a GET
/users/{id} endpoint following the same pattern as the existing endpoints.
```

hasilnya langsung jauh lebih dekat dengan yang Anda butuhkan, dan revisinya
sedikit.

> Catatan: untuk agentic coding saya memakai **Claude Code**, dan dari
> pengalaman prompt serta instruksinya bekerja paling baik dalam Bahasa
> Inggris. Karena itu contoh prompt di atas sengaja ditulis dalam Bahasa
> Inggris — narasi catatan tetap Bahasa Indonesia, tapi yang Anda ketikkan
> ke agent sebaiknya Bahasa Inggris.

## Pelajaran praktisnya

Investasi terbaik bukan menghafal trik prompt, tapi **menyiapkan konteks
sekali di awal** — entah lewat file instruksi proyek, README yang rapi, atau
contoh kode yang konsisten. Begitu konteksnya jelas, prompt sederhana pun
sudah cukup. Agent itu seperti anggota tim baru: yang dia butuhkan bukan
perintah yang lebih galak, tapi onboarding yang lebih baik.
