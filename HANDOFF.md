# Panduan Lanjutan Proyek Joki Ta Mas?

> Dokumen serah-terima untuk teman yang akan melanjutkan proyek ini.
> Terakhir diperbarui: 19 November 2026.

Dokumen ini menjelaskan **apa yang sudah jadi**, **cara menjalankannya**, **di mana harus mengubah sesuatu**, dan **apa yang sebaiknya dikerjakan berikutnya**. Untuk instruksi singkat, lihat juga [`README.md`](./README.md).

---

## 1. Ringkasan proyek

Joki Ta Mas? adalah website jasa **joki tiket JKT48** untuk layanan **2-Shot (2S)** dan **Meet & Greet (MnG)**. Pemesan memilih member di katalog, menambahkannya ke keranjang (boleh lebih dari satu member), melengkapi data akun JKT48, lalu rincian pesanan dikirim ke admin lewat **WhatsApp**. Admin mengecek ketersediaan slot & pembayaran **secara manual** dan mengubah status pesanan di panel admin.

Versi sebelumnya (form 3 langkah untuk *war tiket konser* + halaman `/pricelist`) **sudah diganti total** oleh form ini. Tabel & data lama tidak dihapus.

Yang **tidak** ada di proyek ini (memang di luar scope):

- Nomor WhatsApp pemesan **tidak diminta** di form. Cocokkan chat masuk memakai **kode pesanan** (`JTM-XXXXXX`) yang selalu ikut disertakan di pesan WhatsApp.
- Verifikasi pembayaran otomatis (tidak ada integrasi payment gateway/mutasi bank).
- Upload file apa pun (bukti bayar, dsb.) — semuanya lewat chat WhatsApp.
- Katalog member dikelola lewat **kode** (`src/lib/members.ts`), bukan lewat database/admin.

---

## 2. Status proyek

Sudah selesai dan sudah diuji end-to-end:

- Form pesanan di `/`: pilih layanan (2S/MnG) → filter tim → pilih member → jumlah tiket → tambah ke keranjang → isi data pemesan & akun JKT48 → submit.
- Keranjang multi-member (maks. 30 item), batas qty 1–20, 2S selalu 1 tiket.
- Perhitungan harga di server (`calculateItemCost`), kode pesanan `JTM-XXXXXX`.
- Submit → pesanan tersimpan di `service_orders` → jendela WhatsApp ke admin terbuka berisi rincian + kode pesanan.
- Panel admin baru (tema rose/slate): daftar pesanan, filter status, pencarian, statistik, detail pesanan (tabel item + kredensial akun dengan tombol tampil/salin), catatan internal, verifikasi status, ubah status manual.
- Pengaturan: buka/tutup pemesanan, buka/tutup jenis akun (OFC / Non-OFC), pengumuman, nama situs, kontak WA.
- Katalog member di admin (`/admin/katalog`): edit harga 2S / MnG 1–4 / MnG 5–20 untuk semua member, tersimpan di tabel `member_catalog`, langsung berlaku tanpa deploy.
- Manajemen tim (tambah admin/verifikator, aktif/nonaktif, reset password).
- Halaman lama yang dihapus: `/pricelist`, `/admin/event`, wizard 3 langkah, ilustrasi seatmap, header/footer/nav lama.

Build produksi terakhir: **lulus** (`npm run build` bersih).

Pengujian end-to-end terakhir (19 Nov 2026): submit dari browser → baris tersimpan di `data/jokitamas.db` → muncul pertama di `/admin` → detail & aksi status berfungsi → logout/login berfungsi → settings tersimpan ke DB. Tiga pesanan uji sengaja **disimpan sebagai contoh**: `JTM-PPFUZJ`, `JTM-BT7NR7`, `JTM-T9WCY4`.

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
| `ADMIN_NAME` | `Admin Joki Ta Mas?` | Nama admin pertama (hanya saat DB kosong) |
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
| `/` | `src/app/page.tsx` | Bungkus halaman (pengumuman + footer) → render `JokiOrderForm` |

Form pesanannya sendiri ada di `src/components/joki-order-form.tsx` (client component, ±600 baris).

### Panel admin

