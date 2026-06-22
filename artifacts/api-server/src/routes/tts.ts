import { Router, type IRouter } from "express";

const router: IRouter = Router();

router.get("/tts", async (req, res) => {
  const text = String(req.query.text || "").trim();
  if (!text) { res.status(400).json({ error: "text required" }); return; }

  try {
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=th&client=tw-ob&q=${encodeURIComponent(text)}`;
    const upstream = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; restaurant-pos/1.0)",
        "Referer": "https://translate.google.com/",
      },
    });

    if (!upstream.ok) {
      res.status(502).json({ error: "TTS upstream failed" });
      return;
    }

    const buffer = await upstream.arrayBuffer();
    res.setHeader("Content-Type", upstream.headers.get("content-type") || "audio/mpeg");
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.send(Buffer.from(buffer));
  } catch (err) {
    res.status(500).json({ error: "TTS failed" });
  }
});

export default router;
