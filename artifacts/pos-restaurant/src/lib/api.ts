const BASE = "/api";

export type Category = {
  id: string;
  name: string;
  sortOrder: number;
};

export type MenuItem = {
  id: string;
  name: string;
  price: number;
  categoryId: string;
  description?: string | null;
  imageUrl?: string | null;
  available: boolean;
};

export type CartItem = {
  menuItemId: string;
  name: string;
  price: number;
  qty: number;
  note?: string;
};

export type OrderStatus = "pending" | "cooking" | "ready" | "paid" | "voided";

export type Order = {
  id: string;
  queueNumber: number;
  createdAt: string;
  items: CartItem[];
  total: number;
  status: OrderStatus;
  tableNote?: string | null;
};

export type ShopSettings = {
  name: string;
  footerMessage: string;
  logoDataUrl?: string;
};

async function req<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) throw new Error(`API ${path} failed: ${res.status}`);
  return res.json();
}

export const api = {
  categories: {
    list: () => req<Category[]>("/categories"),
    create: (data: Category) => req<Category>("/categories", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Category>) => req<Category>(`/categories/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id: string) => req<{ ok: boolean }>(`/categories/${id}`, { method: "DELETE" }),
  },
  menu: {
    list: () => req<MenuItem[]>("/menu"),
    create: (data: MenuItem) => req<MenuItem>("/menu", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: Partial<MenuItem>) => req<MenuItem>(`/menu/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id: string) => req<{ ok: boolean }>(`/menu/${id}`, { method: "DELETE" }),
  },
  orders: {
    list: () => req<Order[]>("/orders"),
    create: (data: Omit<Order, "createdAt"> & { createdAt?: string }) => req<Order>("/orders", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Order>) => req<Order>(`/orders/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    todayCount: () => req<{ count: number; maxQueue: number }>("/orders/today-count"),
  },
  settings: {
    get: () => req<ShopSettings>("/settings"),
    update: (data: Partial<ShopSettings>) => req<ShopSettings>("/settings", { method: "PUT", body: JSON.stringify(data) }),
  },
};
