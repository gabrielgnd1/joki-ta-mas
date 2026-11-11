# Panduan Lanjutan Proyek Joki Ta Mas?

> Dokumen serah-terima untuk teman yang akan melanjutkan proyek ini.
> Terakhir diperbarui: 10 November 2026.

Dokumen ini menjelaskan **apa yang sudah jadi**, **cara menjalankannya**, **di mana harus mengubah sesuatu**, dan **apa yang sebaiknya dikerjakan berikutnya**. Untuk instruksi singkat, lihat juga [`README.md`](./README.md).

---

## 1. Ringkasan proyek

Joki Ta Mas? adalah website jasa **joki war tiket konser**. Pemesan mengisi form, memilih section, transfer fee joki, lalu mengirim bukti transfer ke admin lewat WhatsApp. Admin/verifikator mengecek bukti tersebut **secara manual** dan mengubah status pesanan.

Yang **tidak** ada di proyek ini (memang di luar scope):

- Joki VC / Meet & Greet / 2-shot.
- Verifikasi pembayaran otomatis (tidak ada integrasi payment gateway/mutasi bank).
- Pembayaran selain **QRIS**.
- Multi-event dalam satu halaman (saat ini satu event aktif, lihat bagian 8).

---

## 2. Status proyek

Sudah selesai dan sudah diuji end-to-end:

- Form pemesanan 3 langkah (event → section → data diri & pembayaran).
- Perhitungan harga di server, kode pesanan `JTM-XXXXXX`.
- Tombol kirim bukti transfer lewat WhatsApp (tanpa upload di web).
- Pricelist dengan warna per section.
- Panel admin: daftar pesanan, filter, pencarian, statistik, detail pesanan, verifikasi manual, catatan internal, ubah status manual.
- Manajemen event & section (harga, buka/tutup).
- Pengaturan situs (rekening, kontak, syarat, buka/tutup war, pengumuman).
- Manajemen tim (tambah admin/verifikator, aktif/nonaktif, reset password).
- Tema visual baru: langit biru, aksen emas, warna CAT sesuai seatplan.

Build produksi terakhir: **lulus** (`npm run build` bersih).
Database pengujian sudah dihapus; database baru akan dibuat otomatis saat pertama kali dijalankan.

---

## 3. Mulai cepat

### Prasyarat

- **Node.js 22 atau lebih baru** (dikembangkan di Node 24).
- npm (sudah termasuk Node).
- Tidak perlu build tools native; driver database memakai `@libsql/client`.

### Instalasi

```bash
git clone https://github.com/gabrielgnd1/joki-ta-mas.git
cd joki-ta-mas
npm install
cp .env.example .env      # opsional, tapi disarankan
npm run dev
```

Buka <http://localhost:3000>.

> Catatan WSL: jika memakai `nvm`, jalankan perintah lewat shell interaktif
> (`bash -ic "..."`) atau pastikan `node` ada di `PATH`.

### Perintah npm

| Perintah | Fungsi |
| --- | --- |
| `npm run dev` | Development server di `0.0.0.0:3000` (hot reload) |
| `npm run build` | Build produksi |
| `npm start` | Jalankan hasil build di `0.0.0.0:3000` |

### Environment variables

Lihat `.env.example`:

| Variabel | Default | Keterangan |
| --- | --- | --- |
| `TURSO_DATABASE_URL` | — | URL database Turso (`libsql://...`) untuk produksi |
| `TURSO_AUTH_TOKEN` | — | Token akses Turso |
| `DATABASE_PATH` | `./data/jokitamas.db` | Lokasi file SQLite lokal (dipakai bila URL Turso kosong) |
| `ADMIN_NAME` | `Admin Jokitamas` | Nama admin pertama (hanya saat DB kosong) |
| `ADMIN_EMAIL` | `admin@jokitamas.local` | Email admin pertama |
| `ADMIN_PASSWORD` | `admin123` | Password admin pertama |
| `COOKIE_SECURE` | `false` | Set `true` saat sudah pakai HTTPS |

**Penting:** `ADMIN_*` hanya dipakai saat tabel `users` masih kosong. Kalau database sudah ada, mengubah env tidak berefek — gunakan menu **Tim** di panel admin.

### Login admin

- URL: <http://localhost:3000/admin>
- Default: `admin@jokitamas.local` / `admin123`

**Segera ganti password** lewat menu **Tim** setelah login pertama.

---

## 4. Peta halaman & API

### Halaman publik

| URL | File | Fungsi |
| --- | --- | --- |
| `/` | `src/app/page.tsx` | Hero + wizard pemesanan |
| `/pricelist` | `src/app/pricelist/page.tsx` | Daftar fee per section |

