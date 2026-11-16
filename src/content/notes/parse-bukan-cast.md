---
title: "Tipe pada kolom JSON bukan validasi: isinya harus diparse, bukan di-cast"
ringkasan: "Kolom JSON membuat skema fleksibel, dan tipe C# di atasnya memberi rasa aman yang tidak dibayar oleh apa pun saat runtime. Deserializer menulis lewat refleksi, jadi field yang hilang tetap masuk sebagai null ke property yang dideklarasikan non-nullable."
tanggal: 2026-11-16
topik: "Agentic Coding"
sumber: "https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/null-safety/nullable-reference-types"
draft: false
---

Catatan 18. Catatan 17 membahas satu codebase yang menghasilkan dua build, dan tes yang harus tahu build mana yang sedang diperiksa. Catatan ini soal satu baris aturan review yang terdengar sepele sampai Anda menelusuri apa yang sebenarnya dijamin oleh tipe.

> Dari instruksi review di salah satu repositori internal kami: "A TypeScript type on the column is not runtime validation."

Aturan itu lahir di repositori TypeScript, dan kolom yang dimaksud adalah kolom JSON di PostgreSQL. Contoh C# di bawah adalah porting yang saya tulis sendiri, belum pernah saya kompilasi, dan nama kelasnya fiktif. Saya tidak mengklaim versi .NET-nya pernah dipakai di sana.

## Di mana tipe berhenti menjaga

Kolom JSON dipakai justru ketika skema belum stabil. Konsekuensinya: isi kolom itu ditulis oleh versi kode yang mungkin sudah tidak ada lagi. Di C# biasanya kita memetakannya ke sebuah record dan selesai:

```csharp
public sealed record ShipmentMetadata(string CarrierCode, int PackageCount);

var raw = await db.Shipments
    .Where(s => s.Id == id)
    .Select(s => s.MetadataJson)
    .SingleAsync(ct);

var meta = JsonSerializer.Deserialize<ShipmentMetadata>(raw)!;
```

`CarrierCode` dideklarasikan `string`, bukan `string?`. Compiler percaya. Tapi baris terakhir membaca data yang ditulis bulan lalu, mungkin tanpa field itu sama sekali — dan `JsonSerializer` tidak menolak: ia mengisi apa yang ketemu dan membiarkan sisanya kosong. Yang Anda pegang adalah objek bertipe `ShipmentMetadata` dengan `CarrierCode` bernilai `null`, dan `NullReferenceException` muncul jauh dari sini, di tempat yang tidak menyebut JSON sama sekali.

## Nullable reference types hanya hidup saat kompilasi

Ini bukan bug deserializer. **Nullable reference types adalah fitur waktu kompilasi**; tidak ada pemeriksaan yang tersisa di IL. Deserializer menulis lewat refleksi, jadi anotasi itu tidak pernah dilihatnya. Tanda `!` yang kita tambahkan supaya warning hilang bukan jaminan — itu janji dari kita kepada compiler, bukan sebaliknya.

Jadi tipe pada kolom JSON menggambarkan **apa yang kita harapkan ada**, bukan apa yang ada. Perbedaan itu gratis selama skema belum pernah berubah, dan berhenti gratis pada hari pertama ia berubah.

## Parse, bukan cast

Perbaikannya bukan menambah `?` di mana-mana, karena itu menyebarkan ketidakpastian ke seluruh kode. Perbaikannya adalah memberi batas satu tempat yang mengubah JSON mentah menjadi tipe yang benar-benar dijamin:

```csharp
internal static Result<ShipmentMetadata> Parse(string rawJson)
{
    JsonDocument doc;
    try { doc = JsonDocument.Parse(rawJson); }
    catch (JsonException e) { return Result.Fail<ShipmentMetadata>($"malformed json: {e.Message}"); }

    using (doc)
    {
        var root = doc.RootElement;
        if (!root.TryGetProperty("carrierCode", out var carrier)
            || carrier.ValueKind != JsonValueKind.String
            || string.IsNullOrWhiteSpace(carrier.GetString()))
        {
            return Result.Fail<ShipmentMetadata>("carrierCode missing or empty");
        }

        if (!root.TryGetProperty("packageCount", out var count)
            || !count.TryGetInt32(out var packageCount)
            || packageCount < 0)
        {
            return Result.Fail<ShipmentMetadata>("packageCount missing or not a non-negative int");
        }

        return Result.Ok(new ShipmentMetadata(carrier.GetString()!, packageCount));
    }
}
```

Panjang, dan memang itu intinya. Setiap `if` di atas adalah satu asumsi yang sebelumnya tidak tertulis di mana pun. Setelah melewati fungsi ini, `ShipmentMetadata` benar-benar berarti apa yang tertulis pada tipenya — dan hanya fungsi ini yang perlu tahu bahwa sumbernya kolom JSON.

## Tesnya

Yang diuji bukan jalur bahagia, melainkan baris yang ditulis versi kode lama:

```csharp
[Theory]
[InlineData("{}")]
[InlineData("""{"packageCount":2}""")]
[InlineData("""{"carrierCode":"","packageCount":2}""")]
[InlineData("""{"carrierCode":"DHL","packageCount":-1}""")]
public void Parse_rejects_rows_written_by_older_schemas(string rawJson)
    => Assert.False(ShipmentMetadataParser.Parse(rawJson).IsSuccess);
```

## Yang perlu ditulis di CLAUDE.md

Agent akan menulis `Deserialize<T>` karena itu yang paling sering benar di internet. Jadi tulis batasnya secara eksplisit: **data dari kolom JSON, body HTTP, dan payload antrian tidak boleh langsung di-deserialize ke tipe domain**; harus lewat parser yang mengembalikan `Result<T>`; dan setiap parser baru wajib punya tes yang memberinya input cacat. Tiga kalimat itu lebih berguna daripada aturan "validasi input", yang terlalu umum untuk bisa ditegakkan.

## Batasnya

Pola ini mahal kalau kolom JSON-nya memang hanya dibaca untuk ditampilkan apa adanya. Kalau tidak ada logika yang bergantung padanya, biarkan ia `JsonElement` dan jangan berpura-pura ia punya bentuk.

Tes yang saya pakai sekarang: untuk setiap tipe di kode saya, siapa yang pernah memeriksa bahwa isinya sesuai tipe itu — compiler, atau sebuah fungsi yang bisa saya tunjuk?
