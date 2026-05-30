# CLAUDE.md - RekapTrading

Dokumen ini adalah panduan pengembangan untuk Claude (AI assistant) saat membantu membangun aplikasi **RekapTrading**.

Terakhir diperbarui: 30 Mei 2026.

---

## Identitas Aplikasi

- **Nama**: RekapTrading
- **Deskripsi**: Aplikasi jurnal trading pribadi berbasis web untuk mencatat, memantau, dan menganalisis performa trading harian.
- **Target user**: Trader individu (single user per akun)

---

## Tech Stack

| Layer           | Teknologi                                                                 |
| --------------- | ------------------------------------------------------------------------- |
| Framework       | Next.js 14 (App Router)                                                   |
| Bahasa          | TypeScript                                                                |
| Styling         | Tailwind CSS                                                              |
| Database & Auth | Supabase (PostgreSQL + Supabase Auth)                                     |
| Deployment      | Vercel                                                                    |
| Fetch kurs live | Exchange rate API (exchangerate-api.com atau open.er-api.com — free tier) |

---

## Status Implementasi Terkini

- Project saat ini belum berada di dalam repository Git, jadi pengecekan perubahan tidak bisa memakai `git diff` / `git status`.
- Dashboard utama sudah dipecah ke `components/Dashboard.tsx`, bukan langsung di `app/page.tsx`.
- `app/page.tsx` hanya merender `<Dashboard />`.
- Login dan register memakai komponen bersama `components/LoginForm.tsx`.
- Supabase client browser dibuat di `lib/supabase.ts` dan mengembalikan `null` jika environment variable belum lengkap.
- Middleware Supabase SSR sudah melindungi semua route non-publik, dengan fallback membiarkan request lanjut jika env Supabase belum diisi.
- Schema database dan RLS sudah tersedia di `supabase/schema.sql`.
- Dependency saat ini memakai Next.js 14.2, React 18.3, Supabase SSR/client, Recharts, next-themes, lucide-react, Tailwind, dan TypeScript.
- Ada `package-lock.json`, `pnpm-lock.yaml`, dan `pnpm-workspace.yaml`. Sebelum menambah dependency, samakan dulu package manager yang dipakai di sesi kerja.

## Autentikasi

- Pakai **Supabase Auth** dengan email + password
- Hanya ada halaman **Login** dan **Register**
- Setelah login, semua data terikat pada `user_id` dari Supabase Auth
- Proteksi route: semua halaman selain `/login` dan `/register` wajib authenticated
- Gunakan middleware Next.js untuk proteksi route
- Jika env Supabase belum lengkap, UI menampilkan pesan konfigurasi alih-alih crash.

---

## Struktur Halaman

```
/login          → Halaman login
/register       → Halaman registrasi
/               → Dashboard utama (redirect ke /login jika belum auth)
```

Cukup satu halaman utama (dashboard). Tidak ada halaman lain.

---

## Fitur Utama

### 1. Set Modal Awal

- Pertama kali masuk, user diminta set modal awal
- Modal awal tersimpan di tabel `settings` di Supabase
- Bisa diubah kapan saja lewat tombol di dashboard

### 2. Tabel Catatan Trading (CRUD)

**Kolom tabel:**
| Kolom | Keterangan |
|---|---|
| Tanggal | Date picker |
| Hari | Otomatis dari tanggal (Senin–Minggu) |
| Modal / Saldo Hari Ini | Saldo awal sebelum trading hari itu |
| Profit / Loss | Angka positif = profit, negatif = loss. Input boleh negatif langsung (misal -50000) |
| % Return | Otomatis dihitung: (PnL / Saldo) × 100 |
| Total / Saldo Akhir | Otomatis: Saldo + PnL |
| Hasil | Otomatis: Win jika PnL > 0, Loss jika PnL < 0 |
| Catatan | Textarea bebas (opsional) |

**Behavior input:**

- Tombol **Tambah Trade** membuka modal berisi kalkulator harian dan form trade.
- Saat buka form Tambah, field **Saldo Hari Ini** otomatis terisi dengan saldo terakhir (total akhir dari entry terakhir berdasarkan urutan tanggal). Jika belum ada entry, pakai modal awal.
- PnL boleh input angka negatif langsung (misal `-50000`). Tidak ada radio win/loss — sistem tentukan otomatis dari nilai PnL.
- Form juga mendukung mode **Input Saldo Akhir**, sehingga PnL dihitung dari `saldo akhir broker - saldo hari ini`.
- Validasi: tanggal dan PnL wajib diisi.
- Setelah save berhasil, modal tambah/edit ditutup.
- Tabel menampilkan 7 trade per halaman, urut dari tanggal terbaru. Jika tanggal sama, fallback urutan memakai `created_at`, `updated_at`, lalu `id`.
- Pada mobile, trade tampil sebagai kartu. Pada desktop, trade tampil sebagai tabel.
- Klik baris/kartu membuka modal detail trade berisi modal, PnL, return, saldo akhir, catatan, serta tombol Edit dan Hapus.

