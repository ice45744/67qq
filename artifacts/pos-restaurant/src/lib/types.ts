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
  description?: string;
  imageUrl?: string;
  available: boolean;
};

export type CartItem = {
  menuItemId: string;
  name: string;
  price: number;
  qty: number;
  note?: string;
};

export type Order = {
  id: string;
  orderNumber: string;
  createdAt: string;
  items: CartItem[];
  subtotal: number;
  vat: number;
  total: number;
  paymentMethod: 'cash' | 'transfer' | 'card';
  channel: 'dine-in' | 'takeaway' | 'delivery';
  tableNumber?: string;
  status: 'paid' | 'voided';
};

export type ShopSettings = {
  name: string;
  address: string;
  phone: string;
  taxId: string;
  vatRate: number;
  footerMessage: string;
  logoDataUrl?: string;
};
