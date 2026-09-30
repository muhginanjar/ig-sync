# sosmed-infimate

Galeri semua post Instagram **@infimate.travel** dengan tombol share: foto, video, atau carousel dibagikan sebagai file asli lewat share sheet HP.

## Stack

- Next.js 16 (App Router) + Tailwind
- SQLite (better-sqlite3 + Drizzle), file di `data/app.db`
- Wasabi (S3-compatible) untuk menyimpan media
- Instagram API with Instagram Login (`instagram_business_basic`)

## Setup

```bash
npm install
cp .env.example .env   # isi kredensial IG & Wasabi
npm run sync           # tarik semua post dari IG → Wasabi + SQLite
npm run dev            # http://localhost:3000
```

## Perintah

| Perintah | Fungsi |
|---|---|
| `npm run sync` | Impor post baru, update caption, hapus post yang sudah dihapus di IG |
| `npm run sync -- --full` | Download ulang semua media |
| `npm run token:refresh` | Perpanjang token IG 60 hari (jalankan mingguan) |
| `npm run db:generate` | Buat migration baru setelah mengubah `src/db/schema.ts` |

Contoh crontab di server:

```cron
*/30 * * * * cd /app && npm run sync >> logs/sync.log 2>&1
0 3 * * 1    cd /app && npm run token:refresh >> logs/token.log 2>&1
```

## Cara kerja

```
IG API ──(npm run sync)──► Wasabi (media) + SQLite (metadata)
                                   │
Browser ◄── /media/<key>    302 ke presigned URL Wasabi   (tampilan)
        ◄── /api/file/<id>  stream same-origin            (share/download)
```

- `/api/file/<id>` ada karena Web Share API butuh byte file-nya, dan fetch langsung ke Wasabi akan terkena CORS.
- Post dengan total ukuran ≤ 15 MB disiapkan otomatis saat halaman dibuka, jadi share sheet langsung muncul. Post yang lebih besar (video) disiapkan saat tombol ditekan. Kalau browser menganggap tap-nya kedaluwarsa, tombol meminta tap sekali lagi.
- Di desktop yang tidak mendukung share file, tombol otomatis beralih ke share/salin link.
