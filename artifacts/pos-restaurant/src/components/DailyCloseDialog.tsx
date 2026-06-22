import { useMemo } from "react";
import { BarChart3, Printer, X, TrendingUp, ShoppingBag, CheckCircle2, Clock } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useOrders, useSettings, formatCurrency } from "@/lib/store";
import { Order } from "@/lib/types";
import { cn } from "@/lib/utils";

interface DailyCloseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type TopItem = { name: string; qty: number; revenue: number };
type DailyStats = {
  paid: Order[];
  pending: Order[];
  voided: Order[];
  revenue: number;
  totalItems: number;
  topItems: TopItem[];
};

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function nowString() {
  return new Intl.DateTimeFormat("th-TH", {
    year: "numeric", month: "long", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  }).format(new Date());
}

const RECEIPT_FONT = "'Sarabun','Noto Sans Thai',system-ui,sans-serif";

function DailySummaryReceipt({ shopName, footer, stats, timeStr }: {
  shopName: string;
  footer: string;
  stats: DailyStats;
  timeStr: string;
}) {
  return (
    <div
      id="print-container"
      style={{
        width: "219px",
        maxWidth: "219px",
        margin: "0 auto",
        background: "#fff",
        color: "#000",
        padding: "10px 6px",
        fontFamily: RECEIPT_FONT,
        fontSize: "12px",
        lineHeight: 1.35,
      }}
    >
      <div style={{ textAlign: "center", marginBottom: "8px" }}>
        <div style={{ fontWeight: 700, fontSize: "15px" }}>{shopName}</div>
        <div style={{ fontSize: "11px" }}>** สรุปยอดประจำวัน **</div>
        <div style={{ fontSize: "10px", marginTop: "2px" }}>{timeStr}</div>
      </div>

      <div style={{ borderTop: "1px dashed #000", borderBottom: "1px dashed #000", padding: "6px 0", margin: "6px 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
          <span>ออเดอร์ที่ปิดบิล</span>
          <span style={{ fontWeight: 700 }}>{stats.paid.length} รายการ</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>รายการที่ขาย</span>
          <span style={{ fontWeight: 700 }}>{stats.totalItems} ชิ้น</span>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "16px", fontWeight: 800, margin: "8px 0" }}>
        <span>ยอดขายรวม</span>
        <span>{stats.revenue.toLocaleString("th-TH")} ฿</span>
      </div>

      {stats.topItems.length > 0 && (
        <>
          <div style={{ borderTop: "1px dashed #000", margin: "6px 0" }} />
          <div style={{ fontWeight: 700, fontSize: "11px", marginBottom: "4px" }}>เมนูขายดี</div>
          {stats.topItems.map((item, i) => (
            <div key={item.name} style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", marginBottom: "2px" }}>
              <span>{i + 1}. {item.name}</span>
              <span>x{item.qty}</span>
            </div>
          ))}
        </>
      )}

      {stats.paid.length > 0 && (
        <>
          <div style={{ borderTop: "1px dashed #000", margin: "8px 0" }} />
          <div style={{ fontWeight: 700, fontSize: "11px", marginBottom: "4px" }}>รายการออเดอร์</div>
          {stats.paid.map(o => (
            <div key={o.id} style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", marginBottom: "2px" }}>
              <span>คิว #{o.queueNumber}</span>
              <span>{o.total.toLocaleString("th-TH")} ฿</span>
            </div>
          ))}
        </>
      )}

      <div style={{ borderTop: "1px dashed #000", margin: "8px 0" }} />
      <div style={{ textAlign: "center", fontSize: "11px" }}>{footer}</div>
    </div>
  );
}

