---
title: "Dua composition root yang tidak pernah dibandingkan — dan agent cuma membaca satu"
ringkasan: "Aplikasi yang punya lebih dari satu entrypoint mendaftarkan service-nya dua kali, sendiri-sendiri. Agent akan menyunting yang dia baca duluan, `dotnet build` tetap hijau, dan bedanya baru terasa di lingkungan yang bukan laptop Anda."
tanggal: 2026-09-21
topik: "Agentic Coding"
sumber: "https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/service-registration"
draft: false
---

Catatan 10. Sembilan catatan sebelumnya soal apa yang perlu ditulis di konteks agent.
Yang ini soal satu hal yang **tidak akan agent temukan sendiri**, seberapa bagus pun
model-nya — karena bukti kesalahannya tidak ada di file yang dia buka.

Mulai dari aturan di sebuah repo TypeScript yang saya baca minggu ini:

> These two files construct the same services … **independently and drift silently**.
> A capability wired into one but not the other works locally and fails in cloud, or
> the reverse. Nothing catches it: there is no shared factory and no test asserting
> parity.

Dua file. Keduanya merakit service yang sama. Tidak ada yang membandingkannya.

## Kenapa ini bukan bug biasa

Bug biasa punya jejak: stack trace, tes merah, review yang menangkap. Yang ini tidak
punya satu pun. Kode di kedua file **benar secara lokal**. Tiap file, dibaca sendirian,
lolos review — karena yang salah bukan isinya, melainkan selisih antara keduanya. Dan
selisih tidak muncul di diff satu file.

Di .NET polanya sangat umum. Anda punya API dan satu background worker:

```csharp
// src/Shop.Api/Program.cs
builder.Services.AddScoped<IOrderRepository, OrderRepository>();
builder.Services.AddScoped<IPricingService, PricingService>();
builder.Services.AddScoped<IAuditWriter, SqlAuditWriter>();

// src/Shop.Worker/Program.cs
services.AddScoped<IOrderRepository, OrderRepository>();
services.AddScoped<IPricingService, PricingService>();
// IAuditWriter? tidak ada di sini.
```

`dotnet build` hijau. `dotnet test` hijau, kalau tes Anda memakai `ServiceCollection`
sendiri — dan hampir semua tes unit begitu. Worker baru meledak saat runtime, dengan
`InvalidOperationException: Unable to resolve service for type 'IAuditWriter'`, di
environment yang menjalankannya.

## Yang diperparah agent

Beri agent task "tambahkan audit log ke proses order". Dia akan membuka `Shop.Api`,
menemukan pola registrasi, menambahkan satu baris, menjalankan build, dan melaporkan
selesai. Semua langkahnya benar. `Shop.Worker/Program.cs` tidak pernah dia buka karena
**tidak ada alasan untuk membukanya** — tidak ada referensi, tidak ada nama yang cocok
saat grep, tidak ada tes yang gagal.

Ini kelas masalah yang sama dengan yang saya bahas di catatan 06: konteks yang tidak
diminta tidak akan terbaca. Bedanya, di sini yang hilang bukan aturan, melainkan
**keberadaan file kedua**.

## Perbaikan pertama: satu extension method

Dokumentasi .NET menyebut konvensinya secara eksplisit — satu `Add{GROUP_NAME}` untuk
mendaftarkan semua service sebuah fitur. Pakai itu sebagai satu-satunya pintu:

```csharp
// src/Shop.Application/DependencyInjection.cs
public static class DependencyInjection
{
    public static IServiceCollection AddShopCore(
        this IServiceCollection services, IConfiguration config)
    {
        services.AddDbContext<ShopDbContext>(o =>
            o.UseNpgsql(config.GetConnectionString("Shop")));
        services.AddScoped<IOrderRepository, OrderRepository>();
        services.AddScoped<IPricingService, PricingService>();
        services.AddScoped<IAuditWriter, SqlAuditWriter>();
        return services;
    }
}
```

Sekarang kedua `Program.cs` memanggil `AddShopCore(config)` dan selesai. Tapi ini baru
**konvensi**, bukan gerbang: tidak ada yang mencegah orang berikutnya — atau agent —
menambahkan satu `AddScoped` langsung di `Program.cs` karena itu jalan terpendek.

## Perbaikan kedua: tes paritas

Naikkan konvensinya jadi tes, persis seperti pada batas arsitektur di catatan 09:

```csharp
public class CompositionRootParityTests
{
    private static HashSet<string> Describe(Action<IServiceCollection> compose)
    {
        var services = new ServiceCollection();
        compose(services);
        return services
            .Select(d => $"{d.ServiceType.FullName}|{d.Lifetime}")
            .ToHashSet();
    }

    [Fact]
    public void Worker_registers_every_core_service_the_api_does()
    {
        var config = new ConfigurationBuilder().Build();

        var api = Describe(s => ApiCompositionRoot.Configure(s, config));
        var worker = Describe(s => WorkerCompositionRoot.Configure(s, config));

        var missing = api.Except(worker)
            .Where(d => d.StartsWith("Shop.Application.")
                     || d.StartsWith("Shop.Domain."))
            .ToList();

        Assert.True(missing.Count == 0,
            $"Worker is missing: {string.Join(", ", missing)}");
    }
}
```

Filter namespace-nya penting: API memang **boleh** punya registrasi yang worker tidak
punya — `AddControllers`, autentikasi, CORS. Yang tidak boleh berbeda adalah service
domain dan application.

Satu lagi yang murah dan sering dilewat, pasang di kedua host:

```csharp
builder.Host.UseDefaultServiceProvider(o =>
{
    o.ValidateScopes = true;
    o.ValidateOnBuild = true;
});
```

`ValidateOnBuild` memindahkan `Unable to resolve service` dari request pertama ke
**startup**. Worker yang salah wiring mati saat deploy, bukan tiga jam kemudian saat
pesan pertama masuk.

## Yang ditulis di CLAUDE.md

Tes menangkap pelanggaran. CLAUDE.md-lah yang mencegah agent membuatnya:

```markdown
## Composition roots

There are two: `src/Shop.Api/Program.cs` and `src/Shop.Worker/Program.cs`.
Register services in `AddShopCore()` (`src/Shop.Application/DependencyInjection.cs`),
never directly in either `Program.cs`. `CompositionRootParityTests` asserts parity.
```

Tiga baris, dan yang paling berharga adalah yang pertama: **jumlah composition root
Anda ada berapa.** Itu fakta yang tidak bisa disimpulkan dari file mana pun sendirian.

Jadi pertanyaan yang saya pakai sekarang sebelum menyerahkan repo ke agent: kalau dia
hanya membuka satu entrypoint, apa yang dia lewatkan — dan apakah ada yang merah kalau
dia melewatkannya?
