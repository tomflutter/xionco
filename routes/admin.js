const express = require("express");
const router = express.Router();
const { query, run, getOne } = require("../db/database");

// Helper buat nomor transaksi
function generateNomorTransaksi() {
  const now = new Date();
  const ts = now.toISOString().replace(/[-T:.Z]/g, "").slice(0, 14);
  const rand = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
  return `TRX-${ts}-${rand}`;
}

// ========== DASHBOARD ==========
router.get("/", (req, res) => {
  const produkCount = getOne("SELECT COUNT(*) as total FROM produk");
  const pembelianAktif = getOne("SELECT COUNT(*) as total FROM pembelian WHERE status='aktif'");
  const pembelianCancel = getOne("SELECT COUNT(*) as total FROM pembelian WHERE status='cancel'");
  const totalPendapatan = getOne("SELECT SUM(total_harga) as total FROM pembelian WHERE status='aktif'");
  const recentPembelian = query(`
    SELECT p.*, pr.nama as nama_produk, pr.kategori 
    FROM pembelian p 
    JOIN produk pr ON p.produk_id = pr.id 
    ORDER BY p.created_at DESC LIMIT 5
  `);
  const stokRendah = query(`
    SELECT pr.nama, s.jumlah FROM stok s
    JOIN produk pr ON s.produk_id = pr.id
    WHERE s.jumlah < 10 ORDER BY s.jumlah ASC
  `);

  res.render("pages/dashboard", {
    title: "Dashboard",
    active: "dashboard",
    stats: {
      produk: produkCount?.total || 0,
      aktif: pembelianAktif?.total || 0,
      cancel: pembelianCancel?.total || 0,
      pendapatan: totalPendapatan?.total || 0
    },
    recentPembelian,
    stokRendah
  });
});

// ========== PRODUK ==========
router.get("/produk", (req, res) => {
  const produk = query(`
    SELECT p.*, s.jumlah as stok 
    FROM produk p 
    LEFT JOIN stok s ON p.id = s.produk_id 
    ORDER BY p.id
  `);
  res.render("pages/produk", { title: "Manajemen Produk", active: "produk", produk });
});

router.post("/produk", (req, res) => {
  const { nama, kategori, harga, deskripsi, stok } = req.body;
  run("INSERT INTO produk (nama, kategori, harga, deskripsi) VALUES (?,?,?,?)",
    [nama, kategori, parseFloat(harga), deskripsi]);
  const produkBaru = getOne("SELECT last_insert_rowid() as id");
  run("INSERT INTO stok (produk_id, jumlah) VALUES (?,?)", [produkBaru.id, parseInt(stok) || 0]);
  res.redirect("/admin/produk?success=Produk+berhasil+ditambahkan");
});

router.post("/produk/:id/update-stok", (req, res) => {
  const { jumlah } = req.body;
  run("UPDATE stok SET jumlah=?, updated_at=CURRENT_TIMESTAMP WHERE produk_id=?",
    [parseInt(jumlah), req.params.id]);
  res.redirect("/admin/produk?success=Stok+berhasil+diperbarui");
});

router.delete("/produk/:id", (req, res) => {
  run("DELETE FROM stok WHERE produk_id=?", [req.params.id]);
  run("DELETE FROM produk WHERE id=?", [req.params.id]);
  res.redirect("/admin/produk?success=Produk+berhasil+dihapus");
});

