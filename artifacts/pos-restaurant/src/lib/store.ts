import { useState, useEffect, useCallback, useRef } from "react";
import { api, Category, MenuItem, Order, ShopSettings, CartItem } from "./api";

export type { Category, MenuItem, CartItem, Order, ShopSettings } from "./api";

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB" }).format(amount);
}

export function formatDate(isoString: string) {
  return new Intl.DateTimeFormat("th-TH", {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  }).format(new Date(isoString));
}

function useSSE<T>(
  eventName: string,
  onEvent: (data: T) => void
) {
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    const es = new EventSource("/api/events");
    const handler = (e: MessageEvent) => {
      try {
        onEventRef.current(JSON.parse(e.data));
      } catch (_) {}
    };
    es.addEventListener(eventName, handler);
    return () => {
      es.removeEventListener(eventName, handler);
      es.close();
    };
  }, [eventName]);
}

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.categories.list().then(setCategories).finally(() => setLoading(false));
  }, []);

  useSSE<Category>("categories:update", (updated) => {
    setCategories(prev => {
      const exists = prev.find(c => c.id === updated.id);
      const next = exists
        ? prev.map(c => c.id === updated.id ? updated : c)
        : [...prev, updated];
      return next.sort((a, b) => a.sortOrder - b.sortOrder);
    });
  });

  useSSE<{ id: string }>("categories:delete", ({ id }) => {
    setCategories(prev => prev.filter(c => c.id !== id));
  });

  const addCategory = useCallback(async (cat: Category) => {
    await api.categories.create(cat);
  }, []);

  const updateCategory = useCallback(async (cat: Category) => {
    await api.categories.update(cat.id, cat);
  }, []);

  const deleteCategory = useCallback(async (id: string) => {
    await api.categories.delete(id);
  }, []);

  return { categories, loading, addCategory, updateCategory, deleteCategory };
}

export function useMenu() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.menu.list().then(setMenuItems).finally(() => setLoading(false));
  }, []);

  useSSE<MenuItem>("menu:update", (updated) => {
    setMenuItems(prev => {
      const exists = prev.find(m => m.id === updated.id);
      return exists ? prev.map(m => m.id === updated.id ? updated : m) : [...prev, updated];
    });
  });

  useSSE<{ id: string }>("menu:delete", ({ id }) => {
    setMenuItems(prev => prev.filter(m => m.id !== id));
  });

  const addMenuItem = useCallback(async (item: MenuItem) => {
    await api.menu.create(item);
  }, []);

  const updateMenuItem = useCallback(async (item: MenuItem) => {
    await api.menu.update(item.id, item);
  }, []);

  const deleteMenuItem = useCallback(async (id: string) => {
    await api.menu.delete(id);
  }, []);

  return { menuItems, loading, addMenuItem, updateMenuItem, deleteMenuItem };
}

export function useOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.orders.list().then(setOrders).finally(() => setLoading(false));
  }, []);

  useSSE<Order>("orders:new", (order) => {
    setOrders(prev => [order, ...prev]);
  });

  useSSE<Order>("orders:update", (updated) => {
    setOrders(prev => prev.map(o => o.id === updated.id ? updated : o));
  });

  const addOrder = useCallback(async (order: Omit<Order, "createdAt"> & { createdAt?: string }) => {
    return api.orders.create(order);
  }, []);

  const updateOrder = useCallback(async (order: Order) => {
    return api.orders.update(order.id, order);
  }, []);

  const updateOrderStatus = useCallback(async (id: string, status: Order["status"]) => {
    return api.orders.update(id, { status });
  }, []);

  const nextQueueNumber = useCallback(async (): Promise<number> => {
    const { maxQueue } = await api.orders.todayCount();
    return maxQueue + 1;
  }, []);

  return { orders, loading, addOrder, updateOrder, updateOrderStatus, nextQueueNumber };
}

export function useSettings() {
  const [settings, setSettings] = useState<ShopSettings>({
    name: "ร้านของฉัน",
    footerMessage: "ขอบคุณที่ใช้บริการ",
  });

  useEffect(() => {
    api.settings.get().then(setSettings);
  }, []);

  useSSE<ShopSettings>("settings:update", setSettings);

  const saveSettings = useCallback(async (data: Partial<ShopSettings>) => {
    const updated = await api.settings.update(data);
    setSettings(updated);
  }, []);

  return { settings, setSettings: saveSettings };
}
