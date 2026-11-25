<div align="center">
  <img src="cerospace-web/public/logo-readme.png" alt="CeroSpace Logo" width="160" />

  <h1>CeroSpace</h1>

  <p><strong>Platform E-Commerce Fashion Multi-Role — Your Style, Your Space</strong></p>

  <p>
    Aplikasi marketplace fashion modern berbasis <strong>Next.js App Router</strong>, <strong>NextAuth v5</strong>, <strong>Tailwind CSS</strong>, dan <strong>PostgreSQL Raw SQL</strong> dengan pemisahan peran penuh untuk Pembeli, Penjual, dan Administrator.
  </p>

  <p>
    <img src="https://img.shields.io/badge/Next.js-16.4.6-000000?style=flat&logo=next.js&logoColor=white" alt="Next.js" />
    <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat&logo=react&logoColor=black" alt="React" />
    <img src="https://img.shields.io/badge/PostgreSQL-Raw%20SQL-336791?style=flat&logo=postgresql&logoColor=white" alt="PostgreSQL" />
    <img src="https://img.shields.io/badge/NextAuth-v5%20JWT-0f172b?style=flat" alt="NextAuth" />
    <img src="https://img.shields.io/badge/Tailwind%20CSS-v4-06B6D4?style=flat&logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
    <img src="https://img.shields.io/badge/Auth-bcrypt-22c55e?style=flat" alt="bcrypt" />
  </p>
</div>

---

## Daftar Isi

