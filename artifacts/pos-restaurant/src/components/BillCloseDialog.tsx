import { useState, useRef } from "react";
import { Banknote, QrCode, Calculator, Check, Printer, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useOrders, useSettings, formatCurrency } from "@/lib/store";
import { Order } from "@/lib/types";
import { ReceiptPrintable } from "@/components/ReceiptPrintable";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface BillCloseDialogProps {
  order: Order | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const QUICK_AMOUNTS = [20, 50, 100, 200, 500, 1000];

export function BillCloseDialog({ order, open, onOpenChange }: BillCloseDialogProps) {
  const { updateOrderStatus } = useOrders();
  const { settings } = useSettings();
  const { toast } = useToast();
  const printRef = useRef<HTMLDivElement>(null);

  const [method, setMethod] = useState<"cash" | "transfer">("cash");
  const [cashInput, setCashInput] = useState("");
  const [printingOrder, setPrintingOrder] = useState<Order | null>(null);
  const [paid, setPaid] = useState(false);

  const total = order?.total ?? 0;
  const cashReceived = parseFloat(cashInput) || 0;
  const change = Math.max(0, cashReceived - total);
  const canPay = method === "transfer" || cashReceived >= total;

  const reset = () => {
    setCashInput("");
    setPaid(false);
    setMethod("cash");
  };

  const handleClose = () => {
    reset();
    onOpenChange(false);
  };

  const handleQuickAmount = (amount: number) => {
    setCashInput(String(amount));
  };

  const handleConfirm = () => {
    if (!order || !canPay) return;
    updateOrderStatus(order.id, "paid");
    setPaid(true);
    const paidOrder = { ...order, status: "paid" as const };
    setPrintingOrder(paidOrder);
    toast({
      title: `ปิดบิลคิว #${order.queueNumber} เรียบร้อย`,
      description: method === "cash"
        ? `รับเงิน ${formatCurrency(cashReceived)} ทอน ${formatCurrency(change)}`
        : "โอนเงินเรียบร้อย",
    });
    setTimeout(() => {
      window.print();
      setTimeout(() => setPrintingOrder(null), 500);
    }, 150);
  };

  if (!order) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); else onOpenChange(v); }}>
        <DialogContent className="max-w-md w-[95vw] p-0 overflow-hidden rounded-2xl">
          <DialogHeader className="px-5 pt-5 pb-0">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <Calculator className="size-5 text-primary" />
                ปิดบิล — คิว #{order.queueNumber}
              </DialogTitle>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={handleClose}>
                <X className="size-4" />
              </Button>
            </div>
          </DialogHeader>

          <div className="px-5 py-4 space-y-4 overflow-y-auto max-h-[75vh]">
            {/* Order summary */}
            <div className="bg-muted/50 rounded-xl p-4 space-y-2">
              {order.items.map((item, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="font-medium">{item.name} <span className="text-muted-foreground">x{item.qty}</span></span>
                  <span>{formatCurrency(item.price * item.qty)}</span>
                </div>
              ))}
              <div className="border-t pt-2 mt-2 flex justify-between font-bold text-lg">
                <span>ยอดรวม</span>
                <span className="text-primary">{formatCurrency(total)}</span>
              </div>
            </div>

            {/* Payment method */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setMethod("cash")}
                className={cn(
                  "flex flex-col items-center gap-2 py-3 rounded-xl border-2 transition-all",
                  method === "cash"
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border text-muted-foreground hover:border-muted-foreground"
                )}
              >
                <Banknote className="size-5" />
                <span className="text-sm font-semibold">เงินสด</span>
              </button>
              <button
                onClick={() => setMethod("transfer")}
                className={cn(
                  "flex flex-col items-center gap-2 py-3 rounded-xl border-2 transition-all",
                  method === "transfer"
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border text-muted-foreground hover:border-muted-foreground"
                )}
              >
                <QrCode className="size-5" />
                <span className="text-sm font-semibold">โอนเงิน / พร้อมเพย์</span>
              </button>
            </div>

            {/* Cash input */}
            {method === "cash" && (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-muted-foreground">รับเงินมา (บาท)</label>
                  <Input
                    type="number"
                    inputMode="numeric"
                    placeholder="0"
                    value={cashInput}
                    onChange={(e) => setCashInput(e.target.value)}
                    className="text-2xl font-bold h-14 text-center"
                  />
                </div>

                {/* Quick amount buttons */}
                <div className="grid grid-cols-3 gap-2">
                  {QUICK_AMOUNTS.map(amount => (
                    <button
                      key={amount}
                      onClick={() => handleQuickAmount(amount)}
                      className={cn(
                        "py-2.5 rounded-xl text-sm font-semibold border transition-all",
                        cashInput === String(amount)
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-muted/50 border-border hover:bg-muted"
                      )}
                    >
                      ฿{amount}
                    </button>
                  ))}
                </div>

                {/* Exact amount shortcut */}
                <button
                  onClick={() => setCashInput(String(total))}
                  className="w-full py-2.5 rounded-xl text-sm font-semibold border border-dashed border-border hover:bg-muted transition-all text-muted-foreground"
                >
                  พอดี {formatCurrency(total)}
                </button>

                {/* Change display */}
                <div className={cn(
                  "rounded-xl p-4 flex justify-between items-center",
                  change > 0 ? "bg-green-50 border border-green-200" : "bg-muted/30"
                )}>
                  <span className="text-sm font-medium text-muted-foreground">เงินทอน</span>
                  <span className={cn(
                    "text-2xl font-black",
                    change > 0 ? "text-green-600" : "text-muted-foreground"
                  )}>
                    {formatCurrency(change)}
                  </span>
                </div>
              </div>
            )}

            {method === "transfer" && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
                <QrCode className="size-10 text-blue-500 mx-auto mb-2" />
                <p className="font-semibold text-blue-700">ยอด {formatCurrency(total)}</p>
                <p className="text-xs text-blue-500 mt-1">ลูกค้าโอนเงินผ่านพร้อมเพย์ / QR Code</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-5 pb-5 pt-2 border-t bg-card">
            {paid ? (
              <Button
                className="w-full h-14 text-base font-bold bg-green-600 hover:bg-green-700"
                onClick={() => { setPrintingOrder(order); setTimeout(() => { window.print(); setTimeout(() => setPrintingOrder(null), 500); }, 100); }}
              >
                <Printer className="mr-2 size-5" /> พิมพ์ใบเสร็จซ้ำ
              </Button>
            ) : (
              <Button
                className="w-full h-14 text-base font-bold shadow-lg shadow-primary/20"
                disabled={!canPay}
                onClick={handleConfirm}
              >
                <Check className="mr-2 size-5" />
                {method === "cash"
                  ? canPay ? `ยืนยัน · ทอน ${formatCurrency(change)}` : "ใส่จำนวนเงินที่รับมา"
                  : "ยืนยันรับเงินโอน"}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {printingOrder && (
        <ReceiptPrintable
          ref={printRef}
          order={printingOrder}
          settings={settings}
          cashReceived={method === "cash" ? cashReceived : undefined}
          change={method === "cash" ? change : undefined}
        />
      )}
    </>
  );
}
