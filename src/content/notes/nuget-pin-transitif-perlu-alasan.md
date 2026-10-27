---
title: "Pin versi transitif di NuGet menutup celah keamanan hari ini, dan jadi misteri bulan depan kalau alasannya tidak ditulis"
ringkasan: "Central Package Management bisa memaksa versi paket transitif tanpa mengubah satu pun PackageReference. Itu alat yang bagus untuk menambal advisory, tapi setiap pin adalah utang: tanpa alasan dan kondisi lepasnya, agent akan menghapusnya karena terlihat tidak terpakai, atau menaikkannya tanpa tahu apa yang dijaga."
tanggal: 2026-10-26
topik: "Agentic Coding"
sumber: "https://learn.microsoft.com/en-us/nuget/consume-packages/central-package-management"
draft: false
---

Catatan 15. Catatan 14 membahas keputusan infrastruktur yang perlu batas tertulis. Catatan ini soal jenis keputusan yang paling mudah terlupa: memaksa versi paket yang tidak pernah Anda tulis sendiri di `.csproj`.

Pola ini saya kenal dari ekosistem npm, lewat fitur `overrides` di `package.json`, bukan dari proyek .NET. Contoh C# di bawah saya tulis sendiri untuk catatan ini, belum pernah saya kompilasi, dan nama paketnya fiktif.

## Masalah: celah ada di paket yang tidak Anda pilih

Anda memakai `Contoh.Pdf`. Paket itu menarik `Contoh.Parser 2.1.0`, dan versi itu punya advisory. Anda tidak bisa menunggu pemilik `Contoh.Pdf` merilis ulang. Menambah `PackageReference` langsung ke `Contoh.Parser` hanya untuk menaikkan versinya mengotori daftar dependensi: seolah-olah proyek Anda memakai parser itu.

Ada juga biaya yang kurang terlihat: `PackageReference` baru berarti seseorang di kemudian hari mengira kode Anda memang memanggil parser itu, lalu menyusun keputusan di atas asumsi yang salah. Pin transitif lebih jujur karena ia menyatakan sebuah batas, bukan sebuah penggunaan.

## Alatnya: pinning transitif

Dengan Central Package Management, versi dideklarasikan di satu tempat. Properti `CentralPackageTransitivePinningEnabled` membuat versi di sana juga berlaku untuk dependensi transitif, tanpa `PackageReference` baru. Dokumentasi NuGet mencatat bahwa pin tidak boleh menurunkan versi (restore gagal dengan NU1109), dan bahwa saat `pack`, paket yang dipin ikut tertulis sebagai dependensi eksplisit.

```xml
<!-- Directory.Packages.props -->
<Project>
  <PropertyGroup>
    <ManagePackageVersionsCentrally>true</ManagePackageVersionsCentrally>
    <CentralPackageTransitivePinningEnabled>true</CentralPackageTransitivePinningEnabled>
  </PropertyGroup>
  <ItemGroup>
    <PackageVersion Include="Contoh.Pdf" Version="4.0.0" />
    <!-- Transitive pin. Reason: advisory in 2.1.0. Remove when Contoh.Pdf requires >= 2.1.5. Owner: platform team. -->
    <PackageVersion Include="Contoh.Parser" Version="2.1.5" />
  </ItemGroup>
</Project>
```

Perhatikan komentar di atas pin. Itu bagian terpenting dari contoh ini, bukan bagian XML-nya.

## Pasangannya: biarkan build yang memberi tahu

Pin tanpa deteksi hanya menunda masalah. `NuGetAudit` melaporkan advisory saat restore. Menurut dokumentasi, `NuGetAuditMode` bernilai `direct` secara default kecuali proyek menargetkan `net10.0` atau lebih baru, jadi untuk target lain, setel `all` supaya paket transitif ikut diperiksa:

```xml
<PropertyGroup>
  <NuGetAudit>true</NuGetAudit>
  <NuGetAuditMode>all</NuGetAuditMode>
  <NuGetAuditLevel>moderate</NuGetAuditLevel>
  <!-- Only high and critical advisories fail the build. -->
  <WarningsAsErrors>$(WarningsAsErrors);NU1903;NU1904</WarningsAsErrors>
</PropertyGroup>
```

NU1903 dan NU1904 adalah kode untuk advisory tingkat high dan critical.

## Di mana agent masuk

Pin di atas terlihat aneh bagi yang tidak tahu ceritanya: paket yang tidak ada satu pun `PackageReference`-nya, dengan versi yang lebih tinggi dari yang diminta siapa pun. Agent yang diminta merapikan dependensi punya dua tindakan yang masuk akal dan sama-sama salah. Menghapusnya karena "tidak dipakai", sehingga celah kembali tanpa ada yang tahu. Atau menaikkannya ke versi terbaru karena "lebih baru lebih aman", padahal pin itu bisa saja menjaga kompatibilitas dengan paket lain.

Agent tidak bisa menebak alasan. Alasan harus ada di tempat ia membaca, dan harus bisa diperiksa. Tambahkan satu aturan ke CLAUDE.md:

```markdown
- Setiap `PackageVersion` yang tidak punya `PackageReference` langsung adalah pin transitif.
  Jangan hapus atau naikkan tanpa membaca komentar di atasnya. Pin tanpa komentar alasan,
  syarat lepas, dan pemilik: tanyakan dulu, jangan ubah.
```

## Batas yang jujur

Komentar tidak ditegakkan oleh compiler. Pin yang syarat lepasnya sudah terpenuhi tetap akan bertahan selamanya kalau tidak ada yang melihat. Cara termurah yang saya tahu: jadwalkan peninjauan pin sebagai kerja berulang, dan biarkan `NuGetAudit` yang mengingatkan ketika sebuah pin menjadi tidak perlu atau tidak cukup. Untuk pustaka yang Anda publikasikan, ingat bahwa pin ikut menjadi dependensi eksplisit di paket Anda.

Satu hal lagi yang perlu dibaca ulang sebelum Anda mengandalkan pola ini: pin hanya menjaga versi yang Anda pilih hari ini. Ia tidak membuktikan bahwa versi itu kompatibel dengan semua yang memakainya. Jalankan test suite penuh setiap kali sebuah pin berubah, bukan hanya build.

Tes yang saya pakai untuk setiap pin: kalau orang yang menulisnya pindah tim besok, apakah yang membaca file ini tahu kenapa baris itu ada dan kapan boleh dihapus?
