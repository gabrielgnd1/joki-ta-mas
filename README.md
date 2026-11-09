# JOKITAMAS — Joki War Tiket Konser

Website pemesanan jasa war tiket konser dengan form 3 langkah, cek pesanan,
pricelist, dan panel admin untuk verifikasi pembayaran secara manual.

> Baru bergabung atau lanjut mengerjakan proyek ini? Baca
> **[`HANDOFF.md`](./HANDOFF.md)** — panduan lengkap dalam Bahasa Indonesia.

## Stack

- **Next.js 16** (App Router, Server Actions) + React 19
- **SQLite** via `better-sqlite3` — database berupa satu file di `data/`
- **Tailwind CSS 4**
- Tanpa layanan eksternal: tidak perlu Supabase, tidak perlu VPS khusus untuk
  mencoba. Cukup Node.js 22+.

## Menjalankan

```bash
npm install
npm run dev
```

Buka http://localhost:3000

Build produksi:

```bash
npm run build
npm start
```

## Login admin

Saat database pertama kali dibuat, akun admin otomatis dibuat dari env:

| Env | Default |
| --- | --- |
| `ADMIN_NAME` | `Admin Jokitamas` |
| `ADMIN_EMAIL` | `admin@jokitamas.local` |
| `ADMIN_PASSWORD` | `admin123` |

**Segera ganti password** lewat menu **Tim** setelah login pertama, atau isi
`.env` sebelum menjalankan pertama kali:

```bash
cp .env.example .env
```

Lalu buka http://localhost:3000/admin

## Halaman

| URL | Fungsi |
| --- | --- |
| `/` | Form pemesanan (3 langkah) |
| `/cek` | Cek status + unggah bukti transfer |
| `/pricelist` | Daftar harga per section |
| `/admin` | Daftar pesanan, filter, statistik |
| `/admin/orders/[id]` | Detail pesanan, bukti transfer, verifikasi manual |
| `/admin/event` | Ubah event, jadwal, fee, buka/tutup section |
| `/admin/settings` | Rekening BCA/GoPay, kontak, syarat, buka/tutup war |
| `/admin/team` | Tambah admin/verifikator, reset password |

## Alur pembayaran manual

1. Pemesan mengisi form dan memilih **Transfer BCA** atau **Transfer GoPay**.
2. Setelah submit, pemesan mendapat kode pesanan (`JTM-XXXXXX`).
3. Pemesan transfer, lalu upload bukti di `/cek`.
4. Status otomatis menjadi **Menunggu Verifikasi**.
5. Admin membuka detail pesanan, mencocokkan nominal + tujuan transfer, lalu
   menekan **Verifikasi Pembayaran**. Status menjadi **Pembayaran Valid** dan
   tercatat siapa yang memverifikasi beserta waktunya.
6. Setelah tiket berhasil didapat, admin menandai **Selesai**.

Tidak ada verifikasi otomatis. Semua perubahan status dilakukan manusia.

## Data & backup

Semua data ada di folder `data/`:

```
data/jokitamas.db          # database SQLite
data/uploads/              # bukti transfer yang diunggah
```

Backup cukup copy folder tersebut. Contoh:

```bash
tar -czf backup-jokitamas-$(date +%F).tar.gz data/
```

## Catatan deploy

- Butuh hosting dengan **filesystem persisten** (VPS, Railway/Fly dengan
  volume, shared hosting Node, atau komputer sendiri). **Jangan** taruh file
  SQLite di Vercel/Netlify serverless — datanya hilang.
- Jalankan di belakang HTTPS, lalu set `COOKIE_SECURE=true` di `.env`.
- Ganti `ADMIN_PASSWORD` sebelum deploy.
- Upload bukti dibatasi 4 MB (JPG/PNG/WEBP/PDF), tersimpan di luar `public/`
  dan hanya bisa diakses lewat route yang membutuhkan kode pesanan.

## Keamanan yang sudah ada

- Password di-hash dengan `scrypt` (bukan plain text).
- Sesi login disimpan di database + cookie `httpOnly`, bukan JWT di localStorage.
- Rate limit untuk submit pesanan, upload bukti, dan login.
- Honeypot field untuk bot.
- Harga **selalu dihitung ulang di server** dari database, bukan dari client.
- Bukti transfer tidak bisa ditebak karena butuh kode pesanan acak.
- Verifikator tidak bisa mengakses menu event, pengaturan, atau tim.
