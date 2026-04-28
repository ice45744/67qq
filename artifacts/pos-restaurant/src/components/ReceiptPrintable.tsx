import { forwardRef } from "react";
import { Order, ShopSettings, formatDate } from "@/lib/store";

interface ReceiptPrintableProps {
  order: Order;
  settings: ShopSettings;
}

const RECEIPT_FONT = "'Sarabun', 'Noto Sans Thai', system-ui, -apple-system, sans-serif";

function QueueTicket({ order, settings }: ReceiptPrintableProps) {
  return (
    <div
      className="receipt-section"
      style={{
        width: "302px",
        maxWidth: "302px",
        margin: "0 auto",
        background: "#fff",
        color: "#000",
        padding: "16px 12px",
        fontFamily: RECEIPT_FONT,
        fontSize: "14px",
        lineHeight: 1.35,
      }}
    >
      <div style={{ textAlign: "center", marginBottom: "8px" }}>
        <div style={{ fontWeight: 700, fontSize: "16px" }}>{settings.name}</div>
        <div style={{ fontSize: "12px", marginTop: "2px" }}>** ใบคิว / สำหรับครัว **</div>
      </div>

      <div
        style={{
          textAlign: "center",
          border: "2px solid #000",
          padding: "12px 8px",
          margin: "8px 0",
        }}
      >
        <div style={{ fontSize: "13px", fontWeight: 600 }}>หมายเลขคิว</div>
        <div
          style={{
            fontSize: "72px",
            fontWeight: 800,
            lineHeight: 1,
            margin: "4px 0",
            letterSpacing: "2px",
          }}
        >
          {order.queueNumber}
        </div>
      </div>

      <div style={{ fontSize: "12px", textAlign: "center", marginBottom: "8px" }}>
        {formatDate(order.createdAt)}
      </div>

      <div style={{ borderTop: "1px dashed #000", margin: "8px 0" }} />

      <div style={{ fontWeight: 700, fontSize: "14px", marginBottom: "6px" }}>รายการอาหาร</div>
      {order.items.map((item, idx) => (
        <div
          key={idx}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: "4px",
            fontSize: "15px",
            fontWeight: 600,
          }}
        >
          <span style={{ flex: 1, paddingRight: "8px", wordBreak: "break-word" }}>
            {item.name}
            {item.note && (
              <div style={{ fontSize: "12px", fontWeight: 400, marginTop: "2px" }}>
                หมายเหตุ: {item.note}
              </div>
            )}
          </span>
          <span style={{ fontWeight: 800, whiteSpace: "nowrap" }}>x{item.qty}</span>
        </div>
      ))}

      <div style={{ borderTop: "1px dashed #000", margin: "10px 0" }} />

      <div style={{ textAlign: "center", fontSize: "12px", marginTop: "6px" }}>
        ** กรุณาเรียกหมายเลขคิว **
      </div>
    </div>
  );
}

function CustomerReceipt({ order, settings }: ReceiptPrintableProps) {
  return (
    <div
      className="receipt-section"
      style={{
        width: "302px",
        maxWidth: "302px",
        margin: "0 auto",
        background: "#fff",
        color: "#000",
        padding: "16px 12px",
        fontFamily: RECEIPT_FONT,
        fontSize: "14px",
        lineHeight: 1.4,
      }}
    >
      <div style={{ textAlign: "center", marginBottom: "8px" }}>
        {settings.logoDataUrl && (
          <img
            src={settings.logoDataUrl}
            alt="Logo"
            style={{
              width: "56px",
              height: "56px",
              objectFit: "contain",
              margin: "0 auto 6px",
              display: "block",
            }}
          />
        )}
        <div style={{ fontWeight: 700, fontSize: "18px" }}>{settings.name}</div>
        <div style={{ fontSize: "12px", marginTop: "2px" }}>ใบเสร็จลูกค้า</div>
      </div>

      <div style={{ borderTop: "1px dashed #000", borderBottom: "1px dashed #000", padding: "6px 0", margin: "8px 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>หมายเลขคิว</span>
          <span style={{ fontWeight: 800, fontSize: "16px" }}>#{order.queueNumber}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>วันที่</span>
          <span>{formatDate(order.createdAt)}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>ประเภท</span>
          <span>กลับบ้าน</span>
        </div>
      </div>

      <div style={{ marginBottom: "8px" }}>
        <div
          style={{
            display: "flex",
            fontWeight: 700,
            borderBottom: "1px dashed #000",
            paddingBottom: "4px",
            marginBottom: "6px",
          }}
        >
          <span style={{ flex: 1 }}>รายการ</span>
          <span style={{ width: "40px", textAlign: "center" }}>จำนวน</span>
          <span style={{ width: "70px", textAlign: "right" }}>ราคา</span>
        </div>
        {order.items.map((item, idx) => (
          <div key={idx} style={{ marginBottom: "6px" }}>
            <div style={{ display: "flex", alignItems: "flex-start" }}>
              <span style={{ flex: 1, paddingRight: "4px", wordBreak: "break-word" }}>
                {item.name}
              </span>
              <span style={{ width: "40px", textAlign: "center" }}>{item.qty}</span>
              <span style={{ width: "70px", textAlign: "right" }}>
                {(item.price * item.qty).toLocaleString("th-TH")}
              </span>
            </div>
            {item.note && (
              <div style={{ fontSize: "12px", paddingLeft: "4px", marginTop: "2px" }}>
                - {item.note}
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{ borderTop: "1px dashed #000", paddingTop: "6px", marginBottom: "10px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: "18px",
            fontWeight: 800,
          }}
        >
          <span>ยอดสุทธิ</span>
          <span>{order.total.toLocaleString("th-TH")} บาท</span>
        </div>
      </div>

      <div style={{ textAlign: "center", marginTop: "12px" }}>
        <div style={{ fontSize: "12px", marginBottom: "8px" }}>{settings.footerMessage}</div>
        <div style={{ fontSize: "16px", fontWeight: 800, letterSpacing: "1px" }}>
          คิว #{order.queueNumber}
        </div>
      </div>
    </div>
  );
}

export const ReceiptPrintable = forwardRef<HTMLDivElement, ReceiptPrintableProps>(
  ({ order, settings }, ref) => {
    return (
      <div ref={ref} id="print-container">
        <QueueTicket order={order} settings={settings} />
        <div className="receipt-cut" />
        <CustomerReceipt order={order} settings={settings} />
      </div>
    );
  }
);
ReceiptPrintable.displayName = "ReceiptPrintable";
