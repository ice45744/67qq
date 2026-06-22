import { useState, useMemo, useRef, memo, useCallback } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus, X, ShoppingBag, Receipt, Printer, UtensilsCrossed, CheckCircle2, ChefHat } from "lucide-react";
import { useCategories, useMenu, useNextQueue, useSettings, CartItem, Order, formatCurrency } from "@/lib/store";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ReceiptPrintable } from "@/components/ReceiptPrintable";

// ---------- CartContent as a stable component (outside Home) ----------
interface CartContentProps {
  cart: CartItem[];
  nextQueue: number;
  total: number;
  onUpdateQty: (id: string, delta: number) => void;
  onRemoveItem: (id: string) => void;
  onCheckout: () => void;
}

const CartContent = memo(function CartContent({
  cart,
  nextQueue,
  total,
  onUpdateQty,
  onRemoveItem,
  onCheckout,
}: CartContentProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b flex items-center justify-between">
        <h2 className="font-bold text-lg flex items-center gap-2">
          <ShoppingBag className="size-5 text-primary" />
          รายการออเดอร์
        </h2>
        <div className="text-xs text-muted-foreground">
          คิวถัดไป <span className="font-bold text-foreground text-base">#{nextQueue}</span>
        </div>
      </div>

      <ScrollArea className="flex-1 p-2">
        <AnimatePresence>
          {cart.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full flex flex-col items-center justify-center text-muted-foreground p-8 text-center"
            >
              <div className="size-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Receipt className="size-8 opacity-50" />
              </div>
              <p>ยังไม่มีรายการอาหาร</p>
              <p className="text-sm opacity-70 mt-1">แตะที่เมนูเพื่อเพิ่มรายการ</p>
            </motion.div>
          ) : (
            <div className="space-y-2 p-2">
              {cart.map(item => (
                <motion.div
                  key={item.menuItemId}
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.15 }}
                  className="bg-card border rounded-xl p-3 shadow-sm"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-medium pr-2 line-clamp-2 leading-tight">{item.name}</span>
                    <span className="font-medium shrink-0">{formatCurrency(item.price * item.qty)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => onRemoveItem(item.menuItemId)}
                    >
                      <X className="size-4" />
                    </Button>
                    <div className="flex items-center bg-muted rounded-lg p-0.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 rounded-md"
                        onClick={() => onUpdateQty(item.menuItemId, -1)}
                      >
                        <Minus className="size-3" />
                      </Button>
                      <span className="w-8 text-center font-medium">{item.qty}</span>
                      <Button
                        variant="secondary"
                        size="icon"
                        className="h-7 w-7 rounded-md bg-background shadow-sm"
                        onClick={() => onUpdateQty(item.menuItemId, 1)}
                      >
                        <Plus className="size-3" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>
      </ScrollArea>

      <div className="p-4 border-t bg-card mt-auto space-y-4">
        <div className="rounded-xl bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
          รับออเดอร์ <span className="font-semibold text-foreground">กลับบ้าน</span> · ชำระ <span className="font-semibold text-foreground">เงินสด</span>
        </div>
        <div className="flex justify-between text-2xl font-bold">
          <span>ยอดสุทธิ</span>
          <span className="text-primary">{formatCurrency(total)}</span>
        </div>
        <button
          style={{ touchAction: "manipulation" }}
          disabled={cart.length === 0}
          onClick={onCheckout}
          className="w-full h-[72px] rounded-2xl text-xl font-black bg-primary text-primary-foreground shadow-lg shadow-primary/30 flex items-center justify-center gap-2 active:scale-[0.97] transition-transform duration-100 disabled:opacity-40 disabled:pointer-events-none"
        >
          <ChefHat className="size-6" />
          ส่งออเดอร์ไปครัว
        </button>
      </div>
    </div>
  );
});

// ---------- Home page ----------
export default function Home() {
  const { categories } = useCategories();
  const { menuItems } = useMenu();
  const { nextQueue, nextQueueNumber } = useNextQueue();
  const { settings } = useSettings();

  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);
  const [printingOrder, setPrintingOrder] = useState<Order | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const filteredMenu = useMemo(() => {
    const items = menuItems.filter(m => m.available);
    if (activeCategory === "all") return items;
    return items.filter(m => m.categoryId === activeCategory);
  }, [menuItems, activeCategory]);

  const total = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.qty, 0),
    [cart]
  );

  const addToCart = useCallback((item: { id: string; name: string; price: number }) => {
    setCart(prev => {
      const existing = prev.find(i => i.menuItemId === item.id);
      if (existing) {
        return prev.map(i => i.menuItemId === item.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { menuItemId: item.id, name: item.name, price: item.price, qty: 1 }];
    });
  }, []);

  const updateQty = useCallback((id: string, delta: number) => {
    setCart(prev =>
      prev
        .map(i => i.menuItemId === id ? { ...i, qty: i.qty + delta } : i)
        .filter(i => i.qty > 0)
    );
  }, []);

  const removeItem = useCallback((id: string) => {
    setCart(prev => prev.filter(i => i.menuItemId !== id));
  }, []);

  const handleCheckout = useCallback(async () => {
    if (cart.length === 0) return;
    const queueNumber = await nextQueueNumber();
    const newOrder = await api.orders.create({
      id: crypto.randomUUID(),
      queueNumber,
      createdAt: new Date().toISOString(),
      items: [...cart],
      total,
      status: "pending",
    });
    setCart([]);
    setIsMobileCartOpen(false);
    setTimeout(() => setConfirmedOrder(newOrder), 320);
  }, [cart, total, nextQueueNumber]);

  const handlePrint = useCallback(() => {
    if (!confirmedOrder) return;
    setPrintingOrder(confirmedOrder);
    setConfirmedOrder(null);
    setTimeout(() => {
      window.print();
      setTimeout(() => setPrintingOrder(null), 600);
    }, 150);
  }, [confirmedOrder]);

  const handleCloseConfirm = useCallback(() => setConfirmedOrder(null), []);

  const sortedCategories = useMemo(
    () => [...categories].sort((a, b) => a.sortOrder - b.sortOrder),
    [categories]
  );

  return (
    <div className="flex h-full w-full pb-[84px] md:pb-0">
      <div className="flex-1 flex flex-col min-w-0 bg-muted/30">
        {/* Category bar */}
        <div className="p-4 bg-card/80 backdrop-blur-md sticky top-0 z-10 border-b shadow-sm">
          <ScrollArea className="w-full whitespace-nowrap">
            <div className="flex w-max space-x-2 pb-2">
              <Button
                variant={activeCategory === "all" ? "default" : "secondary"}
                className="rounded-full px-6 font-medium"
                onClick={() => setActiveCategory("all")}
              >
                ทั้งหมด
              </Button>
              {sortedCategories.map(cat => (
                <Button
                  key={cat.id}
                  variant={activeCategory === cat.id ? "default" : "secondary"}
                  className="rounded-full px-6 font-medium bg-white"
                  onClick={() => setActiveCategory(cat.id)}
                >
                  {cat.name}
                </Button>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Menu grid */}
        <ScrollArea className="flex-1 p-4 lg:p-6">
          {menuItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="size-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <UtensilsCrossed className="size-10 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">ยังไม่มีเมนูในร้าน</h3>
              <p className="text-muted-foreground mb-6 max-w-xs">
                เริ่มต้นด้วยการเพิ่มหมวดหมู่และเมนูอาหารของคุณเอง
              </p>
              <Link href="/menu">
                <Button size="lg" className="font-bold active-elevate shadow-md">
                  <Plus className="mr-2 size-5" /> ไปจัดการเมนู
                </Button>
              </Link>
            </div>
          ) : filteredMenu.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center text-muted-foreground">
              <UtensilsCrossed className="size-10 opacity-30 mb-3" />
              <p>ไม่มีเมนูในหมวดนี้</p>
            </div>
          ) : null}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 lg:gap-4 pb-20">
            {filteredMenu.map(item => (
              <motion.div
                key={item.id}
                whileTap={{ scale: 0.96 }}
                onClick={() => addToCart(item)}
                className="bg-card rounded-2xl overflow-hidden border shadow-sm cursor-pointer hover:shadow-md transition-all group flex flex-col"
              >
                <div className="aspect-[4/3] bg-muted relative overflow-hidden">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      <UtensilsCrossed className="size-8 opacity-20" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute bottom-2 right-2 bg-primary text-primary-foreground font-bold px-2 py-1 rounded-lg shadow-sm">
                    {item.price}.-
                  </div>
                </div>
                <div className="p-3 flex-1 flex flex-col">
                  <h3 className="font-bold leading-tight line-clamp-2 text-sm lg:text-base">{item.name}</h3>
                </div>
              </motion.div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Desktop cart */}
      <div className="hidden md:block w-80 lg:w-96 border-l bg-card shadow-xl z-20 flex-shrink-0">
        <CartContent
          cart={cart}
          nextQueue={nextQueue}
          total={total}
          onUpdateQty={updateQty}
          onRemoveItem={removeItem}
          onCheckout={handleCheckout}
        />
      </div>

      {/* Mobile floating cart button */}
      <div className="md:hidden fixed bottom-[84px] left-0 right-0 p-3 z-40">
        <button
          style={{ touchAction: "manipulation" }}
          onClick={() => setIsMobileCartOpen(true)}
          className="w-full h-14 rounded-2xl shadow-xl bg-primary text-primary-foreground flex justify-between items-center px-6 active:scale-[0.97] transition-transform duration-100"
        >
          <div className="flex items-center gap-3">
            <div className="bg-white/20 rounded-full size-8 flex items-center justify-center">
              <span className="font-bold text-sm">{cart.reduce((s, i) => s + i.qty, 0)}</span>
            </div>
            <span className="font-semibold text-base">ดูออเดอร์</span>
          </div>
          <span className="font-bold text-lg">{formatCurrency(total)}</span>
        </button>
      </div>

      {/* Mobile cart drawer — Framer Motion (no Radix overhead) */}
      <AnimatePresence>
        {isMobileCartOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="cart-backdrop"
              className="md:hidden fixed inset-0 bg-black/40 z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={() => setIsMobileCartOpen(false)}
            />
            {/* Drawer panel — sits above the 84px tab bar */}
            <motion.div
              key="cart-drawer"
              className="md:hidden fixed left-0 right-0 z-[60] bg-card rounded-t-3xl shadow-2xl flex flex-col"
              style={{ bottom: 84, height: "calc(90svh - 84px)" }}
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 380, damping: 38, mass: 0.8 }}
            >
              {/* Drag handle */}
              <button
                style={{ touchAction: "manipulation" }}
                onClick={() => setIsMobileCartOpen(false)}
                className="flex justify-center pt-3 pb-1 w-full"
              >
                <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
              </button>
              <CartContent
                cart={cart}
                nextQueue={nextQueue}
                total={total}
                onUpdateQty={updateQty}
                onRemoveItem={removeItem}
                onCheckout={handleCheckout}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Order confirmed dialog */}
      <Dialog open={!!confirmedOrder} onOpenChange={(v) => { if (!v) handleCloseConfirm(); }}>
        <DialogContent className="max-w-sm w-[92vw] p-0 rounded-2xl overflow-hidden">
          <div className="bg-green-50 px-6 pt-6 pb-4 text-center">
            <div className="size-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="size-9 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-green-800">ส่งออเดอร์แล้ว!</h2>
            <p className="text-green-700 text-sm mt-1">
              คิว <span className="font-black text-3xl text-green-600">#{confirmedOrder?.queueNumber}</span>
            </p>
            <p className="text-green-600 text-xs mt-2">ห้องครัวจะเห็นออเดอร์นี้ทันที</p>
          </div>

          {confirmedOrder && (
            <div className="px-5 py-3 space-y-1.5 border-b">
              {confirmedOrder.items.map((item, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{item.name} <span className="font-semibold text-foreground">x{item.qty}</span></span>
                  <span className="font-medium">{formatCurrency(item.price * item.qty)}</span>
                </div>
              ))}
              <div className="flex justify-between font-bold text-base pt-1 border-t mt-2">
                <span>ยอดรวม</span>
                <span className="text-primary">{formatCurrency(confirmedOrder.total)}</span>
              </div>
            </div>
          )}

          <div className="flex gap-3 px-5 py-4">
            <Button variant="outline" className="flex-1 h-11" onClick={handleCloseConfirm}>
              ปิด
            </Button>
            <Button className="flex-1 h-11 gap-2" onClick={handlePrint}>
              <Printer className="size-4" />
              พิมพ์ใบเสร็จ
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Hidden receipt for printing */}
      {printingOrder && (
        <ReceiptPrintable ref={printRef} order={printingOrder} settings={settings} />
      )}
    </div>
  );
}
