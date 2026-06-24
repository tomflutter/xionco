# 🏪 TokoAdmin – Admin Panel & Chatbot AI

Sistem admin toko sederhana dengan fitur manajemen pembelian dan Chatbot AI berbasis GROQ, dibangun dengan Node.js + Express + EJS + SQL.js.

## 📋 Fitur

### Admin Panel (`/admin`)
- **Dashboard** – statistik ringkasan (produk, pembelian aktif/cancel, pendapatan, stok menipis)
- **Manajemen Produk** – 10 produk bawaan, tambah produk baru, update stok, hapus produk
- **Manajemen Stok** – lihat status stok semua produk (Aman / Menipis / Kritis)
- **Manajemen Pembelian** – input pembelian baru, cancel pembelian (stok otomatis dikembalikan), filter & cari, detail transaksi

### Chatbot AI (`/chatbot`)
- Interface chat modern dengan GROQ API (model: llama-3.1-8b-instant)
- Quick suggestion buttons
- Riwayat percakapan per sesi
- Typing indicator animasi

## 🗄️ Database (SQL.js / SQLite)

| Tabel | Deskripsi |
|-------|-----------|
| `produk` | Data 10 produk (nama, kategori, harga, deskripsi) |
| `stok` | Jumlah stok per produk |
| `pembelian` | Transaksi pembelian (nomor unik, pembeli, produk, jumlah, total, status) |

## 🚀 Cara Menjalankan

### Prasyarat
- Node.js v22
- npm

### Instalasi

```bash
# 1. Clone repositori
git clone https://github.com/tomflutter/xionco.git
cd toko-admin-chatbot

# 2. Install dependensi
npm install

# 3. Konfigurasi environment
cp .env.example .env
# Edit .env dan isi GROQ_API_KEY

# 4. Jalankan server
node app.js
# atau untuk development:
npx nodemon app.js
```

### Akses
- **Admin Panel** : http://localhost:3000/admin
- **Chatbot**     : http://localhost:3000/chatbot

## 🔑 Mendapatkan GROQ API Key

1. Daftar di https://console.groq.com
2. Buat API Key baru
3. Masukkan di file `.env` atau set sebagai environment variable

## 📁 Struktur Proyek

```
toko-admin-chatbot/
├── app.js                  # Entry point Express
├── package.json
├── .env.example            # example konfigurasi
├── db/
│   └── database.js         # Inisialisasi & helper SQL.js
├── routes/
│   ├── admin.js            # Routes admin panel
│   └── chatbot.js          # Routes chatbot + GROQ API
├── views/
│   ├── partials/
│   │   ├── header.ejs
│   │   └── footer.ejs
│   └── pages/
│       ├── dashboard.ejs
│       ├── produk.ejs
│       ├── stok.ejs
│       ├── pembelian.ejs
│       ├── detail-pembelian.ejs
│       ├── chatbot.ejs
│       └── 404.ejs
└── public/
    ├── css/
    │   ├── style.css       # Stylesheet utama
    │   └── chatbot.css     # Stylesheet chatbot
    └── js/
        ├── main.js         # JS utama (modal, UI)
        └── chatbot.js      # JS chatbot (fetch, render)
```

## 🛠️ Teknologi

- **Backend**: Node.js, Express.js
- **Template Engine**: EJS
- **Database**: SQL.js (SQLite murni JavaScript, tanpa native binding)
- **AI**: GROQ API (model llama-3.1-8b-instant)
- **Frontend**: Vanilla CSS + JS (dark theme)

## 📝 Catatan

- Database otomatis dibuat saat pertama kali dijalankan (`toko.db`)
- 10 produk bawaan ter-seed otomatis dengan stok acak 10–60 unit
- Stok otomatis berkurang saat pembelian dibuat dan dikembalikan saat dibatalkan
- Chatbot membutuhkan GROQ_API_KEY yang valid untuk berfungsi
