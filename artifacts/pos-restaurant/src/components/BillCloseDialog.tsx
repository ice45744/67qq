import { useState } from "react";
import { Banknote, QrCode, Calculator, Check, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useOrders, formatCurrency } from "@/lib/store";
import { Order } from "@/lib/types";
import { cn } from "@/lib/utils";

interface BillCloseDialogProps {
  order: Order | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called when payment confirmed — parent should close dialog then print */
  onPaid: (order: Order, cashReceived?: number, change?: number) => void;
}

const QUICK_AMOUNTS = [20, 50, 100, 200, 500, 1000];

export function BillCloseDialog({ order, open, onOpenChange, onPaid }: BillCloseDialogProps) {
  const { updateOrderStatus } = useOrders();
  const [method, setMethod] = useState<"cash" | "transfer">("cash");
  const [cashInput, setCashInput] = useState("");

  const total = order?.total ?? 0;
  const cashReceived = parseFloat(cashInput) || 0;
  const change = Math.max(0, cashReceived - total);
  const canPay = method === "transfer" || cashReceived >= total;

  const reset = () => { setCashInput(""); setMethod("cash"); };

  const handleClose = () => { reset(); onOpenChange(false); };

  const handleConfirm = async () => {
    if (!order || !canPay) return;
    await updateOrderStatus(order.id, "paid");
    const paidOrder: Order = { ...order, status: "paid" };
    // Close dialog first, then parent will trigger print
    reset();
    onOpenChange(false);
    onPaid(
      paidOrder,
      method === "cash" ? cashReceived : undefined,
      method === "cash" ? change : undefined,
    );
  };

  if (!order) return null;

  return (
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
                <span className="font-medium">
                  {item.name} <span className="text-muted-foreground">x{item.qty}</span>
                </span>
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
            {(["cash", "transfer"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMethod(m)}
                className={cn(
                  "flex flex-col items-center gap-2 py-3 rounded-xl border-2 transition-all",
                  method === m
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border text-muted-foreground hover:border-muted-foreground"
                )}
              >
                {m === "cash" ? <Banknote className="size-5" /> : <QrCode className="size-5" />}
                <span className="text-sm font-semibold">
                  {m === "cash" ? "เงินสด" : "โอนเงิน / พร้อมเพย์"}
                </span>
              </button>
            ))}
          </div>

          {/* Cash input section */}
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
                {QUICK_AMOUNTS.map((amount) => (
                  <button
                    key={amount}
                    onClick={() => setCashInput(String(amount))}
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

        {/* Footer action */}
        <div className="px-5 pb-5 pt-3 border-t bg-card">
          <Button
            className="w-full h-14 text-base font-bold shadow-lg shadow-primary/20"
            disabled={!canPay}
            onClick={handleConfirm}
          >
            <Check className="mr-2 size-5" />
            {method === "cash"
              ? canPay
                ? `ยืนยัน + พิมพ์ใบเสร็จ · ทอน ${formatCurrency(change)}`
                : "ใส่จำนวนเงินที่รับมา"
              : "ยืนยันรับเงินโอน + พิมพ์ใบเสร็จ"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
