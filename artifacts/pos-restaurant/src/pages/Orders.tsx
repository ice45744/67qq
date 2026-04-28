import { useState, useRef } from "react";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { Search, Printer, Eye } from "lucide-react";
import { useOrders, useSettings, Order, formatCurrency } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ReceiptPrintable } from "@/components/ReceiptPrintable";

export default function Orders() {
  const { orders } = useOrders();
  const { settings } = useSettings();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const filteredOrders = orders.filter(o =>
    String(o.queueNumber).includes(searchTerm.trim())
  );

  const handlePrint = (order: Order) => {
    setIsPreviewOpen(false);
    setSelectedOrder(order);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const handlePreview = (order: Order) => {
    setSelectedOrder(order);
    setIsPreviewOpen(true);
  };

  return (
    <div className="flex-1 p-4 lg:p-8 overflow-y-auto bg-muted/10 pb-20 md:pb-8">
      <div className="max-w-5xl mx-auto space-y-6">

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">รายการออเดอร์</h1>
            <p className="text-muted-foreground">ประวัติออเดอร์ทั้งหมด</p>
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
        </div>

        <div className="bg-card rounded-2xl border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>คิว</TableHead>
                  <TableHead>วันเวลา</TableHead>
                  <TableHead>จำนวนรายการ</TableHead>
                  <TableHead>ยอดรวม</TableHead>
                  <TableHead className="text-right">จัดการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                      ยังไม่มีออเดอร์
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrders.map(order => (
                    <TableRow key={order.id} className="group">
                      <TableCell className="font-bold text-primary text-lg">#{order.queueNumber}</TableCell>
                      <TableCell>{format(new Date(order.createdAt), "dd MMM yy HH:mm", { locale: th })}</TableCell>
                      <TableCell>{order.items.reduce((s, i) => s + i.qty, 0)} รายการ</TableCell>
                      <TableCell className="font-bold">{formatCurrency(order.total)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="icon" onClick={() => handlePreview(order)}>
                            <Eye className="size-4" />
                          </Button>
                          <Button variant="default" size="icon" onClick={() => handlePrint(order)}>
                            <Printer className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
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
