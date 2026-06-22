import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChefHat, CheckCircle2, Clock, Bell, UtensilsCrossed, BellRing } from "lucide-react";
import { useOrders, useSettings, formatCurrency } from "@/lib/store";
import { Order } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function useElapsedTick() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 15000);
    return () => clearInterval(id);
  }, []);
  return tick;
}

function elapsed(isoString: string) {
  const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
  if (diff < 60) return `${diff} วิ`;
  if (diff < 3600) return `${Math.floor(diff / 60)} นาที`;
  return `${Math.floor(diff / 3600)} ชม.`;
}

function isUrgent(isoString: string) {
  return (Date.now() - new Date(isoString).getTime()) > 10 * 60 * 1000;
}

/** Play a short notification beep via Web Audio API — no file needed */
function playBeep() {
  try {
    const ctx = new AudioContext();
    const times = [0, 0.18, 0.36];
    times.forEach((t) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0, ctx.currentTime + t);
      gain.gain.linearRampToValueAtTime(0.6, ctx.currentTime + t + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.14);
      osc.start(ctx.currentTime + t);
      osc.stop(ctx.currentTime + t + 0.15);
    });
    setTimeout(() => ctx.close(), 1000);
  } catch (_) {}
}

export default function Kitchen() {
  const { orders, updateOrder } = useOrders();
  const { settings } = useSettings();
  useElapsedTick();

  const knownIds = useRef<Set<string>>(new Set());
  const isFirstLoad = useRef(true);
  const [newOrderBanner, setNewOrderBanner] = useState<Order[]>([]);
  const bannerTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeOrders = useMemo(() =>
    orders
      .filter(o => o.status === "pending" || o.status === "cooking")
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
    [orders]
  );

  const readyOrders = useMemo(() =>
    orders
      .filter(o => o.status === "ready")
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .slice(0, 10),
    [orders]
  );

  // Detect new pending orders
  useEffect(() => {
    const incoming: Order[] = [];
    orders.forEach(o => {
      if (o.status === "pending" && !knownIds.current.has(o.id)) {
        if (!isFirstLoad.current) incoming.push(o);
        knownIds.current.add(o.id);
      } else {
        knownIds.current.add(o.id);
      }
    });

    if (isFirstLoad.current) {
      isFirstLoad.current = false;
      return;
    }

    if (incoming.length > 0) {
      playBeep();
      setNewOrderBanner(incoming);
      if (bannerTimer.current) clearTimeout(bannerTimer.current);
      bannerTimer.current = setTimeout(() => setNewOrderBanner([]), 5000);
    }
  }, [orders]);

  const markCooking = (order: Order) => updateOrder({ ...order, status: "cooking" } as Order);
  const markReady   = (order: Order) => updateOrder({ ...order, status: "ready" } as Order);

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="bg-orange-500 p-2 rounded-xl shrink-0">
            <ChefHat className="size-5" />
          </div>
          <div className="min-w-0">
            <h1 className="font-bold text-lg leading-none">ห้องครัว</h1>
            <p className="text-gray-400 text-xs mt-0.5 truncate">{settings.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-orange-500/20 text-orange-400 px-2.5 py-1.5 rounded-full text-sm">
            <Bell className="size-3.5" />
            <span className="font-bold">{activeOrders.length}</span>
            <span className="hidden sm:inline">รอทำ</span>
          </div>
          <div className="flex items-center gap-1.5 bg-green-500/20 text-green-400 px-2.5 py-1.5 rounded-full text-sm">
            <CheckCircle2 className="size-3.5" />
            <span className="font-bold">{readyOrders.length}</span>
            <span className="hidden sm:inline">พร้อม</span>
          </div>
        </div>
      </header>

      {/* 🔔 New order notification banner */}
      <AnimatePresence>
        {newOrderBanner.length > 0 && (
          <motion.div
            key="banner"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="bg-orange-500 px-4 py-3 flex items-center gap-3">
              <div className="bg-white/20 rounded-full p-2 shrink-0">
                <BellRing className="size-5 text-white animate-bounce" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-black text-white text-base leading-tight">
                  ออเดอร์ใหม่มาแล้ว!
                </p>
                <p className="text-orange-100 text-sm mt-0.5">
                  คิว {newOrderBanner.map(o => `#${o.queueNumber}`).join(", ")}
                  {" · "}
                  {newOrderBanner.reduce((s, o) => s + o.items.reduce((n, i) => n + i.qty, 0), 0)} รายการ
                </p>
              </div>
              <button
                onClick={() => setNewOrderBanner([])}
                className="text-white/70 hover:text-white text-2xl leading-none px-1"
              >
                ×
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Active orders */}
        <div className="flex-1 overflow-y-auto p-3 lg:p-5 lg:border-r lg:border-gray-800">
          <h2 className="text-gray-400 text-xs uppercase tracking-widest font-semibold mb-3 flex items-center gap-2">
            <Clock className="size-3.5" /> รอทำ / กำลังทำ
          </h2>

          {activeOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-gray-600">
              <UtensilsCrossed className="size-14 mb-4 opacity-30" />
              <p className="text-base">ไม่มีออเดอร์รอทำ</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              <AnimatePresence>
                {activeOrders.map(order => {
                  const urgent = isUrgent(order.createdAt);
                  return (
                    <motion.div
                      key={order.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className={cn(
                        "rounded-2xl border p-4 flex flex-col gap-3",
                        urgent && order.status === "pending"
                          ? "bg-red-950/60 border-red-500/60"
                          : order.status === "cooking"
                          ? "bg-orange-950/60 border-orange-500/50"
                          : "bg-gray-900 border-gray-700"
                      )}
                    >
                      {/* Queue number + status */}
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-4xl font-black text-white leading-none">#{order.queueNumber}</span>
                            {order.status === "cooking" && (
                              <span className="bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">
                                กำลังทำ
                              </span>
                            )}
                            {order.status === "pending" && !urgent && (
                              <span className="bg-blue-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">
                                ใหม่!
                              </span>
                            )}
                            {urgent && order.status === "pending" && (
                              <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">
                                รอนาน!
                              </span>
                            )}
                          </div>
                          <p className="text-gray-500 text-xs mt-1 flex items-center gap-1">
                            <Clock className="size-3" />
                            {elapsed(order.createdAt)} ที่แล้ว
                          </p>
                        </div>
                        <span className="text-gray-400 text-sm font-medium">{formatCurrency(order.total)}</span>
                      </div>

                      {/* Items */}
                      <div className="border-t border-gray-700/60 pt-3 space-y-2">
                        {order.items.map((item, i) => (
                          <div key={i} className="flex justify-between items-center">
                            <span className="text-white font-semibold text-base">{item.name}</span>
                            <span className="bg-gray-700 text-gray-100 font-black text-sm px-3 py-0.5 rounded-full">
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

                      {/* Action buttons */}
                      <div className="flex gap-2 mt-1">
                        {order.status === "pending" && (
                          <Button
                            onClick={() => markCooking(order)}
                            className="flex-1 bg-orange-600 hover:bg-orange-500 text-white font-bold h-11 text-sm"
                          >
                            <ChefHat className="size-4 mr-1" /> รับออเดอร์
                          </Button>
                        )}
                        <Button
                          onClick={() => markReady(order)}
                          className={cn(
                            "font-bold h-11 text-sm bg-green-600 hover:bg-green-500 text-white",
                            order.status === "pending" ? "flex-1" : "w-full"
                          )}
                        >
                          <CheckCircle2 className="size-4 mr-1" /> เสร็จแล้ว
                        </Button>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Ready orders sidebar */}
        <div className="lg:w-72 xl:w-80 shrink-0 bg-gray-900/50 border-t lg:border-t-0 lg:border-l border-gray-800">
          <div className="p-3 lg:p-4">
            <h2 className="text-gray-400 text-xs uppercase tracking-widest font-semibold mb-3 flex items-center gap-2">
              <CheckCircle2 className="size-3.5 text-green-400" /> พร้อมเสิร์ฟแล้ว
            </h2>
            {readyOrders.length === 0 ? (
              <p className="text-gray-600 text-sm text-center py-6">ยังไม่มีออเดอร์พร้อมเสิร์ฟ</p>
            ) : (
              <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0">
                <AnimatePresence>
                  {readyOrders.map(order => (
                    <motion.div
                      key={order.id}
                      layout
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="bg-green-950/50 border border-green-700/50 rounded-xl p-3 shrink-0 lg:shrink min-w-[140px] lg:min-w-0"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-2xl font-black text-green-400">#{order.queueNumber}</span>
                        <span className="bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                          พร้อม
                        </span>
                      </div>
                      <div className="text-gray-300 text-xs space-y-0.5">
                        {order.items.map((item, i) => (
                          <div key={i} className="flex justify-between gap-2">
                            <span className="truncate">{item.name}</span>
                            <span className="text-gray-500 shrink-0">x{item.qty}</span>
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
    </div>
  );
}
