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
| `npm run db:migrate` | Terapkan migration ke database (jalankan setelah deploy) |
| `npm run storage:cors` | Izinkan upload dari browser ke Wasabi (sekali, untuk halaman admin) |
| `npm run db:generate` | Buat migration baru setelah mengubah `src/db/schema.ts` |

## Production (PM2)

```bash
npm ci
npm run build
npm run db:migrate               # buat/update tabel database
npm run sync                     # sync pertama
pm2 start ecosystem.config.cjs   # web :$PORT (default 3000) + cron sync (30 menit) + cron token (Senin 03:00)
pm2 save && pm2 startup          # auto-start saat server reboot
```

Update (pull, install, build, migrate, reload):

```bash
npm run deploy
```

Perubahan lokal di server (biasanya `package-lock.json` setelah `npm install`) otomatis disimpan ke `git stash`, jadi tidak perlu stash manual. Di server selalu pakai `npm ci`, bukan `npm install`.

Ganti port lewat `PORT` di `.env`, lalu `pm2 delete ig-sync-web && pm2 start ecosystem.config.cjs --only ig-sync-web && pm2 save`. Pasang Nginx + HTTPS di depan port tersebut. Share file di HP hanya jalan lewat HTTPS.

## Post khusus aplikasi (`/admin`)

Foto, video, atau carousel yang tidak diposting di Instagram bisa ditambahkan lewat `/admin`:

1. Isi `ADMIN_PASSWORD` (minimal 8 karakter) dan `SITE_URL` di `.env`.
2. Jalankan `npm run storage:cors` sekali, supaya browser boleh upload langsung ke Wasabi.
3. Buka `https://<domain>/admin`, login, lalu tekan **Post baru**.

- Post diurutkan bersama post IG berdasarkan tanggal posting.
- Tanggal di masa depan = terjadwal: tidak tampil ke publik sampai waktunya tiba.
- Di grid, post ini ditandai icon ✨. Di halaman detail, tombol yang khusus IG disembunyikan, dan "Bagikan link" membagikan link halaman aplikasi.
- Sync IG tidak pernah menghapus post ini.

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
