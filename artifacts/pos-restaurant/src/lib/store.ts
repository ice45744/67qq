import { useState, useEffect } from 'react';
import { Category, MenuItem, Order, ShopSettings } from './types';

export type { Category, MenuItem, CartItem, Order, ShopSettings } from './types';

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-menu', name: 'เมนู', sortOrder: 1 },
  { id: 'cat-topping', name: 'ท็อปปิ้ง', sortOrder: 2 },
];

const DEFAULT_MENU_ITEMS: MenuItem[] = [];

const DEFAULT_SETTINGS: ShopSettings = {
  name: 'ร้านของฉัน',
  footerMessage: 'ขอบคุณที่ใช้บริการ',
};

function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
      window.dispatchEvent(new Event('local-storage'));
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    const handleStorageChange = () => {
      try {
        const item = window.localStorage.getItem(key);
        if (item) setStoredValue(JSON.parse(item));
      } catch (error) {
        console.error(error);
      }
    };
    // same-tab updates
    window.addEventListener('local-storage', handleStorageChange);
    // cross-tab updates (native storage event fires in OTHER tabs)
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('local-storage', handleStorageChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [key]);

  return [storedValue, setValue] as const;
}

export function useCategories() {
  const [categories, setCategories] = useLocalStorage<Category[]>('pos_categories_v3', DEFAULT_CATEGORIES);
  const addCategory = (cat: Category) => setCategories(prev => [...prev, cat].sort((a,b) => a.sortOrder - b.sortOrder));
  const updateCategory = (cat: Category) => setCategories(prev => prev.map(c => c.id === cat.id ? cat : c).sort((a,b) => a.sortOrder - b.sortOrder));
  const deleteCategory = (id: string) => setCategories(prev => prev.filter(c => c.id !== id));
  return { categories, addCategory, updateCategory, deleteCategory };
}

export function useMenu() {
  const [menuItems, setMenuItems] = useLocalStorage<MenuItem[]>('pos_menu_items_v3', DEFAULT_MENU_ITEMS);
  const addMenuItem = (item: MenuItem) => setMenuItems(prev => [...prev, item]);
  const updateMenuItem = (item: MenuItem) => setMenuItems(prev => prev.map(m => m.id === item.id ? item : m));
  const deleteMenuItem = (id: string) => setMenuItems(prev => prev.filter(m => m.id !== id));
  return { menuItems, addMenuItem, updateMenuItem, deleteMenuItem };
}

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function useOrders() {
  const [orders, setOrders] = useLocalStorage<Order[]>('pos_orders_v2', []);

  const addOrder = (order: Order) => setOrders(prev => [order, ...prev]);
  const updateOrder = (order: Order) => setOrders(prev => prev.map(o => o.id === order.id ? order : o));
  const updateOrderStatus = (id: string, status: Order['status']) =>
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));

  const nextQueueNumber = () => {
    const today = todayKey();
    const todays = orders.filter(o => o.createdAt.slice(0, 10) === today);
    const max = todays.reduce((m, o) => Math.max(m, o.queueNumber || 0), 0);
    return max + 1;
  };

  return { orders, addOrder, updateOrder, updateOrderStatus, nextQueueNumber };
}

export function useSettings() {
  const [settings, setSettings] = useLocalStorage<ShopSettings>('pos_settings_v2', DEFAULT_SETTINGS);
  return { settings, setSettings };
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(amount);
}

export function formatDate(isoString: string) {
  return new Intl.DateTimeFormat('th-TH', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  }).format(new Date(isoString));
}
