import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChefHat, CheckCircle2, Clock, Bell, UtensilsCrossed,
  BellRing, BellOff, Volume2, VolumeX, AlarmCheck,
} from "lucide-react";
import { useOrders, useSettings, formatCurrency } from "@/lib/store";
import { Order } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const SOUND_KEY = "kitchen-sound-enabled";

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

// ---------- Audio & TTS ----------
let sharedCtx: AudioContext | null = null;

function getAudioCtx(): AudioContext | null {
  if (!sharedCtx) {
    try { sharedCtx = new AudioContext(); } catch (_) { return null; }
  }
  return sharedCtx;
}

// Short alert tone played immediately before the voice (instant feedback)
function playAlertTone() {
  const ctx = getAudioCtx();
  if (!ctx) return;
  if (ctx.state === "suspended") ctx.resume();
  [0, 0.18].forEach((t) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0, ctx.currentTime + t);
    gain.gain.linearRampToValueAtTime(0.7, ctx.currentTime + t + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.14);
    osc.start(ctx.currentTime + t);
    osc.stop(ctx.currentTime + t + 0.15);
  });
}

// ── TTS helpers ─────────────────────────────────────────────────────────────

// Voices load asynchronously — wait for them before picking Thai voice
function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise(resolve => {
    const v = window.speechSynthesis.getVoices();
    if (v.length > 0) { resolve(v); return; }
    const handler = () => resolve(window.speechSynthesis.getVoices());
    window.speechSynthesis.addEventListener("voiceschanged", handler, { once: true });
    // Timeout fallback — resolve with whatever is available after 1 s
    setTimeout(() => resolve(window.speechSynthesis.getVoices()), 1000);
  });
}

function pickThaiVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  return (
    voices.find(v => v.lang === "th-TH") ||
    voices.find(v => v.lang.startsWith("th")) ||
    null
  );
}

// Unlock TTS on iOS — must be called inside a user-gesture handler
function unlockTTS() {
  if (!("speechSynthesis" in window)) return;
  const u = new SpeechSynthesisUtterance(" ");
  u.volume = 0;
  window.speechSynthesis.speak(u);
  // Trigger voice list load now so it's ready when first order arrives
  loadVoices();
}

// Announce new orders by queue number — fully async so Thai voice is found
async function speakOrder(orders: Order[]) {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();

  const nums = orders.map(o => o.queueNumber);
  const text =
    nums.length === 1
      ? `ออเดอร์ใหม่ คิวที่ ${nums[0]}`
      : `ออเดอร์ใหม่ คิวที่ ${nums.slice(0, -1).join(" และคิวที่ ")} และคิวที่ ${nums[nums.length - 1]}`;

  const voices = await loadVoices();
  const thaiVoice = pickThaiVoice(voices);

  const u = new SpeechSynthesisUtterance(text);
  if (thaiVoice) u.voice = thaiVoice;
  u.lang = "th-TH";
  u.rate = 0.9;
  u.pitch = 1.1;
  u.volume = 1;

  // Short delay so alert tone plays first
  setTimeout(() => window.speechSynthesis.speak(u), 300);
}

// Test announcement — also async
async function speakTest() {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();

  const voices = await loadVoices();
  const thaiVoice = pickThaiVoice(voices);

  const u = new SpeechSynthesisUtterance("เปิดเสียงแจ้งเตือนแล้ว");
  if (thaiVoice) u.voice = thaiVoice;
  u.lang = "th-TH";
  u.rate = 0.9;
  u.volume = 1;
  window.speechSynthesis.speak(u);
}