### Panel admin

| URL | File | Akses | Fungsi |
| --- | --- | --- | --- |
| `/admin/login` | `src/app/admin/login/page.tsx` | publik | Form login |
| `/admin` | `src/app/admin/(panel)/page.tsx` | admin + verifier | Daftar pesanan, filter, statistik |
| `/admin/orders/[id]` | `src/app/admin/(panel)/orders/[id]/page.tsx` | admin + verifier | Detail, verifikasi manual |
| `/admin/event` | `src/app/admin/(panel)/event/page.tsx` | **admin saja** | Ubah event, harga, buka/tutup section |
| `/admin/settings` | `src/app/admin/(panel)/settings/page.tsx` | **admin saja** | Rekening, kontak, syarat, pengumuman |
| `/admin/team` | `src/app/admin/(panel)/team/page.tsx` | **admin saja** | Kelola akun tim |

### API routes

| Endpoint | Method | Fungsi |
| --- | --- | --- |
| `/api/orders` | `POST` | Membuat pesanan (validasi Zod + rate limit + honeypot) |

---

## 5. Alur bisnis

```
Pemesan isi form
      │
      ▼
POST /api/orders  ──►  status: pending  (kode JTM-XXXXXX)
      │
      ▼
Bayar via QRIS, kirim bukti ke admin via WhatsApp
      │
      ▼
Admin buka detail, cocokkan nominal & tujuan transfer
      │
      ▼
Klik "Verifikasi Pembayaran"  ──►  status: verified
      │                            (verified_by + verified_at tercatat)
      ▼
Tiket didapat → admin tandai "Selesai"  ──►  status: completed
```

Status lain:

- `cancelled` — dibatalkan admin.
- Admin juga bisa mengubah status manual lewat dropdown di halaman detail.

### Arti status (label UI)

| DB | Label |
| --- | --- |
| `pending` | Menunggu Pembayaran |
| `review` | Menunggu Verifikasi |
| `verified` | Pembayaran Valid |
| `completed` | Selesai |
| `cancelled` | Dibatalkan |

Definisi label ada di `src/lib/types.ts` (`STATUS_LABEL`, `STATUS_BADGE`).

---

## 6. Aturan bisnis penting

Jangan ubah tanpa sadar, karena ini menyangkut uang dan data pribadi:

1. **Harga selalu dihitung ulang di server** dari tabel `sections`. Client hanya mengirim `sectionCode`, `qty`, dll. Jangan pernah percaya `total` dari client.
2. **Maksimal tiket per pesanan** disimpan di `events.max_tickets` (default 4, dibatasi 1–10 di form admin).
3. **Section cadangan** maksimal 10, hanya boleh kode section yang valid, dan tidak boleh sama dengan section utama.
4. **Metode pembayaran hanya** `QRIS` (validasi Zod).
5. **Tidak ada verifikasi otomatis.** Status `verified` hanya berubah lewat tombol admin (`updateOrderStatusAction`).
6. **Kode pesanan** memakai alfabet tanpa karakter ambigu (`ABCDEFGHJKLMNPQRSTUVWXYZ23456789`), format `JTM-` + 6 karakter.
7. **Bukti transfer tidak disimpan di server.** Pemesan mengirimkannya ke admin via WhatsApp; admin mencocokkan manual sebelum verifikasi.
8. **Tiket war hanya konser.** Jangan tambahkan layanan VC/M&G/2-shot ke form tanpa mengubah alur & harga.

---

## 7. Struktur folder