| URL | File | Akses | Fungsi |
| --- | --- | --- | --- |
| `/admin/login` | `src/app/admin/login/page.tsx` | publik | Form login |
| `/admin` | `src/app/admin/(panel)/page.tsx` | admin + verifier | Daftar pesanan, filter, pencarian, statistik |
| `/admin/orders/[id]` | `src/app/admin/(panel)/orders/[id]/page.tsx` | admin + verifier | Detail, kredensial akun, catatan, ubah status |
| `/admin/katalog` | `src/app/admin/(panel)/katalog/page.tsx` | **admin saja** | Edit harga member (2S, MnG 1–4, MnG 5–20) |
| `/admin/settings` | `src/app/admin/(panel)/settings/page.tsx` | **admin saja** | Pemesanan, jenis akun, pengumuman, kontak |
| `/admin/team` | `src/app/admin/(panel)/team/page.tsx` | **admin saja** | Kelola akun tim |

Navigasi panel: **Pesanan**, **Katalog** (admin saja), **Pengaturan** (admin saja), **Tim** (admin saja) — `src/components/admin-nav.tsx`.

### API routes

| Endpoint | Method | Fungsi |
| --- | --- | --- |
| `/api/orders` | `POST` | Membuat pesanan (validasi Zod + rate limit + honeypot + gate jenis akun) |

Server Actions: `src/app/actions/admin.ts` (status, catatan, settings, tim) dan `src/app/actions/auth.ts` (login/logout).

---

## 5. Alur bisnis

```
Pemesan isi form (bisa banyak member)
      │
      ▼
POST /api/orders  ──►  simpan 1 baris di service_orders
      │                (status: pending, kode JTM-XXXXXX,
      │                 harga dihitung ulang di server)
      ▼
Jendela WhatsApp ke admin terbuka, berisi rincian + KODE pesanan
      │
      ▼
Admin mencocokkan chat dengan pesanan via kode, cek slot & pembayaran
      │
      ▼
Klik "✓ Tandai Sudah Dikonfirmasi"  ──►  status: verified
      │                                  (verified_by + verified_at tercatat)
      ▼
Tiket didapat → admin tandai "Selesai"  ──►  status: completed
```

Status lain:

- `review` — Menunggu Verifikasi (dipakai bila admin ingin tahap cek dulu).
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

1. **Harga selalu dihitung ulang di server** dari katalog di database (tabel `member_catalog`, dibaca lewat `src/lib/member-catalog.ts`). Client hanya mengirim `team`, `nickname`, `serviceType`, `qty`. Jangan pernah percaya `subtotal`/`total` dari client.
2. **Roster member vs harga:** daftar member (tim, nickname, nama lengkap) berasal dari seed `MEMBER_TEAMS` di `src/lib/members.ts` dan disinkronkan ke database saat start (`INSERT OR IGNORE` — tidak menimpa harga editan admin). **Harga hanya diubah lewat `/admin/katalog`**, bukan lewat kode, supaya tidak perlu deploy.
3. **2S selalu 1 tiket** per item (field qty dinonaktifkan di form).
4. **MnG memakai tarif paket flat**, tidak dikalikan jumlah tiket: qty 1–4 pakai `mngLow`, qty 5–20 pakai `mngHigh`. Batas ketat 1–20 (dibatasi juga oleh Zod & server).
5. **Keranjang maksimal 30 item** per pesanan (Zod `.max(30)`).
6. **Gate jenis akun:** settings `ticket_ofc_enabled` = pemesanan akun OFC, `ticket_general_enabled` = Non-OFC. Nonaktifkan salah satu untuk menutup jenis tersebut (API membalas 403).
7. **Tidak ada verifikasi otomatis.** Status hanya berubah lewat tombol/dropdown admin (`updateOrderStatusAction`).
8. **Kode pesanan** memakai alfabet tanpa karakter ambigu (`ABCDEFGHJKLMNPQRSTUVWXYZ23456789`), format `JTM-` + 6 karakter, selalu disertakan di pesan WhatsApp supaya admin bisa mencocokkan chat → baris DB.
9. **Kredensial akun JKT48 pemesan** (email + password) disimpan dan ditampilkan hanya di panel admin, lengkap dengan peringatan. Jangan pernah menampilkannya di halaman publik.
10. **Tidak ada field WhatsApp pemesan** — keputusan desain. Jangan menambahkannya tanpa membahas ulang.

---

## 7. Struktur folder

