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
  queueNumber: number;
  createdAt: string;
  items: CartItem[];
  total: number;
  status: 'paid' | 'voided';
};

export type ShopSettings = {
  name: string;
  footerMessage: string;
  logoDataUrl?: string;
};
