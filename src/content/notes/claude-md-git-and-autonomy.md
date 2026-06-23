---
title: "Git dan otonomi di CLAUDE.md: kapan agen jalan sendiri, kapan bertanya"
ringkasan: "Aturan git dan batas otonomi yang eksplisit mengurangi friksi dua arah — agent berhenti meminta izin untuk hal remeh, dan berhenti mengambil keputusan yang seharusnya milik Anda."
tanggal: 2026-06-23
topik: "Claude Code"
draft: false
---

Dua sumber friksi yang sering muncul saat bekerja dengan agent: dia melakukan
operasi git yang tidak Anda inginkan (commit setengah jadi, push ke main), atau
sebaliknya — berhenti tiap dua menit menanyakan hal yang jelas. Keduanya
gejala dari hal yang sama: **batas otonomi tidak pernah dituliskan.** Bagian
CLAUDE.md ini yang menetapkannya.

## Aturan git: yang tidak boleh diserahkan ke tebakan

Git adalah tempat kesalahan agent paling mahal, jadi aturannya harus tegas:

```
## Git rules

- Never work on main directly. Always branch first.
- Branch naming: <type>/<short-description>, e.g. feat/user-export.
- Conventional commits: feat:, fix:, refactor:, docs:, test:, chore:
- Never force-push. Never rebase a shared branch.
- NEVER commit or push without explicit confirmation. Stage the changes,
  show a summary, and wait for me to say "commit" or "push".
```

Baris terakhir itu yang paling sering menyelamatkan. Secara default, biarkan
agent menulis kode sebebasnya — tapi jadikan commit dan push sebagai tindakan
yang **selalu** butuh konfirmasi. Menulis kode mudah di-undo; sejarah git yang
sudah ter-push tidak.

## Trust model: default bertindak, kecuali untuk hal-hal ini

Sisi sebaliknya sama pentingnya. Kalau agent meminta izin untuk setiap langkah,
Anda kehilangan seluruh keuntungan agentic coding. Tetapkan defaultnya
**bertindak**, lalu daftarkan pengecualian yang harus ditanyakan:

```
## Autonomy

Act without asking for standard work: writing code, refactoring, adding
tests, fixing bugs within the stated scope. Don't ask "shall I continue?" —
keep going until the task is done or you are genuinely blocked.

Ask first only for:
- Architectural changes (new project, swapping a library, changing a schema)
- Business/product decisions (what a feature should do)
- Security-sensitive changes (auth, secrets, permissions)
- Anything destructive or hard to reverse
```

Daftar pengecualian ini membuat otonomi terasa aman. Anda tidak memberi cek
kosong — Anda bilang "jalan sendiri untuk pekerjaan rutin, berhenti di empat
hal ini". Agent jadi tahu kapan harus melaju dan kapan harus angkat tangan.

## Sertakan jejak yang konsisten

Hal kecil yang berguna untuk audit: minta agent menandai commit-nya sendiri,
supaya kontribusi agent bisa dibedakan di sejarah git.

```
- Add a trailer to agent-authored commits:
  Co-Authored-By: Claude <noreply@anthropic.com>
```

## Intinya

Otonomi bukan saklar on/off — ini garis yang Anda tarik. Tulis aturan git yang
tegas (terutama: jangan pernah commit/push tanpa konfirmasi), lalu beri agent
default "bertindak" dengan daftar pendek hal yang harus ditanyakan dulu. Hasilnya
agent yang melaju untuk hal rutin tanpa menyeret Anda, tapi tahu persis kapan
keputusan itu bukan miliknya.
