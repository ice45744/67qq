import { useState, useRef, useMemo } from "react";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { Search, Printer, Eye, ChefHat, CheckCircle2, Clock, Banknote, ExternalLink } from "lucide-react";
import { useOrders, useSettings, Order, formatCurrency } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ReceiptPrintable } from "@/components/ReceiptPrintable";
import { cn } from "@/lib/utils";
import { OrderStatus } from "@/lib/types";

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string }> = {
  pending:  { label: "รอห้องครัว", color: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  cooking:  { label: "กำลังทำ",   color: "bg-orange-100 text-orange-800 border-orange-200" },
  ready:    { label: "พร้อมเสิร์ฟ", color: "bg-green-100 text-green-800 border-green-200" },
  paid:     { label: "ชำระแล้ว",  color: "bg-gray-100 text-gray-600 border-gray-200" },
  voided:   { label: "ยกเลิก",    color: "bg-red-100 text-red-700 border-red-200" },
};

export default function Orders() {
  const { orders, updateOrderStatus } = useOrders();
  const { settings } = useSettings();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [tab, setTab] = useState<"active" | "all">("active");
  const printRef = useRef<HTMLDivElement>(null);

  const activeOrders = useMemo(() => {
    return orders.filter(o => o.status === 'pending' || o.status === 'cooking' || o.status === 'ready');
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const source = tab === "active" ? activeOrders : orders;
    return source.filter(o => String(o.queueNumber).includes(searchTerm.trim()));
  }, [orders, activeOrders, tab, searchTerm]);

  const handlePrint = (order: Order) => {
    setIsPreviewOpen(false);
    setSelectedOrder(order);
    setTimeout(() => { window.print(); }, 150);
  };

  const handlePreview = (order: Order) => {
    setSelectedOrder(order);
    setIsPreviewOpen(true);
  };

  const handleCollectPayment = (order: Order) => {
    updateOrderStatus(order.id, 'paid');
    setSelectedOrder(order);
    setTimeout(() => { window.print(); }, 150);
  };

  return (
    <div className="flex-1 p-4 lg:p-8 overflow-y-auto bg-muted/10 pb-20 md:pb-8">
      <div className="max-w-5xl mx-auto space-y-6">

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">รายการออเดอร์</h1>
            <p className="text-muted-foreground">ติดตามและจัดการออเดอร์</p>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="/kitchen"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm px-4 py-2 rounded-lg transition-colors"
            >
              <ChefHat className="size-4" />
              เปิดหน้าห้องครัว
              <ExternalLink className="size-3 opacity-70" />
            </a>
          </div>
        </div>

        {activeOrders.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {(["pending", "cooking", "ready"] as OrderStatus[]).map(s => {
              const count = orders.filter(o => o.status === s).length;
              const cfg = STATUS_CONFIG[s];
              const icons = { pending: Clock, cooking: ChefHat, ready: CheckCircle2 };
              const Icon = icons[s as keyof typeof icons];
              return (
                <div key={s} className={cn("rounded-xl border px-4 py-3 flex items-center gap-3", cfg.color)}>
                  <Icon className="size-5 shrink-0" />
                  <div>
                    <p className="font-bold text-xl leading-none">{count}</p>
                    <p className="text-xs mt-0.5">{cfg.label}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex gap-2 border-b pb-2">
          <button
            onClick={() => setTab("active")}
            className={cn("px-4 py-2 text-sm font-medium rounded-t-lg transition-colors",
              tab === "active" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}
          >
            ออเดอร์ที่ยังค้างอยู่ {activeOrders.length > 0 && `(${activeOrders.length})`}
          </button>
          <button
            onClick={() => setTab("all")}
            className={cn("px-4 py-2 text-sm font-medium rounded-t-lg transition-colors",
              tab === "all" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}
          >
            ทั้งหมด
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="ค้นหาเลขคิว..."
            className="pl-9 bg-background"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="bg-card rounded-2xl border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>คิว</TableHead>
                  <TableHead>วันเวลา</TableHead>
                  <TableHead>รายการ</TableHead>
                  <TableHead>สถานะ</TableHead>
                  <TableHead>ยอดรวม</TableHead>
                  <TableHead className="text-right">จัดการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                      {tab === "active" ? "ไม่มีออเดอร์ค้างอยู่" : "ยังไม่มีออเดอร์"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrders.map(order => {
                    const cfg = STATUS_CONFIG[order.status as OrderStatus] ?? STATUS_CONFIG.paid;
                    return (
                      <TableRow key={order.id} className="group">
                        <TableCell className="font-bold text-primary text-lg">#{order.queueNumber}</TableCell>
                        <TableCell className="text-sm">{format(new Date(order.createdAt), "dd MMM HH:mm", { locale: th })}</TableCell>
                        <TableCell className="text-sm">{order.items.map(i => `${i.name} x${i.qty}`).join(", ")}</TableCell>
                        <TableCell>
                          <span className={cn("text-xs font-semibold px-2 py-1 rounded-full border", cfg.color)}>
                            {cfg.label}
                          </span>
                        </TableCell>
                        <TableCell className="font-bold">{formatCurrency(order.total)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {order.status === 'ready' && (
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 text-white font-bold gap-1"
                                onClick={() => handleCollectPayment(order)}
                              >
                                <Banknote className="size-4" /> รับเงิน
                              </Button>
                            )}
                            <Button variant="outline" size="icon" onClick={() => handlePreview(order)}>
                              <Eye className="size-4" />
                            </Button>
                            <Button variant="default" size="icon" onClick={() => handlePrint(order)}>
                              <Printer className="size-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-md bg-gray-100 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>ตัวอย่างใบเสร็จ</DialogTitle>
          </DialogHeader>
          <div className="receipt-preview flex justify-center p-4 bg-white rounded-lg shadow-inner">
            <div className="origin-top">
              {selectedOrder && (
                <ReceiptPrintable order={selectedOrder} settings={settings} />
              )}
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>ปิด</Button>
            <Button onClick={() => selectedOrder && handlePrint(selectedOrder)}>
              <Printer className="mr-2 size-4" /> พิมพ์ซ้ำ
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {selectedOrder && !isPreviewOpen && (
        <ReceiptPrintable ref={printRef} order={selectedOrder} settings={settings} />
      )}
    </div>
  );
}
