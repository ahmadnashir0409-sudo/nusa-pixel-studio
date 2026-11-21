# Nusa Pixel Studio

Website company profile Nusa Pixel, dibuat menggunakan HTML, CSS, dan JavaScript, dengan Supabase untuk pengaturan konten dan portfolio.

## File utama

- `index.html` — website publik.
- `style.css` — desain dan responsive layout.
- `app.js` — interaksi, portfolio, dan konsultasi WhatsApp.
- `config.js` — konfigurasi Supabase dan nomor WhatsApp.
- `admin.html`, `admin.css`, `admin.js` — dashboard admin.
- `assets/nusa-pixel-logo.png` — logo.

## Deploy GitHub Pages

1. Pastikan seluruh file dan folder tetap berada pada struktur repository.
2. Buka **Settings → Pages** di repository GitHub.
3. Atur source ke **Deploy from a branch**.
4. Pilih branch `main` dan folder `/ (root)`, lalu simpan.
5. Tunggu deployment selesai dan buka URL GitHub Pages yang ditampilkan.

## Konfigurasi

Edit `config.js` untuk mengatur:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY` (publishable/anon key, bukan service-role key)
- `WHATSAPP_NUMBER` (format internasional, angka saja, contoh `62812...`)

Jangan pernah memasukkan Supabase `service_role` key ke file frontend atau repository publik.

## Supabase dan dashboard admin

Website publik dapat menampilkan kartu project DAGBOEK internal meskipun tabel portfolio belum berisi data. Jika data portfolio yang dipublikasikan tersedia di Supabase, data tersebut akan ditampilkan.

Dashboard admin memerlukan Supabase Auth serta tabel `site_settings` dan `portfolio` dengan kolom yang digunakan oleh `admin.js`. Kebijakan Row Level Security (RLS) wajib dikonfigurasi di Supabase agar hanya admin terotorisasi yang dapat mengubah pengaturan dan portfolio. Menyembunyikan halaman admin bukan pengganti RLS.

Skema database dan policy tidak diubah oleh paket frontend ini. Periksa konfigurasi RLS di Supabase sebelum membuka dashboard admin untuk penggunaan publik.

## Catatan

- Nomor WhatsApp saat ini dibaca dari `config.js` sebagai fallback dan dapat ditimpa oleh `site_settings.whatsapp`.
- Tahun copyright diperbarui otomatis.
- Portfolio DAGBOEK ditandai sebagai produk internal Nusa Pixel, bukan proyek klien.