```
jokitamas/
├─ src/
│  ├─ app/
│  │  ├─ layout.tsx              # Root layout, metadata, font global
│  │  ├─ globals.css             # Tema Tailwind 4 (warna, .card, .btn-*, .input)
│  │  ├─ page.tsx                # Halaman utama (hero + wizard)
│  │  ├─ pricelist/page.tsx      # Pricelist
│  │  ├─ admin/
│  │  │  ├─ login/page.tsx
│  │  │  └─ (panel)/             # Layout admin (wajib login)
│  │  │     ├─ layout.tsx
│  │  │     ├─ page.tsx          # Dashboard/daftar pesanan
│  │  │     ├─ orders/[id]/page.tsx
│  │  │     ├─ event/page.tsx
│  │  │     ├─ settings/page.tsx
│  │  │     └─ team/page.tsx
│  │  ├─ actions/                # Server Actions
│  │  │  ├─ admin.ts             # Status, catatan, event, section, settings, tim
│  │  │  └─ auth.ts              # Login/logout
│  │  └─ api/
│  │     └─ orders/route.ts
│  ├─ components/
│  │  ├─ order-wizard.tsx        # Wizard 3 langkah (client component)
│  │  ├─ arena-art.tsx           # Ilustrasi seatmap SVG
│  │  ├─ site-header.tsx / site-nav-links.tsx / site-footer.tsx
│  │  ├─ admin-nav.tsx           # Navigasi panel admin
│  │  └─ status-badge.tsx
│  └─ lib/
│     ├─ db.ts                   # Koneksi SQLite, skema, seed awal
│     ├─ auth.ts                 # Sesi login (cookie httpOnly + tabel sessions)
│     ├─ password.ts             # scrypt, sha256, generator kode
│     ├─ orders.ts               # Query pesanan, statistik, createOrder
│     ├─ settings.ts             # Baca/tulis settings
│     ├─ validation.ts           # Skema Zod
│     ├─ rate-limit.ts           # Rate limit in-memory
│     ├─ palette.ts              # Warna CAT 1–7
│     ├─ format.ts               # Format rupiah/tanggal (Asia/Jakarta)
│     └─ types.ts                # Tipe DB, label status, label pembayaran
├─ data/                         # TIDAK di-commit (gitignored)
│  └─ jokitamas.db
├─ HANDOFF.md                    # Dokumen ini
├─ README.md
└─ ...config
```

---

## 8. Database

Database SQLite/libSQL diakses lewat `@libsql/client`. Lokal memakai file `data/jokitamas.db`; produksi memakai Turso. Skema dan seed dibuat otomatis di `src/lib/db.ts` saat aplikasi pertama kali menyentuh database.

### Tabel

| Tabel | Isi |
| --- | --- |
| `users` | Akun admin/verifikator (`role`: `admin` / `verifier`, `active` 0/1) |
| `sessions` | Sesi login; menyimpan `token_hash`, bukan token asli |
| `events` | Event aktif (`is_active`), `max_tickets` |
| `sections` | Kategori per event (`code`, `price`, `is_open`, `sort`) |
| `orders` | Semua pesanan + data identitas + status |
| `settings` | Key-value pengaturan situs |

Detail kolom penting di `orders`:

- `code` — kode unik pesanan.
- `event_name`, `show_at` — **snapshot** event saat pesanan dibuat (event boleh berubah nanti tanpa mengubah riwayat).
- `section_code`, `section_price`, `qty`, `total` — snapshot harga.
- `backup_sections` — JSON array kode section cadangan.
- `status` — salah satu dari 5 status di atas.
- `verified_by`, `verified_at` — diisi saat admin memverifikasi.
- `internal_note` — catatan admin, tidak dilihat pemesan.

### Settings keys

`site_name`, `site_tagline`, `wa_number`, `wa_number_2` (opsional), `x_username`, `qris_merchant`, `qris_nmid`, `qris_image`, `qris_note`, `payment_note`, `terms`, `orders_open` (`"1"`/`"0"`), `ticket_ofc_enabled` (`"1"`/`"0"`), `ticket_general_enabled` (`"1"`/`"0"`), `announcement`.

Default lengkap ada di `DEFAULT_SETTINGS` (`src/lib/db.ts`).

### Data awal (seed)

Saat database kosong, otomatis dibuat:

- 1 akun admin dari env `ADMIN_*`.
- 1 event: *AYO SENYUMLAH | JKT48 15th Anniversary Concert*, 19 Des 2026 18:30 WIB, Jakarta, maks 4 tiket.
- 7 section: CAT 1 Rp 400.000 (tutup), CAT 2 Rp 350.000, CAT 3 Rp 320.000, CAT 4 Rp 300.000, CAT 5 Rp 250.000, CAT 6 Rp 220.000, CAT 7 Rp 200.000.
- Settings default.

Harga/section/event ini **contoh** — ganti lewat `/admin/event` atau ubah seed di `src/lib/db.ts`.

### Backup & reset

Backup = copy folder `data/`:

```bash
tar -czf backup-jokitamas-$(date +%F).tar.gz data/
```

Reset total (hati-hati, semua pesanan hilang):

```bash
rm -rf data/
```

Database baru + admin + event contoh akan dibuat saat aplikasi dijalankan lagi.

---

## 9. Desain & tema

Tema mengikuti gambar seatplan konser: langit biru, aksen emas, warna kategori cerah.

- Font: **Baloo 2** (display) + **Plus Jakarta Sans** (body), diimpor di `src/app/globals.css`.
- Latar: gradien langit biru (`background-image` di `globals.css`).
- Komponen utility: `.card`, `.btn-primary` (emas), `.btn-secondary`, `.input`, `.badge`.
- Warna CAT ada di `src/lib/palette.ts`:

