import { pgTable, text, integer, boolean, jsonb, timestamp, real } from "drizzle-orm/pg-core";

export type OrderItem = {
  menuItemId: string;
  name: string;
  price: number;
  qty: number;
  note?: string;
};

export const categoriesTable = pgTable("categories", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const menuItemsTable = pgTable("menu_items", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  price: real("price").notNull(),
  categoryId: text("category_id").notNull(),
  description: text("description"),
  imageUrl: text("image_url"),
  available: boolean("available").notNull().default(true),
  stock: integer("stock"),
});

export const ordersTable = pgTable("orders", {
  id: text("id").primaryKey(),
  queueNumber: integer("queue_number").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  items: jsonb("items").notNull().$type<OrderItem[]>(),
  total: real("total").notNull(),
  status: text("status").notNull().default("pending"),
  tableNote: text("table_note"),
  source: text("source").notNull().default("staff"),
});

export const settingsTable = pgTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

export type Category = typeof categoriesTable.$inferSelect;
export type MenuItem = typeof menuItemsTable.$inferSelect;
export type Order = typeof ordersTable.$inferSelect;
export type Setting = typeof settingsTable.$inferSelect;
