---
title: "Aturan yang wajib jalan naikkan jadi gate — tapi gate yang gagal diam-diam lebih buruk daripada tidak ada"
ringkasan: "Catatan 08 bilang aturan yang wajib jalan sebaiknya naik jadi hook, bukan tinggal di CLAUDE.md. Yang tidak saya sebut di sana: hook yang error dan keluar diam-diam terbaca persis seperti hook yang lolos, dan itu lebih berbahaya daripada aturan yang Anda tahu tidak ditegakkan."
tanggal: 2026-08-26
topik: "Claude Code"
sumber: "https://code.claude.com/docs/en/hooks"
draft: false
---

Di catatan 08 ada satu kalimat yang saya lewati terlalu cepat: aturan yang wajib jalan
sebaiknya naik jadi **hook**, dan yang tersisa di CLAUDE.md cukup alasannya. Catatan ini
menagih janji itu — sekaligus memasang peringatan yang seharusnya ikut saya tulis.

## Aturan yang cuma dideklarasikan

Mulai dari kasus nyata. Sebuah repo mendeklarasikan batas arsitekturnya di konfigurasi
linter: layer mana boleh mereferensi layer mana. Konfigurasinya benar. Masalahnya,
linter itu **tidak pernah jalan** — versinya dan salah satu plugin-nya terpaut satu major
version, prosesnya crash sebelum mengevaluasi satu rule pun, dan tidak ada workflow yang
memanggilnya. Crash-nya pun tak pernah kelihatan.

Padanannya di .NET: Anda menulis di CLAUDE.md:

```markdown
Rule: dependencies point inward. Shop.Domain must never reference Shop.Application,
Shop.Infrastructure, or Shop.Api.
```

Lalu apa yang menegakkannya? `dotnet build` tidak. Begitu ada agent yang menambahkan
`ProjectReference` ke luar untuk "menyelesaikan" sebuah task, build **tetap** hijau.
Aturannya hanya hidup sebagai kalimat yang dibaca dan kadang dipatuhi.

## Naikkan ke `dotnet test` dulu, baru pikirkan hook

Sebelum menulis hook, tanyakan apakah aturannya bisa jadi **tes biasa**. Untuk batas
arsitektur, bisa — dan jauh lebih murah:

```csharp
public class ArchitectureTests
{
    [Fact]
    public void Domain_should_not_depend_on_outer_layers()
    {
        var result = Types.InAssembly(typeof(Order).Assembly)
            .That().ResideInNamespace("Shop.Domain")
            .ShouldNot().HaveDependencyOnAny(
                "Shop.Application", "Shop.Infrastructure", "Shop.Api")
            .GetResult();

        Assert.True(
            result.IsSuccessful,
            $"Layering violated by: {string.Join(", ", result.FailingTypeNames ?? [])}");
    }
}
```

Sekarang aturannya punya gigi: `dotnet test` merah, CI merah, dan pesan gagalnya
menyebut tipe mana yang melanggar. **Aturan yang bisa jadi tes, jadikan tes.**

Bedanya dengan CLAUDE.md: kalimat di sana meminta agent *berusaha* patuh, tes membuat
ketidakpatuhan jadi kegagalan. Dan karena tes hidup di repo, dia ikut jalan untuk manusia —
Anda bukan membangun pagar khusus agent, Anda menutup lubang yang memang terbuka untuk
semua orang.

Hook baru dipakai untuk yang tidak bisa jadi tes: sesuatu yang harus terjadi **sebelum**
sebuah aksi. Menahan `git push` sampai ada konfirmasi manusia contohnya — tidak ada
`dotnet test` yang bisa mencegah itu, karena saat tes jalan aksinya sudah lewat.

## Kalau memang harus hook, hook-nya harus bisa berisik

Hook adalah perintah shell yang jalan di lifecycle event, apa pun yang agent putuskan:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          { "type": "command", "command": "node", "args": [".claude/hooks/git-write-gate.mjs"] }
        ]
      }
    ]
  }
}
```

Jebakannya semuanya berbentuk sama: **hook yang gagal tanpa suara terbaca sebagai
lolos.**

Pertama, **`.sh` di Windows**. Kalau ada satu anggota tim yang jalan di Windows tanpa WSL,
hook `.sh` Anda no-op di mesin dia — dan di layarnya semua tampak normal. Tulis hook di
Node, bukan bash. Ini alasan paling membosankan untuk kehilangan gate.

Perhatikan juga bentuk deklarasi di JSON di atas: `command` dan `args` dipisah — *exec
form*. Kalau ditulis sebagai satu string, ada shell yang menafsirkannya, dan shell itu
berbeda di tiap mesin.

Kedua, **exit 0 tanpa output artinya "tidak berpendapat"**. `try/catch` yang menelan
exception lalu `return` akan membuka semua yang tadinya dijaga. Gagalnya harus ke arah
menolak, bukan ke arah diam:

```javascript
try {
  const verdict = evaluate(input);
  if (verdict.block) {
    console.error(verdict.reason);
    process.exit(2);        // 2 = block, and the reason reaches the agent
  }
} catch (err) {
  console.error(`git-write-gate crashed: ${err.message}`);
  process.exit(2);          // fail closed, never silently allow
}
```

Ketiga, **perilaku di CI**. Hook untuk sesi interaktif bisa ikut jalan di runner dan
menahan langkah otomatis — sementara run-nya tetap exit 0, jadi tidak ada yang curiga.
Periksa `process.env.GITHUB_ACTIONS` eksplisit, dan putuskan sadar-sadar: no-op, atau
tetap menjaga.

## Hook dikunci versinya, skill boleh mengambang

Satu kebijakan versi tidak cukup untuk keduanya. Skill dan rule hanya mengubah apa yang
**dibaca** agent, jadi biarkan mengikuti commit terbaru. Hook **dieksekusi** di mesin
setiap orang, jadi versinya dikunci dan naiknya bertahap: satu mesin, lalu satu repo, baru
semua orang. Hook rusak yang auto-propagate memblokir semua orang sekaligus, tanpa jalan
keluar lokal.

Dan kalau Anda mendistribusikannya lewat setelan organisasi, **jangan pernah menandainya
*Required***. Required menghapus kemampuan tim untuk menonaktifkannya — tepat saat mereka
paling membutuhkannya, yaitu ketika hook-nya salah memblokir pekerjaan yang sah. Kemampuan
mematikan gate adalah dasar argumen kenapa gate itu aman dipasang.

## Tes untuk memutuskan sebuah gate layak dipercaya

Satu pertanyaan, dan ini bukan pertanyaan tentang kode:

> Kapan terakhir kali gate ini **menolak** sesuatu, dan siapa yang melihatnya?

Kalau jawabannya "belum pernah", itu bukan kabar baik — berarti Anda belum punya bukti
gate-nya hidup. Buktikan sekali, sengaja: tulis commit yang melanggar aturannya, lihat dia
merah. Baru setelah itu gate-nya masuk hitungan.

Dan simpan satu tes bypass di suite Anda — tes yang mencoba menerobos gate dan **harus
gagal**. Tes itulah yang memberi tahu Anda saat gate-nya diam-diam mati.
