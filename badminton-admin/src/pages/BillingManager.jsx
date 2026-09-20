// badminton-admin/src/pages/BillingManager.jsx
import React, { useState, useEffect } from "react";
import API from "../services/api";
import {
  ShoppingCart,
  Search,
  Clock,
  User,
  CheckCircle2,
  AlertCircle,
  Package,
  Plus,
  Minus,
} from "lucide-react";

import CheckoutModal from "../components/CheckoutModal";

export default function BillingManager() {
  const [checkedInBookings, setCheckedInBookings] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [currentInvoice, setCurrentInvoice] = useState(null);

  const [products, setProducts] = useState([]);
  const [productSearch, setProductSearch] = useState("");

  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [notification, setNotification] = useState({ message: "", type: "" });

  const [actualStartTime, setActualStartTime] = useState("19:00");
  const [actualEndTime, setActualEndTime] = useState("22:00");

  const showNotification = (message, type = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification({ message: "", type: "" }), 3000);
  };

  useEffect(() => {
    fetchCheckedInBookings();
    fetchProducts();
  }, []);

  const fetchCheckedInBookings = async () => {
    try {
      const res = await API.get("/bookings");
      const list = res.data.data || res.data || [];
      const active = list.filter((b) => {
        const status = b.bookingStatus ? b.bookingStatus.toLowerCase() : "";
        return status === "checked_in";
      });
      setCheckedInBookings(active);
    } catch (error) {
      console.error("Lỗi tải danh sách check-in:", error);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await API.get("/products");
      setProducts(res.data.data || []);
    } catch (error) {
      console.error("Lỗi tải sản phẩm:", error);
    }
  };

  const handleSelectBooking = async (booking) => {
    setSelectedBooking(booking);
    setActualStartTime(booking.startTime || "19:00");
    setActualEndTime(booking.endTime || "22:00");

    try {
      const res = await API.get(`/invoices/booking/${booking._id}`);
      if (res.data.success) {
        setCurrentInvoice(res.data.data);
      }
    } catch (error) {
      console.error("Lỗi lấy invoice:", error);
      showNotification("Không thể tải thông tin hóa đơn của sân này!", "error");
    }
  };

  const handleSetCurrentTime = (type) => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const timeString = `${hours}:${minutes}`;

    if (type === "start") {
      setActualStartTime(timeString);
    } else {
      setActualEndTime(timeString);
    }
  };

  const handleAddProduct = async (product) => {
    if (!currentInvoice) return;

    let items = [...currentInvoice.items];
    const existingIndex = items.findIndex((item) => {
      const pId = item.product?._id || item.product;
      return pId === product._id;
    });

    if (existingIndex > -1) {
      items[existingIndex].quantity += 1;
    } else {
      items.push({
        product: product._id,
        name: product.name,
        price: product.price,
        quantity: 1,
      });
    }

    try {
      const res = await API.put(`/invoices/${currentInvoice._id}`, { items });
      if (res.data.success) {
        setCurrentInvoice(res.data.data);
      }
    } catch (error) {
      console.error("Lỗi thêm sản phẩm:", error);
      showNotification("Lỗi thêm sản phẩm vào bill!", "error");
    }
  };

  const handleUpdateQuantity = async (productId, delta) => {
    if (!currentInvoice) return;

    let items = currentInvoice.items
      .map((item) => {
        const pId = item.product?._id || item.product;
        if (pId === productId) {
          const newQty = item.quantity + delta;
          return newQty > 0
            ? { ...item, quantity: newQty, product: pId }
            : null;
        }
        return { ...item, product: item.product?._id || item.product };
      })
      .filter(Boolean);

    try {
      const res = await API.put(`/invoices/${currentInvoice._id}`, { items });
      if (res.data.success) {
        setCurrentInvoice(res.data.data);
      }
    } catch (error) {
      console.error("Lỗi cập nhật số lượng:", error);
      showNotification("Lỗi cập nhật số lượng sản phẩm!", "error");
    }
  };

  const timeToMinutes = (timeStr) => {
    if (!timeStr) return 0;
    const parts = timeStr.split(":");
    const h = parseInt(parts[0], 10) || 0;
    const m = parseInt(parts[1], 10) || 0;
    return h * 60 + m;
  };

  const calculateBookingDurationMinutes = (start, end) => {
    const startMins = timeToMinutes(start);
    let endMins = timeToMinutes(end);
    if (endMins <= startMins) endMins += 24 * 60;
    const diff = endMins - startMins;
    return diff > 0 ? diff : 120;
  };

  const calculateActualMinutes = () => {
    const startMins = timeToMinutes(actualStartTime);
    let endMins = timeToMinutes(actualEndTime);
    if (endMins <= startMins) endMins += 24 * 60;
    const diff = endMins - startMins;
    return diff > 0 ? diff : 0;
  };

  const baseCourtFee = currentInvoice
    ? currentInvoice.courtFee
    : selectedBooking?.totalPrice || 0;
  const originalDurationMins = selectedBooking
    ? calculateBookingDurationMinutes(
        selectedBooking.startTime,
        selectedBooking.endTime,
      )
    : 120;
  const pricePerMinute =
    originalDurationMins > 0
      ? baseCourtFee / originalDurationMins
      : 100000 / 120;

  const actualMinutesPlayed = calculateActualMinutes();
  const totalCourtFee = Math.round(actualMinutesPlayed * pricePerMinute);

  const depositPaid = currentInvoice
    ? currentInvoice.depositPaid
    : selectedBooking?.depositAmount || 0;
  const productsTotal = currentInvoice ? currentInvoice.productsTotal : 0;
  const totalBill = totalCourtFee + productsTotal;
  const remainingAmount = Math.max(0, totalBill - depositPaid);
  const invoiceItems = currentInvoice ? currentInvoice.items : [];

  const handleCheckoutComplete = async (method) => {
    if (!currentInvoice) return;

    let cashierName = "Thu ngân ca trực";
    const adminUserStr = localStorage.getItem("adminUser");
    if (adminUserStr) {
      try {
        const adminUser = JSON.parse(adminUserStr);
        cashierName = adminUser.name || "Thu ngân ca trực";
      } catch (e) {
        console.error("Lỗi đọc adminUser:", e);
      }
    }

    try {
      await API.put(`/invoices/${currentInvoice._id}`, {
        paymentStatus: "paid_full",
        paymentMethod: method,
        cashierName: cashierName,
      });

      const methodNames = {
        cash: "Tiền mặt",
        transfer: "Chuyển khoản",
      };
      const methodNameText = methodNames[method] || "Tiền mặt";

      showNotification(
        `Thanh toán thành công (${methodNameText}) và hoàn tất hóa đơn!`,
      );

      setSelectedBooking(null);
      setCurrentInvoice(null);
      setIsCheckoutModalOpen(false);
      fetchCheckedInBookings();
    } catch (error) {
      console.error("Lỗi thanh toán:", error);
      showNotification("Lỗi khi xử lý thanh toán hóa đơn!", "error");
    }
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(productSearch.toLowerCase()),
  );

  return (
    <div className="w-full min-h-screen p-6 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col relative transition-colors duration-200">
      {notification.message && (
        <div
          className={`mb-4 p-4 rounded-xl text-white font-medium flex items-center gap-3 shadow-lg ${
            notification.type === "error" ? "bg-red-500" : "bg-emerald-600"
          }`}
        >
          <AlertCircle size={20} />
          <span>{notification.message}</span>
        </div>
      )}

      <div className="mb-4">
        <h1 className="text-2xl font-bold flex items-center gap-2 text-slate-800 dark:text-white">
          <ShoppingCart className="text-emerald-500" /> Quản Lý Hóa Đơn & Thanh
          Toán (POS)
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Hệ thống quản lý hóa đơn, dịch vụ phát sinh và thanh toán chuyên
          nghiệp.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 flex-1 items-start">
        {/* CỘT 1: Sân đang check_in */}
        <div className="xl:col-span-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm flex flex-col">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 flex items-center justify-between">
            <span>Sân đang hoạt động</span>
            <span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 text-xs px-2.5 py-0.5 rounded-full font-bold border border-emerald-200 dark:border-emerald-800">
              {checkedInBookings.length} SÂN
            </span>
          </h2>

          <div className="space-y-3 overflow-y-auto pr-1 max-h-[calc(100vh-200px)]">
            {checkedInBookings.length > 0 ? (
              checkedInBookings.map((booking) => {
                const isSelected = selectedBooking?._id === booking._id;
                const customerDisplayName =
                  booking.user?.name || booking.guestName || "Khách lẻ";

                return (
                  <div
                    key={booking._id}
                    onClick={() => handleSelectBooking(booking)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 shadow-sm ring-1 ring-emerald-500"
                        : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-emerald-500/50 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1.5">
                      <span className="font-bold text-slate-800 dark:text-white text-sm">
                        {booking.court?.name || "Sân cầu lông"}
                      </span>
                      <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700/50 px-2 py-0.5 rounded font-bold tracking-wide">
                        Đang chơi
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1">
                      <p className="flex items-center gap-1.5 truncate">
                        <User
                          size={13}
                          className="text-slate-400 dark:text-slate-500 shrink-0"
                        />{" "}
                        Khách:{" "}
                        <span className="font-medium text-slate-700 dark:text-slate-200 truncate">
                          {customerDisplayName}
                        </span>
                      </p>
                      <p className="flex items-center gap-1.5">
                        <Clock
                          size={13}
                          className="text-slate-400 dark:text-slate-500 shrink-0"
                        />{" "}
                        Giờ: {booking.startTime} - {booking.endTime}
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-16 text-slate-400 dark:text-slate-500 italic text-xs">
                Không có sân nào đang check-in lúc này.
              </div>
            )}
          </div>
        </div>

        {/* CỘT 2: Sản phẩm */}
        <div className="xl:col-span-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              1. Kho sản phẩm
            </h2>
            <span className="text-xs text-slate-400 dark:text-slate-500">
              {filteredProducts.length} món
            </span>
          </div>

          <div className="relative mb-3">
            <Search
              className="absolute left-3 top-2.5 text-slate-400 dark:text-slate-500"
              size={15}
            />
            <input
              type="text"
              placeholder="Tìm nhanh nước, cầu..."
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs outline-none focus:border-emerald-500 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
            />
          </div>

          <div className="space-y-2 overflow-y-auto pr-1 max-h-[calc(100vh-210px)]">
            {filteredProducts.length > 0 ? (
              filteredProducts.map((p) => (
                <button
                  key={p._id}
                  onClick={() => handleAddProduct(p)}
                  disabled={!currentInvoice}
                  className={`w-full p-2.5 border rounded-xl text-left flex justify-between items-center transition-all group shadow-sm ${
                    currentInvoice
                      ? "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:border-emerald-500/60 cursor-pointer"
                      : "border-slate-200 dark:border-slate-900 bg-slate-100 dark:bg-slate-900/40 opacity-50 cursor-not-allowed"
                  }`}
                >
                  <div className="pr-2 truncate">
                    <p className="font-semibold text-slate-700 dark:text-slate-200 text-xs truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      {p.name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                        {p.price.toLocaleString("vi-VN")} đ
                      </span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500">
                        Kho: {p.stock}
                      </span>
                    </div>
                  </div>
                  <div className="w-6 h-6 bg-emerald-600 group-hover:bg-emerald-500 text-white rounded-lg flex items-center justify-center text-xs font-bold shrink-0 transition-colors">
                    +
                  </div>
                </button>
              ))
            ) : (
              <div className="py-16 text-center text-slate-400 dark:text-slate-500 text-xs italic">
                Không tìm thấy sản phẩm.
              </div>
            )}
          </div>
        </div>

        {/* CỘT 3: Chi tiết hóa đơn */}
        <div className="xl:col-span-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
              2. Chi tiết hóa đơn
            </h2>

            {selectedBooking && currentInvoice ? (
              <>
                <div className="text-xs text-slate-600 dark:text-slate-300 mb-3 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex justify-between items-center">
                  <div>
                    <p className="font-bold text-slate-800 dark:text-white text-sm">
                      {selectedBooking.court?.name}
                    </p>
                    <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
                      Khách:{" "}
                      <span className="text-slate-700 dark:text-slate-200 font-medium">
                        {selectedBooking.user?.name ||
                          selectedBooking.guestName}
                      </span>
                    </p>
                  </div>
                  <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 px-2.5 py-1 rounded font-medium border border-emerald-200 dark:border-emerald-700/50">
                    Đang chơi
                  </span>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 p-3.5 rounded-xl mb-3 text-xs space-y-3">
                  <div className="flex justify-between items-center text-slate-500 dark:text-slate-400 pb-2.5 border-b border-slate-200 dark:border-slate-800/60">
                    <span>Giờ đặt lịch gốc:</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 text-xs">
                      {selectedBooking.startTime} - {selectedBooking.endTime}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 dark:text-slate-400">
                      Giờ bắt đầu (Thực tế):
                    </span>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="19:00"
                        value={actualStartTime}
                        onChange={(e) => setActualStartTime(e.target.value)}
                        className="w-24 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-emerald-600 dark:text-emerald-400 font-bold text-xs text-center outline-none focus:border-emerald-500"
                      />
                      <button
                        onClick={() => handleSetCurrentTime("start")}
                        title="Lấy giờ hiện tại"
                        className="px-2.5 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-emerald-600 dark:text-emerald-400 border border-slate-200 dark:border-slate-700 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Clock size={14} />
                        <span className="text-[11px] font-semibold">
                          Hiện tại
                        </span>
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 dark:text-slate-400">
                      Giờ kết thúc (Thực tế):
                    </span>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="22:00"
                        value={actualEndTime}
                        onChange={(e) => setActualEndTime(e.target.value)}
                        className="w-24 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-emerald-600 dark:text-emerald-400 font-bold text-xs text-center outline-none focus:border-emerald-500"
                      />
                      <button
                        onClick={() => handleSetCurrentTime("end")}
                        title="Lấy giờ hiện tại"
                        className="px-2.5 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-emerald-600 dark:text-emerald-400 border border-slate-200 dark:border-slate-700 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Clock size={14} />
                        <span className="text-[11px] font-semibold">
                          Hiện tại
                        </span>
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2.5 border-t border-slate-200 dark:border-slate-800/60 text-slate-600 dark:text-slate-300">
                    <span className="text-slate-500 dark:text-slate-400">
                      Tổng tiền sân:
                    </span>
                    <span className="font-bold text-slate-800 dark:text-white text-sm">
                      {totalCourtFee.toLocaleString("vi-VN")} đ
                    </span>
                  </div>
                </div>

                <div className="mt-2">
                  <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wide">
                    Dịch vụ phát sinh:
                  </p>
                  <div className="space-y-2">
                    {invoiceItems.length > 0 ? (
                      invoiceItems.map((item) => {
                        const pId = item.product?._id || item.product;
                        return (
                          <div
                            key={pId}
                            className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl text-xs"
                          >
                            <div className="w-2/5 truncate pr-2">
                              <p className="font-medium text-slate-700 dark:text-slate-200 truncate">
                                {item.name}
                              </p>
                              <p className="text-[10px] text-slate-400 dark:text-slate-500">
                                {item.price.toLocaleString("vi-VN")} đ
                              </p>
                            </div>
                            <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                              <button
                                onClick={() => handleUpdateQuantity(pId, -1)}
                                className="w-5 h-5 text-slate-400 hover:text-slate-700 dark:hover:text-white flex items-center justify-center font-bold cursor-pointer"
                              >
                                <Minus size={12} />
                              </button>
                              <span className="font-semibold px-2 text-slate-800 dark:text-white text-xs">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => handleUpdateQuantity(pId, 1)}
                                className="w-5 h-5 text-slate-400 hover:text-slate-700 dark:hover:text-white flex items-center justify-center font-bold cursor-pointer"
                              >
                                <Plus size={12} />
                              </button>
                            </div>
                            <span className="font-semibold text-emerald-600 dark:text-emerald-400 text-right w-24">
                              {(item.price * item.quantity).toLocaleString(
                                "vi-VN",
                              )}{" "}
                              đ
                            </span>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-xs text-slate-400 dark:text-slate-500 italic py-3 text-center bg-slate-50 dark:bg-slate-800/20 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                        Chưa chọn món phát sinh nào. Bấm vào sản phẩm ở giữa để
                        thêm.
                      </p>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="py-32 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
                <Package
                  size={42}
                  className="stroke-1 mb-2 text-slate-300 dark:text-slate-700"
                />
                <p className="text-xs text-center">
                  Chưa chọn sân nào.
                  <br />
                  Vui lòng chọn sân bên trái để lập bill.
                </p>
              </div>
            )}
          </div>

          {selectedBooking && currentInvoice && (
            <div className="border-t border-slate-200 dark:border-slate-800 pt-3 mt-3 space-y-2 text-xs">
              <div className="flex justify-between text-slate-500 dark:text-slate-400">
                <span>Tiền sân (Tổng):</span>
                <span className="text-slate-700 dark:text-slate-200">
                  {totalCourtFee.toLocaleString("vi-VN")} đ
                </span>
              </div>
              <div className="flex justify-between text-slate-500 dark:text-slate-400">
                <span>Tiền hàng phát sinh:</span>
                <span className="text-slate-700 dark:text-slate-200">
                  {productsTotal.toLocaleString("vi-VN")} đ
                </span>
              </div>
              <div className="flex justify-between text-slate-500 dark:text-slate-400">
                <span>Đã cọc trước:</span>
                <span className="text-emerald-600 dark:text-emerald-400">
                  -{depositPaid.toLocaleString("vi-VN")} đ
                </span>
              </div>
              <div className="flex justify-between font-bold text-sm text-slate-800 dark:text-white pt-2 border-t border-slate-200 dark:border-slate-800/60">
                <span>Cần thanh toán thêm:</span>
                <span className="text-emerald-600 dark:text-emerald-400 text-lg">
                  {remainingAmount.toLocaleString("vi-VN")} đ
                </span>
              </div>

              <button
                onClick={() => setIsCheckoutModalOpen(true)}
                className="w-full mt-3 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer text-sm"
              >
                <CheckCircle2 size={16} /> Tiến Hành Thanh Toán
              </button>
            </div>
          )}
        </div>
      </div>

      <CheckoutModal
        isOpen={isCheckoutModalOpen}
        onClose={() => setIsCheckoutModalOpen(false)}
        onConfirm={handleCheckoutComplete}
        booking={selectedBooking}
        remainingAmount={remainingAmount}
        actualStartTime={actualStartTime}
        actualEndTime={actualEndTime}
        invoiceItems={invoiceItems}
        totalCourtFee={totalCourtFee}
        productsTotal={productsTotal}
        depositPaid={depositPaid}
      />
    </div>
  );
}