### 3. Statistik Ringkasan

Tampil di bagian atas dashboard:

- Modal Awal
- Saldo Sekarang (akumulasi)
- Total Return (%)
- Win Rate (%)
- Total Profit bersih
- Rata-rata Profit per hari menang
- Rata-rata Loss per hari kalah
- Total hari trading

### 4. Equity Curve

- Grafik garis yang menampilkan pertumbuhan saldo dari hari ke hari
- X-axis: tanggal, Y-axis: saldo
- Gunakan library **Recharts** (sudah friendly dengan Next.js + TypeScript)
- Titik hijau jika di atas modal awal, merah jika di bawah

### 5. Kalkulator Harian

Fitur kalkulator tampil di dalam modal **Tambah Trade / Edit Trade** bersama form trade, bukan halaman terpisah.

**Input:**

- Modal hari ini (otomatis terisi dari saldo terakhir, bisa diubah)
- Target profit (%) hari ini
- Batas maksimal loss (%) hari ini

**Output otomatis:**

- Angka rupiah target profit: `modal × target%`
- Angka rupiah batas loss: `modal × batas_loss%`
- Kalimat ringkasan: _"Kejar Rp X.XXX.XXX, stop kalau sudah minus Rp X.XXX.XXX"_

### 6. Toggle Currency (Rp ↔ USD)

- Toggle di navbar/header untuk switch tampilan antara **Rupiah (Rp)** dan **USD ($)**
- Kurs USD/IDR diambil dari `https://open.er-api.com/v6/latest/USD` saat halaman dimuat atau saat toggle diklik
- Kurs disimpan dalam cache memory dan `localStorage` selama 10 menit dengan key `rekaptrading:usd-idr-rate`
- Jika request kurs gagal, aplikasi memakai fallback `1 USD = Rp 16.250`
- Semua angka di tabel, statistik, dan kalkulator ikut terkonversi
- Data tetap disimpan dalam **Rupiah** di database. Konversi hanya di sisi tampilan (frontend).
- Navbar menampilkan info kurs, misal: _"1 USD = Rp 16.250 · 21.15"_

### 7. Tema Light / Dark

- Toggle dark mode di navbar
- Gunakan `next-themes` library
- Simpan preferensi di localStorage
- Implementasi visual saat ini dominan dark theme. Jika light mode dilanjutkan, pastikan CSS global dan komponen punya token warna light yang lengkap.

---

## Skema Database (Supabase)

### Tabel: `settings`

```sql
id          uuid primary key default gen_random_uuid()
user_id     uuid references auth.users(id) on delete cascade
modal_awal  bigint not null
created_at  timestamptz default now()
updated_at  timestamptz default now()
```

_Satu baris per user._

### Tabel: `trades`

```sql
id          uuid primary key default gen_random_uuid()
user_id     uuid references auth.users(id) on delete cascade
tanggal     date not null
saldo_awal  bigint not null
pnl         bigint not null
catatan     text
created_at  timestamptz default now()
updated_at  timestamptz default now()
```

**Catatan:**

- Semua nilai uang disimpan dalam **Rupiah (integer, bukan desimal)** untuk menghindari floating point issue.
- `pnl` bisa negatif.
- Kolom `hasil` (win/loss), `%`, `saldo_akhir`, `hari` tidak disimpan — semua dihitung di frontend.
- Row Level Security (RLS) wajib diaktifkan: user hanya bisa CRUD data miliknya sendiri.

---

## Struktur Folder Next.js

```
/app
  /login
    page.tsx
  /register
    page.tsx
  /
    page.tsx          ← Dashboard utama
  layout.tsx
  globals.css

/components
  Dashboard.tsx        ← Orkestrasi dashboard, state Supabase, modal tambah/edit trade
  Navbar.tsx          ← Toggle dark mode + toggle currency + info kurs + logout
  StatsGrid.tsx       ← Kartu statistik ringkasan
  TradeTable.tsx      ← Tabel/kartu trade, pagination, modal detail, edit/delete trigger
  TradeForm.tsx       ← Form tambah/edit dengan mode input PnL atau saldo akhir broker
  EquityCurve.tsx     ← Grafik Recharts
  Calculator.tsx      ← Kalkulator harian di modal trade
  ModalAwalForm.tsx   ← Form set modal awal
  LoginForm.tsx       ← Form login/register bersama

/lib
  supabase.ts         ← Supabase client
  utils.ts            ← Helper: format angka, hitung hari, konversi currency
  currency.ts         ← Fetch kurs live + caching sederhana

/types
  index.ts            ← TypeScript types (Trade, Settings, dll)

/middleware.ts        ← Proteksi route auth
/supabase/schema.sql  ← DDL tabel settings/trades + RLS policies
```

