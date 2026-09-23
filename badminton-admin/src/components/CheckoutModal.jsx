import React, { useRef } from "react";
import {
  CheckCircle2,
  X,
  QrCode,
  Receipt,
  Banknote,
  Printer,
} from "lucide-react";

export default function CheckoutModal({
  isOpen,
  onClose,
  onConfirm,
  booking,
  remainingAmount,
  actualStartTime,
  actualEndTime,
  invoiceItems,
  totalCourtFee,
  productsTotal,
  depositPaid,
  paidItemsAmount = 0,
  discountAmount = 0,
  appliedVoucher = null,
}) {
  const printRef = useRef(null);

  if (!isOpen || !booking) return null;

  const courtName = booking.court?.name || "Sân";
  const customerName = booking.user?.name || booking.guestName || "Khách lẻ";

  const BANK_ID = import.meta.env.VITE_BANK_ID;
  const ACCOUNT_NO = import.meta.env.VITE_ACCOUNT_NO;
  const ACCOUNT_NAME = import.meta.env.VITE_ACCOUNT_NAME;

  const addInfoText = `Thanh toan ${courtName} ${booking.startTime}-${booking.endTime}`;
  const encodedAddInfo = addInfoText.replace(/ /g, "%20");
  const encodedAccountName = ACCOUNT_NAME.replace(/ /g, "%20");

  const qrUrl = `https://img.vietqr.io/image/${BANK_ID}-${ACCOUNT_NO}-compact2.jpg?amount=${remainingAmount}&addInfo=${encodedAddInfo}&accountName=${encodedAccountName}`;

  const handlePrintReceipt = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open("", "_blank", "width=400,height=600");
    printWindow.document.write(`
      <html>
        <head>
          <title>Hóa đơn thanh toán - ${courtName}</title>
          <style>
            body {
              font-family: 'Courier New', Courier, monospace;
              font-size: 12px;
              width: 80mm;
              margin: 0;
              padding: 10px;
              color: #000;
            }
            .text-center { text-align: center; }
            .font-bold { font-weight: bold; }
            .flex { display: flex; justify-content: space-between; }
            .border-b { border-bottom: 1px dashed #000; padding-bottom: 5px; margin-bottom: 5px; }
            .mt-2 { margin-top: 10px; }
            table { width: 100%; border-collapse: collapse; margin-top: 5px; }
            th, td { text-align: left; padding: 3px 0; font-size: 11px; }
            .text-right { text-align: right; }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
          <script>
            window.onload = function() {
              window.print();
              window.close();
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-4xl p-6 shadow-2xl text-slate-800 dark:text-slate-100 flex flex-col max-h-[95vh]">
        <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800 mb-5 shrink-0">
          <h3 className="text-base font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
            <Receipt size={18} /> XÁC NHẬN THANH TOÁN & CHỌN PHƯƠNG THỨC
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg bg-slate-100 dark:bg-slate-800/60 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto pr-1 flex-1">
          <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 p-4 rounded-xl flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700/60 pb-2">
                Thông tin chi tiết hóa đơn
              </h4>

              <div className="text-xs space-y-1.5 bg-white dark:bg-slate-900/60 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">
                    Sân:
                  </span>
                  <span className="font-bold text-slate-800 dark:text-white">
                    {courtName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">
                    Khách hàng:
                  </span>
                  <span className="font-bold text-slate-800 dark:text-white">
                    {customerName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">
                    Thời gian chơi thực tế:
                  </span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {actualStartTime} - {actualEndTime}
                  </span>
                </div>
              </div>

              <div>
                <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">
                  Dịch vụ / Sản phẩm:
                </p>
                <div className="space-y-1.5">
                  {invoiceItems.length > 0 ? (
                    invoiceItems.map((item) => {
                      const pId = item.product?._id || item.product;
                      return (
                        <div
                          key={pId}
                          className="flex justify-between items-center text-xs bg-white dark:bg-slate-900/40 p-2.5 rounded border border-slate-200 dark:border-slate-800/60"
                        >
                          <span className="text-slate-700 dark:text-slate-200 truncate w-3/5">
                            {item.name} (x{item.quantity}){" "}
                            {item.isPaid && (
                              <span className="text-emerald-600 dark:text-emerald-400 text-[10px]">
                                (Đã trả lẻ)
                              </span>
                            )}
                          </span>
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                            {(item.price * item.quantity).toLocaleString(
                              "vi-VN",
                            )}{" "}
                            đ
                          </span>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 italic">
                      Không có dịch vụ phát sinh.
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="border-t border-slate-200 dark:border-slate-700/60 pt-3 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-500 dark:text-slate-400">
                <span>Tiền sân:</span>
                <span className="text-slate-700 dark:text-slate-200">
                  {totalCourtFee.toLocaleString("vi-VN")} đ
                </span>
              </div>
              <div className="flex justify-between text-slate-500 dark:text-slate-400">
                <span>Tổng tiền hàng phát sinh:</span>
                <span className="text-slate-700 dark:text-slate-200">
                  {productsTotal.toLocaleString("vi-VN")} đ
                </span>
              </div>
              {paidItemsAmount > 0 && (
                <div className="flex justify-between text-amber-600 dark:text-amber-400">
                  <span>Đã thanh toán lẻ các món trước:</span>
                  <span>-{paidItemsAmount.toLocaleString("vi-VN")} đ</span>
                </div>
              )}
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-medium">
                  <span>Giảm giá Voucher ({appliedVoucher?.code}):</span>
                  <span>-{discountAmount.toLocaleString("vi-VN")} đ</span>
                </div>
              )}
              <div className="flex justify-between text-slate-500 dark:text-slate-400">
                <span>Đã cọc trước:</span>
                <span className="text-emerald-600 dark:text-emerald-400">
                  -{depositPaid.toLocaleString("vi-VN")} đ
                </span>
              </div>
              <div className="flex justify-between font-bold text-sm text-slate-800 dark:text-white pt-2 border-t border-slate-200 dark:border-slate-700/60">
                <span>Tổng tiền còn lại cần trả:</span>
                <span className="text-emerald-600 dark:text-emerald-400 text-base">
                  {remainingAmount.toLocaleString("vi-VN")} đ
                </span>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 p-4 rounded-xl flex flex-col items-center justify-between">
            <div className="w-full flex flex-col items-center justify-center flex-1">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-1.5">
                <QrCode size={15} /> Quét mã QR chuyển khoản
              </h4>

              <div className="bg-white p-2.5 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 mb-3">
                <img
                  src={qrUrl}
                  alt="QR Thanh Toán"
                  className="w-44 h-44 object-contain rounded"
                />
              </div>
              <p className="text-[11px] text-amber-700 dark:text-amber-400 font-medium bg-amber-50 dark:bg-amber-950/40 px-3 py-1 rounded-lg border border-amber-200 dark:border-amber-800/50 text-center">
                Nội dung CK: {addInfoText}
              </p>
            </div>

            <div className="w-full space-y-2 mt-4">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onConfirm("cash")}
                  className="py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-semibold transition-all text-xs cursor-pointer flex items-center justify-center gap-1.5 shadow-md"
                >
                  <Banknote size={15} /> Tiền Mặt
                </button>
                <button
                  onClick={() => onConfirm("transfer")}
                  className="py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold transition-all text-xs cursor-pointer flex items-center justify-center gap-1.5 shadow-md"
                >
                  <CheckCircle2 size={15} /> Chuyển Khoản
                </button>
              </div>

              <button
                onClick={handlePrintReceipt}
                className="w-full py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-medium transition-all text-xs cursor-pointer flex items-center justify-center gap-1.5 shadow-md"
              >
                <Printer size={15} /> In Hóa Đơn
              </button>

              <button
                onClick={onClose}
                className="w-full py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl font-medium transition-all text-xs cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: "none" }}>
        <div ref={printRef}>
          <div className="text-center font-bold" style={{ fontSize: "14px" }}>
            HỆ THỐNG SÂN CẦU LÔNG TONO
          </div>
          <div className="text-center" style={{ fontSize: "11px" }}>
            ĐC: Ninh Kiều, Cần Thơ
          </div>
          <div className="text-center" style={{ fontSize: "11px" }}>
            Hotline: 0909.xxx.xxx
          </div>
          <div className="border-b mt-2"></div>

          <div
            className="text-center font-bold"
            style={{ fontSize: "13px", margin: "8px 0" }}
          >
            PHIẾU THANH TOÁN
          </div>

          <div>Ngày: {new Date().toLocaleDateString("vi-VN")}</div>
          <div>Khách hàng: {customerName}</div>
          <div>Sân: {courtName}</div>
          <div>
            Giờ chơi: {actualStartTime} - {actualEndTime}
          </div>
          <div>
            Thu ngân:{" "}
            {JSON.parse(localStorage.getItem("adminUser") || "{}").name ||
              "Thu ngân"}
          </div>
          <div className="border-b mt-2"></div>

          <table>
            <thead>
              <tr className="border-b">
                <th>Nội dung</th>
                <th className="text-center">SL</th>
                <th className="text-right">Tiền</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Tiền sân ({courtName})</td>
                <td className="text-center">1</td>
                <td className="text-right">
                  {totalCourtFee.toLocaleString("vi-VN")}đ
                </td>
              </tr>
              {invoiceItems.map((item, idx) => {
                const itemTotal = item.price * item.quantity;
                return (
                  <tr key={idx}>
                    <td>
                      <span
                        style={
                          item.isPaid
                            ? { textDecoration: "line-through", color: "#666" }
                            : {}
                        }
                      >
                        {item.name}
                      </span>
                      {item.isPaid && (
                        <span
                          style={{
                            fontSize: "10px",
                            fontStyle: "italic",
                            display: "block",
                            color: "#666",
                          }}
                        >
                          (Đã trả lẻ)
                        </span>
                      )}
                    </td>
                    <td
                      className="text-center"
                      style={
                        item.isPaid
                          ? { color: "#666", textDecoration: "line-through" }
                          : {}
                      }
                    >
                      {item.quantity}
                    </td>
                    <td
                      className="text-right"
                      style={
                        item.isPaid
                          ? { textDecoration: "line-through", color: "#666" }
                          : {}
                      }
                    >
                      {itemTotal.toLocaleString("vi-VN")}đ
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="border-b mt-2"></div>

          <div className="flex">
            <span>Tiền sân:</span>
            <span>{totalCourtFee.toLocaleString("vi-VN")}đ</span>
          </div>
          <div className="flex">
            <span>Tổng tiền hàng phát sinh:</span>
            <span>{productsTotal.toLocaleString("vi-VN")}đ</span>
          </div>
          {paidItemsAmount > 0 && (
            <div className="flex" style={{ color: "#333" }}>
              <span>Đã trả lẻ các món trước:</span>
              <span>-{paidItemsAmount.toLocaleString("vi-VN")}đ</span>
            </div>
          )}
          {depositPaid > 0 && (
            <div className="flex">
              <span>Đã cọc trước:</span>
              <span>-{depositPaid.toLocaleString("vi-VN")}đ</span>
            </div>
          )}
          {discountAmount > 0 && (
            <div className="flex">
              <span>Giảm giá voucher:</span>
              <span>-{discountAmount.toLocaleString("vi-VN")}đ</span>
            </div>
          )}
          <div className="border-b mt-2"></div>

          <div className="flex font-bold" style={{ fontSize: "13px" }}>
            <span>THANH TOÁN CUỐI GIỜ:</span>
            <span>{remainingAmount.toLocaleString("vi-VN")}đ</span>
          </div>
          <div className="border-b mt-2"></div>

          <div className="text-center mt-3">
            <div
              style={{
                fontSize: "11px",
                fontWeight: "bold",
                marginBottom: "4px",
              }}
            >
              QUÉT MÃ QR ĐỂ THANH TOÁN
            </div>
            <img
              src={`https://img.vietqr.io/image/${BANK_ID}-${ACCOUNT_NO}-compact2.jpg?amount=${remainingAmount}&addInfo=${encodedAddInfo}&accountName=${encodedAccountName}`}
              alt="QR Code"
              style={{
                width: "120px",
                height: "120px",
                margin: "0 auto",
                display: "block",
              }}
            />
          </div>

          <div className="text-center mt-3" style={{ fontSize: "11px" }}>
            Cảm ơn quý khách và hẹn gặp lại!
          </div>
        </div>
      </div>
    </div>
  );
}
