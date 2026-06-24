const express = require("express");
const router = express.Router();
const fetch = require("node-fetch");

router.get("/", (req, res) => {
  res.render("pages/chatbot", { title: "Chatbot AI", active: "chatbot" });
});

router.post("/message", async (req, res) => {
  const { message, history } = req.body;
  const GROQ_API_KEY = process.env.GROQ_API_KEY || "";

  if (!GROQ_API_KEY) {
    return res.json({
      success: false,
      error: "GROQ API Key belum dikonfigurasi. Silakan set GROQ_API_KEY di environment variable."
    });
  }

  try {
    const messages = [
      {
        role: "system",
        content: `Kamu adalah asisten toko bernama "TokoBot" yang membantu pelanggan dan admin toko online kami. 
Kamu ramah, profesional, dan selalu menjawab dalam Bahasa Indonesia.
Kamu bisa membantu dengan:
- Informasi produk dan stok
- Cara melakukan pembelian
- Status pesanan
- Pertanyaan umum tentang toko
- Rekomendasi produk
Jawab dengan singkat, jelas, dan helpful. Gunakan emoji secukupnya untuk membuat percakapan lebih menyenangkan.`
      },
      ...(Array.isArray(history) ? history.slice(-10) : []),
      { role: "user", content: message }
    ];

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: "llama3-8b-8192",
        messages,
        max_tokens: 1024,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.error?.message || `HTTP Error ${response.status}`);
    }

    const data = await response.json();
    const reply = data.choices[0]?.message?.content || "Maaf, saya tidak bisa merespons saat ini.";

    res.json({ success: true, reply });
  } catch (err) {
    console.error("GROQ API Error:", err.message);
    res.json({ success: false, error: "Gagal menghubungi AI: " + err.message });
  }
});

module.exports = router;
