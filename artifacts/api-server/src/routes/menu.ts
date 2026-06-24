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
  const { id, name, price, categoryId, description, imageUrl, available, stock } = req.body;
  const [row] = await db.insert(menuItemsTable)
    .values({ id, name, price, categoryId, description, imageUrl, available: available ?? true, stock: stock ?? null })
    .returning();
  broadcast("menu:update", row);
  res.json(row);
});

router.put("/menu/:id", async (req, res) => {
  const { name, price, categoryId, description, imageUrl, available, stock } = req.body;
  const updateData: Record<string, unknown> = {};
  if (name !== undefined) updateData.name = name;
  if (price !== undefined) updateData.price = price;
  if (categoryId !== undefined) updateData.categoryId = categoryId;
  if (description !== undefined) updateData.description = description;
  if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
  if (available !== undefined) updateData.available = available;
  if (stock !== undefined) updateData.stock = stock === null ? null : Number(stock);

  const [row] = await db.update(menuItemsTable)
    .set(updateData)
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
