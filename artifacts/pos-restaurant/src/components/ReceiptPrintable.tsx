import { forwardRef } from "react";
import { Order, ShopSettings, formatDate } from "@/lib/store";

interface ReceiptPrintableProps {
  order: Order;
  settings: ShopSettings;
  cashReceived?: number;
  change?: number;
}

const RECEIPT_FONT = "'Sarabun', 'Noto Sans Thai', system-ui, -apple-system, sans-serif";

function QueueTicket({ order, settings }: ReceiptPrintableProps) {
  return (
    <div
      className="receipt-section"
      style={{
        width: "219px",
        maxWidth: "219px",
        margin: "0 auto",
        background: "#fff",
        color: "#000",
        padding: "10px 6px",
        fontFamily: RECEIPT_FONT,
        fontSize: "12px",
        lineHeight: 1.3,
      }}
    >
      <div style={{ textAlign: "center", marginBottom: "6px" }}>
        <div style={{ fontWeight: 700, fontSize: "14px" }}>{settings.name}</div>
        <div style={{ fontSize: "11px", marginTop: "2px" }}>** ใบคิว / สำหรับครัว **</div>
      </div>

      <div
        style={{
          textAlign: "center",
          border: "2px solid #000",
          padding: "8px 4px",
          margin: "6px 0",
        }}
      >
        <div style={{ fontSize: "11px", fontWeight: 600 }}>หมายเลขคิว</div>
        <div
          style={{
            fontSize: "56px",
            fontWeight: 800,
            lineHeight: 1,
            margin: "2px 0",
            letterSpacing: "1px",
          }}
        >
          {order.queueNumber}
        </div>
      </div>

      <div style={{ fontSize: "11px", textAlign: "center", marginBottom: "6px" }}>
        {formatDate(order.createdAt)}
      </div>

      <div style={{ borderTop: "1px dashed #000", margin: "6px 0" }} />

      <div style={{ fontWeight: 700, fontSize: "12px", marginBottom: "4px" }}>รายการอาหาร</div>
      {order.items.map((item, idx) => (
        <div
          key={idx}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: "4px",
            fontSize: "13px",
            fontWeight: 600,
          }}
        >
          <span style={{ flex: 1, paddingRight: "4px", wordBreak: "break-word" }}>
            {item.name}
            {item.note && (
              <div style={{ fontSize: "11px", fontWeight: 400, marginTop: "2px" }}>
                หมายเหตุ: {item.note}
              </div>
            )}
          </span>
          <span style={{ fontWeight: 800, whiteSpace: "nowrap" }}>x{item.qty}</span>
        </div>
      ))}

      <div style={{ borderTop: "1px dashed #000", margin: "8px 0" }} />

      <div style={{ textAlign: "center", fontSize: "11px", marginTop: "4px" }}>
        ** กรุณาเรียกหมายเลขคิว **
      </div>
    </div>
  );
}

function CustomerReceipt({ order, settings, cashReceived, change }: ReceiptPrintableProps) {
  return (
    <div
      className="receipt-section"
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
      <div style={{ textAlign: "center", marginBottom: "6px" }}>
        {settings.logoDataUrl && (
          <img
            src={settings.logoDataUrl}
            alt="Logo"
            style={{
              width: "44px",
              height: "44px",
              objectFit: "contain",
              margin: "0 auto 4px",
              display: "block",
            }}
          />
        )}
        <div style={{ fontWeight: 700, fontSize: "15px" }}>{settings.name}</div>
        <div style={{ fontSize: "11px", marginTop: "2px" }}>ใบเสร็จลูกค้า</div>
      </div>

      <div style={{ borderTop: "1px dashed #000", borderBottom: "1px dashed #000", padding: "4px 0", margin: "6px 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>คิว</span>
          <span style={{ fontWeight: 800, fontSize: "14px" }}>#{order.queueNumber}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>วันที่</span>
          <span>{formatDate(order.createdAt)}</span>
        </div>
      </div>

      <div style={{ marginBottom: "6px" }}>
        <div
          style={{
            display: "flex",
            fontWeight: 700,
            borderBottom: "1px dashed #000",
            paddingBottom: "3px",
            marginBottom: "4px",
            fontSize: "11px",
          }}
        >
          <span style={{ flex: 1 }}>รายการ</span>
          <span style={{ width: "26px", textAlign: "center" }}>x</span>
          <span style={{ width: "50px", textAlign: "right" }}>ราคา</span>
        </div>
        {order.items.map((item, idx) => (
          <div key={idx} style={{ marginBottom: "4px" }}>
            <div style={{ display: "flex", alignItems: "flex-start" }}>
              <span style={{ flex: 1, paddingRight: "2px", wordBreak: "break-word" }}>
                {item.name}
              </span>
              <span style={{ width: "26px", textAlign: "center" }}>{item.qty}</span>
              <span style={{ width: "50px", textAlign: "right" }}>
                {(item.price * item.qty).toLocaleString("th-TH")}
              </span>
            </div>
            {item.note && (
              <div style={{ fontSize: "11px", paddingLeft: "2px", marginTop: "1px" }}>
                - {item.note}
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{ borderTop: "1px dashed #000", paddingTop: "4px", marginBottom: "4px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: "15px",
            fontWeight: 800,
          }}
        >
          <span>ยอดสุทธิ</span>
          <span>{order.total.toLocaleString("th-TH")} บาท</span>
        </div>

        {cashReceived !== undefined && cashReceived > 0 && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px", fontSize: "12px" }}>
              <span>รับเงิน</span>
              <span>{cashReceived.toLocaleString("th-TH")} บาท</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", fontWeight: 700 }}>
              <span>เงินทอน</span>
              <span>{(change ?? 0).toLocaleString("th-TH")} บาท</span>
            </div>
          </>
        )}
      </div>

      <div style={{ textAlign: "center", marginTop: "8px" }}>
        <div style={{ fontSize: "11px", marginBottom: "6px" }}>{settings.footerMessage}</div>
        <div style={{ fontSize: "13px", fontWeight: 800, letterSpacing: "1px" }}>
          คิว #{order.queueNumber}
        </div>
      </div>
    </div>
  );
}

export const ReceiptPrintable = forwardRef<HTMLDivElement, ReceiptPrintableProps>(
  ({ order, settings, cashReceived, change }, ref) => {
    return (
      <div ref={ref} id="print-container">
        <QueueTicket order={order} settings={settings} />
        <div className="receipt-cut" />
        <CustomerReceipt order={order} settings={settings} cashReceived={cashReceived} change={change} />
      </div>
    );
  }
);
ReceiptPrintable.displayName = "ReceiptPrintable";
