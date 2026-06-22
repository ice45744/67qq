import { Router } from "express";

const router = Router();

router.post("/upload", async (req, res) => {
  const { image } = req.body as { image: string };
  if (!image) {
    res.status(400).json({ error: "image is required" });
    return;
  }

  const apiKey = process.env.IMGBB_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "IMGBB_API_KEY not configured" });
    return;
  }

  const base64 = image.includes(",") ? image.split(",")[1] : image;

  const form = new URLSearchParams();
  form.set("key", apiKey);
  form.set("image", base64);

  const response = await fetch("https://api.imgbb.com/1/upload", {
    method: "POST",
    body: form,
  });

  const data = await response.json() as { success: boolean; data?: { url: string; display_url: string } };

  if (!response.ok || !data.success) {
    res.status(502).json({ error: "ImgBB upload failed", detail: data });
    return;
  }

  res.json({ url: data.data!.display_url });
});

export default router;