```
jokitamas/
├─ src/
│  ├─ app/
│  │  ├─ layout.tsx              # Root layout, metadata, font global
│  │  ├─ globals.css             # Tailwind 4 + tema admin + CSS form (.joki-form)
│  │  ├─ page.tsx                # Halaman utama (pengumuman, footer, render form)
│  │  ├─ admin/
│  │  │  ├─ login/page.tsx
│  │  │  └─ (panel)/             # Layout admin (wajib login)
│  │  │     ├─ layout.tsx
│  │  │     ├─ page.tsx          # Dashboard/daftar pesanan
│  │  │     ├─ orders/[id]/page.tsx
│  │  │     ├─ katalog/page.tsx  # Editor harga member
│  │  │     ├─ settings/page.tsx
│  │  │     └─ team/page.tsx
│  │  ├─ actions/                # Server Actions
│  │  │  ├─ admin.ts             # Status, catatan, settings, tim
│  │  │  └─ auth.ts              # Login/logout
│  │  └─ api/
│  │     └─ orders/route.ts      # POST pesanan
│  ├─ components/
│  │  ├─ joki-order-form.tsx     # Form pesanan 2S/MnG + keranjang (client)
│  │  ├─ secret-field.tsx        # Tombol tampil/salin untuk password
│  │  ├─ admin-nav.tsx           # Navigasi panel admin
│  │  └─ status-badge.tsx
│  └─ lib/
│     ├─ db.ts                   # Koneksi SQLite, skema, seed awal
│     ├─ members.ts              # Roster SEED member + tipe + calculateItemCost
│     ├─ member-catalog.ts       # Baca katalog & harga dari tabel member_catalog
│     ├─ service-orders.ts       # Query pesanan (service_orders), statistik, create
│     ├─ wa-message.ts           # Susun URL wa.me berisi rincian pesanan
│     ├─ auth.ts                 # Sesi login (cookie httpOnly + tabel sessions)
│     ├─ password.ts             # scrypt, sha256, generator kode pesanan
│     ├─ settings.ts             # Baca/tulis settings
│     ├─ validation.ts           # Skema Zod (jokiOrderInputSchema, loginSchema)
│     ├─ rate-limit.ts           # Rate limit in-memory
│     ├─ format.ts               # Format rupiah/tanggal (Asia/Jakarta)
│     └─ types.ts                # Tipe DB, label status, OrderItem
├─ data/                         # TIDAK di-commit (gitignored)
│  └─ jokitamas.db
├─ HANDOFF.md                    # Dokumen ini
├─ README.md
└─ ...config
```

File lama yang **sudah dihapus**: `src/lib/orders.ts`, `src/lib/palette.ts`, `src/components/order-wizard.tsx`, `arena-art.tsx`, `site-header.tsx`, `site-footer.tsx`, `site-nav-links.tsx`, `src/app/pricelist/`, `src/app/admin/(panel)/event/`.

---

## 8. Database

Database SQLite/libSQL diakses lewat `@libsql/client`. Lokal memakai file `data/jokitamas.db`; produksi memakai Turso. Skema dan seed dibuat otomatis di `src/lib/db.ts` saat aplikasi pertama kali menyentuh database.

### Tabel

| Tabel | Status | Isi |
| --- | --- | --- |
| `users` | aktif | Akun admin/verifikator (`role`: `admin` / `verifier`, `active` 0/1) |
| `sessions` | aktif | Sesi login; menyimpan `token_hash`, bukan token asli |
| `service_orders` | aktif | **Semua pesanan baru** (lihat di bawah) |
| `member_catalog` | aktif | Katalog & harga member (diedit lewat `/admin/katalog`) |
| `settings` | aktif | Key-value pengaturan situs |
| `orders` | **legacy** | Pesanan war tiket lama — tidak dipakai aplikasi, data tidak dihapus |
| `events`, `sections` | **legacy** | Event/section war tiket lama — tidak dipakai UI (seed masih membuat 1 event contoh, tidak berbahaya) |

### Kolom `service_orders`

- `code` — kode unik pesanan (`JTM-XXXXXX`).
- `items` — **JSON array** keranjang: `[{ serviceType, team, nickname, fullName, qty, sessionNote, subtotal, priceLabel }]`. Satu baris DB per pesanan (bukan per item).
- `item_count`, `ticket_count`, `total` — agregat hasil hitung server.
- `service_types` — gabungan layanan, mis. `2S+MnG`.
- `customer_name`, `account_type` (`OFC`/`Non-OFC`), `jkt_email`, `jkt_password` — data pemesan & akun JKT48 (password **plain text**, lihat bagian 10).
- `status` — salah satu dari 5 status di atas.
- `verified_by`, `verified_at` — diisi saat admin memverifikasi.
- `internal_note` — catatan admin, tidak dilihat pemesan.
- `created_at`, `updated_at` — ISO string.

### Kolom `member_catalog`

