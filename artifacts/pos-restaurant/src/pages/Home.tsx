import { useState, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus, X, ShoppingBag, Receipt, Printer } from "lucide-react";
import { useCategories, useMenu, useOrders, useSettings, CartItem, formatCurrency } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useToast } from "@/hooks/use-toast";
import { ReceiptPrintable } from "@/components/ReceiptPrintable";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function Home() {
  const { categories } = useCategories();
  const { menuItems } = useMenu();
  const { addOrder } = useOrders();
  const { settings } = useSettings();
  const { toast } = useToast();

  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [channel, setChannel] = useState<'dine-in' | 'takeaway' | 'delivery'>('dine-in');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer' | 'card'>('cash');
  const [tableNumber, setTableNumber] = useState("");
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);
  const [previewOrder, setPreviewOrder] = useState<any>(null);

  const printRef = useRef<HTMLDivElement>(null);

  const filteredMenu = useMemo(() => {
    const items = menuItems.filter(m => m.available);
    if (activeCategory === "all") return items;
    return items.filter(m => m.categoryId === activeCategory);
  }, [menuItems, activeCategory]);

  const addToCart = (item: any) => {
    setCart(prev => {
      const existing = prev.find(i => i.menuItemId === item.id);
      if (existing) {
        return prev.map(i => i.menuItemId === item.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { menuItemId: item.id, name: item.name, price: item.price, qty: 1 }];
    });
  };

  const updateQty = (id: string, delta: number) => {
    setCart(prev => prev.map(i => {
      if (i.menuItemId === id) {
        const newQty = i.qty + delta;
        return newQty > 0 ? { ...i, qty: newQty } : i;
      }
      return i;
    }));
  };

  const removeItem = (id: string) => {
    setCart(prev => prev.filter(i => i.menuItemId !== id));
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const vat = settings.vatRate > 0 ? Math.round((subtotal * settings.vatRate) / 100) : 0;
  const total = subtotal + vat;

  const handleCheckout = () => {
    if (cart.length === 0) return;

    const orderNumber = `ORD-${Date.now().toString().slice(-6)}`;
    const newOrder = {
      id: crypto.randomUUID(),
      orderNumber,
      createdAt: new Date().toISOString(),
      items: [...cart],
      subtotal,
      vat,
      total,
      paymentMethod,
      channel,
      tableNumber: channel === 'dine-in' ? tableNumber : undefined,
      status: 'paid' as const
    };

    addOrder(newOrder);
    setPreviewOrder(newOrder);
    
    // Clear cart immediately for next customer
    setCart([]);
    setTableNumber("");
    setIsMobileCartOpen(false);

    toast({
      title: "ชำระเงินสำเร็จ",
      description: `ออเดอร์ ${orderNumber} ถูกบันทึกแล้ว`,
    });

    // Give state a moment to update DOM, then print
    setTimeout(() => {
      window.print();
      setPreviewOrder(null);
    }, 100);
  };

  const CartContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <h2 className="font-bold text-lg flex items-center gap-2">
          <ShoppingBag className="size-5 text-primary" />
          รายการออเดอร์
        </h2>
      </div>

      <div className="p-4 border-b bg-muted/10 space-y-4">
        <div>
          <Label className="mb-2 block">ช่องทาง</Label>
          <ToggleGroup type="single" value={channel} onValueChange={(v: any) => v && setChannel(v)} className="justify-start">
            <ToggleGroupItem value="dine-in" className="flex-1">ทานที่ร้าน</ToggleGroupItem>
            <ToggleGroupItem value="takeaway" className="flex-1">กลับบ้าน</ToggleGroupItem>
            <ToggleGroupItem value="delivery" className="flex-1">เดลิเวอรี่</ToggleGroupItem>
          </ToggleGroup>
        </div>
        
        {channel === 'dine-in' && (
          <div className="animate-in fade-in slide-in-from-top-2">
            <Label className="mb-2 block">หมายเลขโต๊ะ</Label>
            <Input 
              placeholder="เช่น T1, A5" 
              value={tableNumber} 
              onChange={e => setTableNumber(e.target.value)}
              className="text-lg"
            />
          </div>
        )}
      </div>

      <ScrollArea className="flex-1 p-2">
        <AnimatePresence mode="popLayout">
          {cart.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
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
                  layout
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-card border rounded-xl p-3 shadow-sm"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-medium pr-2 line-clamp-2 leading-tight">{item.name}</span>
                    <span className="font-medium shrink-0">{formatCurrency(item.price * item.qty)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => removeItem(item.menuItemId)}>
                      <X className="size-4" />
                    </Button>
                    <div className="flex items-center bg-muted rounded-lg p-0.5">
                      <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md" onClick={() => updateQty(item.menuItemId, -1)}>
                        <Minus className="size-3" />
                      </Button>
                      <span className="w-8 text-center font-medium">{item.qty}</span>
                      <Button variant="secondary" size="icon" className="h-7 w-7 rounded-md bg-background shadow-sm" onClick={() => updateQty(item.menuItemId, 1)}>
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
        <div>
          <Label className="mb-2 block">วิธีชำระเงิน</Label>
          <ToggleGroup type="single" value={paymentMethod} onValueChange={(v: any) => v && setPaymentMethod(v)} className="justify-start">
            <ToggleGroupItem value="cash" className="flex-1">เงินสด</ToggleGroupItem>
            <ToggleGroupItem value="transfer" className="flex-1">โอนเงิน</ToggleGroupItem>
            <ToggleGroupItem value="card" className="flex-1">บัตร</ToggleGroupItem>
          </ToggleGroup>
        </div>

        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>ยอดรวม</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          {vat > 0 && (
            <div className="flex justify-between text-muted-foreground">
              <span>VAT {settings.vatRate}%</span>
              <span>{formatCurrency(vat)}</span>
            </div>
          )}
          <div className="flex justify-between text-xl font-bold text-foreground pt-2 border-t border-dashed">
            <span>ยอดสุทธิ</span>
            <span className="text-primary">{formatCurrency(total)}</span>
          </div>
        </div>

        <Button 
          size="lg" 
          className="w-full h-14 text-lg font-bold shadow-lg shadow-primary/20 active-elevate"
          disabled={cart.length === 0 || (channel === 'dine-in' && !tableNumber)}
          onClick={handleCheckout}
        >
          <Printer className="mr-2 size-5" />
          ชำระเงินและพิมพ์ใบเสร็จ
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex h-full w-full pb-16 md:pb-0">
      {/* Menu Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-muted/30">
        <div className="p-4 bg-card/80 backdrop-blur-md sticky top-0 z-10 border-b shadow-sm">
          <ScrollArea className="w-full whitespace-nowrap" orientation="horizontal">
            <div className="flex w-max space-x-2 pb-2">
              <Button
                variant={activeCategory === "all" ? "default" : "secondary"}
                className="rounded-full px-6 font-medium"
                onClick={() => setActiveCategory("all")}
              >
                ทั้งหมด
              </Button>
              {categories.sort((a,b) => a.sortOrder - b.sortOrder).map(cat => (
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

        <ScrollArea className="flex-1 p-4 lg:p-6">
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

      {/* Desktop Cart Sidebar */}
      <div className="hidden md:block w-80 lg:w-96 border-l bg-card shadow-xl z-20 flex-shrink-0">
        <CartContent />
      </div>

      {/* Mobile Cart Summary Sticky Bar */}
      <div className="md:hidden fixed bottom-16 left-0 right-0 p-3 bg-gradient-to-t from-background via-background to-transparent z-40">
        <Sheet open={isMobileCartOpen} onOpenChange={setIsMobileCartOpen}>
          <SheetTrigger asChild>
            <Button 
              className="w-full h-14 rounded-2xl shadow-xl shadow-primary/20 flex justify-between px-6 active-elevate"
              size="lg"
            >
              <div className="flex items-center gap-3">
                <div className="bg-primary-foreground/20 rounded-full size-8 flex items-center justify-center">
                  <span className="font-bold">{cart.reduce((s,i) => s+i.qty, 0)}</span>
                </div>
                <span className="font-medium">ดูออเดอร์</span>
              </div>
              <span className="font-bold text-lg">{formatCurrency(total)}</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[90dvh] p-0 flex flex-col rounded-t-3xl sm:max-w-none">
            <SheetTitle className="sr-only">ตะกร้าสินค้า</SheetTitle>
            <CartContent />
          </SheetContent>
        </Sheet>
      </div>

      {/* Hidden Printable Area */}
      {previewOrder && (
        <ReceiptPrintable ref={printRef} order={previewOrder} settings={settings} />
      )}
    </div>
  );
}
