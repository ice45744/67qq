import { useState, useRef, useMemo } from "react";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { Search, Printer, Eye, ChefHat, CheckCircle2, Clock, Banknote, ExternalLink } from "lucide-react";
import { useOrders, useSettings, Order, formatCurrency } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ReceiptPrintable } from "@/components/ReceiptPrintable";
import { BillCloseDialog } from "@/components/BillCloseDialog";
import { cn } from "@/lib/utils";
import { OrderStatus } from "@/lib/types";

type PaidConfirm = { order: Order; cashReceived?: number; change?: number };

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string }> = {
  pending:  { label: "รอห้องครัว",  color: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  cooking:  { label: "กำลังทำ",     color: "bg-orange-100 text-orange-800 border-orange-200" },
  ready:    { label: "พร้อมเสิร์ฟ", color: "bg-green-100 text-green-800 border-green-200" },
  paid:     { label: "ชำระแล้ว",   color: "bg-gray-100 text-gray-500 border-gray-200" },
  voided:   { label: "ยกเลิก",     color: "bg-red-100 text-red-700 border-red-200" },
};

export default function Orders() {
  const { orders } = useOrders();
  const { settings } = useSettings();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isBillOpen, setIsBillOpen] = useState(false);
  const [tab, setTab] = useState<"active" | "all">("active");
  const [paidConfirm, setPaidConfirm] = useState<PaidConfirm | null>(null);
  const [printingReceipt, setPrintingReceipt] = useState<PaidConfirm | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const activeOrders = useMemo(() =>
    orders.filter(o => o.status === "pending" || o.status === "cooking" || o.status === "ready"),
    [orders]
  );

  const filteredOrders = useMemo(() => {
    const source = tab === "active" ? activeOrders : orders;
    return source.filter(o => String(o.queueNumber).includes(searchTerm.trim()));
  }, [orders, activeOrders, tab, searchTerm]);

  const handlePrint = (order: Order) => {
    setIsPreviewOpen(false);
    setSelectedOrder(order);
    setTimeout(() => { window.print(); }, 150);
  };

  const handleOpenBill = (order: Order) => {
    setSelectedOrder(order);
    setIsBillOpen(true);
  };

  const handlePaid = (order: Order, cashReceived?: number, change?: number) => {
    // Show confirm dialog with print/close options — no auto-print
    setPaidConfirm({ order, cashReceived, change });
  };

  const handlePrintReceipt = () => {
    if (!paidConfirm) return;
    setPrintingReceipt(paidConfirm);
    setPaidConfirm(null);
    setTimeout(() => {
      window.print();
      setTimeout(() => setPrintingReceipt(null), 600);
    }, 150);
  };

  const statusCounts = useMemo(() => ({
    pending: orders.filter(o => o.status === "pending").length,
    cooking: orders.filter(o => o.status === "cooking").length,
    ready:   orders.filter(o => o.status === "ready").length,
  }), [orders]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 lg:p-8 pb-20 md:pb-8 bg-muted/10">
        <div className="max-w-5xl mx-auto space-y-5">

          {/* Header */}
          <div className="flex justify-between items-center gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight">ออเดอร์ / คิดเงิน</h1>
              <p className="text-muted-foreground text-xs sm:text-sm">จัดการออเดอร์และปิดบิล</p>
            </div>
            {/* Desktop only — mobile uses the top bar kitchen shortcut */}
            <a
              href="/kitchen"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm px-4 py-2.5 rounded-xl transition-colors shadow-sm"
            >
              <ChefHat className="size-4" />
              หน้าห้องครัว
              <ExternalLink className="size-3 opacity-80" />
            </a>
          </div>

          {/* Status summary cards */}
          {activeOrders.length > 0 && (
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {([
                { key: "pending", icon: Clock, label: "รอครัว" },
                { key: "cooking", icon: ChefHat, label: "กำลังทำ" },
                { key: "ready",   icon: CheckCircle2, label: "พร้อมเสิร์ฟ" },
              ] as const).map(({ key, icon: Icon, label }) => {
                const cfg = STATUS_CONFIG[key];
                return (
                  <div key={key} className={cn("rounded-xl border px-3 py-3 flex items-center gap-2 sm:gap-3", cfg.color)}>
                    <Icon className="size-4 sm:size-5 shrink-0" />
                    <div className="min-w-0">
                      <p className="font-black text-xl sm:text-2xl leading-none">{statusCounts[key]}</p>
                      <p className="text-[10px] sm:text-xs mt-0.5 truncate">{label}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Ready orders quick-pay row */}
          {statusCounts.ready > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-4 space-y-3">
              <p className="text-green-800 font-semibold text-sm flex items-center gap-2">
                <CheckCircle2 className="size-4" /> ออเดอร์พร้อมเสิร์ฟ — รอเก็บเงิน
              </p>
              <div className="flex flex-wrap gap-2">
                {orders
                  .filter(o => o.status === "ready")
                  .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
                  .map(order => (
                    <button
                      key={order.id}
                      onClick={() => handleOpenBill(order)}
                      className="flex items-center gap-2 bg-white border-2 border-green-400 text-green-800 font-bold px-4 py-2 rounded-xl hover:bg-green-500 hover:text-white hover:border-green-500 transition-all shadow-sm"
                    >
                      <Banknote className="size-4" />
                      คิว #{order.queueNumber} · {formatCurrency(order.total)}
                    </button>
                  ))}
              </div>
            </div>
          )}

          {/* Tabs + search */}
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div className="flex rounded-xl border bg-muted/50 p-1 gap-1">
              {([
                { key: "active", label: `ค้างอยู่${activeOrders.length > 0 ? ` (${activeOrders.length})` : ""}` },
                { key: "all",    label: "ทั้งหมด" },
              ] as const).map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  className={cn(
                    "px-4 py-1.5 text-sm font-medium rounded-lg transition-all",
                    tab === key ? "bg-white shadow text-foreground" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="relative w-full sm:w-60">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="ค้นหาเลขคิว..."
                className="pl-9 bg-background h-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Orders list — cards on mobile, table on desktop */}
          <div className="space-y-2 sm:hidden">
            {filteredOrders.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground bg-card rounded-2xl border">
                {tab === "active" ? "ไม่มีออเดอร์ค้างอยู่" : "ยังไม่มีออเดอร์"}
              </div>
            ) : filteredOrders.map(order => {
              const cfg = STATUS_CONFIG[order.status as OrderStatus] ?? STATUS_CONFIG.paid;
              return (
                <div key={order.id} className="bg-card border rounded-2xl p-4 space-y-3 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-black text-primary">#{order.queueNumber}</span>
                    <span className={cn("text-xs font-semibold px-2.5 py-1 rounded-full border", cfg.color)}>
                      {cfg.label}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {format(new Date(order.createdAt), "dd MMM HH:mm", { locale: th })}
                  </div>
                  <div className="text-sm space-y-0.5">
                    {order.items.map((item, i) => (
                      <div key={i} className="flex justify-between">
                        <span>{item.name} <span className="text-muted-foreground">x{item.qty}</span></span>
                        <span className="font-medium">{formatCurrency(item.price * item.qty)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between border-t pt-3">
                    <span className="font-bold text-lg">{formatCurrency(order.total)}</span>
                    <div className="flex gap-2">
                      {(order.status === "pending" || order.status === "cooking" || order.status === "ready") && (
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white font-bold gap-1"
                          onClick={() => handleOpenBill(order)}
                        >
                          <Banknote className="size-4" /> คิดเงิน
                        </Button>
                      )}
                      <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => { setSelectedOrder(order); setIsPreviewOpen(true); }}>
                        <Printer className="size-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop table */}
          <div className="hidden sm:block bg-card rounded-2xl border shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 border-b">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground">คิว</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground">วันเวลา</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground">รายการ</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground">สถานะ</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground">ยอดรวม</th>
                    <th className="text-right px-4 py-3 font-semibold text-muted-foreground">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-muted-foreground">
                        {tab === "active" ? "ไม่มีออเดอร์ค้างอยู่" : "ยังไม่มีออเดอร์"}
                      </td>
                    </tr>
                  ) : filteredOrders.map(order => {
                    const cfg = STATUS_CONFIG[order.status as OrderStatus] ?? STATUS_CONFIG.paid;
                    return (
                      <tr key={order.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 font-black text-primary text-xl">#{order.queueNumber}</td>
                        <td className="px-4 py-3 text-muted-foreground">{format(new Date(order.createdAt), "dd MMM HH:mm", { locale: th })}</td>
                        <td className="px-4 py-3 max-w-xs">
                          <span className="line-clamp-2 text-sm">{order.items.map(i => `${i.name} x${i.qty}`).join(", ")}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn("text-xs font-semibold px-2.5 py-1 rounded-full border", cfg.color)}>
                            {cfg.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-bold">{formatCurrency(order.total)}</td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-2">
                            {(order.status === "pending" || order.status === "cooking" || order.status === "ready") && (
                              <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white font-bold gap-1" onClick={() => handleOpenBill(order)}>
                                <Banknote className="size-4" /> คิดเงิน
                              </Button>
                            )}
                            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => { setSelectedOrder(order); setIsPreviewOpen(true); }}>
                              <Eye className="size-4" />
                            </Button>
                            <Button variant="default" size="icon" className="h-8 w-8" onClick={() => handlePrint(order)}>
                              <Printer className="size-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Bill close dialog */}
      <BillCloseDialog
        order={selectedOrder}
        open={isBillOpen}
        onOpenChange={(v) => { setIsBillOpen(v); if (!v) setSelectedOrder(null); }}
        onPaid={handlePaid}
      />

      {/* Receipt preview dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-sm w-[92vw] bg-gray-100 max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle>ตัวอย่างใบเสร็จ</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center p-4 bg-white rounded-xl shadow-inner">
            {selectedOrder && <ReceiptPrintable order={selectedOrder} settings={settings} />}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>ปิด</Button>
            <Button onClick={() => selectedOrder && handlePrint(selectedOrder)}>
              <Printer className="mr-2 size-4" /> พิมพ์ซ้ำ
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ✅ Paid confirmation dialog — choose to print or just close */}
      <Dialog open={!!paidConfirm} onOpenChange={(v) => { if (!v) setPaidConfirm(null); }}>
        <DialogContent className="max-w-sm w-[92vw] p-0 rounded-2xl overflow-hidden">
          <div className="bg-green-50 px-6 pt-6 pb-4 text-center">
            <div className="size-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="size-9 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-green-800">ชำระเงินแล้ว!</h2>
            <p className="text-green-700 text-sm mt-1">
              คิว <span className="font-black text-3xl text-green-600">#{paidConfirm?.order.queueNumber}</span>
            </p>
          </div>

          {paidConfirm && (
            <div className="px-5 py-3 space-y-1.5 border-b">
              {paidConfirm.order.items.map((item, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{item.name} <span className="font-semibold text-foreground">x{item.qty}</span></span>
                  <span className="font-medium">{formatCurrency(item.price * item.qty)}</span>
                </div>
              ))}
              <div className="flex justify-between font-bold text-base pt-1 border-t mt-2">
                <span>ยอดรวม</span>
                <span className="text-primary">{formatCurrency(paidConfirm.order.total)}</span>
              </div>
              {paidConfirm.cashReceived !== undefined && paidConfirm.cashReceived > 0 && (
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>รับเงิน</span>
                  <span>{formatCurrency(paidConfirm.cashReceived)}</span>
                </div>
              )}
              {paidConfirm.change !== undefined && paidConfirm.change > 0 && (
                <div className="flex justify-between text-sm font-bold text-green-700">
                  <span>เงินทอน</span>
                  <span>{formatCurrency(paidConfirm.change)}</span>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3 px-5 py-4">
            <Button variant="outline" className="flex-1 h-11" onClick={() => setPaidConfirm(null)}>
              ปิด
            </Button>
            <Button className="flex-1 h-11 gap-2" onClick={handlePrintReceipt}>
              <Printer className="size-4" />
              พิมพ์ใบเสร็จ
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Receipt for re-print from preview */}
      {selectedOrder && !isPreviewOpen && !isBillOpen && !paidConfirm && (
        <ReceiptPrintable ref={printRef} order={selectedOrder} settings={settings} />
      )}

      {/* Receipt after bill close — only printed when user taps "พิมพ์ใบเสร็จ" */}
      {printingReceipt && (
        <ReceiptPrintable
          ref={printRef}
          order={printingReceipt.order}
          settings={settings}
          cashReceived={printingReceipt.cashReceived}
          change={printingReceipt.change}
        />
      )}
    </div>
  );
}