- `id` — primary key (dipakai nama field form `/admin/katalog`).
- `team`, `nickname`, `full_name` — identitas member (unik per `team + nickname`).
- `price_2s` — tarif 2-Shot (per item, selalu 1 tiket).
- `mng_low` — tarif paket MnG 1–4 tiket (flat).
- `mng_high` — tarif paket MnG 5–20 tiket (flat).
- `sort` — urutan tampil di form (tim → member).

Roster member berasal dari seed `MEMBER_TEAMS` (`src/lib/members.ts`) dan disinkronkan dengan `INSERT OR IGNORE` setiap start, jadi harga yang sudah diedit admin **tidak tertimpa** dan member baru dari kode otomatis masuk.

### Settings keys

`site_name`, `site_tagline`, `wa_number`, `wa_number_2` (opsional), `x_username`, `orders_open` (`"1"`/`"0"`), `ticket_ofc_enabled` (`"1"`/`"0"`), `ticket_general_enabled` (`"1"`/`"0"`), `announcement`.

Default lengkap ada di `DEFAULT_SETTINGS` (`src/lib/db.ts`).

Catatan: key lama `qris_*`, `payment_note`, `terms` **masih ada di database** tetapi sudah tidak ditampilkan di UI dan tidak dipakai form baru. `site_tagline` juga masih tersimpan (default lamanya "Joki War Tiket Konser") tetapi tidak dirender di mana pun.

### Data awal (seed)

Saat database kosong, otomatis dibuat:

- 1 akun admin dari env `ADMIN_*`.
- Settings default.
- 58 baris `member_catalog` (seed dari `MEMBER_TEAMS`, 4 tim).
- 1 event + 7 section contoh (warisan versi lama; tidak dipakai halaman mana pun).

### Backup & reset

Backup = copy folder `data/`:

```bash
tar -czf backup-jokitamas-$(date +%F).tar.gz data/
```

Reset total (hati-hati, semua pesanan hilang):

```bash
rm -rf data/
```

Database baru + admin akan dibuat saat aplikasi dijalankan lagi.

---

## 9. Desain & tema

Tema baru (menggantikan tema "langit biru & emas"):

- **Halaman publik `/`**: mengikuti form statis sumbernya — latar `#f8fafc`, kartu putih, aksen **rose** (`#e11d48`), tombol hijau WhatsApp (`#16a34a`), font sistem (`-apple-system, ...`). Semua style di-scope di bawah `.joki-form` pada `src/app/globals.css` agar tidak bocor ke halaman admin.
  - Rename class yang dilakukan saat porting: `.container` → `.joki-shell`, `.section-title` → `.joki-section-title` (hindari tabrakan dengan Tailwind/global).
- **Panel admin**: rose + slate (`bg-rose-600` untuk nav aktif, badge status memakai warna Tailwind: amber/violet/emerald/sky/slate).
- Font: **Baloo 2** + **Plus Jakarta Sans** masih diimpor di `globals.css` (dipakai admin & layout); form publik memakai font sistem.
- Komponen utility admin: `.container-page`, `.card`, `.btn-*`, `.input`, `.label` — lihat `globals.css`.

---

## 10. Keamanan

Sudah ada:

- Password admin di-hash **scrypt** dengan salt (`src/lib/password.ts`).
- Sesi di database + cookie `httpOnly`, `sameSite=lax`, `secure` mengikuti `COOKIE_SECURE`.
- Semua query memakai prepared statement (aman dari SQL injection).
- Validasi input server-side dengan Zod (`jokiOrderInputSchema`).
- Rate limit: pesanan 8×/10 menit/IP, login 10×/10 menit/IP.
- Honeypot field `website` di form pesanan (bot yang mengisi → ditolak).
- Harga dihitung ulang di server; data harga client diabaikan.
- Role `verifier` tidak bisa membuka settings/team (redirect ke `/admin`).
- **Password akun JKT48 pemesan disimpan plain text** di `service_orders.jkt_password` — memang disengaja agar admin bisa login ke akun tersebut untuk joki, tapi: hanya tampil di panel admin (tombol tampil/salin + peringatan), dan tidak pernah dikirim ke mana pun selain WhatsApp milik admin.

Belum ada / bisa ditingkatkan:

