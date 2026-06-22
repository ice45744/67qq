import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, categoriesTable } from "@workspace/db";
import { broadcast } from "../lib/sse.js";

const router = Router();

router.get("/categories", async (_req, res) => {
  const rows = await db.select().from(categoriesTable).orderBy(categoriesTable.sortOrder);
  res.json(rows);
});

router.post("/categories", async (req, res) => {
  const { id, name, sortOrder } = req.body;
  const [row] = await db.insert(categoriesTable).values({ id, name, sortOrder }).returning();
  broadcast("categories:update", row);
  res.json(row);
});

router.put("/categories/:id", async (req, res) => {
  const { name, sortOrder } = req.body;
  const [row] = await db.update(categoriesTable)
    .set({ name, sortOrder })
    .where(eq(categoriesTable.id, req.params.id))
    .returning();
  broadcast("categories:update", row);
  res.json(row);
});

router.delete("/categories/:id", async (req, res) => {
  await db.delete(categoriesTable).where(eq(categoriesTable.id, req.params.id));
  broadcast("categories:delete", { id: req.params.id });
  res.json({ ok: true });
});

export default router;
