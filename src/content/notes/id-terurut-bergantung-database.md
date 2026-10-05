---
title: "ID yang bisa diurutkan hanya terurut di database yang membacanya dengan urutan yang sama"
ringkasan: "Aturan \"jangan pakai GUID acak, pakai UUIDv7\" benar di PostgreSQL dan nyaris tidak berarti di SQL Server. Aturan ID di CLAUDE.md perlu membawa alasannya dan batas berlakunya, lalu ditegakkan oleh build, bukan oleh ingatan agent."
tanggal: 2026-10-05
topik: "Agentic Coding"
sumber: "https://www.dbi-services.com/blog/why-uuidv7-does-not-reduce-fragmentation-in-sql-server/"
draft: false
---

Catatan 12. Catatan 11 membahas gerbang yang bisa diubah oleh branch yang sedang diuji. Catatan ini soal aturan yang lebih kecil, satu baris di CLAUDE.md tentang cara membuat ID, dan kenapa satu baris itu bisa benar di satu proyek tapi menyesatkan di proyek lain.

Saya menemukan aturan semacam ini di sebuah monorepo TypeScript: jangan pakai UUID acak, pakai ID yang terurut waktu. Contoh di bawah adalah porting ke .NET yang saya tulis sendiri. Saya tidak mengklaim versi .NET-nya pernah dipakai di sana.

## Kenapa ID acak jadi masalah

Primary key biasanya punya index B-tree. Kalau key-nya acak, seperti hasil `Guid.NewGuid()` (UUID versi 4), setiap insert jatuh di posisi acak di index. Halaman index terbelah, terisi setengah, dan index membengkak.

ULID dan **UUIDv7** memecahkan ini dengan menaruh timestamp di depan. ID yang dibuat belakangan nilainya lebih besar, jadi insert baru berkumpul di ujung index. Sejak .NET 9 ada `Guid.CreateVersion7()`, dan provider EF Core untuk PostgreSQL (Npgsql) versi 9.0 sudah membuat UUIDv7 secara default untuk key bertipe `Guid`.

Sampai di sini aturannya terdengar universal. Ternyata tidak.

## SQL Server membaca byte-nya dari belakang

PostgreSQL membandingkan `uuid` byte demi byte dari depan, jadi timestamp di depan memang menentukan urutan. SQL Server tidak. Dokumentasinya hanya bilang bahwa urutan `uniqueidentifier` tidak dibandingkan per pola bit. Pengukuran dbi services (tautan di Referensi) menunjukkan SQL Server membandingkan **enam byte terakhir lebih dulu**. Di UUIDv7, enam byte itu berisi data acak. Hasil uji mereka pada 25.000 insert satu baris per statement: UUIDv7 tidak lebih baik daripada `NEWID()`. Kepadatan halaman dan fragmentasinya praktis sama.

Jadi aturan "pakai UUIDv7" membawa kesimpulan tanpa membawa syaratnya. Agent yang membaca CLAUDE.md tidak tahu syarat itu ada. Kalau aturannya disalin ke proyek SQL Server, dia akan mematuhinya dengan rajin, dan tidak ada yang membaik.

## Satu pintu untuk membuat ID

Daripada mengandalkan agent ingat aturan, saya membuat satu pintu dan menutup pintu lain. Semua ID baru lewat satu kelas:

```csharp
// src/Shop.Core/Ids.cs
namespace Shop.Core;

public static class Ids
{
    // PostgreSQL compares uuid byte by byte from the front,
    // so a timestamp-first UUIDv7 keeps inserts at the end of the index.
    // On SQL Server this gives no locality; change this method, not the callers.
#pragma warning disable RS0030
    public static Guid New() => Guid.CreateVersion7();
#pragma warning restore RS0030
}
```

Pintu lain ditutup dengan **BannedApiAnalyzers** dari Microsoft. Daftarkan di `Directory.Build.props`:

```xml
<ItemGroup>
  <PackageReference Include="Microsoft.CodeAnalysis.BannedApiAnalyzers" Version="3.3.4" PrivateAssets="all" />
  <AdditionalFiles Include="$(MSBuildThisFileDirectory)BannedSymbols.txt" />
</ItemGroup>
<PropertyGroup>
  <WarningsAsErrors>$(WarningsAsErrors);RS0030</WarningsAsErrors>
</PropertyGroup>
```

Lalu `BannedSymbols.txt` di root solution:

```text
M:System.Guid.NewGuid;Use Ids.New(). See CLAUDE.md, section Identifiers.
M:System.Guid.CreateVersion7;Use Ids.New() so the generator can follow the database.
M:System.Guid.CreateVersion7(System.DateTimeOffset);Use Ids.New().
```

Sekarang `Guid.NewGuid()` di mana pun selain `Ids` membuat `dotnet build` gagal dengan RS0030, lengkap dengan pesan yang menunjuk ke CLAUDE.md. `CreateVersion7` ikut dilarang di luar `Ids`. Tujuannya bukan karena UUIDv7 salah. Kalau suatu hari database-nya pindah ke SQL Server, cukup satu method yang perlu diganti, misalnya dengan generator yang sadar urutan SQL Server.

## Yang ditulis di CLAUDE.md

```markdown
## Identifiers
- New IDs come from `Ids.New()` only. `Guid.NewGuid()` and
  `Guid.CreateVersion7()` are banned outside `Ids` (RS0030, build error).
- Why: primary keys are B-tree indexed, and random keys scatter inserts.
- Scope: this works because we run PostgreSQL, which compares uuid bytes
  from the front. SQL Server does not. Don't copy this rule to a SQL Server
  project without changing `Ids.New()`.
- If RS0030 blocks you, don't add `#pragma`. Stop and tell me why you need it.
```

Baris **Scope** adalah bagian yang paling sering hilang. Aturan tanpa batas berlaku akan terlihat benar di mana pun ia ditempel.

Dua catatan jujur. Pertama, analyzer hanya memeriksa kode C# Anda. Default di database seperti `HasDefaultValueSql("NEWID()")`, atau key yang dibuat oleh value generator bawaan EF Core, tidak lewat `Ids` dan tidak terdeteksi. Periksa konfigurasi model Anda juga. Kedua, `#pragma` di `Ids` adalah lubang yang disengaja. Agent bisa menyalin pola itu ke tempat lain, karena itu baris terakhir di CLAUDE.md melarangnya secara eksplisit, dan review tetap perlu mencarinya.

Pertanyaan yang sekarang saya ajukan ke setiap aturan teknis di CLAUDE.md: apakah aturan ini menyebut kondisi yang membuatnya benar, atau hanya kesimpulannya?