- Rate limit masih **in-memory** — hilang saat restart dan tidak akurat bila multi-instance. Untuk produksi serius, pindah ke Redis/DB.
- Belum ada audit log perubahan status (siapa mengubah apa dan kapan, selain `verified_by`).
- Belum ada CSRF token eksplisit (Server Actions Next.js sudah punya proteksi origin, tapi tetap perlu dipahami).
- Belum ada fitur hapus/arsip pesanan.
- Belum ada notifikasi otomatis (email/WA) saat status berubah.
- Belum ada enkripsi at-rest untuk `jkt_password`.

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
- [ ] Ganti nomor WA utama di `/admin/settings` (`wa_number`) — dipakai form untuk membuka chat admin.
- [ ] Cek katalog & harga member di `src/lib/members.ts` sesuai tarif terbaru.
- [ ] Pastikan gate OFC/Non-OFC sesuai kebijakan (keduanya default aktif).
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
2. **Notifikasi WhatsApp** — tombol "Kirim update ke pemesan" yang membuka `wa.me` dengan template pesan status. Murah, tanpa API berbayar. (Nomor pemesan tidak tersimpan — perlu keputusan: minta nomor, atau kirim update ke admin saja.)
3. **Katalog member di database** — ~~pindahkan `members.ts` ke tabel + halaman admin~~ **selesai** (`member_catalog` + `/admin/katalog`). Sisa ide: tambah/hapus member & ubah nama dari admin (saat ini roster dari kode).
4. **Rate limit persisten** — pindahkan `src/lib/rate-limit.ts` ke DB/Redis.
5. **Export CSV** — daftar pesanan untuk rekap fee & rekap data tiket.

Prioritas menengah:

6. Hapus/soft-delete pesanan duplikat atau spam.
7. Enkripsi `jkt_password` (atau minimal audit akses).
8. Halaman statistik sederhana (per tim, per layanan, per hari).
9. Ganti password sendiri untuk semua role (saat ini reset lewat admin).
10. CAPTCHA ringan di form pesanan bila spam bot meningkat.

Teknis:

11. Tambah test (Vitest/Playwright) untuk `createServiceOrder`, `calculateItemCost`, dan alur verifikasi.
12. Migrasi skema berversi (saat ini `CREATE TABLE IF NOT EXISTS`; perubahan kolom harus manual) + bersihkan tabel legacy `orders`/`events`/`sections` bila sudah yakin tidak butuh.
13. Optimasi query daftar pesanan bila data sudah banyak.
14. Aksesibilitas: audit kontras, fokus keyboard, label form.

---

## 13. Konvensi kontribusi

- **Bahasa UI:** Indonesia. Nama variabel/kode: Inggris (konsisten dengan kode yang ada).
- **Format uang/tanggal:** selalu lewat `src/lib/format.ts` (zona waktu `Asia/Jakarta`). Jangan format manual.
- **Harga:** jangan pernah dipercaya dari client — hitung lewat `calculateItemCost`.
- **Komponen server vs client:** default server component. Tambahkan `"use client"` hanya bila butuh state/event (contoh: `joki-order-form.tsx`, `admin-nav.tsx`).
- **Mutasi data:** gunakan Server Actions di `src/app/actions/` untuk form admin; API route untuk hal yang dipanggil `fetch` dari client.
- **Setelah mengubah data:** panggil `revalidatePath(...)` untuk halaman terkait.
- **Query DB:** selalu prepared statement (`db.prepare(...).run/get/all`).
- **CSS:** style halaman publik wajib di-scope di bawah `.joki-form`; jangan menambah class global yang bisa bocor.
- **Commit:** pesan jelas, mis. `feat: form pesanan 2S/MnG`, `fix: validasi qty MnG`.
- **Sebelum push:** jalankan `npm run build` dan pastikan tidak ada error TypeScript.

### Di mana mengubah hal umum

| Ingin mengubah... | File |
| --- | --- |
| Teks/judul halaman utama | `src/app/page.tsx`, `src/components/joki-order-form.tsx` |
| Field & langkah form pesanan | `src/components/joki-order-form.tsx` |
| Harga/katalog member | `/admin/katalog` (harga) · `src/lib/members.ts` (roster/seed) |
| Validasi field | `src/lib/validation.ts` |
| Isi pesan WhatsApp | `src/lib/wa-message.ts` |
| Teks status & warna badge | `src/lib/types.ts` |
| Tema warna/font/tombol | `src/app/globals.css` |
| Struktur DB / data seed | `src/lib/db.ts` |
| Logika pesanan & statistik | `src/lib/service-orders.ts` |
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

**Pesanan tidak muncul di `/admin`**
Pastikan submit berhasil (halaman menampilkan kode pesanan `JTM-XXXXXX`) dan Anda melihat tabel `service_orders`. Pesanan lama di tabel `orders` tidak akan tampil.

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

Kalau ada yang tidak jelas, baca dulu kode di `src/lib/` (logika inti), `src/lib/members.ts` (harga) dan `src/app/actions/` (mutasi data) — sebagian besar alur bisnis ada di tempat itu.