| Section | Warna |
| --- | --- |
| CAT 1 | Merah `#e53935` |
| CAT 2 | Kuning `#fdd835` |
| CAT 3 | Ungu `#8e24aa` |
| CAT 4 | Oranye `#fb8c00` |
| CAT 5 | Hijau `#43a047` |
| CAT 6 | Biru `#1e88e5` |
| CAT 7 | Pink `#f06292` |

`colorForSection(code)` membaca angka dari kode (mis. `CAT 3` → warna ke-3). Kalau nanti ada kategori baru, tambahkan ke `SECTION_PALETTE`.

Ilustrasi seatmap: `src/components/arena-art.tsx`.
Layout utama: dua kolom — poster + ringkasan (kiri, sticky) dan kartu form (kanan).

---

## 10. Keamanan

Sudah ada:

- Password di-hash **scrypt** dengan salt (`src/lib/password.ts`).
- Sesi di database + cookie `httpOnly`, `sameSite=lax`, `secure` mengikuti `COOKIE_SECURE`.
- Semua query memakai prepared statement (aman dari SQL injection).
- Validasi input server-side dengan Zod.
- Rate limit: pesanan 8×/10 menit/IP, login 10×/10 menit/IP.
- Honeypot field `website` di form pesanan.
- Harga dihitung ulang di server.
- Bukti transfer tidak disimpan di server; hanya dikirim via WhatsApp.
- Role `verifier` tidak bisa membuka event/settings/team (redirect ke `/admin`).

Belum ada / bisa ditingkatkan:

- Rate limit masih **in-memory** — hilang saat restart dan tidak akurat bila multi-instance. Untuk produksi serius, pindah ke Redis/DB.
- Belum ada audit log perubahan status (siapa mengubah apa dan kapan, selain `verified_by`).
- Belum ada CSRF token eksplisit (Server Actions Next.js sudah punya proteksi origin, tapi tetap perlu dipahami).
- Belum ada fitur hapus/arsip pesanan lama.
- Belum ada notifikasi otomatis (email/WA) saat status berubah.

---

## 11. Deploy

Database memakai **libSQL** (`@libsql/client`). Di lokal otomatis memakai file
`data/jokitamas.db`; di produksi gunakan **Turso** supaya bisa jalan di Vercel
(filesystem Vercel tidak persisten).

Env produksi:

```bash
TURSO_DATABASE_URL=libsql://...
TURSO_AUTH_TOKEN=...
ADMIN_NAME=...
ADMIN_EMAIL=...
ADMIN_PASSWORD=...
COOKIE_SECURE=true
```

Vercel:

1. Import repo di vercel.com/new
2. Isi env di atas
3. Deploy
4. Tambahkan domain di Project → Settings → Domains

Jangan set `DATABASE_PATH` di Vercel.

Alternatif tanpa Turso: VPS/Railway/Fly dengan volume persisten dan
`DATABASE_PATH=/path/ke/data/jokitamas.db`.

Langkah umum di VPS:

```bash
npm ci
npm run build
COOKIE_SECURE=true npm start   # di belakang reverse proxy HTTPS
```

Checklist sebelum live:

- [ ] Ganti `ADMIN_PASSWORD` sebelum database pertama kali dibuat, atau ganti lewat menu Tim.
- [ ] Isi data QRIS asli (merchant, NMID, gambar) di `/admin/settings`.
- [ ] Ganti nomor WA (utama + cadangan) & username X.
- [ ] Sesuaikan syarat & ketentuan.
- [ ] Set harga section & event yang benar.
- [ ] Set `COOKIE_SECURE=true` dan pasang HTTPS.
- [ ] Backup database (Turso dashboard / `turso db shell .dump`, atau folder `data/` bila lokal).
- [ ] Pastikan koneksi Turso memakai HTTPS dan token valid.

Contoh reverse proxy Nginx (ringkas):

```nginx
server {
  server_name domainkamu.com;
  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  }
}
```

---

## 12. Ide pengembangan berikutnya

Prioritas tinggi:

1. **Audit log status** — tabel `order_logs` (order_id, actor, from_status, to_status, note, created_at). Ditampilkan di detail pesanan.
2. **Notifikasi WhatsApp** — tombol "Kirim update ke pemesan" yang membuka `wa.me` dengan template pesan status. Murah, tanpa API berbayar.
3. **Rate limit persisten** — pindahkan `src/lib/rate-limit.ts` ke DB/Redis.
4. **Export CSV** — daftar pesanan untuk rekap fee & rekap data tiket.
5. **Arsip event** — dukungan banyak event sekaligus (pemilihan event di form), arsip event lama.

