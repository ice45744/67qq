import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, menuItemsTable } from "@workspace/db";
import { broadcast } from "../lib/sse.js";

const router = Router();

router.get("/menu", async (_req, res) => {
  const rows = await db.select().from(menuItemsTable);
  res.json(rows);
});

router.post("/menu", async (req, res) => {
  const { id, name, price, categoryId, description, imageUrl, available } = req.body;
  const [row] = await db.insert(menuItemsTable)
    .values({ id, name, price, categoryId, description, imageUrl, available: available ?? true })
    .returning();
  broadcast("menu:update", row);
  res.json(row);
});

router.put("/menu/:id", async (req, res) => {
  const { name, price, categoryId, description, imageUrl, available } = req.body;
  const [row] = await db.update(menuItemsTable)
    .set({ name, price, categoryId, description, imageUrl, available })
    .where(eq(menuItemsTable.id, req.params.id))
    .returning();
  broadcast("menu:update", row);
  res.json(row);
});

router.delete("/menu/:id", async (req, res) => {
  await db.delete(menuItemsTable).where(eq(menuItemsTable.id, req.params.id));
  broadcast("menu:delete", { id: req.params.id });
  res.json({ ok: true });
});

export default router;
