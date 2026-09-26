import React, { useState, useEffect } from "react";
import API from "../services/api";
import { toast } from "react-toastify";
import { ShieldAlert } from "lucide-react";

export default function BookingConfirmModal({
  selectedDate = "",
  selectedSlots = [],
  initialTotalPrice = 0,
  initialVoucherCode = "",
  customerInfo,
  setCustomerInfo,
  onClose,
  onSubmit,
}) {
  const [name, setName] = useState(customerInfo?.name || "");
  const [phone, setPhone] = useState(customerInfo?.phone || "");
  const [voucherCode, setVoucherCode] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [discountMessage, setDiscountMessage] = useState("");

  const [paymentType, setPaymentType] = useState("full");

  const [step, setStep] = useState("input"); // 'input' -> 'auth_choice' -> 'qr_payment'
  const [userExists, setUserExists] = useState(false);
  const [currentUserData, setCurrentUserData] = useState(null); // Lưu thông tin chi tiết user để check strikeCount
  const [password, setPassword] = useState("12345678");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const BANK_ID = import.meta.env.VITE_BANK_ID || "MB";
  const ACCOUNT_NO = import.meta.env.VITE_ACCOUNT_NO || "";
  const ACCOUNT_NAME = import.meta.env.VITE_ACCOUNT_NAME || "";

  const safeInitialTotal = Number(initialTotalPrice) || 0;

  useEffect(() => {
    if (voucherCode) {
      applyVoucherCode(voucherCode, safeInitialTotal);
    } else {
      setDiscountAmount(0);
      setDiscountMessage("");
    }
  }, [voucherCode, safeInitialTotal]);

  // Kiểm tra nếu user có strikeCount > 3 hoặc bắt buộc cọc thì ép thanh toán 100%
  const isForceFullDeposit =
    currentUserData &&
    (currentUserData.isRequireDeposit || currentUserData.strikeCount > 3);

  useEffect(() => {
    if (isForceFullDeposit) {
      setPaymentType("full");
    }
  }, [isForceFullDeposit]);

  const applyVoucherCode = async (code, total) => {
    if (!code || !code.trim()) {
      setDiscountAmount(0);
      setDiscountMessage("");
      return;
    }
    try {
      const res = await API.post("/discounts/apply", {
        code: code.trim(),
        orderTotal: total,
      });
      if (res.data && res.data.success) {
        const amount = Number(res.data.data?.discountAmount) || 0;
        setDiscountAmount(amount);
        setDiscountMessage(`Giảm ${amount.toLocaleString()}đ`);
      }
    } catch (error) {
      setDiscountAmount(0);
      setDiscountMessage("Mã không hợp lệ");
    }
  };

  const getGroupedSlots = () => {
    const map = {};
    selectedSlots.forEach((slot) => {
      if (!map[slot.courtId]) {
        map[slot.courtId] = {
          courtName: slot.courtName || `Sân ${slot.courtId}`,
          hours: [],
        };
      }
      map[slot.courtId].hours.push(slot.hour);
    });

    return Object.values(map).map((item) => {
      item.hours.sort((a, b) => a - b);
      const startH = item.hours[0];
      const endH = item.hours[item.hours.length - 1] + 1;
      return {
        courtName: item.courtName,
        timeStr: `${String(startH).padStart(2, "0")}:00 - ${String(endH).padStart(2, "0")}:00`,
      };
    });
  };

  const groupedSlots = getGroupedSlots();
  const slotsDescription = groupedSlots
    .map((slot) => `${slot.courtName}(${slot.timeStr})`)
    .join("_");

  const transferContent =
    `DatSan_${name}_${phone}_${selectedDate}_${slotsDescription}`.replace(
      /\s+/g,
      "",
    );

  const addInfoText = transferContent;
  const encodedAddInfo = addInfoText.replace(/ /g, "%20");
  const encodedAccountName = ACCOUNT_NAME.replace(/ /g, "%20");

  const safeDiscountAmount = Number(discountAmount) || 0;
  const finalTotal = Math.max(0, safeInitialTotal - safeDiscountAmount);

  let payableAmount = finalTotal;
  if (paymentType === "deposit_50" && !isForceFullDeposit) {
    payableAmount = Math.round(finalTotal * 0.5);
  } else if (paymentType === "no_deposit" && !isForceFullDeposit) {
    payableAmount = 0;
  }

  const qrUrl = `https://img.vietqr.io/image/${BANK_ID}-${ACCOUNT_NO}-compact2.jpg?amount=${payableAmount}&addInfo=${encodedAddInfo}&accountName=${encodedAccountName}`;

  const handleCheckCustomer = async (e) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      toast.warning("Vui lòng nhập Tên và Số điện thoại!");
      return;
    }

    setLoading(true);
    try {
      const trimmedPhone = phone.trim();

      // Lấy danh sách users để check biến strikeCount và cờ bắt buộc cọc
      const resUsers = await API.get("/users");
      const allUsers = resUsers.data.success ? resUsers.data.data : [];
      const foundUser = allUsers.find((u) => u.phone === trimmedPhone);

      if (foundUser) {
        setUserExists(true);
        setCurrentUserData(foundUser);
        if (foundUser.strikeCount > 3 || foundUser.isRequireDeposit) {
          toast.warning(
            `Tài khoản có lịch sử bùng sân (${foundUser.strikeCount} lần). Bắt buộc cọc 100%!`,
          );
        }
      } else {
        setUserExists(false);
        setCurrentUserData(null);
      }

      setStep("auth_choice");
    } catch (err) {
      setUserExists(false);
      setCurrentUserData(null);
      setStep("auth_choice");
    } finally {
      setLoading(false);
    }
  };

  const handleAuthAction = async (actionType) => {
    setLoading(true);
    try {
      const trimmedPhone = phone.trim();

      if (actionType === "register") {
        setVoucherCode("TRAINGHIEMSAN");
        await API.post("/auth/register", {
          name: name.trim(),
          phone: trimmedPhone,
          password,
        });
        await API.post("/auth/login", { phone: trimmedPhone, password });
        toast.success("Đăng ký thành công kèm Voucher!");
      } else if (actionType === "login") {
        await API.post("/auth/login", { phone: trimmedPhone, password });
        toast.success("Đăng nhập thành công!");
      } else {
        setVoucherCode("");
        toast.info("Đã bỏ qua đăng nhập/đăng ký.");
      }

      setStep("qr_payment");
    } catch (error) {
      toast.success("Chuyển sang thanh toán!");
      setStep("qr_payment");
    } finally {
      setLoading(false);
    }
  };

  const handleFinalSubmit = () => {
    const isFull = paymentType === "full" || isForceFullDeposit;
    const isDeposit50 = paymentType === "deposit_50" && !isForceFullDeposit;

    onSubmit({
      name: name.trim(),
      phone: phone.trim(),
      voucherCode,
      totalPrice: finalTotal,
      payableAmount: payableAmount,
      isDeposit: isDeposit50 || isFull,
      depositAmount: isFull ? payableAmount : isDeposit50 ? payableAmount : 0,
      depositPercent: isFull ? 100 : isDeposit50 ? 50 : 0,
      discountAmount: safeDiscountAmount,
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl max-w-5xl w-full p-8 text-gray-900 dark:text-slate-100 shadow-2xl space-y-6 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-gray-100 dark:border-slate-800 pb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <span className="text-emerald-500">⚡</span> Xác Nhận Đặt Sân &
              Thanh Toán
            </h2>
            <p className="text-xs text-gray-500 dark:text-slate-400">
              Kiểm tra thông tin chi tiết lịch đặt sân
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-gray-700 dark:hover:text-white bg-gray-50 dark:bg-slate-800 rounded-full transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* BỐ CỤC 2 CỘT */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* CỘT TRÁI */}
          <div className="space-y-4 bg-gray-50/80 dark:bg-slate-950/50 p-6 rounded-2xl border border-gray-100 dark:border-slate-800 flex flex-col justify-between">
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider">
                1. Chi tiết lịch đặt sân
              </h3>

              <div className="space-y-2">
                <span className="text-xs text-gray-500">
                  Ngày chơi:{" "}
                  <strong className="text-gray-800 dark:text-slate-200">
                    {selectedDate}
                  </strong>
                </span>
                {groupedSlots.map((slot, idx) => (
                  <div
                    key={idx}
                    className="bg-white dark:bg-slate-900 px-4 py-2.5 rounded-xl border border-gray-100 dark:border-slate-800 flex justify-between text-xs"
                  >
                    <span className="font-bold text-emerald-600">
                      {slot.courtName}
                    </span>
                    <span className="font-mono text-amber-600 font-bold">
                      {slot.timeStr}
                    </span>
                  </div>
                ))}
              </div>

              {/* CẢNH BÁO BÙNG KÈO & HÌNH THỨC THANH TOÁN */}
              <div className="pt-3 border-t border-gray-200/60 dark:border-slate-800/60 space-y-2.5">
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300">
                  Hình thức thanh toán:
                </label>

                {isForceFullDeposit && (
                  <div className="bg-amber-500/10 border border-amber-500/30 p-2.5 rounded-xl flex items-start gap-2 text-amber-600 dark:text-amber-400 text-xs">
                    <ShieldAlert size={16} className="shrink-0 mt-0.5" />
                    <span>
                      Tài khoản này có lịch sử bùng sân (
                      {currentUserData?.strikeCount || 0} lần). Hệ thống bắt
                      buộc cọc 100% giá trị hóa đơn!
                    </span>
                  </div>
                )}

                <div
                  className={`grid ${isForceFullDeposit ? "grid-cols-1" : "grid-cols-3"} gap-2`}
                >
                  <button
                    type="button"
                    onClick={() => setPaymentType("full")}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                      paymentType === "full" || isForceFullDeposit
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-md"
                        : "bg-white dark:bg-slate-900 text-gray-700 dark:text-slate-300 border-gray-200 dark:border-slate-800"
                    }`}
                  >
                    <span>100% tiền sân</span>
                  </button>

                  {!isForceFullDeposit && (
                    <>
                      <button
                        type="button"
                        onClick={() => setPaymentType("deposit_50")}
                        className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                          paymentType === "deposit_50"
                            ? "bg-amber-600 text-white border-amber-600 shadow-md"
                            : "bg-white dark:bg-slate-900 text-gray-700 dark:text-slate-300 border-gray-200 dark:border-slate-800"
                        }`}
                      >
                        <span>Cọc 50%</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentType("no_deposit")}
                        className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                          paymentType === "no_deposit"
                            ? "bg-blue-600 text-white border-blue-600 shadow-md"
                            : "bg-white dark:bg-slate-900 text-gray-700 dark:text-slate-300 border-gray-200 dark:border-slate-800"
                        }`}
                      >
                        <span>Không cọc (0%)</span>
                      </button>
                    </>
                  )}
                </div>

                <div className="space-y-1.5 text-xs pt-2">
                  <div className="flex justify-between text-gray-500">
                    <span>Tổng tiền gốc:</span>
                    <span>{safeInitialTotal.toLocaleString()} đ</span>
                  </div>
                  {safeDiscountAmount > 0 && (
                    <div className="flex justify-between text-emerald-600 font-medium">
                      <span>Giảm giá voucher:</span>
                      <span>-{safeDiscountAmount.toLocaleString()} đ</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2.5 border-t border-gray-200/60 dark:border-slate-800/60 font-bold text-sm">
                    <span className="text-gray-800 dark:text-slate-200">
                      Số tiền cần thanh toán:
                    </span>
                    <span className="text-amber-600 dark:text-amber-400 text-base font-extrabold">
                      {payableAmount.toLocaleString()} đ
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* THÔNG TIN KHÁCH HÀNG */}
            {name && (
              <div className="mt-4 pt-3 border-t border-gray-200/60 dark:border-slate-800/60 text-xs bg-white dark:bg-slate-900 p-3 rounded-xl border border-gray-100 dark:border-slate-800 space-y-1">
                <span className="font-bold text-gray-700 dark:text-slate-300 block">
                  👤 Thông tin đặt sân:
                </span>
                <div className="text-gray-600 dark:text-slate-400 flex justify-between">
                  <span>
                    Họ tên:{" "}
                    <strong className="text-gray-800 dark:text-slate-200">
                      {name}
                    </strong>
                  </span>
                  <span>
                    SĐT:{" "}
                    <strong className="text-gray-800 dark:text-slate-200">
                      {phone}
                    </strong>
                  </span>
                </div>
                {voucherCode && (
                  <div className="text-emerald-600 font-medium text-[11px]">
                    Voucher áp dụng: {voucherCode}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* CỘT PHẢI */}
          <div className="space-y-4 flex flex-col justify-between">
            {step === "input" && (
              <form onSubmit={handleCheckCustomer} className="space-y-4">
                <h3 className="text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider">
                  2. Thông tin khách hàng
                </h3>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                    Họ và tên <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nhập họ và tên"
                    className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl px-4 py-3 text-xs outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                    Số điện thoại liên hệ{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Nhập số điện thoại"
                    className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl px-4 py-3 text-xs outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                    Mã giảm giá / Voucher (Tùy chọn)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={voucherCode}
                      onChange={(e) => setVoucherCode(e.target.value)}
                      placeholder="Nhập mã voucher"
                      className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        applyVoucherCode(voucherCode, safeInitialTotal)
                      }
                      className="bg-gray-100 dark:bg-slate-800 text-emerald-600 px-4 rounded-xl text-xs font-bold cursor-pointer"
                    >
                      Áp dụng
                    </button>
                  </div>
                  {discountMessage && (
                    <p
                      className={`text-[11px] mt-1.5 ${safeDiscountAmount > 0 ? "text-emerald-600" : "text-red-500"}`}
                    >
                      {discountMessage}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 rounded-xl text-xs shadow-md transition cursor-pointer mt-4"
                >
                  {loading ? "Đang kiểm tra..." : "Tiếp tục thanh toán ➔"}
                </button>
              </form>
            )}

            {step === "auth_choice" && (
              <div className="bg-emerald-500/5 dark:bg-slate-950/80 p-5 rounded-2xl border border-emerald-500/20 space-y-4">
                <h3 className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                  {userExists
                    ? "🔑 Phát hiện tài khoản cũ"
                    : "🎁 Khách hàng mới (Nhận Voucher)"}
                </h3>

                <div>
                  <label className="block text-[11px] text-gray-600 dark:text-slate-400 mb-1.5">
                    Mật khẩu xác thực:
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-emerald-500 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-gray-400 text-xs cursor-pointer"
                    >
                      {showPassword ? "👁️" : "👁️‍🗨️"}
                    </button>
                  </div>
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => handleAuthAction("skip")}
                    className="flex-1 bg-gray-200 dark:bg-slate-800 hover:bg-gray-300 text-gray-700 dark:text-slate-300 py-3 rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    Bỏ qua
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleAuthAction(userExists ? "login" : "register")
                    }
                    disabled={loading}
                    className="flex-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl text-xs shadow-md cursor-pointer"
                  >
                    {userExists ? "Đăng Nhập" : "Đăng Ký & Nhận Voucher"}
                  </button>
                </div>
              </div>
            )}

            {step === "qr_payment" && (
              <div className="bg-emerald-500/10 dark:bg-slate-950 p-6 rounded-2xl border border-emerald-500/30 text-center space-y-4 flex flex-col justify-center h-full">
                {payableAmount > 0 ? (
                  <>
                    <h3 className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">
                      Quét mã QR chuyển khoản ({payableAmount.toLocaleString()}
                      đ)
                    </h3>

                    <div className="bg-white p-4 rounded-2xl border border-gray-200 inline-block shadow-md mx-auto">
                      <img
                        src={qrUrl}
                        alt="QR Code"
                        className="w-80 h-80 object-contain mx-auto rounded-xl"
                      />

                      {/* Chi tiết thông tin chuyển khoản */}
                      <div className="mt-3 pt-2 border-t border-gray-100 text-left space-y-1">
                        <p className="text-[11px] text-gray-500">
                          Khách hàng:{" "}
                          <strong className="text-gray-800">{name}</strong>
                        </p>
                        <p className="text-[11px] text-gray-500">
                          Ngày chơi:{" "}
                          <strong className="text-gray-800">
                            {selectedDate}
                          </strong>
                        </p>
                        <p className="text-[11px] text-gray-500">
                          Khung giờ:{" "}
                          <strong className="text-emerald-600">
                            {slotsDescription}
                          </strong>
                        </p>
                        <p className="text-[11px] font-mono text-gray-700 bg-gray-50 p-1.5 rounded border border-gray-200 mt-1">
                          <strong>Nội dung CK:</strong> {transferContent}
                        </p>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="py-8 space-y-3">
                    <div className="w-14 h-14 bg-blue-500 text-white rounded-full flex items-center justify-center text-2xl mx-auto font-bold shadow-lg">
                      ✓
                    </div>
                    <h3 className="text-sm font-bold text-blue-600 dark:text-blue-400">
                      Đã chọn hình thức không cần cọc (0đ)
                    </h3>
                    <p className="text-xs text-gray-500 max-w-xs mx-auto">
                      Bạn có thể hoàn tất đặt sân ngay lập tức mà không cần
                      chuyển khoản trước.
                    </p>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleFinalSubmit}
                  className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white font-extrabold py-3.5 rounded-xl text-xs shadow-lg cursor-pointer mt-4"
                >
                  Hoàn tất đặt sân ➔
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
