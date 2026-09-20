// badminton-admin/src/components/CheckoutModal.jsx
import React from "react";
import { CheckCircle2, X, QrCode, Receipt, Banknote } from "lucide-react";

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
}) {
  if (!isOpen || !booking) return null;

  const courtName = booking.court?.name || "Sân";
  const customerName = booking.user?.name || booking.guestName || "Khách lẻ";

  const BANK_ID = "MB";
  const ACCOUNT_NO = "0912345678";
  const ACCOUNT_NAME = "NGUYEN VAN A";

  const addInfoText = `Thanh toan ${courtName} ${booking.startTime}-${booking.endTime}`;
  const encodedAddInfo = addInfoText.replace(/ /g, "%20");
  const encodedAccountName = ACCOUNT_NAME.replace(/ /g, "%20");

  const qrUrl = `https://img.vietqr.io/image/${BANK_ID}-${ACCOUNT_NO}-compact2.jpg?amount=${remainingAmount}&addInfo=${encodedAddInfo}&accountName=${encodedAccountName}`;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl p-6 shadow-2xl text-slate-100 flex flex-col max-h-[95vh]">
        {/* Header Modal */}
        <div className="flex justify-between items-center pb-4 border-b border-slate-800 mb-5 shrink-0">
          <h3 className="text-base font-bold text-emerald-400 flex items-center gap-2">
            <Receipt size={18} /> XÁC NHẬN THANH TOÁN & CHỌN PHƯƠNG THỨC
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800/60 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Nội dung 2 cột */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto pr-1 flex-1">
          {/* CỘT TRÁI: Chi tiết hóa đơn */}
          <div className="bg-slate-800/40 border border-slate-800 p-4 rounded-xl flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-700/60 pb-2">
                Thông tin chi tiết hóa đơn
              </h4>

              <div className="text-xs space-y-1.5 bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                <div className="flex justify-between">
                  <span className="text-slate-400">Sân:</span>
                  <span className="font-bold text-white">{courtName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Khách hàng:</span>
                  <span className="font-bold text-white">{customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">
                    Thời gian chơi thực tế:
                  </span>
                  <span className="font-bold text-emerald-400">
                    {actualStartTime} - {actualEndTime}
                  </span>
                </div>
              </div>

              <div>
                <p className="text-[11px] font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">
                  Dịch vụ / Sản phẩm:
                </p>
                <div className="space-y-1.5">
                  {invoiceItems.length > 0 ? (
                    invoiceItems.map((item) => (
                      <div
                        key={item.product}
                        className="flex justify-between items-center text-xs bg-slate-900/40 p-2.5 rounded border border-slate-800/60"
                      >
                        <span className="text-slate-200 truncate w-3/5">
                          {item.name} (x{item.quantity})
                        </span>
                        <span className="font-semibold text-emerald-400">
                          {(item.price * item.quantity).toLocaleString("vi-VN")}{" "}
                          đ
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-[11px] text-slate-500 italic">
                      Không có dịch vụ phát sinh.
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="border-t border-slate-700/60 pt-3 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Tiền sân:</span>
                <span className="text-slate-200">
                  {totalCourtFee.toLocaleString("vi-VN")} đ
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Tiền hàng phát sinh:</span>
                <span className="text-slate-200">
                  {productsTotal.toLocaleString("vi-VN")} đ
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Đã cọc trước:</span>
                <span className="text-emerald-400">
                  -{depositPaid.toLocaleString("vi-VN")} đ
                </span>
              </div>
              <div className="flex justify-between font-bold text-sm text-white pt-2 border-t border-slate-700/60">
                <span>Tổng tiền cần trả:</span>
                <span className="text-emerald-400 text-base">
                  {remainingAmount.toLocaleString("vi-VN")} đ
                </span>
              </div>
            </div>
          </div>

          {/* CỘT PHẢI: Mã QR & Nút lựa chọn thanh toán */}
          <div className="bg-slate-800/40 border border-slate-800 p-4 rounded-xl flex flex-col items-center justify-between">
            <div className="w-full flex flex-col items-center justify-center flex-1">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                <QrCode size={15} /> Quét mã QR chuyển khoản
              </h4>

              <div className="bg-white p-2.5 rounded-2xl shadow-xl border border-slate-700 mb-3">
                <img
                  src={qrUrl}
                  alt="QR Thanh Toán"
                  className="w-44 h-44 object-contain rounded"
                />
              </div>
              <p className="text-[11px] text-amber-400 font-medium bg-amber-950/40 px-3 py-1 rounded-lg border border-amber-800/50 text-center">
                Nội dung CK: {addInfoText}
              </p>
            </div>

            {/* Các nút hành động thanh toán (Chỉ còn Tiền mặt và Chuyển khoản) */}
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
                onClick={onClose}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl font-medium transition-all text-xs cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