// ---------- Full-screen alert overlay ----------
function NewOrderOverlay({
  orders,
  onDismiss,
}: {
  orders: Order[];
  onDismiss: () => void;
}) {
  const totalItems = orders.reduce((s, o) => s + o.items.reduce((n, i) => n + i.qty, 0), 0);
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-orange-600 text-white">
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 22 }}
        className="flex flex-col items-center gap-6 px-8 text-center"
      >
        <div className="bg-white/20 rounded-full p-6">
          <BellRing className="size-16 animate-bounce" />
        </div>

        <div>
          <p className="text-5xl font-black leading-tight tracking-tight">
            ออเดอร์ใหม่!
          </p>
          <p className="text-orange-100 text-xl mt-2">
            {orders.length === 1
              ? `คิว #${orders[0].queueNumber}`
              : `คิว ${orders.map(o => `#${o.queueNumber}`).join(", ")}`}
          </p>
          <p className="text-orange-200 text-lg mt-1">{totalItems} รายการ</p>
        </div>

        {/* Item list */}
        <div className="bg-white/10 rounded-2xl px-6 py-4 w-full max-w-sm space-y-1.5 text-left">
          {orders.flatMap(o =>
            o.items.map((item, i) => (
              <div key={`${o.id}-${i}`} className="flex justify-between text-base font-semibold">
                <span>{item.name}</span>
                <span className="text-orange-200">×{item.qty}</span>
              </div>
            ))
          )}
        </div>

        <Button
          onClick={onDismiss}
          className="mt-2 h-16 px-12 text-xl font-black bg-white text-orange-600 hover:bg-orange-50 rounded-2xl shadow-lg"
        >
          <AlarmCheck className="size-6 mr-2" />
          รับทราบ
        </Button>
      </motion.div>
    </div>
  );
}

// ---------- Setup prompt (full-screen, shown once) ----------
function SoundSetupOverlay({ onEnable }: { onEnable: () => void }) {
  return (
    <div className="fixed inset-0 z-40 flex flex-col items-center justify-center bg-gray-950/95 text-white px-8">
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 22 }}
        className="flex flex-col items-center gap-6 text-center max-w-xs"
      >
        <div className="bg-blue-500/20 rounded-full p-6">
          <Volume2 className="size-14 text-blue-400" />
        </div>
        <div>
          <p className="text-3xl font-black">เปิดเสียงแจ้งเตือน</p>
          <p className="text-gray-400 mt-2 text-base leading-relaxed">
            เมื่อมีออเดอร์ใหม่ ระบบจะพูดว่า
          </p>
          <p className="text-white font-semibold text-base mt-1 bg-white/10 rounded-xl px-4 py-2">
            🔊 "ออเดอร์ใหม่ หมายเลข 1"
          </p>
          <p className="text-gray-500 text-sm mt-3">ระบบจะจำการตั้งค่านี้ไว้ตลอดไป</p>
        </div>
        <Button
          onClick={onEnable}
          className="h-14 px-10 text-lg font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-2xl w-full"
        >
          <Volume2 className="size-5 mr-2" />
          เปิดเสียงพูด
        </Button>
      </motion.div>
    </div>
  );
}

