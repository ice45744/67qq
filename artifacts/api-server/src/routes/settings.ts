import { Router } from "express";
import { db, settingsTable } from "@workspace/db";
import { broadcast } from "../lib/sse.js";

const router = Router();

const DEFAULT_SETTINGS = {
  name: "ร้านหม่าล่าทอด",
  footerMessage: "ขอบคุณที่ใช้บริการ",
  logoDataUrl: "",
};

router.get("/settings", async (_req, res) => {
  const rows = await db.select().from(settingsTable);
  const settings = { ...DEFAULT_SETTINGS } as Record<string, string>;
  for (const row of rows) {
    settings[row.key] = row.value;
  }
  res.json(settings);
});

router.put("/settings", async (req, res) => {
  const entries = Object.entries(req.body as Record<string, string>);
  for (const [key, value] of entries) {
    await db.insert(settingsTable)
      .values({ key, value })
      .onConflictDoUpdate({ target: settingsTable.key, set: { value } });
  }
  const rows = await db.select().from(settingsTable);
  const settings = { ...DEFAULT_SETTINGS } as Record<string, string>;
  for (const row of rows) {
    settings[row.key] = row.value;
  }
  broadcast("settings:update", settings);
  res.json(settings);
});

export default router;