Prioritas menengah:

6. Hapus/soft-delete pesanan duplikat atau spam.
7. Halaman statistik sederhana (per section, per hari, conversion rate).
8. Template pesan otomatis (instruksi bayar) yang bisa diedit dari settings.
9. Ganti password sendiri untuk semua role (saat ini reset lewat admin).
10. CAPTCHA ringan di form pesanan bila spam bot meningkat.

Teknis:

11. Tambah test (Vitest/Playwright) untuk `createOrder` dan alur verifikasi.
12. Migrasi skema berversi (saat ini `CREATE TABLE IF NOT EXISTS`; perubahan kolom harus manual).
13. Optimasi query daftar pesanan bila data sudah banyak.
14. Aksesibilitas: audit kontras, fokus keyboard, label form.

---

## 13. Konvensi kontribusi

- **Bahasa UI:** Indonesia. Nama variabel/kode: Inggris (konsisten dengan kode yang ada).
- **Format uang/tanggal:** selalu lewat `src/lib/format.ts` (zona waktu `Asia/Jakarta`). Jangan format manual.
- **Harga:** jangan pernah dipercaya dari client.
- **Komponen server vs client:** default server component. Tambahkan `"use client"` hanya bila butuh state/event (contoh: `order-wizard.tsx`, `admin-nav.tsx`).
- **Mutasi data:** gunakan Server Actions di `src/app/actions/` untuk form admin; API route untuk hal yang dipanggil `fetch` dari client.
- **Setelah mengubah data:** panggil `revalidatePath(...)` untuk halaman terkait.
- **Query DB:** selalu prepared statement (`db.prepare(...).run/get/all`).
- **Warna section:** ambil dari `colorForSection`, jangan hardcode di banyak tempat.
- **Commit:** pesan jelas, mis. `feat: audit log status pesanan`, `fix: validasi NIK`.
- **Sebelum push:** jalankan `npm run build` dan pastikan tidak ada error TypeScript.

### Di mana mengubah hal umum

| Ingin mengubah... | File |
| --- | --- |
| Teks/hero halaman utama | `src/app/page.tsx` |
| Langkah & field form | `src/components/order-wizard.tsx` |
| Validasi field | `src/lib/validation.ts` |
| Teks status & warna badge | `src/lib/types.ts` |
| Tema warna/font/tombol | `src/app/globals.css`, `src/lib/palette.ts` |
| Struktur DB / data seed | `src/lib/db.ts` |
| Logika pesanan & statistik | `src/lib/orders.ts` |
| Aksi admin | `src/app/actions/admin.ts` |
| Tampilan admin | `src/app/admin/(panel)/**` |
| Rate limit | `src/lib/rate-limit.ts` |

---

## 14. Troubleshooting

**`EADDRINUSE: address already in use 0.0.0.0:3000`**
Ada proses lain di port 3000:

```bash
fuser -k 3000/tcp
```

**Perubahan env `ADMIN_*` tidak berefek**
Env hanya dipakai saat tabel `users` kosong. Ubah lewat menu **Tim**, atau reset `data/`.

**Data terlihat "hilang" setelah ganti folder / deploy**
Di lokal, pastikan `DATABASE_PATH` menunjuk ke file yang benar. Di Vercel, pastikan `TURSO_DATABASE_URL` dan `TURSO_AUTH_TOKEN` terisi — tanpa itu aplikasi memakai file sementara yang hilang.

**Login selalu gagal / balik ke halaman login**
Cek `COOKIE_SECURE`: kalau `true` tapi diakses lewat HTTP, cookie tidak dikirim. Set `false` untuk development.

**Font tidak muncul**
`globals.css` mengimpor Google Fonts. Kalau offline/terblokir, font jatuh ke fallback sistem.

**Database terkunci (`database is locked`)**
Biasanya karena dua proses dev berjalan bersamaan, atau file `.db-wal`/`.db-shm` di-copy saat aplikasi hidup. Hentikan server dulu sebelum backup.

**Ingin mulai dari nol**
Hentikan server, `rm -rf data/ .next/`, lalu `npm run dev`.

---

## 15. Repo & kontak

- Repository: <https://github.com/gabrielgnd1/joki-ta-mas>
- Branch utama: `main`
- Default admin: `admin@jokitamas.local` / `admin123` — **ganti segera**
- Pemilik proyek: @gabrielgnd1

Kalau ada yang tidak jelas, baca dulu kode di `src/lib/` (logika inti) dan `src/app/actions/` (mutasi data) — sebagian besar alur bisnis ada di dua tempat itu.