// ---------- Main Kitchen page ----------
export default function Kitchen() {
  const { orders, updateOrder } = useOrders();
  const { settings } = useSettings();
  useElapsedTick();

  // ── Sound: persisted in localStorage ──────────────────────────────────────
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    try { return localStorage.getItem(SOUND_KEY) === "1"; } catch { return false; }
  });
  const [showSetup, setShowSetup] = useState<boolean>(() => {
    try { return localStorage.getItem(SOUND_KEY) !== "1"; } catch { return true; }
  });

  const enableSound = useCallback(() => {
    // Unlock AudioContext + TTS inside this user-gesture handler (required on iOS)
    const ctx = getAudioCtx();
    if (ctx && ctx.state === "suspended") ctx.resume();
    unlockTTS();
    setSoundEnabled(true);
    setShowSetup(false);
    try { localStorage.setItem(SOUND_KEY, "1"); } catch (_) {}
    // Play tone + Thai voice confirmation
    playAlertTone();
    speakTest();
  }, []);

  const disableSound = useCallback(() => {
    setSoundEnabled(false);
    try { localStorage.removeItem(SOUND_KEY); } catch (_) {}
    setShowSetup(true);
  }, []);

  // ── Notification permission ────────────────────────────────────────────────
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>(
    typeof Notification !== "undefined" ? Notification.permission : "denied"
  );
  const requestNotifPermission = useCallback(async () => {
    if (typeof Notification === "undefined") return;
    const result = await Notification.requestPermission();
    setNotifPermission(result);
  }, []);

  // ── New order detection ────────────────────────────────────────────────────
  // We use a ref for knownIds so we never lose its state across re-renders.
  // isFirstLoad guards against firing alerts for existing orders on mount.
  const knownIds = useRef<Set<string>>(new Set());
  const isFirstLoad = useRef(true);
  const ordersLoadedOnce = useRef(false);

  const [alertOrders, setAlertOrders] = useState<Order[]>([]);

  useEffect(() => {
    // On the very first non-empty orders response, seed knownIds without alerting.
    if (!ordersLoadedOnce.current && orders.length > 0) {
      ordersLoadedOnce.current = true;
      orders.forEach(o => knownIds.current.add(o.id));
      isFirstLoad.current = false;
      return;
    }

    // If still no orders yet, keep waiting.
    if (isFirstLoad.current) return;

    const incoming: Order[] = [];
    orders.forEach(o => {
      if (!knownIds.current.has(o.id)) {
        knownIds.current.add(o.id);
        if (o.status === "pending") incoming.push(o);
      }
    });

    if (incoming.length > 0) {
      if (soundEnabled) {
        playAlertTone();
        speakOrder(incoming);
      }
      if (notifPermission === "granted") showBrowserNotification(incoming);
      setAlertOrders(incoming);
    }
  }, [orders, soundEnabled, notifPermission]);

  // Auto-dismiss alert after 3 seconds
  const alertTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (alertOrders.length > 0) {
      if (alertTimerRef.current) clearTimeout(alertTimerRef.current);
      alertTimerRef.current = setTimeout(() => setAlertOrders([]), 3000);
    }
    return () => { if (alertTimerRef.current) clearTimeout(alertTimerRef.current); };
  }, [alertOrders]);

  const dismissAlert = useCallback(() => {
    if (alertTimerRef.current) clearTimeout(alertTimerRef.current);
    setAlertOrders([]);
  }, []);

  // ── Orders split ──────────────────────────────────────────────────────────
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

  const markCooking = useCallback((order: Order) => updateOrder({ ...order, status: "cooking" } as Order), [updateOrder]);
  const markReady   = useCallback((order: Order) => updateOrder({ ...order, status: "ready" }   as Order), [updateOrder]);

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">

      {/* ── Full-screen new-order alert ── */}
      <AnimatePresence>
        {alertOrders.length > 0 && (
          <motion.div
            key="alert-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <NewOrderOverlay orders={alertOrders} onDismiss={dismissAlert} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Sound setup overlay (shown until user enables sound) ── */}
      <AnimatePresence>
        {showSetup && alertOrders.length === 0 && (
          <motion.div
            key="setup-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <SoundSetupOverlay onEnable={enableSound} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Header ── */}
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
          {/* Sound toggle */}
          <button
            onClick={soundEnabled ? disableSound : enableSound}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-sm font-medium transition-colors",
              soundEnabled
                ? "bg-blue-500/20 text-blue-400 hover:bg-blue-500/30"
                : "bg-gray-700/60 text-gray-400 hover:bg-gray-700"
            )}
          >
            {soundEnabled ? <Volume2 className="size-3.5" /> : <VolumeX className="size-3.5" />}
            <span className="hidden sm:inline">{soundEnabled ? "เสียงเปิด" : "เปิดเสียง"}</span>
          </button>

          {/* Browser notification toggle */}
          <button
            onClick={requestNotifPermission}
            disabled={notifPermission === "granted"}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-sm font-medium transition-colors",
              notifPermission === "granted"
                ? "bg-green-500/20 text-green-400 cursor-default"
                : notifPermission === "denied"
                ? "bg-red-500/20 text-red-400 cursor-not-allowed"
                : "bg-gray-700/60 text-gray-400 hover:bg-gray-700 cursor-pointer"
            )}
          >
            {notifPermission === "granted"
              ? <BellRing className="size-3.5" />
              : notifPermission === "denied"
              ? <BellOff className="size-3.5" />
              : <Bell className="size-3.5" />}
            <span className="hidden sm:inline">
              {notifPermission === "granted" ? "แจ้งเตือนเปิด"
               : notifPermission === "denied" ? "ถูกบล็อก"
               : "เปิดแจ้งเตือน"}
            </span>
          </button>

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

      {/* ── Active orders ── */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
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

// ── Browser notification (helper) ──────────────────────────────────────────
function showBrowserNotification(orders: Order[]) {
  if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
  const queueNums = orders.map(o => `#${o.queueNumber}`).join(", ");
  const itemCount = orders.reduce((s, o) => s + o.items.reduce((n, i) => n + i.qty, 0), 0);
  try {
    new Notification("🍳 ออเดอร์ใหม่มาแล้ว!", {
      body: `คิว ${queueNums} · ${itemCount} รายการ`,
      icon: "/favicon.ico",
      tag: "new-order",
      requireInteraction: false,
    });
  } catch (_) {
    // iOS requires ServiceWorker — skip silently; TTS + overlay handle alerting
  }
}
