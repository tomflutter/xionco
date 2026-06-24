const initSqlJs = require("sql.js");
const fs = require("fs");
const path = require("path");

const DB_PATH = path.join(__dirname, "toko.db");

let db = null;

async function getDb() {
  if (db) return db;

  const SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
    initSchema();
    saveDb();
  }

  return db;
}

function saveDb() {
  if (!db) return;
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
}

function initSchema() {
  db.run(`
    CREATE TABLE IF NOT EXISTS produk (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nama TEXT NOT NULL,
      kategori TEXT,
      harga REAL NOT NULL,
      deskripsi TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS stok (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      produk_id INTEGER NOT NULL,
      jumlah INTEGER NOT NULL DEFAULT 0,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (produk_id) REFERENCES produk(id)
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS pembelian (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nomor_transaksi TEXT UNIQUE NOT NULL,
      nama_pembeli TEXT NOT NULL,
      produk_id INTEGER NOT NULL,
      jumlah INTEGER NOT NULL,
      total_harga REAL NOT NULL,
      status TEXT DEFAULT 'aktif',
      catatan TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (produk_id) REFERENCES produk(id)
    );
  `);

  // Seed 10 produk
  const produkData = [
    ["Laptop ASUS VivoBook 14", "Elektronik", 8500000, "Laptop ringan dengan prosesor Intel Core i5, RAM 8GB, SSD 512GB"],
    ["Mouse Logitech M100", "Aksesoris", 125000, "Mouse kabel ergonomis dengan resolusi 1000 DPI"],
    ["Keyboard Mechanical RGB", "Aksesoris", 450000, "Keyboard gaming mekanik dengan backlight RGB 16.8 juta warna"],
    ["Monitor Samsung 24\"", "Elektronik", 2750000, "Monitor Full HD 1080p IPS panel, refresh rate 75Hz"],
    ["Headphone Sony MDR-ZX110", "Audio", 195000, "Headphone over-ear dengan suara stereo berkualitas tinggi"],
    ["Webcam Logitech C270", "Aksesoris", 380000, "Webcam HD 720p untuk meeting dan streaming"],
    ["SSD Samsung 1TB", "Storage", 1150000, "SSD NVMe PCIe Gen 4 kecepatan baca 7000MB/s"],
    ["RAM Corsair 16GB DDR4", "Komponen", 650000, "RAM gaming DDR4 3200MHz CL16 XMP support"],
    ["Router WiFi TP-Link AX1800", "Jaringan", 485000, "Router WiFi 6 dual-band kecepatan hingga 1800Mbps"],
    ["Printer Canon PIXMA G2020", "Cetak", 1350000, "Printer inkjet warna dengan tangki tinta isi ulang"]
  ];

  const stmtProduk = db.prepare("INSERT INTO produk (nama, kategori, harga, deskripsi) VALUES (?,?,?,?)");
  const stmtStok = db.prepare("INSERT INTO stok (produk_id, jumlah) VALUES (?,?)");

  produkData.forEach((p, i) => {
    stmtProduk.run(p);
    const jumlah = Math.floor(Math.random() * 50) + 10;
    stmtStok.run([i + 1, jumlah]);
  });

  stmtProduk.free();
  stmtStok.free();
}

function query(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

function run(sql, params = []) {
  db.run(sql, params);
  saveDb();
}

function getOne(sql, params = []) {
  const rows = query(sql, params);
  return rows[0] || null;
}

module.exports = { getDb, query, run, getOne, saveDb };
