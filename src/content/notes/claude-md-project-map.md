---
title: "Bagian CLAUDE.md yang paling berdampak: peta proyek"
ringkasan: "Kalau agent tidak diberi tahu struktur solution dan ke mana kode baru harus diletakkan, dia akan mengarang strukturnya sendiri — dan biasanya salah untuk arsitektur Anda."
tanggal: 2026-06-22
topik: "Claude Code"
draft: false
---

Dari semua bagian CLAUDE.md, yang paling cepat terasa dampaknya adalah **peta
proyek** — penjelasan tentang bagaimana solution Anda tersusun dan di mana kode
baru seharusnya diletakkan. Tanpa ini, agent akan menebak: membuat folder
`Services/` baru padahal Anda pakai Clean Architecture, atau menaruh logika
domain di project Web.

Agent tidak melihat keseluruhan solution seperti Anda. Dia membaca beberapa file
lalu menyimpulkan polanya. Tugas CLAUDE.md adalah memberi peta itu di muka.

## Jelaskan lapisan dan arah ketergantungannya

Untuk proyek .NET yang berlapis, hal terpenting bukan daftar project-nya, tapi
**arah referensinya** — siapa boleh bergantung pada siapa. Tuliskan eksplisit:

```
## Solution layout

- Domain        — entities, value objects, domain rules. Depends on NOTHING.
- Application   — use cases, interfaces, DTOs. Depends on Domain only.
- Infrastructure — EF Core, external services. Depends on Application + Domain.
- Api           — composition root, endpoints. Depends on all of the above.

Rule: dependencies point inward. Domain must never reference Application,
Infrastructure, or Api. If you need a dependency to point outward, you need
an interface in Application, implemented in Infrastructure.
```

Aturan "ketergantungan menunjuk ke dalam" ini yang paling sering dilanggar agent
kalau tidak ditulis. Begitu ditulis, agent tahu bahwa untuk mengakses database
dari sebuah use case, dia harus membuat interface di `Application` dan
implementasinya di `Infrastructure` — bukan memanggil `DbContext` langsung.

## Tabel "kalau membangun X, taruh di Y"

Cara paling ringkas memberi peta adalah tabel keputusan. Agent suka ini karena
tidak ambigu:

```
## Where to put new code

| If building...              | Put it in...                          |
|-----------------------------|---------------------------------------|
| Entity / domain rule        | Domain/                               |
| Use case / handler          | Application/Features/<Feature>        |
| Repository implementation   | Infrastructure/Persistence            |
| External API client         | Infrastructure/Integrations           |
| HTTP endpoint               | Api/Endpoints                         |
| Shared DTO / contract       | Application/Contracts                 |
```

Sesuaikan dengan proyek Anda — yang penting agent tidak perlu menebak.

## Konvensi penamaan yang membuat kode "menyatu"

Bagian ini singkat tapi berpengaruh besar pada apakah hasil agent terasa ditulis
oleh tim Anda atau tempelan dari internet:

```
## Conventions

- File-scoped namespaces. One public type per file.
- Types: PascalCase. Locals/params: camelCase. Constants: PascalCase.
- Prefer `record` for DTOs and value objects, `sealed class` for services.
- Async methods end with `Async` and take a `CancellationToken` last.
- Return `Result<T>` for expected failures; throw only for truly exceptional cases.
```

## Intinya

Peta proyek mengubah pertanyaan agent dari "struktur seperti apa yang masuk
akal?" menjadi "di mana tempat yang sudah ditentukan?". Itu menghilangkan
seluruh kategori revisi — file di folder yang salah, ketergantungan yang
terbalik, pola yang tidak konsisten. Tuliskan lapisannya, arah referensinya, dan
satu tabel "taruh di mana", dan sebagian besar tebakan struktural agent hilang.
