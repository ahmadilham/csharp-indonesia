---
title: "Jalankan source saat development, hasil build saat rilis — dan pastikan tes tahu jalur mana yang sedang dipakai"
ringkasan: "Satu proyek bisa menyambung ke pustaka lain lewat source atau lewat paket yang sudah dibangun. Dua jalur itu berguna, tapi agent yang menjalankan dotnet test tanpa tahu jalur mana yang aktif bisa mendapat hasil hijau dari kode yang belum pernah diuji."
tanggal: 2026-11-02
topik: "Agentic Coding"
sumber: "https://learn.microsoft.com/en-us/visualstudio/msbuild/msbuild-conditions"
draft: false
---

Catatan 16. Catatan 15 membahas pin versi transitif yang perlu alasan tertulis. Catatan ini soal pilihan build yang jarang dituliskan: kapan sebuah proyek menjalankan **source** pustaka lain, dan kapan menjalankan **hasil build**-nya.

Pola ini saya kenal dari monorepo TypeScript, lewat kondisi `development` di `exports` pada `package.json`. Saat dev, import menunjuk ke source. Saat rilis, import menunjuk ke hasil build. Kondisi itu tidak aktif dengan sendirinya; alat yang menjalankan kode harus memintanya. Contoh C# di bawah adalah porting yang saya tulis sendiri, belum pernah saya kompilasi, dan nama proyeknya fiktif. Saya tidak mengklaim versi .NET-nya pernah dipakai di sana.

## Dua cara menyambung proyek

Misalkan `Shop.Api` memakai `Shop.Core`. Ada dua sambungan. `ProjectReference` menunjuk ke source, jadi perubahan di Core langsung terbaca saat Api dibangun. `PackageReference` menunjuk ke paket yang sudah dibangun, yaitu yang sebenarnya dipakai di produksi. Saat dev Anda ingin yang pertama karena tidak ada langkah pack. Saat rilis Anda ingin yang kedua. Satu proyek bisa mendukung keduanya lewat property:

```xml
<!-- Shop.Api.csproj -->
<ItemGroup Condition="'$(UseLocalSources)' == 'true'">
  <ProjectReference Include="..\Shop.Core\Shop.Core.csproj" />
</ItemGroup>
<ItemGroup Condition="'$(UseLocalSources)' != 'true'">
  <PackageReference Include="Shop.Core" />
</ItemGroup>
```

Property yang tidak didefinisikan terbaca sebagai string kosong, jadi tanpa flag apa pun jalur yang aktif adalah paket. Itu sengaja: **jalur default harus jalur yang dikirim ke produksi**. Yang ingin memakai source menyalakannya secara eksplisit:

```bash
dotnet test -p:UseLocalSources=true
```

## Masalahnya: hijau di jalur yang salah

Bayangkan agent mengubah `Shop.Core`, lalu menjalankan `dotnet test` tanpa flag. Jalur default memakai paket, jadi tes berjalan terhadap Core versi lama dari feed. Hasilnya hijau, padahal perubahan yang baru ditulis belum diuji sama sekali. `dotnet build` pun hijau, dan tidak ada yang memberi tahu agent bahwa ia menguji kode yang salah.

Kebalikannya sama buruknya. Kalau semua tes selalu memakai source, paket yang benar-benar dikirim tidak pernah diuji. Versi di `PackageReference` bisa tertinggal dan tidak ada yang tahu sampai deploy.

Akar kedua kegagalan itu sama: ada dua jalur, dan jalur yang diuji tidak selalu jalur yang Anda kira. Di TypeScript bentuknya identik, yaitu folder hasil build yang basi terhadap source.

## Yang perlu ditulis di CLAUDE.md dan CI

Agent tidak menebak jalur mana yang berlaku. Ia menjalankan perintah yang tertulis. Jadi tulis tiga hal:

1. **Perintah dev.** Kalau mengubah proyek yang dipakai proyek lain, jalankan tes dengan `-p:UseLocalSources=true`.
2. **Perintah rilis.** CI mem-pack Core ke feed lokal, lalu menjalankan tes tanpa flag, sehingga tes membaca paket yang baru dibangun dari commit yang sama.
3. **Satu job wajib di jalur rilis.** Minimal satu job CI harus berjalan tanpa flag. Kalau job itu dihapus, jalur yang dikirim tidak punya penjaga.

```bash
dotnet pack src/Shop.Core -c Release -o ./local-feed
dotnet restore --source ./local-feed --source https://api.nuget.org/v3/index.json
dotnet test --no-restore -c Release
```

Versi paket hasil `pack` harus sama dengan versi yang diminta `PackageReference`, kalau tidak, restore diam-diam mengambil versi lama dari feed publik. Itu satu hal yang perlu dicek di CI, bukan diasumsikan.

## Batasnya

Pola ini hanya masuk akal kalau `Shop.Core` dan `Shop.Api` memang hidup di repositori yang sama dan dirilis bersamaan. Kalau Core dimiliki tim lain dengan jadwal rilisnya sendiri, `PackageReference` saja sudah cukup, dan jalur source hanya dipakai untuk mencoba perubahan lokal sebelum dikirim ke tim itu.

Pola ini menambah satu hal yang harus diingat, dan mengingat adalah pekerjaan yang paling mudah gagal. IDE juga perlu property yang sama, jadi tempatkan di `Directory.Build.props` atau di pengaturan solusi, bukan di kepala satu orang. Jangan membuat default-nya mode dev supaya "lebih nyaman": nyaman untuk developer, tapi artinya build yang tidak sengaja dikirim adalah build yang tidak pernah diuji sebagai paket.

Tes yang saya pakai sekarang: untuk perubahan yang baru saya tulis, jalur mana yang menjalankannya, dan apakah jalur itu yang dikirim ke produksi?
