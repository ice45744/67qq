import { useState, useRef } from "react";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { CalendarIcon, Search, Printer, Eye } from "lucide-react";
import { useOrders, useSettings, Order, formatCurrency, formatDate } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
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
    o.orderNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handlePrint = (order: Order) => {
    setSelectedOrder(order);
    setTimeout(() => {
      window.print();
    }, 100);
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
            <p className="text-muted-foreground">ประวัติการขายทั้งหมด</p>
          </div>
          
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="ค้นหาเลขออเดอร์..."
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
                  <TableHead>เลขออเดอร์</TableHead>
                  <TableHead>เวลา</TableHead>
                  <TableHead>ช่องทาง</TableHead>
                  <TableHead>ยอดชำระ</TableHead>
                  <TableHead>วิธีชำระ</TableHead>
                  <TableHead className="text-right">จัดการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                      ไม่พบออเดอร์
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrders.map(order => (
                    <TableRow key={order.id} className="group">
                      <TableCell className="font-medium">{order.orderNumber}</TableCell>
                      <TableCell>{format(new Date(order.createdAt), "dd MMM yy HH:mm", { locale: th })}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="font-normal">
                          {order.channel === 'dine-in' ? `ทานที่ร้าน (${order.tableNumber})` : 
                           order.channel === 'takeaway' ? 'กลับบ้าน' : 'เดลิเวอรี่'}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-bold text-primary">{formatCurrency(order.total)}</TableCell>
                      <TableCell>
                        {order.paymentMethod === 'cash' ? 'เงินสด' : 
                         order.paymentMethod === 'transfer' ? 'โอนเงิน' : 'บัตร'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity sm:opacity-100">
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

      {/* Preview Modal */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-md bg-gray-100">
          <DialogHeader>
            <DialogTitle>ตัวอย่างใบเสร็จ</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center p-4 bg-white rounded-lg shadow-inner overflow-hidden">
            <div className="transform scale-[0.85] origin-top">
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

      {/* Hidden element for actual printing */}
      {selectedOrder && !isPreviewOpen && (
        <ReceiptPrintable ref={printRef} order={selectedOrder} settings={settings} />
      )}
    </div>
  );
}