// ========== PEMBELIAN ==========
router.get("/pembelian", (req, res) => {
  const { status, search } = req.query;
  let sql = `
    SELECT p.*, pr.nama as nama_produk, pr.kategori, pr.harga as harga_satuan
    FROM pembelian p 
    JOIN produk pr ON p.produk_id = pr.id
    WHERE 1=1
  `;
  const params = [];

  if (status && status !== "semua") {
    sql += " AND p.status=?";
    params.push(status);
  }
  if (search) {
    sql += " AND (p.nama_pembeli LIKE ? OR p.nomor_transaksi LIKE ? OR pr.nama LIKE ?)";
    const s = `%${search}%`;
    params.push(s, s, s);
  }
  sql += " ORDER BY p.created_at DESC";

  const pembelian = query(sql, params);
  const produk = query("SELECT p.*, s.jumlah as stok FROM produk p LEFT JOIN stok s ON p.id=s.produk_id ORDER BY p.nama");

  res.render("pages/pembelian", {
    title: "Manajemen Pembelian",
    active: "pembelian",
    pembelian,
    produk,
    filterStatus: status || "semua",
    search: search || ""
  });
});

router.post("/pembelian", (req, res) => {
  const { nama_pembeli, produk_id, jumlah, catatan } = req.body;
  const produk = getOne("SELECT p.*, s.jumlah as stok FROM produk p JOIN stok s ON p.id=s.produk_id WHERE p.id=?", [produk_id]);

  if (!produk) {
    return res.redirect("/admin/pembelian?error=Produk+tidak+ditemukan");
  }
  if (produk.stok < parseInt(jumlah)) {
    return res.redirect("/admin/pembelian?error=Stok+tidak+mencukupi+(stok+tersedia:+" + produk.stok + ")");
  }

  const nomorTransaksi = generateNomorTransaksi();
  const totalHarga = produk.harga * parseInt(jumlah);

  run(`INSERT INTO pembelian (nomor_transaksi, nama_pembeli, produk_id, jumlah, total_harga, catatan)
       VALUES (?,?,?,?,?,?)`,
    [nomorTransaksi, nama_pembeli, produk_id, parseInt(jumlah), totalHarga, catatan || ""]);

  // Kurangi stok
  run("UPDATE stok SET jumlah=jumlah-?, updated_at=CURRENT_TIMESTAMP WHERE produk_id=?",
    [parseInt(jumlah), produk_id]);

  res.redirect("/admin/pembelian?success=Pembelian+berhasil+ditambahkan+("+nomorTransaksi+")");
});

// Cancel pembelian
router.post("/pembelian/:id/cancel", (req, res) => {
  const pembelian = getOne("SELECT * FROM pembelian WHERE id=?", [req.params.id]);
  if (!pembelian || pembelian.status === "cancel") {
    return res.redirect("/admin/pembelian?error=Pembelian+tidak+dapat+dibatalkan");
  }

  run("UPDATE pembelian SET status='cancel', updated_at=CURRENT_TIMESTAMP WHERE id=?", [req.params.id]);
  // Kembalikan stok
  run("UPDATE stok SET jumlah=jumlah+?, updated_at=CURRENT_TIMESTAMP WHERE produk_id=?",
    [pembelian.jumlah, pembelian.produk_id]);

  res.redirect("/admin/pembelian?success=Pembelian+berhasil+dibatalkan+dan+stok+dikembalikan");
});

// Detail pembelian
router.get("/pembelian/:id", (req, res) => {
  const pembelian = getOne(`
    SELECT p.*, pr.nama as nama_produk, pr.kategori, pr.harga as harga_satuan
    FROM pembelian p JOIN produk pr ON p.produk_id=pr.id WHERE p.id=?
  `, [req.params.id]);

  if (!pembelian) return res.redirect("/admin/pembelian?error=Data+tidak+ditemukan");
  res.render("pages/detail-pembelian", { title: "Detail Pembelian", active: "pembelian", pembelian });
});

// ========== STOK ==========
router.get("/stok", (req, res) => {
  const stok = query(`
    SELECT p.id, p.nama, p.kategori, p.harga, s.jumlah, s.updated_at
    FROM produk p LEFT JOIN stok s ON p.id=s.produk_id ORDER BY s.jumlah ASC
  `);
  res.render("pages/stok", { title: "Manajemen Stok", active: "stok", stok });
});

module.exports = router;
