import { Router } from "express";
import { eq, sql } from "drizzle-orm";
import { db, ordersTable } from "@workspace/db";
import { broadcast } from "../lib/sse.js";

const router = Router();

router.get("/orders", async (_req, res) => {
  const rows = await db.select().from(ordersTable).orderBy(sql`${ordersTable.createdAt} desc`);
  res.json(rows);
});

router.post("/orders", async (req, res) => {
  const { id, queueNumber, items, total, status, tableNote } = req.body;
  const [row] = await db.insert(ordersTable)
    .values({ id, queueNumber, items, total, status: status ?? "pending", tableNote })
    .returning();
  broadcast("orders:new", row);
  // Notify queue counter watchers
  const today2 = new Date(); today2.setHours(0, 0, 0, 0);
  const allToday = await db.select().from(ordersTable)
    .where(sql`${ordersTable.createdAt} >= ${today2.toISOString()}`);
  const newMax = allToday.reduce((m, o) => Math.max(m, o.queueNumber), 0);
  broadcast("queue:update", { maxQueue: newMax });
  res.json(row);
});

router.put("/orders/:id", async (req, res) => {
  const { status, items, total, tableNote } = req.body;
  const updateData: Record<string, unknown> = {};
  if (status !== undefined) updateData.status = status;
  if (items !== undefined) updateData.items = items;
  if (total !== undefined) updateData.total = total;
  if (tableNote !== undefined) updateData.tableNote = tableNote;

  const [row] = await db.update(ordersTable)
    .set(updateData)
    .where(eq(ordersTable.id, req.params.id))
    .returning();
  broadcast("orders:update", row);
  res.json(row);
});

router.get("/orders/today-count", async (_req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const rows = await db.select().from(ordersTable)
    .where(sql`${ordersTable.createdAt} >= ${today.toISOString()}`);
  const maxQueue = rows.reduce((m, o) => Math.max(m, o.queueNumber), 0);
  res.json({ count: rows.length, maxQueue });
});

export default router;