---

## Konvensi Kode

- Gunakan **TypeScript strict mode**
- Semua komponen adalah **React Server Components** kecuali yang butuh interaktivitas (gunakan `'use client'`)
- Format angka selalu pakai `Intl.NumberFormat` atau helper `formatRp()` / `formatUSD()`
- Format uang saat ini melalui `formatMoney(value, currency, rate)` di `lib/utils.ts`
- Jangan hardcode kurs di UI. Gunakan `fetchUsdIdrRate()` dan fallback terpusat `idrPerUsdFallback`.
- Error handling: tampilkan pesan error yang user-friendly, jangan expose stack trace
- Loading state: tampilkan skeleton atau spinner saat fetch data
- Gunakan lucide-react untuk icon UI baru.
- Jaga layout mobile: komponen memakai `min-w-0`, `break-words`, dan tabel desktop tersembunyi di mobile.
- Semua nilai uang tetap disimpan sebagai integer Rupiah di database.

---

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_EXCHANGE_RATE_API_KEY=   # opsional jika pakai open.er-api.com (free, no key)
```

---

## Catatan Operasional

- Jalankan development server dengan `npm run dev` atau package manager yang disepakati.
- Jalankan build dengan `npm run build` sebelum deploy.
- Untuk setup database, jalankan isi `supabase/schema.sql` di SQL editor Supabase.
- Jangan commit `.env.local`; file ini sudah berisi konfigurasi lokal dan harus tetap privat.

## Desain UI

### Referensi Visual

Gunakan referensi crypto dashboard dark theme (seperti Cryptoin UI Kit) sebagai inspirasi visual. Namun hanya implementasikan komponen yang ada di spec ini — jangan tambah elemen UI yang tidak disebutkan.

### Layout Dashboard

Dashboard saat ini memakai layout responsif 2 area:

- **Kiri / atas mobile**: `ModalAwalForm` + `StatsGrid`
- **Kanan / bawah mobile**: `EquityCurve` + `TradeTable`
- **Modal trade**: `Calculator` + `TradeForm` untuk tambah/edit trade

Jangan mengembalikan form tambah trade sebagai panel permanen kanan kecuali memang diminta. Alur saat ini memakai tombol **Tambah Trade** di navbar yang membuka modal.

### Warna & Tema

- Background utama: `#0f0f1a` (dark navy)
- Surface card: `#1a1a2e` atau `#16213e`
- Aksen utama: ungu `#7c3aed` / `#8b5cf6`
- Aksen sekunder: pink `#ec4899`
- Teks utama: putih `#ffffff`
- Teks muted: `#94a3b8`
- Win/profit: hijau `#10b981`
- Loss: merah `#ef4444`
- Border halus: `rgba(255,255,255,0.08)`

### Navbar (Header)

Navbar hanya berisi:

- Logo / nama app "RekapTrading" (kiri)
- Info kurs live, misal: `1 USD = Rp 16.250 · 21.15` (tengah/kiri)
- Toggle currency Rp/USD (kanan)
- Toggle dark/light mode (kanan)
- Tombol Tambah Trade (kanan)
- Tombol logout icon-only (kanan)

**TIDAK ADA** di navbar: search bar, notifikasi bell, sidebar kiri dengan navigasi huruf.

### Komponen yang TIDAK BOLEH dibuat

Komponen berikut **tidak ada di spec** dan **tidak boleh dibuat**:

- Sidebar navigasi (kiri atau kanan)
- Search bar
- Notifikasi / bell icon
- "Upgrade to Pro" card atau banner apapun
- Badge pair (BTC, ETH, dll) di kalkulator
- Copywriting motivasional ("1 jurnal = disiplin risk", dll)
- Fitur apapun yang tidak tercantum di dokumen ini

---

## Catatan Penting untuk Claude

1. **DILARANG menambah fitur, komponen, atau elemen UI yang tidak ada di dokumen ini.** Jika ragu, tanya dulu.
2. **Saldo awal form selalu auto-fill** dari saldo terakhir — ini UX penting, jangan sampai hilang.
3. **PnL input negatif harus work** — jangan paksa user klik toggle "loss", cukup input `-50000`.
4. **Kalkulasi % jangan NaN** — guard division by zero jika saldo 0.
5. **Semua data uang dalam integer Rupiah** di DB. Konversi USD hanya di tampilan.
6. **RLS Supabase wajib** — pastikan policy `user_id = auth.uid()` terpasang di semua tabel.
7. **Equity curve** harus urut berdasarkan tanggal ascending.
8. **Kurs cache** minimal 10 menit di memori/localStorage agar tidak spam API.
9. **Ikuti layout 2 area + modal trade** yang sudah didefinisikan di bagian Desain UI di atas.
10. **Tidak ada sidebar navigasi** dalam bentuk apapun.
