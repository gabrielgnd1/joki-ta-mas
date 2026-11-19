# Joki Ta Mas? — Jasa Joki Tiket 2S / MnG

Website pemesanan jasa joki tiket JKT48 (**2-Shot** dan **Meet & Greet**) dengan
keranjang multi-member, pengiriman rincian pesanan ke WhatsApp, dan panel admin
untuk verifikasi status secara manual.

> Baru bergabung atau lanjut mengerjakan proyek ini? Baca
> **[`HANDOFF.md`](./HANDOFF.md)** — panduan lengkap dalam Bahasa Indonesia.

## Stack

- **Next.js 16** (App Router, Server Actions) + React 19
- **SQLite** via `@libsql/client` (libSQL / Turso)
- **Tailwind CSS 4** + CSS mentah yang di-scope di `globals.css`
- Lokal: database file di `data/`. Produksi: Turso (gratis) supaya bisa jalan
  di Vercel. Cukup Node.js 22+.

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
| `ADMIN_NAME` | `Admin Joki Ta Mas?` |
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
| `/` | Form pesanan 2S / MnG (keranjang multi-member → WhatsApp) |
| `/admin` | Daftar pesanan, filter status, pencarian, statistik |
| `/admin/orders/[id]` | Detail pesanan, kredensial akun, verifikasi status |
| `/admin/katalog` | Edit harga member (2S, MnG 1–4, MnG 5–20) — langsung aktif |
| `/admin/settings` | Buka/tutup pemesanan & jenis akun, pengumuman, kontak WA |
| `/admin/team` | Tambah admin/verifikator, aktif/nonaktif, reset password |
| `/admin/login` | Login admin |

Halaman `/pricelist` dan `/admin/event` dari versi lama **sudah dihapus**.

## Alur pemesanan

1. Pemesan memilih layanan (2S atau MnG), tim, member, jumlah tiket, lalu
   menambahkannya ke keranjang. Bisa lebih dari satu member dalam satu pesanan.
2. Pemesan mengisi nama, status akun (OFC / Non-OFC), email & password akun
   JKT48. **Tidak ada** kolom nomor WhatsApp pemesan.
3. Submit → pesanan disimpan di database dengan kode `JTM-XXXXXX`, lalu jendela
   WhatsApp ke admin terbuka berisi rincian pesanan **termasuk kode pesanan**.
4. Admin mencocokkan chat WhatsApp dengan pesanan di panel lewat kode tersebut.
5. Admin memverifikasi (Pembayaran Valid), menambahkan catatan internal, dan
   menandai **Selesai** — semuanya manual, tidak ada verifikasi otomatis.

Harga selalu dihitung ulang di server dari katalog member di database
(tabel `member_catalog`). Harga bisa diedit sendiri lewat **`/admin/katalog`**
tanpa deploy; daftar member (roster) berasal dari `src/lib/members.ts`.

## Database

Lokal (tanpa env): otomatis memakai `data/jokitamas.db`.

Produksi: isi env Turso:

```bash
TURSO_DATABASE_URL=libsql://...
TURSO_AUTH_TOKEN=...
```

Skema dan data awal (admin + settings + katalog member) dibuat otomatis saat
request pertama. Tabel pesanan aktif: **`service_orders`**; harga member:
**`member_catalog`**. Tabel lama (`orders`, `events`, `sections`) masih ada di
skema agar data lama tidak hilang, tetapi tidak dipakai aplikasi lagi.

Backup database Turso lewat dashboard Turso atau:

```bash
turso db shell jokitamas ".dump" > backup.sql
```

## Deploy ke Vercel

1. Import repo ini di [vercel.com/new](https://vercel.com/new).
2. Set environment variables:
   - `TURSO_DATABASE_URL`
   - `TURSO_AUTH_TOKEN`
   - `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`
   - `COOKIE_SECURE=true`
3. Deploy.
4. Tambahkan domain di **Project → Settings → Domains**, lalu atur DNS sesuai
   instruksi Vercel.

Jangan set `DATABASE_PATH` di Vercel. Filesystem Vercel tidak persisten; semua
data harus lewat Turso.

- Kredensial akun JKT48 pemesan disimpan di database dan hanya tampil di panel
  admin (ada peringatan + tombol tampilkan/salin). Tidak ada file upload.
- Nomor WhatsApp pemesan tidak diminta; koordinasi lewat chat WhatsApp dengan
  mencocokkan kode pesanan.

## Keamanan yang sudah ada

- Password admin di-hash dengan `scrypt` (bukan plain text).
- Sesi login disimpan di database + cookie `httpOnly`, bukan JWT di localStorage.
- Rate limit untuk submit pesanan dan login.
- Honeypot field untuk bot.
- Harga **selalu dihitung ulang di server** dari katalog member, bukan dari client.
- Verifikator tidak bisa mengakses pengaturan atau tim.
