import { forwardRef } from "react";
import { Order, ShopSettings, formatCurrency, formatDate } from "@/lib/store";

interface ReceiptPrintableProps {
  order: Order;
  settings: ShopSettings;
}

export const ReceiptPrintable = forwardRef<HTMLDivElement, ReceiptPrintableProps>(
  ({ order, settings }, ref) => {
    return (
      <div
        ref={ref}
        id="print-container"
        className="w-[302px] max-w-[302px] mx-auto bg-white text-black p-4 font-mono text-sm leading-tight"
        style={{ fontFamily: "'Space Mono', monospace", color: "#000" }}
      >
        {/* Header */}
        <div className="text-center mb-4">
          {settings.logoDataUrl ? (
            <img
              src={settings.logoDataUrl}
              alt="Logo"
              className="w-16 h-16 object-contain mx-auto mb-2 grayscale"
            />
          ) : (
            <div className="w-16 h-16 border-2 border-black rounded-full flex items-center justify-center mx-auto mb-2 font-bold text-xl">
              {settings.name.charAt(0)}
            </div>
          )}
          <h1 className="font-bold text-lg">{settings.name}</h1>
          <p className="text-xs whitespace-pre-wrap">{settings.address}</p>
          <p className="text-xs">โทร: {settings.phone}</p>
          {settings.taxId && <p className="text-xs">TAX ID: {settings.taxId}</p>}
        </div>

        {/* Order Info */}
        <div className="border-t border-b border-black py-2 mb-4 border-dashed">
          <div className="flex justify-between">
            <span>ออเดอร์:</span>
            <span className="font-bold">{order.orderNumber}</span>
          </div>
          <div className="flex justify-between">
            <span>วันที่:</span>
            <span>{formatDate(order.createdAt)}</span>
          </div>
          <div className="flex justify-between">
            <span>ประเภท:</span>
            <span>
              {order.channel === "dine-in"
                ? "ทานที่ร้าน"
                : order.channel === "takeaway"
                ? "กลับบ้าน"
                : "เดลิเวอรี่"}
            </span>
          </div>
          {order.tableNumber && (
            <div className="flex justify-between">
              <span>โต๊ะ:</span>
              <span className="font-bold">{order.tableNumber}</span>
            </div>
          )}
        </div>

        {/* Items */}
        <div className="mb-4">
          <div className="flex font-bold border-b border-black border-dashed pb-1 mb-2">
            <span className="flex-1">รายการ</span>
            <span className="w-12 text-right">จำนวน</span>
            <span className="w-16 text-right">ราคา</span>
          </div>
          {order.items.map((item, idx) => (
            <div key={idx} className="flex mb-1">
              <span className="flex-1 pr-2 truncate">
                {item.name}
                {item.note && (
                  <span className="block text-xs text-gray-500 truncate">
                    - {item.note}
                  </span>
                )}
              </span>
              <span className="w-12 text-right">{item.qty}</span>
              <span className="w-16 text-right">
                {(item.price * item.qty).toLocaleString()}
              </span>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="border-t border-black border-dashed pt-2 mb-4">
          <div className="flex justify-between">
            <span>ยอดรวม:</span>
            <span>{order.subtotal.toLocaleString()}</span>
          </div>
          {order.vat > 0 && (
            <div className="flex justify-between">
              <span>VAT ({settings.vatRate}%):</span>
              <span>{order.vat.toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between text-lg font-bold mt-1">
            <span>ยอดสุทธิ:</span>
            <span>{order.total.toLocaleString()}</span>
          </div>
          <div className="flex justify-between mt-2 text-xs">
            <span>ชำระโดย:</span>
            <span>
              {order.paymentMethod === "cash"
                ? "เงินสด"
                : order.paymentMethod === "transfer"
                ? "โอนเงิน"
                : "บัตรเครดิต"}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-xs mb-4">{settings.footerMessage}</p>
          <div className="flex justify-center mb-2">
            <div className="font-mono text-2xl tracking-[0.2em] font-bold">
              ||| |||| || |||
            </div>
          </div>
          <p className="text-xs">{order.orderNumber}</p>
        </div>
      </div>
    );
  }
);
ReceiptPrintable.displayName = "ReceiptPrintable";
