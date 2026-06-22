import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChefHat, CheckCircle2, Clock, Bell, UtensilsCrossed } from "lucide-react";
import { useOrders, useSettings, formatCurrency } from "@/lib/store";
import { Order } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function elapsed(isoString: string) {
  const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
  if (diff < 60) return `${diff} วิ`;
  return `${Math.floor(diff / 60)} นาที`;
}

function useTimer() {
  const [, forceRender] = useMemo(() => {
    let setter: any;
    const interval = setInterval(() => setter?.((v: number) => v + 1), 10000);
    return [interval, (fn: any) => { setter = fn; }];
  }, []);
  return;
}

export default function Kitchen() {
  const { orders, updateOrder } = useOrders();
  const { settings } = useSettings();

  const activeOrders = useMemo(() => {
    return orders
      .filter(o => o.status === 'pending' || o.status === 'cooking')
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [orders]);

  const readyOrders = useMemo(() => {
    return orders
      .filter(o => o.status === 'ready')
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .slice(0, 10);
  }, [orders]);

  const markCooking = (order: Order) => {
    updateOrder({ ...order, status: 'cooking' });
  };

  const markReady = (order: Order) => {
    updateOrder({ ...order, status: 'ready' });
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      <header className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="bg-orange-500 p-2 rounded-xl">
            <ChefHat className="size-6" />
          </div>
          <div>
            <h1 className="font-bold text-xl leading-none">ห้องครัว</h1>
            <p className="text-gray-400 text-sm mt-0.5">{settings.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2 bg-orange-500/20 text-orange-400 px-3 py-1.5 rounded-full">
            <Bell className="size-4" />
            <span className="font-bold">{activeOrders.length}</span>
            <span>รอทำ</span>
          </div>
          <div className="flex items-center gap-2 bg-green-500/20 text-green-400 px-3 py-1.5 rounded-full">
            <CheckCircle2 className="size-4" />
            <span className="font-bold">{readyOrders.length}</span>
            <span>พร้อมเสิร์ฟ</span>
          </div>
        </div>
      </header>

      <div className="flex-1 flex gap-0 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 lg:p-6 border-r border-gray-800">
          <h2 className="text-gray-400 text-xs uppercase tracking-widest font-semibold mb-4 flex items-center gap-2">
            <Clock className="size-3.5" /> รอทำ / กำลังทำ
          </h2>

          {activeOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 text-gray-600">
              <UtensilsCrossed className="size-16 mb-4 opacity-30" />
              <p className="text-lg">ไม่มีออเดอร์รอทำ</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              <AnimatePresence>
                {activeOrders.map(order => (
                  <motion.div
                    key={order.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className={cn(
                      "rounded-2xl border p-4 flex flex-col gap-3",
                      order.status === 'cooking'
                        ? "bg-orange-950/60 border-orange-500/50"
                        : "bg-gray-900 border-gray-700"
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-3xl font-black text-white">#{order.queueNumber}</span>
                          {order.status === 'cooking' && (
                            <span className="bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide animate-pulse">
                              กำลังทำ
                            </span>
                          )}
                          {order.status === 'pending' && (
                            <span className="bg-gray-700 text-gray-300 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
                              ใหม่
                            </span>
                          )}
                        </div>
                        <p className="text-gray-500 text-xs mt-0.5 flex items-center gap-1">
                          <Clock className="size-3" />
                          {elapsed(order.createdAt)} ที่แล้ว
                        </p>
                      </div>
                      <span className="text-gray-400 text-sm font-medium">{formatCurrency(order.total)}</span>
                    </div>

                    <div className="border-t border-gray-700/60 pt-3 space-y-2">
                      {order.items.map((item, i) => (
                        <div key={i} className="flex justify-between items-center">
                          <span className="text-white font-medium">{item.name}</span>
                          <span className="bg-gray-700 text-gray-200 font-bold text-sm px-2.5 py-0.5 rounded-full">
                            x{item.qty}
                          </span>
                        </div>
                      ))}
                    </div>

                    {order.tableNote && (
                      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg px-3 py-2 text-yellow-300 text-sm">
                        📝 {order.tableNote}
                      </div>
                    )}

                    <div className="flex gap-2 mt-1">
                      {order.status === 'pending' && (
                        <Button
                          onClick={() => markCooking(order)}
                          className="flex-1 bg-orange-600 hover:bg-orange-500 text-white font-bold h-10"
                        >
                          <ChefHat className="size-4 mr-1" /> รับออเดอร์
                        </Button>
                      )}
                      <Button
                        onClick={() => markReady(order)}
                        className={cn(
                          "font-bold h-10 bg-green-600 hover:bg-green-500 text-white",
                          order.status === 'pending' ? "flex-1" : "w-full"
                        )}
                      >
                        <CheckCircle2 className="size-4 mr-1" /> เสร็จแล้ว
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        <div className="w-72 lg:w-80 shrink-0 overflow-y-auto p-4 bg-gray-900/50">
          <h2 className="text-gray-400 text-xs uppercase tracking-widest font-semibold mb-4 flex items-center gap-2">
            <CheckCircle2 className="size-3.5 text-green-400" /> พร้อมเสิร์ฟแล้ว
          </h2>
          {readyOrders.length === 0 ? (
            <p className="text-gray-600 text-sm text-center py-8">ยังไม่มีออเดอร์พร้อมเสิร์ฟ</p>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {readyOrders.map(order => (
                  <motion.div
                    key={order.id}
                    layout
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="bg-green-950/50 border border-green-700/50 rounded-xl p-3"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl font-black text-green-400">#{order.queueNumber}</span>
                      <span className="bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        พร้อมเสิร์ฟ
                      </span>
                    </div>
                    <div className="text-gray-300 text-sm space-y-1">
                      {order.items.map((item, i) => (
                        <div key={i} className="flex justify-between">
                          <span>{item.name}</span>
                          <span className="text-gray-500">x{item.qty}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
