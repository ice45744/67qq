import { useState, useEffect, useCallback } from 'react';
import { Category, MenuItem, Order, ShopSettings } from './types';

// Default Data Seed
const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-1', name: 'อาหารจานเดียว', sortOrder: 1 },
  { id: 'cat-2', name: 'กับข้าว', sortOrder: 2 },
  { id: 'cat-3', name: 'เครื่องดื่ม', sortOrder: 3 },
  { id: 'cat-4', name: 'ของหวาน', sortOrder: 4 },
];

const DEFAULT_MENU_ITEMS: MenuItem[] = [
  { id: 'menu-1', name: 'ผัดไทยกุ้งสด', price: 80, categoryId: 'cat-1', imageUrl: '/pad-thai.png', available: true },
  { id: 'menu-2', name: 'ข้าวกะเพราหมูกรอบไข่ดาว', price: 70, categoryId: 'cat-1', imageUrl: '/kra-pao.png', available: true },
  { id: 'menu-3', name: 'ต้มยำกุ้งน้ำข้น', price: 150, categoryId: 'cat-2', imageUrl: '/tom-yum.png', available: true },
  { id: 'menu-4', name: 'ส้มตำไทย', price: 50, categoryId: 'cat-2', imageUrl: '/som-tum.png', available: true },
  { id: 'menu-5', name: 'ชาไทยเย็น', price: 40, categoryId: 'cat-3', imageUrl: '/thai-tea.png', available: true },
  { id: 'menu-6', name: 'ข้าวเหนียวมะม่วง', price: 100, categoryId: 'cat-4', imageUrl: '/mango-sticky-rice.png', available: true },
];

const DEFAULT_SETTINGS: ShopSettings = {
  name: 'ร้านอร่อยเด็ด',
  address: '123 ถ.สุขุมวิท กรุงเทพฯ 10110',
  phone: '02-123-4567',
  taxId: '1234567890123',
  vatRate: 7,
  footerMessage: 'ขอบคุณที่ใช้บริการ โอกาสหน้าเชิญใหม่ค่ะ',
};

// Generic useLocalStorage Hook
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
      // Dispatch custom event for cross-tab sync if needed, though mostly single client here
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
    window.addEventListener('local-storage', handleStorageChange);
    return () => window.removeEventListener('local-storage', handleStorageChange);
  }, [key]);

  return [storedValue, setValue] as const;
}

// Domain Hooks
export function useCategories() {
  const [categories, setCategories] = useLocalStorage<Category[]>('pos_categories', DEFAULT_CATEGORIES);
  
  const addCategory = (cat: Category) => setCategories(prev => [...prev, cat].sort((a,b) => a.sortOrder - b.sortOrder));
  const updateCategory = (cat: Category) => setCategories(prev => prev.map(c => c.id === cat.id ? cat : c).sort((a,b) => a.sortOrder - b.sortOrder));
  const deleteCategory = (id: string) => setCategories(prev => prev.filter(c => c.id !== id));

  return { categories, addCategory, updateCategory, deleteCategory };
}

export function useMenu() {
  const [menuItems, setMenuItems] = useLocalStorage<MenuItem[]>('pos_menu_items', DEFAULT_MENU_ITEMS);

  const addMenuItem = (item: MenuItem) => setMenuItems(prev => [...prev, item]);
  const updateMenuItem = (item: MenuItem) => setMenuItems(prev => prev.map(m => m.id === item.id ? item : m));
  const deleteMenuItem = (id: string) => setMenuItems(prev => prev.filter(m => m.id !== id));

  return { menuItems, addMenuItem, updateMenuItem, deleteMenuItem };
}

export function useOrders() {
  const [orders, setOrders] = useLocalStorage<Order[]>('pos_orders', []);

  const addOrder = (order: Order) => setOrders(prev => [order, ...prev]);
  const updateOrder = (order: Order) => setOrders(prev => prev.map(o => o.id === order.id ? order : o));

  return { orders, addOrder, updateOrder };
}

export function useSettings() {
  const [settings, setSettings] = useLocalStorage<ShopSettings>('pos_settings', DEFAULT_SETTINGS);
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
