---
title: "Log agen bukan dokumentasi — itu mekanisme pemulihan saat sesi mati"
ringkasan: "Sesi agent bisa kehabisan konteks atau berhenti di tengah kerja, dan seluruh alasan di balik keputusannya ikut hilang. Log append-only yang ditulis sebelum tiap tahap membuat sesi berikutnya melanjutkan, bukan mengulang."
tanggal: 2026-08-12
topik: "Agentic Coding"
sumber: "https://claude.com/blog/the-new-rules-of-context-engineering-for-claude-5-generation-models"
draft: false
---

Ini kejadian yang mungkin sudah Anda alami. Agent bekerja dua jam pada satu
fitur, sudah menyentuh delapan file, lalu sesi berakhir — konteks penuh,
koneksi putus, atau Anda sendiri yang menutup terminal. Anda buka sesi baru.
Kodenya masih ada di working tree, tapi **alasannya tidak.** Kenapa handler ini
dipindah? Kenapa pendekatan pertama dibuang? Agent baru tidak tahu, jadi dia
menebak — dan sering menebak arah yang sudah dicoba dan gagal satu jam lalu.

Yang hilang bukan kode. Yang hilang jejak keputusan.

## Aturan yang saya pakai

Satu bagian di CLAUDE.md, dan ini termasuk sedikit aturan yang saya tandai
wajib:

```markdown
## Agent logging (MANDATORY)

Every agent writes an append-only markdown log to:
docs/agent-logs/{branch-name}-{YYYY-MM-DD}.md

Write a log entry BEFORE starting each new section of work:

  ## [HH:MM UTC] — What I'm doing
  **What I did:** completed action
  **What I found:** findings or "nothing notable"
  **What's next:** planned next action
  **Blockers:** None / description

This is the crash recovery mechanism. If an agent dies, the next agent
reads this log.
```

Dua detail kecil di situ yang menentukan semuanya berfungsi atau tidak.

**Pertama: ditulis _sebelum_, bukan sesudah.** Log yang ditulis setelah
pekerjaan selesai adalah laporan, dan laporan tidak pernah ada saat Anda paling
membutuhkannya — yaitu ketika pekerjaannya justru *tidak* selesai. Menuliskan
"yang akan saya kerjakan" sebelum mulai berarti kalau sesi mati di tengah,
kalimat terakhir di log persis menjelaskan apa yang sedang berlangsung.

**Kedua: append-only.** Kalau agent boleh menyunting entri lama, dia akan
merapikannya — dan yang pertama hilang justru pendekatan yang gagal. Padahal
itu bagian paling berharga isinya. Log yang rapi berbohong tentang bentuk
pekerjaan yang sebenarnya.

## Sub-agent menulis ke file, bukan kembali ke konteks induk

Aturan pendamping yang dampaknya sama besar:

```markdown
## Context management (agent teams)

- Sub-agents write their findings to a file under `docs/` — the report path
  named in the mission brief, or `docs/agent-logs/` — never back into the
  parent's context.
- Context is summarized automatically as it fills. Don't stop to ask about
  it, and don't wrap up work early on account of it.
```

Kalau Anda menyuruh sub-agent memetakan seluruh repository layer lalu melapor
balik, ringkasan itu masuk ke konteks induk dan mendorong keluar hal lain.
Kalau dia menulis ke `docs/agent-logs/repo-scan.md`, induknya cukup membaca
bagian yang dia butuhkan, saat dia membutuhkannya. Sub-agent jadi cara
**menghemat** konteks, bukan cara menghabiskannya.

## "Bukannya sekarang sudah ada auto memory?"

Pertanyaan yang wajar, dan jawabannya tidak sepenuhnya "ya". Claude Code
sekarang punya **auto memory**: agent menulis sendiri apa yang layak diingat ke
`~/.claude/projects/<project>/memory/`, dengan `MEMORY.md` sebagai indeks yang
dimuat di awal tiap sesi. Anthropic bahkan menyebutnya sebagai salah satu
pergeseran dalam [aturan baru context engineering untuk model Claude
5](https://claude.com/blog/the-new-rules-of-context-engineering-for-claude-5-generation-models):
dari memory yang Anda tulis manual, ke memory yang ditulis sendiri.

Tapi dua hal itu menjawab pertanyaan yang berbeda:

| | Auto memory | Log agen |
|---|---|---|
| Isinya | apa yang layak diingat **lain kali** | apa yang sedang terjadi **sekarang** |
| Ditulis saat | agent menilai sesuatu berguna ke depan | sebelum tiap tahap kerja, tanpa kecuali |
| Hidup di | mesin Anda, di luar repo | dalam repo, ikut branch dan PR |
| Dibaca siapa | agent | agent **dan** rekan tim Anda |

Auto memory dirancang untuk pengetahuan yang bertahan — perintah build,
preferensi, jebakan yang berulang. Dia tidak dirancang untuk merekam
pekerjaan yang belum selesai, dan justru itu yang Anda butuhkan ketika sesi mati
di tengah jalan. Agent yang berhenti mendadak belum sempat menilai apa pun
"layak diingat"; yang menyelamatkan Anda adalah kalimat yang sudah dia tulis
sebelum mulai. Auto memory juga bersifat lokal per mesin — jadi kalau yang Anda
inginkan adalah rekan tim bisa melanjutkan, atau reviewer bisa membaca alasan di
balik sebuah PR, memory tidak sampai ke sana. Pakai keduanya; keduanya tidak
saling menggantikan.

Satu koreksi yang saya lakukan pada aturan saya sendiri karena artikel itu.
Prinsip pertama mereka adalah *rules → judgment*: aturan kaku yang ditulis untuk
mengekang model lemah sekarang cenderung jadi kebisingan. Menandai sesuatu
**MANDATORY** artinya Anda mengklaim ini termasuk pengecualian — dan klaim itu
kehilangan daya kalau Anda menandai lima hal sekaligus. Di CLAUDE.md saya,
logging adalah salah satu dari dua aturan yang berstatus wajib. Kalau daftar itu
tumbuh, yang rusak bukan cuma konteks, tapi arti kata "wajib" itu sendiri.

## Kenapa ini terasa berlebihan sampai satu kali menyelamatkan Anda

Saya paham keberatannya: ini terasa seperti birokrasi untuk mesin. Tiga hal
yang mengubah pandangan saya.

Log itu ternyata **bahan review yang bagus.** Membaca "coba pakai
`IAsyncEnumerable`, dibatalkan karena EF Core mematerialisasi seluruh hasil di
provider ini" lebih menjelaskan sebuah PR daripada diff-nya sendiri.

Log itu juga **jujur soal jalan buntu**, dan itu satu-satunya tempat di repo
yang jujur soal itu. Commit menyimpan yang berhasil. Log menyimpan yang dicoba.

Dan karena log itu file biasa, dia bisa diabaikan oleh hal-hal yang memang
seharusnya mengabaikannya. Di repo saya, `docs/agent-logs/` masuk daftar path
yang tidak pernah direview — reviewer otomatis melewatinya, jadi log tidak
pernah mengotori PR.

Satu tes untuk menilai apakah log Anda benar-benar berfungsi: buka log dari
sesi yang mati di tengah jalan, baca entri terakhirnya, dan tanya apakah orang
lain bisa melanjutkan dari situ tanpa bertanya kepada Anda. Kalau tidak bisa,
yang Anda punya adalah catatan kegiatan, bukan mekanisme pemulihan.
