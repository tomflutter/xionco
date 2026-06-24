const express = require("express");
const methodOverride = require("method-override");
const path = require("path");
const { getDb } = require("./db/database");

const app = express();
const PORT = process.env.PORT || 3000;

// View engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "public")));

// Routes
const adminRouter = require("./routes/admin");
const chatbotRouter = require("./routes/chatbot");

app.use("/admin", adminRouter);
app.use("/chatbot", chatbotRouter);

// Redirect root to admin
app.get("/", (req, res) => res.redirect("/admin"));

// 404
app.use((req, res) => {
  res.status(404).render("pages/404", { title: "Halaman Tidak Ditemukan" });
});

// Init DB then start server
getDb().then(() => {
  app.listen(PORT, () => {
    console.log(`✅ Server berjalan di http://localhost:${PORT}`);
    console.log(`   Admin Panel : http://localhost:${PORT}/admin`);
    console.log(`   Chatbot     : http://localhost:${PORT}/chatbot`);
  });
}).catch(err => {
  console.error("❌ Gagal inisialisasi database:", err);
  process.exit(1);
});