- [Tentang Proyek](#tentang-proyek)
- [Teknologi yang Digunakan](#teknologi-yang-digunakan)
- [Peran & Alur Utama](#peran--alur-utama)
- [Matriks Hak Akses (RBAC)](#matriks-hak-akses-rbac)
- [Keunggulan Teknis](#keunggulan-teknis)
- [Arsitektur & Skema Database](#arsitektur--skema-database)
- [Daftar Endpoint API](#daftar-endpoint-api)
- [Struktur Direktori](#struktur-direktori)
- [Panduan Instalasi & Konfigurasi](#panduan-instalasi--konfigurasi)
- [Alur Pengujian Aplikasi](#alur-pengujian-aplikasi)
- [Troubleshooting Singkat](#troubleshooting-singkat)
- [Pengembang](#pengembang)

---

## Tentang Proyek

**CeroSpace** adalah platform *e-commerce* fashion multi-toko yang dirancang untuk menjembatani pembeli, penjual (mitra toko fashion), dan administrator dalam satu ekosistem terpadu. Pengguna dapat menjelajahi katalog pakaian, celana, sepatu, dan aksesoris dari berbagai toko, mengelola keranjang belanja, melakukan *checkout*, memantau status pengiriman, hingga memberikan ulasan produk.

Dari sisi backend, seluruh proses bisnis—mulai dari registrasi terenkripsi, validasi stok saat *checkout*, verifikasi pendaftaran penjual oleh admin, unggah gambar produk, hingga manajemen banner promosi beranda—dibangun secara eksplisit menggunakan **PostgreSQL Raw SQL** (`node-postgres`) tanpa ORM agar relasi antar tabel, performa kueri, dan integritas data tetap terkendali penuh.

---

## Teknologi yang Digunakan

| Lapisan | Teknologi | Peran dalam Proyek |
| :--- | :--- | :--- |
| **Framework Full-Stack** | Next.js 16 (App Router) & React 19 | Rendering *Server/Client Components* dan REST API *Route Handlers* |
| **Database** | PostgreSQL (`cerospace_db`) & `pg` | Penyimpanan relasional dengan *connection pooling* dan Raw SQL |
| **Autentikasi & Keamanan** | NextAuth v5 (JWT) & `bcrypt` | Manajemen sesi login multi-role, proteksi rute, dan hashing kata sandi |
| **Antarmuka & Ikon** | Tailwind CSS v4 & Lucide React | Styling responsif bergaya minimalis dengan palet *deep navy* (`#0f172b`) |
| **Manajemen Aset** | Local File Upload (`/api/upload`) | Penyimpanan gambar produk dan banner slider di direktori `public/uploads/` |

---

## Peran & Alur Utama

| Peran | Kemampuan & Alur Utama |
| :--- | :--- |
| **Publik & Pembeli** (`buyer`) | Pencarian produk langsung dari bilah navigasi, tampilan banner slider promosi dinamis di beranda (`/`), penjelajahan 4 kategori utama (`Baju`, `Celana`, `Sepatu`, `Aksesoris`), halaman katalog lengkap dengan filter (`/products`), serta halaman detail produk (`/products/[id]`) yang menampilkan deskripsi, stok, profil toko, dan ulasan terverifikasi. Pembeli terautentikasi dapat mengelola keranjang belanja (`/cart`), melakukan proses *checkout*, memantau riwayat & status pesanan secara *real-time* (`/buyer/orders`), serta mengirimkan rating dan ulasan untuk produk dari pesanan yang telah selesai. |
| **Penjual / Mitra Toko** (`seller`) | Pendaftaran akun penjual dengan alur persetujuan admin dan halaman status verifikasi (`/seller/pending`) untuk memantau status akun (`pending`, `approved`, `rejected`). Setelah disetujui, penjual memperoleh akses penuh ke dasbor penjual (`/seller/dashboard`) untuk mengelola informasi profil toko, menambah/mengubah/menghapus produk beserta unggah foto produk lokal, memantau pesanan masuk dan memperbarui status pengiriman, serta opsi penghapusan akun penjual secara mandiri. |
| **Administrator** (`admin`) | Pengawasan dan kendali sistem terpusat melalui dasbor admin (`/admin/dashboard`), mencakup antrean verifikasi pendaftaran akun mitra penjual (`approve` / `reject`) untuk memastikan kualitas toko di platform, serta manajemen CRUD penuh terhadap aset banner slider yang ditampilkan di halaman beranda CeroSpace. |

---

## Akun Demo (Default Login)

Setelah mengimpor `cerospace_db.sql`, Anda dapat langsung mencoba fitur masing-masing peran (*role*) menggunakan akun bawaan berikut:

| Role | Email | Password | Akses Utama |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@cerospace.com` | `password_admin` | Verifikasi seller (`approve`/`reject`) & kelola banner beranda |
| **Seller** | `seller@cerospace.com` | `password_seller` | Kelola produk toko & ubah status pesanan masuk |
| **Buyer** | `buyer@cerospace.com` | `password_buyer` | Belanja, kelola keranjang, checkout, & beri ulasan |

> **Catatan:** Anda juga dapat mendaftarkan akun **Buyer** atau **Seller** baru melalui halaman `/register`. Akun **Seller** yang baru mendaftar akan berstatus `pending` hingga disetujui oleh **Admin**.

---

## Matriks Hak Akses (RBAC)

Setiap rute dan endpoint dilindungi menggunakan *middleware* NextAuth dan validasi sesi di sisi server:

| Rute / Fitur | Publik (Guest) | Buyer | Seller (Pending) | Seller (Approved) | Admin |
| :--- | :---: | :---: | :---: | :---: | :---: |
| Beranda (`/`), Katalog (`/products`), Detail Produk | ✅ | ✅ | ✅ | ✅ | ✅ |
| Keranjang (`/cart`) & Checkout | ❌ | ✅ | ❌ | ❌ | ❌ |
| Riwayat Pesanan & Ulasan (`/buyer/orders`) | ❌ | ✅ | ❌ | ❌ | ❌ |
| Halaman Status Verifikasi (`/seller/pending`) | ❌ | ❌ | ✅ | ❌ *(redirect)* | ❌ |
| Dasbor Penjual (`/seller/dashboard`) | ❌ | ❌ | ❌ *(redirect)* | ✅ | ❌ |
| Dasbor Admin (`/admin/dashboard`) | ❌ | ❌ | ❌ | ❌ | ✅ |

---

## Keunggulan Teknis

- **PostgreSQL Raw SQL & Integritas Relasional:** Menggunakan pustaka `pg` (*connection pooling*) dengan *parameterized queries* (`$1, $2, ...`) untuk mencegah *SQL Injection* sekaligus menjaga kejelasan relasi antar tabel (`users`, `stores`, `categories`, `products`, `cart_items`, `orders`, `order_items`, `reviews`, dan `banners`).
- **Autentikasi & Otorisasi Multi-Role:** Memanfaatkan **NextAuth v5** (*Credentials Provider* dengan strategi sesi **JWT**) dan hashing kata sandi menggunakan **bcrypt** (`password_hash`). Dilengkapi proteksi rute (*middleware*) dan validasi sesi di setiap endpoint API agar setiap peran (`buyer`, `seller`, `admin`) hanya dapat mengakses sumber daya miliknya.
- **Arsitektur Next.js App Router (Server & Client Components):** Memisahkan pengambilan data awal di sisi server (*Server Components*) agar pemuatan halaman cepat, dengan komponen interaktif di sisi klien (`CartClient`, `BuyerOrdersClient`, `SellerDashboardClient`, dan komponen dasbor admin) untuk pengalaman pengguna yang responsif.
- **Manajemen Unggah Aset Lokal:** Endpoint `/api/upload` menangani unggah gambar produk dan banner secara langsung ke direktori `public/uploads/` dengan penamaan file yang aman agar langsung dapat disajikan oleh Next.js.
- **Desain Minimalis & Konsisten:** Dibangun menggunakan **Tailwind CSS** dan ikon **Lucide React** dengan sistem warna *deep navy* (`#0f172b`) yang bersih, simetris, dan adaptif di berbagai ukuran layar.

---

## Arsitektur & Skema Database

Database PostgreSQL (`cerospace_db`) didefinisikan dalam file `cerospace_db.sql` di akar repositori dengan tabel-tabel inti berikut:

| Tabel | Fungsi Utama | Relasi / Kolom Kunci |
| :--- | :--- | :--- |
| `users` | Menyimpan data seluruh pengguna (`buyer`, `seller`, `admin`) | `id`, `email`, `password_hash`, `role`, status verifikasi penjual |
| `stores` | Menyimpan profil toko milik akun penjual | Terhubung ke `users` (`seller_id` / pemilik toko) |
| `categories` | Master kategori fashion (`Baju`, `Celana`, `Sepatu`, `Aksesoris`) | `id`, `name`, `slug` |
| `products` | Katalog produk fashion lengkap dengan harga, stok, dan path gambar | Terhubung ke `stores` dan `categories` |
| `cart_items` | Menyimpan daftar barang sementara di keranjang belanja pembeli | Terhubung ke `users` dan `products` |
| `orders` | Mencatat header transaksi pesanan beserta status dan total harga | `id`, `buyer_id`, `total_price`, `status`, `created_at` |
| `order_items` | Rincian item produk, kuantitas, dan harga satuan per pesanan | Terhubung ke `orders` dan `products` |
| `reviews` | Menyimpan rating bintang dan komentar ulasan dari pembeli | Terhubung ke `users` (`buyer_id`) dan `products` |
| `banners` | Menyimpan daftar gambar dan informasi banner slider halaman beranda | Dikelola penuh oleh `admin` melalui dasbor |

---

## Daftar Endpoint API

Seluruh API dibangun menggunakan **Next.js Route Handlers** di bawah `cerospace-web/src/app/api/`:

| Modul | Endpoint | Kegunaan |
| :--- | :--- | :--- |
| **Autentikasi** | `POST /api/register` | Registrasi akun baru (`buyer` / `seller`) dengan enkripsi `bcrypt` |
| **Autentikasi** | `GET, POST /api/auth/[...nextauth]` | Penanganan login, sesi JWT, dan logout NextAuth |
| **Katalog Publik** | `GET /api/products` | Mengambil daftar produk beserta filter kategori/pencarian |
| **Keranjang & Checkout** | `GET, POST, PATCH, DELETE /api/cart` | Mengelola item di keranjang belanja pembeli |
| **Keranjang & Checkout** | `POST /api/checkout` | Memproses keranjang menjadi pesanan baru (`orders` & `order_items`) |
| **Pembeli (`Buyer`)** | `GET /api/buyer/orders` | Mengambil riwayat dan status pesanan milik pembeli aktif |
| **Pembeli (`Buyer`)** | `POST /api/review` | Mengirimkan rating dan ulasan untuk produk yang telah dibeli |
| **Penjual (`Seller`)** | `POST /api/upload` | Mengunggah file gambar produk ke direktori `public/uploads/` |
| **Penjual (`Seller`)** | `GET, PUT /api/seller/store` | Membaca dan memperbarui profil toko milik penjual |
| **Penjual (`Seller`)** | `GET, POST /api/seller/products` | Melihat daftar produk toko dan menambahkan produk baru |
| **Penjual (`Seller`)** | `PUT, DELETE /api/seller/products/[id]` | Mengubah detail/stok atau menghapus produk tertentu |
| **Penjual (`Seller`)** | `GET, PATCH /api/seller/orders` | Melihat pesanan masuk dan memperbarui status pengiriman |
| **Penjual (`Seller`)** | `DELETE /api/seller/delete-account` | Menghapus akun penjual beserta data terkait |
| **Admin (`Admin`)** | `GET, PATCH /api/admin/sellers` | Melihat daftar pendaftar penjual dan menyetujui/menolak verifikasi |
| **Admin (`Admin`)** | `GET, POST /api/admin/banners` | Menampilkan daftar banner dan menambahkan banner baru |
| **Admin (`Admin`)** | `PUT, DELETE /api/admin/banners/[id]` | Memperbarui atau menghapus banner beranda tertentu |

---

## Struktur Direktori

```text
CeroSpace/
├── cerospace_db.sql                    # Skema PostgreSQL & data awal (seed)
├── README.md                           # Dokumentasi utama proyek
└── cerospace-web/                      # Aplikasi utama Next.js
    ├── package.json                    # Daftar dependensi & skrip npm
    ├── public/                         # Aset statis (logo, gambar toko, produk, banner)
    │   └── uploads/
    │       └── banners/                # Aset gambar slider beranda
    └── src/
        ├── auth.js                     # Konfigurasi NextAuth & Credentials provider
        ├── auth.config.js              # Konfigurasi callback & proteksi rute
        ├── lib/
        │   └── db.js                   # Koneksi pool PostgreSQL (pg)
        ├── components/                 # Komponen UI reusable & Client Views
        │   ├── Navbar.js               # Navigasi utama & pencarian
        │   ├── Footer.js               # Footer situs
        │   ├── CartClient.js           # Antarmuka keranjang & ringkasan checkout
        │   ├── BuyerOrdersClient.js    # Pelacakan pesanan & form ulasan pembeli
        │   ├── SellerDashboardClient.js# Antarmuka dasbor pengelolaan penjual
        │   └── ...                     # Komponen produk, banner, dan admin
        └── app/                        # Next.js App Router (Halaman & API)
            ├── page.js                 # Halaman beranda utama
            ├── layout.js               # Root layout & SessionProvider
            ├── products/               # Halaman katalog & detail produk
            ├── cart/                   # Halaman keranjang belanja
            ├── buyer/orders/           # Halaman riwayat pesanan pembeli
            ├── seller/                 # Halaman utama, pending verifikasi, & dasbor penjual
            ├── admin/                  # Halaman utama & dasbor administrator
            └── api/                    # Seluruh REST API Route Handlers
```

---

## Panduan Instalasi & Konfigurasi

### 1. Prasyarat Sistem
Pastikan perangkat Anda telah terpasang:
- **Node.js** versi `18.x` atau lebih baru (disarankan v20+ LTS)
- **PostgreSQL** (versi 14+) beserta **pgAdmin 4** atau CLI `psql`
- **Git**

### 2. Clone Repositori
```bash
git clone [https://github.com/mtaqwin/CeroSpace.git](https://github.com/mtaqwin/CeroSpace.git)
cd CeroSpace
```

### 3. Persiapan Database PostgreSQL
1. Buka **pgAdmin 4** atau terminal `psql`, lalu buat database baru bernama **`cerospace_db`**.
2. Impor dan jalankan skrip SQL dari file `cerospace_db.sql` ke dalam database tersebut:
   ```bash
   psql -U postgres -d cerospace_db -f cerospace_db.sql
   ```
   *(Atau buka file `cerospace_db.sql` melalui **Query Tool** di pgAdmin 4 lalu klik **Execute**).*

### 4. Konfigurasi Environment Variables
Masuk ke direktori `cerospace-web`, lalu buat file baru bernama `.env.local` dengan isi berikut:

```env
# Koneksi Database PostgreSQL
DATABASE_URL=postgresql://postgres:password_postgres_anda@localhost:5432/cerospace_db

# Konfigurasi NextAuth v5
AUTH_SECRET=ganti_dengan_string_acak_panjang_minimal_32_karakter
NEXTAUTH_URL=http://localhost:3000
```

> **Catatan:** Sesuaikan `postgres` dan `password_postgres_anda` dengan kredensial PostgreSQL lokal Anda. Anda dapat membuat nilai `AUTH_SECRET` secara cepat di terminal dengan menjalankan `npx auth secret`.

### 5. Instalasi Dependensi & Menjalankan Server
Pastikan terminal berada di dalam folder **`cerospace-web`**, lalu jalankan:

```bash
cd cerospace-web
npm install
npm run dev
```

Aplikasi akan berjalan di **`http://localhost:3000`**.

---

## Alur Pengujian Aplikasi

Untuk menguji keseluruhan sistem secara *end-to-end*, ikuti skenario berikut:

1. **Alur Pembeli (`buyer`):**
   - Daftar akun baru sebagai pembeli melalui halaman registrasi atau masuk menggunakan akun pembeli yang tersedia di `cerospace_db.sql`.
   - Jelajahi produk dari beranda atau halaman `/products`, buka detail produk, lalu tambahkan ke keranjang.
   - Buka `/cart`, sesuaikan jumlah barang, lalu klik **Checkout**.
   - Pantau perubahan status pesanan di `/buyer/orders` dan kirimkan rating beserta ulasan setelah pesanan diselesaikan oleh penjual.
2. **Alur Penjual (`seller`) & Verifikasi Admin:**
   - Daftar akun baru sebagai penjual; secara otomatis sistem akan mengarahkan akun ke halaman tunggu `/seller/pending`.
   - Masuk menggunakan akun **Admin**, buka `/admin/dashboard`, lalu setujui (`Approve`) pendaftaran penjual tersebut.
   - Masuk kembali sebagai penjual, buka `/seller/dashboard`, lengkapi profil toko, tambahkan produk baru beserta foto, dan perbarui status pesanan yang masuk.
3. **Manajemen Banner Beranda (`admin`):**
   - Dari `/admin/dashboard`, tambahkan, ubah, atau hapus banner promosi, lalu buka kembali halaman beranda (`/`) untuk memverifikasi perubahan pada slider.

---

## Troubleshooting Singkat

- **Error `ENOENT: no such file or directory, open '.../package.json'`:** Pastikan Anda sudah masuk ke folder aplikasi dengan `cd cerospace-web` sebelum menjalankan `npm install` atau `npm run dev`.
- **Gagal koneksi database (`ECONNREFUSED` / `password authentication failed`):** Periksa kembali apakah layanan PostgreSQL sudah aktif dan nilai `DATABASE_URL` di `cerospace-web/.env.local` sudah sesuai dengan username, password, dan nama database `cerospace_db`.
- **Gagal clone di Windows (`Filename too long`):** Jalankan `git config --global core.longpaths true` terlebih dahulu sebelum melakukan `git clone`.

---

## Pengembang

<div align="center">
  <strong>Muhammad Taqwin Yunus</strong><br/>
  Program Studi Sistem Informasi — Fakultas Matematika dan Ilmu Pengetahuan Alam<br/>
  Universitas Hasanuddin
</div>