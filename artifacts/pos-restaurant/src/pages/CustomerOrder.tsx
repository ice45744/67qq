import { useState, useMemo, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus, ShoppingBag, X, CheckCircle2, ChefHat, UtensilsCrossed, Trash2 } from "lucide-react";
import { useCategories, useMenu, useNextQueue, useSettings, CartItem, MenuItem, formatCurrency } from "@/lib/store";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

// ── Types ────────────────────────────────────────────────────────────────────
type Screen = "menu" | "cart" | "success";

// ── Main page ────────────────────────────────────────────────────────────────
export default function CustomerOrder() {
  const { categories } = useCategories();
  const { menuItems } = useMenu();
  const { settings } = useSettings();
  const { nextQueueNumber } = useNextQueue();

  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [screen, setScreen] = useState<Screen>("menu");
  const [queueNum, setQueueNum] = useState<number | null>(null);
  const [placing, setPlacing] = useState(false);
  const [tableNote, setTableNote] = useState("");

  const sortedCategories = useMemo(
    () => [...categories].sort((a, b) => a.sortOrder - b.sortOrder),
    [categories]
  );

  const availableMenu = useMemo(
    () => menuItems.filter(m => m.available),
    [menuItems]
  );

  const filteredMenu = useMemo(() => {
    if (activeCategory === "all") return availableMenu;
    return availableMenu.filter(m => m.categoryId === activeCategory);
  }, [availableMenu, activeCategory]);

  const total = useMemo(
    () => cart.reduce((s, i) => s + i.price * i.qty, 0),
    [cart]
  );
  const totalQty = useMemo(
    () => cart.reduce((s, i) => s + i.qty, 0),
    [cart]
  );

  const getQty = useCallback(
    (itemId: string) => cart.find(i => i.menuItemId === itemId)?.qty ?? 0,
    [cart]
  );

  const setQty = useCallback((item: MenuItem, delta: number) => {
    setCart(prev => {
      const exists = prev.find(i => i.menuItemId === item.id);
      if (!exists && delta > 0) {
        return [...prev, { menuItemId: item.id, name: item.name, price: item.price, qty: 1 }];
      }
      const next = prev
        .map(i => i.menuItemId === item.id ? { ...i, qty: i.qty + delta } : i)
        .filter(i => i.qty > 0);
      return next;
    });
  }, []);

  const removeItem = useCallback((id: string) => {
    setCart(prev => prev.filter(i => i.menuItemId !== id));
  }, []);

  const handlePlaceOrder = async () => {
    if (cart.length === 0 || placing) return;
    setPlacing(true);
    try {
      const queueNumber = await nextQueueNumber();
      await api.orders.create({
        id: crypto.randomUUID(),
        queueNumber,
        createdAt: new Date().toISOString(),
        items: [...cart],
        total,
        status: "pending",
        source: "customer",
        tableNote: tableNote.trim() || undefined,
      });
      setQueueNum(queueNumber);
      setCart([]);
      setTableNote("");
      setScreen("success");
    } finally {
      setPlacing(false);
    }
  };

  // ── Success screen ─────────────────────────────────────────────────────────
  if (screen === "success") {
    return (
      <div className="min-h-svh bg-gradient-to-br from-green-50 to-emerald-100 flex flex-col items-center justify-center p-6 text-center">
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 22 }}
          className="flex flex-col items-center gap-5"
        >
          <div className="size-28 rounded-full bg-green-500 flex items-center justify-center shadow-xl shadow-green-300">
            <CheckCircle2 className="size-16 text-white" />
          </div>
          <div>
            <p className="text-green-700 font-semibold text-lg">ส่งออเดอร์แล้ว!</p>
            <p className="text-green-900 font-black text-6xl mt-1">#{queueNum}</p>
            <p className="text-green-600 mt-2 text-sm">หมายเลขคิวของคุณ</p>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-md w-full max-w-xs text-left space-y-1">
            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide mb-2">กรุณารอสักครู่</p>
            <div className="flex items-center gap-3 text-sm text-foreground">
              <ChefHat className="size-4 text-orange-500 shrink-0" />
              ครัวกำลังทำอาหารให้คุณ
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <CheckCircle2 className="size-4 text-green-500 shrink-0" />
              พนักงานจะนำอาหารมาส่งให้
            </div>
          </div>
          <button
            onClick={() => setScreen("menu")}
            className="mt-2 w-full max-w-xs h-14 rounded-2xl bg-green-500 text-white font-bold text-base shadow-lg active:scale-95 transition-transform"
          >
            สั่งเพิ่มอีก
          </button>
        </motion.div>
      </div>
    );
  }

  // ── Cart screen ────────────────────────────────────────────────────────────
  if (screen === "cart") {
    return (
      <div className="min-h-svh bg-background flex flex-col">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background border-b px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => setScreen("menu")}
            className="size-10 rounded-full bg-muted flex items-center justify-center active:bg-muted/70"
          >
            <X className="size-5" />
          </button>
          <h1 className="font-bold text-lg flex-1">ตะกร้า ({totalQty} รายการ)</h1>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-36">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
              <ShoppingBag className="size-12 opacity-20" />
              <p>ยังไม่มีรายการ</p>
            </div>
          ) : cart.map(item => (
            <motion.div
              key={item.menuItemId}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-card border rounded-2xl p-4 flex items-center gap-3"
            >
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{item.name}</p>
                <p className="text-primary font-bold">{formatCurrency(item.price)}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setQty({ id: item.menuItemId, name: item.name, price: item.price, categoryId: "", available: true }, -1)}
                  className="size-9 rounded-full bg-muted flex items-center justify-center active:scale-90 transition-transform"
                >
                  {item.qty === 1 ? <Trash2 className="size-4 text-red-400" /> : <Minus className="size-4" />}
                </button>
                <span className="w-7 text-center font-bold text-lg">{item.qty}</span>
                <button
                  onClick={() => setQty({ id: item.menuItemId, name: item.name, price: item.price, categoryId: "", available: true }, +1)}
                  className="size-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center active:scale-90 transition-transform"
                >
                  <Plus className="size-4" />
                </button>
              </div>
            </motion.div>
          ))}

          {/* Note */}
          {cart.length > 0 && (
            <div className="bg-card border rounded-2xl p-4">
              <label className="text-sm font-semibold text-muted-foreground block mb-2">หมายเหตุ (ไม่บังคับ)</label>
              <textarea
                rows={2}
                placeholder="เช่น ไม่เผ็ด, ไม่ใส่ผัก..."
                value={tableNote}
                onChange={e => setTableNote(e.target.value)}
                className="w-full text-sm bg-muted/40 rounded-xl px-3 py-2 resize-none outline-none focus:ring-2 ring-primary"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4">
            <div className="flex justify-between items-center mb-3">
              <span className="text-muted-foreground font-medium">ยอดรวม</span>
              <span className="font-black text-2xl text-primary">{formatCurrency(total)}</span>
            </div>
            <button
              disabled={placing}
              onClick={handlePlaceOrder}
              className="w-full h-14 rounded-2xl bg-primary text-primary-foreground font-bold text-base shadow-lg shadow-primary/30 active:scale-[0.98] transition-transform disabled:opacity-60"
            >
              {placing ? "กำลังส่ง..." : "สั่งอาหาร"}
            </button>
          </div>
        )}
      </div>
    );
  }

  // ── Menu screen ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-svh bg-background flex flex-col">
      {/* Top header */}
      <div className="bg-primary text-primary-foreground px-4 pt-10 pb-5">
        <p className="text-primary-foreground/70 text-sm">ยินดีต้อนรับสู่</p>
        <h1 className="text-2xl font-black">{settings.name}</h1>
        <p className="text-primary-foreground/70 text-xs mt-0.5">สั่งอาหารได้เลย · ไม่ต้องรอพนักงาน</p>
      </div>

      {/* Category tabs */}
      <div className="sticky top-0 z-10 bg-background border-b shadow-sm">
        <div className="flex gap-2 px-4 py-2 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveCategory("all")}
            className={cn(
              "shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold transition-all",
              activeCategory === "all"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            )}
          >
            ทั้งหมด
          </button>
          {sortedCategories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                "shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold transition-all",
                activeCategory === cat.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Menu grid */}
      <div className="flex-1 overflow-y-auto p-4 pb-32">
        {filteredMenu.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
            <UtensilsCrossed className="size-12 opacity-20" />
            <p>ไม่มีเมนูในหมวดนี้</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filteredMenu.map(item => {
              const qty = getQty(item.id);
              return (
                <motion.div
                  key={item.id}
                  layout
                  className="bg-card border rounded-2xl overflow-hidden shadow-sm flex flex-col"
                >
                  {/* Image */}
                  <div className="aspect-[4/3] bg-muted relative overflow-hidden">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        <UtensilsCrossed className="size-8 opacity-20" />
                      </div>
                    )}
                    {qty > 0 && (
                      <div className="absolute top-2 right-2 size-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-black shadow">
                        {qty}
                      </div>
                    )}
                  </div>

                  {/* Info + controls */}
                  <div className="p-3 flex-1 flex flex-col gap-2">
                    <div className="flex-1">
                      <p className="font-bold text-sm leading-tight line-clamp-2">{item.name}</p>
                      {item.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{item.description}</p>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-black text-primary">{item.price}.-</span>
                      {qty === 0 ? (
                        <button
                          onClick={() => setQty(item, +1)}
                          className="size-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center active:scale-90 transition-transform shadow"
                        >
                          <Plus className="size-4" />
                        </button>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setQty(item, -1)}
                            className="size-7 rounded-full bg-muted flex items-center justify-center active:scale-90 transition-transform"
                          >
                            <Minus className="size-3.5" />
                          </button>
                          <span className="w-5 text-center font-bold text-sm">{qty}</span>
                          <button
                            onClick={() => setQty(item, +1)}
                            className="size-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center active:scale-90 transition-transform"
                          >
                            <Plus className="size-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating cart button */}
      <AnimatePresence>
        {totalQty > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 34 }}
            className="fixed bottom-6 left-4 right-4 z-50"
          >
            <button
              onClick={() => setScreen("cart")}
              className="w-full h-16 rounded-2xl bg-primary text-primary-foreground shadow-2xl shadow-primary/40 flex items-center justify-between px-5 active:scale-[0.98] transition-transform"
            >
              <div className="size-9 rounded-xl bg-white/20 flex items-center justify-center font-black text-lg">
                {totalQty}
              </div>
              <span className="font-bold text-base">ดูตะกร้า</span>
              <span className="font-black text-lg">{formatCurrency(total)}</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
