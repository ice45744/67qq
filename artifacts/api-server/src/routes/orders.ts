import { Router } from "express";
import { eq, sql } from "drizzle-orm";
import { db, ordersTable, settingsTable, menuItemsTable } from "@workspace/db";
import { broadcast } from "../lib/sse.js";

const router = Router();

router.get("/orders", async (_req, res) => {
  const rows = await db.select().from(ordersTable).orderBy(sql`${ordersTable.createdAt} desc`);
  res.json(rows);
});

router.post("/orders", async (req, res) => {
  const { id, queueNumber, items, total, status, tableNote, source } = req.body;
  const [row] = await db.insert(ordersTable)
    .values({ id, queueNumber, items, total, status: status ?? "pending", tableNote, source: source ?? "staff" })
    .returning();
  broadcast("orders:new", row);

  // Decrement stock for each item ordered — if stock hits 0, mark unavailable
  if (Array.isArray(items)) {
    for (const item of items) {
      const [menuItem] = await db.select().from(menuItemsTable).where(eq(menuItemsTable.id, item.menuItemId));
      if (!menuItem || menuItem.stock === null || menuItem.stock === undefined) continue;
      const newStock = Math.max(0, menuItem.stock - item.qty);
      const [updated] = await db.update(menuItemsTable)
        .set({ stock: newStock, available: newStock > 0 ? menuItem.available : false })
        .where(eq(menuItemsTable.id, item.menuItemId))
        .returning();
      broadcast("menu:update", updated);
    }
  }

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
  const resetRow = await db.select().from(settingsTable).where(eq(settingsTable.key, "queueResetAt"));
  const resetAt = resetRow[0]?.value ?? null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const since = resetAt && new Date(resetAt) > today ? resetAt : today.toISOString();
  const rows = await db.select().from(ordersTable)
    .where(sql`${ordersTable.createdAt} >= ${since}`);
  const maxQueue = rows.reduce((m, o) => Math.max(m, o.queueNumber), 0);
  res.json({ count: rows.length, maxQueue });
});

router.post("/orders/reset-queue", async (_req, res) => {
  const now = new Date().toISOString();
  await db.insert(settingsTable)
    .values({ key: "queueResetAt", value: now })
    .onConflictDoUpdate({ target: settingsTable.key, set: { value: now } });
  broadcast("queue:update", { maxQueue: 0 });
  res.json({ ok: true, resetAt: now });
});

export default router;