export function DailyCloseDialog({ open, onOpenChange }: DailyCloseDialogProps) {
  const { orders } = useOrders();
  const { settings } = useSettings();
  const today = todayKey();

  const stats = useMemo<DailyStats>(() => {
    const todayOrders = orders.filter(o => o.createdAt.slice(0, 10) === today);
    const paid    = todayOrders.filter(o => o.status === "paid");
    const pending = todayOrders.filter(o => ["pending","cooking","ready"].includes(o.status));
    const voided  = todayOrders.filter(o => o.status === "voided");
    const revenue = paid.reduce((s, o) => s + o.total, 0);
    const totalItems = paid.reduce((s, o) => s + o.items.reduce((si, i) => si + i.qty, 0), 0);
    const itemMap: Record<string, TopItem> = {};
    paid.forEach(o => o.items.forEach(i => {
      if (!itemMap[i.name]) itemMap[i.name] = { name: i.name, qty: 0, revenue: 0 };
      itemMap[i.name].qty += i.qty;
      itemMap[i.name].revenue += i.price * i.qty;
    }));
    const topItems = Object.values(itemMap).sort((a, b) => b.qty - a.qty).slice(0, 5);
    return { paid, pending, voided, revenue, totalItems, topItems };
  }, [orders, today]);

  const timeStr = nowString();

  const handlePrint = () => {
    onOpenChange(false);
    setTimeout(() => {
      const el = document.getElementById("daily-print-area");
      if (el) el.style.visibility = "visible";
      window.print();
      setTimeout(() => {
        if (el) el.style.visibility = "hidden";
      }, 600);
    }, 200);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg w-[96vw] p-0 overflow-hidden rounded-2xl">
          <DialogHeader className="px-5 pt-5 pb-0">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <BarChart3 className="size-5 text-primary" />
                ปิดรอบ / สรุปยอดวันนี้
              </DialogTitle>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => onOpenChange(false)}>
                <X className="size-4" />
              </Button>
            </div>
            <p className="text-muted-foreground text-sm mt-1 pb-2">{timeStr}</p>
          </DialogHeader>

          <div className="overflow-y-auto max-h-[60vh] px-5 py-3 space-y-4">
            {/* KPI cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
                <TrendingUp className="size-5 text-primary mb-2" />
                <p className="text-2xl font-black text-primary">{formatCurrency(stats.revenue)}</p>
                <p className="text-xs text-muted-foreground mt-0.5">ยอดขายรวม</p>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <CheckCircle2 className="size-5 text-green-600 mb-2" />
                <p className="text-2xl font-black text-green-700">{stats.paid.length}</p>
                <p className="text-xs text-muted-foreground mt-0.5">ออเดอร์ปิดบิลแล้ว</p>
              </div>
              <div className="bg-muted/60 border rounded-xl p-4">
                <ShoppingBag className="size-5 text-foreground/60 mb-2" />
                <p className="text-2xl font-black">{stats.totalItems}</p>
                <p className="text-xs text-muted-foreground mt-0.5">รายการที่ขายได้</p>
              </div>
              <div className={cn("rounded-xl p-4 border", stats.pending.length > 0 ? "bg-yellow-50 border-yellow-200" : "bg-muted/60 border")}>
                <Clock className={cn("size-5 mb-2", stats.pending.length > 0 ? "text-yellow-600" : "text-foreground/60")} />
                <p className={cn("text-2xl font-black", stats.pending.length > 0 && "text-yellow-700")}>{stats.pending.length}</p>
                <p className="text-xs text-muted-foreground mt-0.5">ออเดอร์ยังค้างอยู่</p>
              </div>
            </div>

            {/* Top items */}
            {stats.topItems.length > 0 && (
              <div className="bg-card border rounded-xl overflow-hidden">
                <div className="px-4 py-2.5 border-b bg-muted/40">
                  <p className="font-semibold text-sm">เมนูขายดีวันนี้</p>
                </div>
                <div className="divide-y">
                  {stats.topItems.map((item, i) => (
                    <div key={item.name} className="flex items-center gap-3 px-4 py-2.5">
                      <span className={cn(
                        "size-6 rounded-full flex items-center justify-center text-xs font-black shrink-0",
                        i === 0 ? "bg-yellow-400 text-yellow-900"
                          : i === 1 ? "bg-gray-300 text-gray-700"
                          : i === 2 ? "bg-orange-300 text-orange-900"
                          : "bg-muted text-muted-foreground"
                      )}>
                        {i + 1}
                      </span>
                      <span className="flex-1 font-medium text-sm">{item.name}</span>
                      <span className="text-muted-foreground text-sm">x{item.qty}</span>
                      <span className="font-semibold text-sm">{formatCurrency(item.revenue)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Order list */}
            {stats.paid.length > 0 ? (
              <div className="bg-card border rounded-xl overflow-hidden">
                <div className="px-4 py-2.5 border-b bg-muted/40">
                  <p className="font-semibold text-sm">ออเดอร์ที่ปิดบิลแล้ว ({stats.paid.length})</p>
                </div>
                <div className="divide-y max-h-44 overflow-y-auto">
                  {stats.paid.map(o => (
                    <div key={o.id} className="flex items-center justify-between px-4 py-2 text-sm">
                      <span className="font-bold text-primary">#{o.queueNumber}</span>
                      <span className="text-muted-foreground text-xs">{o.items.reduce((s,i)=>s+i.qty,0)} ชิ้น</span>
                      <span className="font-semibold">{formatCurrency(o.total)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-10 text-muted-foreground">
                <BarChart3 className="size-10 mx-auto mb-3 opacity-30" />
                <p>ยังไม่มีออเดอร์ที่ปิดบิลวันนี้</p>
              </div>
            )}
          </div>

          <div className="px-5 py-4 border-t bg-card flex gap-3">
            <Button variant="outline" className="flex-1 h-11" onClick={() => onOpenChange(false)}>
              ปิด
            </Button>
            <Button className="flex-1 h-11 gap-2" onClick={handlePrint} disabled={stats.paid.length === 0}>
              <Printer className="size-4" /> พิมพ์ใบสรุปยอด
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Hidden print area — only visible during window.print() */}
      <div
        id="daily-print-area"
        style={{ position: "fixed", left: "-10000px", top: 0, pointerEvents: "none", visibility: "hidden" }}
      >
        <DailySummaryReceipt
          shopName={settings.name}
          footer={settings.footerMessage}
          stats={stats}
          timeStr={timeStr}
        />
      </div>
    </>
  );
}
