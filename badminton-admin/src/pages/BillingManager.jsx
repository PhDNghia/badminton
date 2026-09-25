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
  Check,
  Tag,
  CircleDot,
  Receipt,
  X,
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

  // State quản lý giờ độc lập cho từng sân theo bookingId: { [bId]: { startTime, endTime } }
  const [courtTimes, setCourtTimes] = useState({});

  // State quản lý Modal thêm sân phát sinh
  const [isAddCourtModalOpen, setIsAddCourtModalOpen] = useState(false);
  const [availableCourts, setAvailableCourts] = useState([]);

  // State quản lý Voucher
  const [voucherCode, setVoucherCode] = useState("");
  const [appliedVoucher, setAppliedVoucher] = useState(null);
  const [discountAmount, setDiscountAmount] = useState(0);

  const showNotification = (message, type = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification({ message: "", type: "" }), 3500);
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

      const groupedMap = {};
      active.forEach((b) => {
        const key =
          b.groupBookingId ||
          `${b.user?._id || b.guestPhone || b.guestName}_${b.date}_${b.startTime}_${b.endTime}`;

        if (!groupedMap[key]) {
          groupedMap[key] = {
            ...b,
            allCourts: [b.court],
            allBookingIds: [b._id],
            allBookingsData: [b],
          };
        } else {
          const courtId = b.court?._id || b.court;
          const exists = groupedMap[key].allCourts.some(
            (c) => (c?._id || c) === courtId,
          );
          if (!exists) {
            groupedMap[key].allCourts.push(b.court);
          }
          groupedMap[key].allBookingIds.push(b._id);
          groupedMap[key].allBookingsData.push(b);
        }
      });

      setCheckedInBookings(Object.values(groupedMap));
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
    setVoucherCode("");
    setAppliedVoucher(null);
    setDiscountAmount(0);

    const initialTimes = {};
    if (booking.allBookingsData && booking.allBookingsData.length > 0) {
      booking.allBookingsData.forEach((subB) => {
        initialTimes[subB._id] = {
          startTime: subB.startTime || "07:00",
          endTime: subB.endTime || "10:00",
        };
      });
    } else if (booking.allBookingIds) {
      booking.allBookingIds.forEach((bId) => {
        initialTimes[bId] = {
          startTime: booking.startTime || "07:00",
          endTime: booking.endTime || "10:00",
        };
      });
    }

    try {
      const res = await API.get(`/invoices/booking/${booking._id}`);
      if (res.data.success) {
        const inv = res.data.data;
        setCurrentInvoice(inv);

        // Khôi phục giờ từ courtTimes hoặc courtDetails đã lưu trong DB
        if (inv.courtTimes && Object.keys(inv.courtTimes).length > 0) {
          Object.assign(initialTimes, inv.courtTimes);
        } else if (inv.courtDetails && inv.courtDetails.length > 0) {
          booking.allBookingIds.forEach((bId, idx) => {
            const detail =
              inv.courtDetails[idx] ||
              inv.courtDetails.find(
                (d) =>
                  (d.court?._id || d.court) ===
                  (booking.allCourts?.[idx]?._id || booking.allCourts?.[idx]),
              );
            if (detail && detail.actualStartTime && detail.actualEndTime) {
              initialTimes[bId] = {
                startTime: detail.actualStartTime,
                endTime: detail.actualEndTime,
              };
            }
          });
        }
      }
    } catch (error) {
      console.error("Lỗi lấy invoice:", error);
      showNotification("Không thể tải thông tin hóa đơn của sân này!", "error");
    }

    setCourtTimes(initialTimes);
  };

  const handleUpdateCourtTimesInDB = async (timesToUpdate) => {
    if (!selectedBooking) return;
    // Ưu tiên dùng dữ liệu timesToUpdate truyền trực tiếp vào
    const targetTimes = timesToUpdate || courtTimes;

    try {
      const invRes = await API.get(`/invoices/booking/${selectedBooking._id}`);
      if (!invRes.data.success || !invRes.data.data) {
        throw new Error("Không thể lấy thông tin hóa đơn cho sân này!");
      }
      const activeInvoice = invRes.data.data;

      const courtDetails = selectedBooking.allBookingIds.map((bId, index) => {
        const courtObj = selectedBooking.allCourts?.[index];
        const courtId = courtObj?._id || courtObj;
        const t = targetTimes[bId] || {
          startTime: selectedBooking.startTime || "07:00",
          endTime: selectedBooking.endTime || "10:00",
        };

        const startStr = t.startTime || "07:00";
        const endStr = t.endTime || "10:00";
        const startParts = startStr.split(":");
        const endParts = endStr.split(":");

        const startH = parseInt(startParts[0], 10) || 0;
        const endH = parseInt(endParts[0], 10) || 0;
        const hours = Math.max(1, endH - startH);
        const price = calculateCourtFeeByHours(startStr, endStr);

        return {
          court: courtId,
          actualStartTime: startStr,
          actualEndTime: endStr,
          hoursPlayed: hours,
          price: price,
        };
      });

      const res = await API.put(`/invoices/${activeInvoice._id}`, {
        courtDetails: courtDetails,
        items: activeInvoice.items,
        courtTimes: targetTimes,
      });

      if (res.data.success) {
        setCurrentInvoice(res.data.data);
        showNotification("Đã cập nhật giờ sân và tính lại tiền!");
      }
    } catch (error) {
      console.error(
        "Chi tiết lỗi từ Server:",
        error.response?.data || error.message,
      );
      showNotification(
        error.response?.data?.message || "Lỗi lưu giờ sân trên server!",
        "error",
      );
    }
  };

  const handleSetCurrentTimeForCourt = (bId, type) => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const timeString = `${hours}:${minutes}`;

    setCourtTimes((prev) => {
      const current = prev[bId] || { startTime: "07:00", endTime: "10:00" };
      const updated = {
        ...prev,
        [bId]: {
          ...current,
          [type === "start" ? "startTime" : "endTime"]: timeString,
        },
      };
      handleUpdateCourtTimesInDB(updated);
      return updated;
    });
  };

  const handleOpenAddCourtModal = async () => {
    if (!selectedBooking) return;
    try {
      const [resCourts, resBookings] = await Promise.all([
        API.get("/courts"),
        API.get("/bookings"),
      ]);

      const courtsData = resCourts.data.data || resCourts.data || [];
      const bookingsData = resBookings.data.data || resBookings.data || [];

      const bookingDate = new Date(selectedBooking.date)
        .toISOString()
        .split("T")[0];
      const targetStartH = parseInt(
        selectedBooking.startTime.split(":")[0],
        10,
      );
      const targetEndH = parseInt(selectedBooking.endTime.split(":")[0], 10);

      const bookedCourtIds = new Set();
      bookingsData.forEach((b) => {
        if (b.bookingStatus === "cancelled") return;
        const bDate = new Date(b.date).toISOString().split("T")[0];
        if (bDate !== bookingDate) return;

        const bStart = parseInt((b.startTime || "00:00").split(":")[0], 10);
        const bEnd = parseInt((b.endTime || "00:00").split(":")[0], 10);

        if (targetStartH < bEnd && targetEndH > bStart) {
          const cId = b.court?._id || b.court;
          bookedCourtIds.add(cId);
        }
      });

      const freeCourts = courtsData.filter((c) => !bookedCourtIds.has(c._id));
      setAvailableCourts(freeCourts);
      setIsAddCourtModalOpen(true);
    } catch (err) {
      console.error("Lỗi tải danh sách sân trống:", err);
      showNotification("Không thể tải danh sách sân trống!", "error");
    }
  };

  const handleConfirmAddExtraCourt = async (courtId) => {
    try {
      const res = await API.post("/bookings/add-extra-court", {
        existingBookingId: selectedBooking._id,
        newCourtId: courtId,
      });
      if (res.data.success) {
        showNotification(
          "Đã thêm sân phát sinh và gộp vào hóa đơn thành công!",
        );
        setIsAddCourtModalOpen(false);
        fetchCheckedInBookings();
        const invRes = await API.get(
          `/invoices/booking/${selectedBooking._id}`,
        );
        if (invRes.data.success) setCurrentInvoice(invRes.data.data);
      }
    } catch (err) {
      console.error("Lỗi thêm sân phát sinh:", err);
      showNotification(
        err.response?.data?.message || "Lỗi khi thêm sân phát sinh!",
        "error",
      );
    }
  };

  const handleAddProduct = async (product) => {
    if (!currentInvoice) return;

    let items = [...currentInvoice.items];
    const existingIndex = items.findIndex((item) => {
      const pId = item.product?._id || item.product;
      return pId === product._id && !item.isPaid;
    });

    if (existingIndex > -1) {
      items[existingIndex].quantity += 1;
    } else {
      items.push({
        product: product._id,
        name: product.name,
        price: product.price,
        quantity: 1,
        isPaid: false,
      });
    }

    try {
      const res = await API.put(`/invoices/${currentInvoice._id}`, {
        items,
        courtTimes,
      });
      if (res.data.success) {
        setCurrentInvoice(res.data.data);
      }
    } catch (error) {
      console.error("Lỗi thêm sản phẩm:", error);
      showNotification("Lỗi thêm sản phẩm vào bill!", "error");
    }
  };

  const handleUpdateQuantity = async (productId, delta, isPaid = false) => {
    if (!currentInvoice) return;

    let items = currentInvoice.items
      .map((item) => {
        const pId = item.product?._id || item.product;
        if (pId === productId && Boolean(item.isPaid) === Boolean(isPaid)) {
          const newQty = item.quantity + delta;
          return newQty > 0
            ? { ...item, quantity: newQty, product: pId }
            : null;
        }
        return { ...item, product: item.product?._id || item.product };
      })
      .filter(Boolean);

    try {
      const res = await API.put(`/invoices/${currentInvoice._id}`, {
        items,
        courtTimes,
      });
      if (res.data.success) {
        setCurrentInvoice(res.data.data);
      }
    } catch (error) {
      console.error("Lỗi cập nhật số lượng:", error);
      showNotification("Lỗi cập nhật số lượng sản phẩm!", "error");
    }
  };

  const handleTogglePaidItem = async (productId) => {
    if (!currentInvoice) return;

    let items = currentInvoice.items.map((item) => {
      const pId = item.product?._id || item.product;
      if (pId === productId) {
        return { ...item, product: pId, isPaid: !item.isPaid };
      }
      return { ...item, product: item.product?._id || item.product };
    });

    try {
      const res = await API.put(`/invoices/${currentInvoice._id}`, {
        items,
        courtTimes,
      });
      if (res.data.success) {
        setCurrentInvoice(res.data.data);
        showNotification("Đã cập nhật trạng thái thanh toán lẻ cho món hàng!");
      }
    } catch (error) {
      console.error("Lỗi cập nhật trạng thái trả lẻ:", error);
      showNotification("Lỗi cập nhật trạng thái món hàng!", "error");
    }
  };

  const timeToMinutes = (timeStr) => {
    if (!timeStr) return 0;
    const parts = timeStr.split(":");
    const h = parseInt(parts[0], 10) || 0;
    const m = parseInt(parts[1], 10) || 0;
    return h * 60 + m;
  };

  const calculateCourtFeeByHours = (startStr, endStr) => {
    if (!startStr || !endStr) return 0;

    const startMins = timeToMinutes(startStr);
    let endMins = timeToMinutes(endStr);

    if (endMins <= startMins) {
      endMins += 24 * 60;
    }

    let totalFee = 0;
    let currentMins = startMins;

    while (currentMins < endMins) {
      const hourOfDay = Math.floor((currentMins / 60) % 24);

      let hourlyRate = 30000;
      if (hourOfDay >= 0 && hourOfDay <= 5) {
        hourlyRate = 60000;
      } else if (hourOfDay >= 6 && hourOfDay <= 16) {
        hourlyRate = 30000;
      } else {
        hourlyRate = 60000;
      }

      const nextHourMins = Math.min(
        Math.ceil((currentMins + 1) / 60) * 60,
        endMins,
      );
      const durationInThisHour = nextHourMins - currentMins;

      totalFee += (hourlyRate / 60) * durationInThisHour;
      currentMins = nextHourMins;
    }

    return Math.round(totalFee);
  };

  const totalCourtFee = React.useMemo(() => {
    if (!selectedBooking?.allBookingIds) return 0;
    let sum = 0;
    selectedBooking.allBookingIds.forEach((bId) => {
      const t = courtTimes[bId];
      if (t) {
        sum += calculateCourtFeeByHours(t.startTime, t.endTime);
      }
    });
    return sum;
  }, [courtTimes, selectedBooking]);

  const depositPaid =
    currentInvoice?.depositPaid ||
    selectedBooking?.depositAmount ||
    selectedBooking?.depositPaid ||
    0;

  const productsTotal = currentInvoice ? currentInvoice.productsTotal : 0;

  const paidItemsAmount = currentInvoice?.items
    ? currentInvoice.items
        .filter((item) => item.isPaid)
        .reduce((sum, item) => sum + item.price * item.quantity, 0)
    : 0;

  const totalBill = totalCourtFee + productsTotal;

  const handleApplyVoucher = async () => {
    if (!voucherCode.trim()) {
      showNotification("Vui lòng nhập mã voucher!", "error");
      return;
    }

    try {
      const res = await API.post("/discounts/apply", {
        code: voucherCode.trim(),
        orderTotal: totalBill,
      });

      if (res.data.success) {
        const data = res.data.data;
        setAppliedVoucher({
          code: data.code,
          discountType: data.discountType,
          discountValue: data.discountValue,
        });
        setDiscountAmount(data.discountAmount);
        showNotification(
          res.data.message ||
            `Áp dụng mã thành công (-${data.discountAmount.toLocaleString("vi-VN")} đ)!`,
        );
      }
    } catch (error) {
      console.error("Lỗi áp dụng voucher:", error);
      const errMsg =
        error.response?.data?.message || "Không thể áp dụng mã giảm giá!";
      showNotification(errMsg, "error");
      setAppliedVoucher(null);
      setDiscountAmount(0);
    }
  };

  useEffect(() => {
    if (appliedVoucher) {
      const minOrder =
        appliedVoucher.minOrderValue || appliedVoucher.minOrder || 0;
      if (totalBill < minOrder) {
        showNotification(
          "Hóa đơn thay đổi không còn đủ điều kiện dùng mã giảm giá này!",
          "error",
        );
        setAppliedVoucher(null);
        setDiscountAmount(0);
      } else {
        const discountVal =
          appliedVoucher.discountValue || appliedVoucher.value || 0;
        const discountType =
          appliedVoucher.discountType || appliedVoucher.type || "fixed";
        let calc =
          discountType === "percentage" || discountType.includes("Phần trăm")
            ? Math.round((totalBill * discountVal) / 100)
            : discountVal;
        setDiscountAmount(calc);
      }
    }
  }, [totalBill]);

  const remainingAmount = Math.max(
    0,
    totalBill - depositPaid - paidItemsAmount - discountAmount,
  );
  const invoiceItems = currentInvoice ? currentInvoice.items : [];

  const handleCheckoutComplete = async (method) => {
    if (!currentInvoice || !selectedBooking) return;

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
      const courtDetails = selectedBooking.allBookingIds.map((bId, index) => {
        const courtObj = selectedBooking.allCourts?.[index];
        const courtId = courtObj?._id || courtObj;
        const t = courtTimes[bId] || { startTime: "07:00", endTime: "10:00" };

        const startH = parseInt(t.startTime.split(":")[0], 10) || 0;
        const endH = parseInt(t.endTime.split(":")[0], 10) || 0;
        const hours = Math.max(1, endH - startH);
        const price = calculateCourtFeeByHours(t.startTime, t.endTime);

        return {
          court: courtId,
          actualStartTime: t.startTime,
          actualEndTime: t.endTime,
          hoursPlayed: hours,
          price: price,
        };
      });

      // Đổi lại đường dẫn endpoint thành chuẩn /invoices/{id}
      await API.put(`/invoices/${currentInvoice._id}`, {
        paymentStatus: "paid_full",
        paymentMethod: method,
        cashierName: cashierName,
        depositPaid: depositPaid,
        discountAmount: discountAmount,
        discountCode: appliedVoucher ? appliedVoucher.code : null,
        courtDetails: courtDetails,
        courtTimes: courtTimes,
        items: currentInvoice.items,
      });

      const bookingIdsToComplete = selectedBooking?.allBookingIds || [
        selectedBooking?._id,
      ];

      const methodNames = {
        cash: "Tiền mặt",
        transfer: "Chuyển khoản",
      };
      const methodNameText = methodNames[method] || "Tiền mặt";

      showNotification(
        `Thanh toán thành công (${methodNameText}) và lưu hóa đơn thành công!`,
      );

      if (bookingIdsToComplete.length > 0) {
        setCheckedInBookings((prev) =>
          prev.filter((b) => !bookingIdsToComplete.includes(b._id)),
        );
      }

      setSelectedBooking(null);
      setCurrentInvoice(null);
      setVoucherCode("");
      setAppliedVoucher(null);
      setDiscountAmount(0);
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
        <div className="fixed top-6 right-6 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <div
            className={`px-4 py-3 rounded-xl text-white font-medium flex items-center gap-2.5 shadow-xl border ${
              notification.type === "error"
                ? "bg-rose-600 border-rose-500"
                : "bg-emerald-600 border-emerald-500"
            }`}
          >
            <AlertCircle size={18} className="shrink-0" />
            <span className="text-xs max-w-xs font-medium">
              {notification.message}
            </span>
          </div>
        </div>
      )}

      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2 text-slate-800 dark:text-white">
          <ShoppingCart className="text-emerald-600" size={24} /> Quản Lý Hóa
          Đơn & Thanh Toán
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Hệ thống quản lý hóa đơn, dịch vụ phát sinh và thanh toán chuyên
          nghiệp
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 flex-1 items-start">
        {/* CỘT 1: SÂN Đang CHECK-IN */}
        <div className="xl:col-span-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <CircleDot size={14} className="text-emerald-500" /> Sân đang hoạt
              động
            </h2>
            <span className="bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs px-2.5 py-0.5 rounded-full font-bold border border-emerald-200 dark:border-emerald-800">
              {checkedInBookings.length} SÂN
            </span>
          </div>

          <div className="space-y-2.5 overflow-y-auto pr-1 max-h-[calc(100vh-210px)]">
            {checkedInBookings.length > 0 ? (
              checkedInBookings.map((booking) => {
                const isSelected = selectedBooking?._id === booking._id;
                const customerDisplayName =
                  booking.user?.name || booking.guestName || "Khách lẻ";

                return (
                  <div
                    key={booking._id}
                    onClick={() => handleSelectBooking(booking)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? "border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/40 shadow-xs ring-1 ring-emerald-500"
                        : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-emerald-500/50 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1.5">
                      <span className="font-bold text-slate-800 dark:text-white text-sm">
                        {booking.allCourts && booking.allCourts.length > 1
                          ? booking.allCourts
                              .map((c) => c?.name || "Sân")
                              .join(", ")
                          : booking.court?.name || "Sân cầu lông"}
                      </span>
                      <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700/50 px-2 py-0.5 rounded-full font-semibold">
                        Đang chơi
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1">
                      <p className="flex items-center gap-1.5 truncate">
                        <User
                          size={13}
                          className="text-slate-400 dark:text-slate-500 shrink-0"
                        />
                        <span className="font-medium text-slate-700 dark:text-slate-200 truncate">
                          {customerDisplayName}
                        </span>
                      </p>
                      <p className="flex items-center gap-1.5">
                        <Clock
                          size={13}
                          className="text-slate-400 dark:text-slate-500 shrink-0"
                        />
                        Giờ: {booking.startTime} - {booking.endTime}
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-16 text-slate-400 dark:text-slate-500 italic text-xs">
                Không có sân nào đang check-in.
              </div>
            )}
          </div>
        </div>

        {/* CỘT 2: KHO SẢN PHẨM */}
        <div className="xl:col-span-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-xs flex flex-col">
          <div className="flex justify-between items-center mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Package size={14} className="text-emerald-500" /> Kho sản phẩm
            </h2>
            <span className="text-xs text-slate-400 font-medium">
              {filteredProducts.length} món
            </span>
          </div>

          <div className="relative mb-3">
            <Search
              className="absolute left-3.5 top-2.5 text-slate-400"
              size={15}
            />
            <input
              type="text"
              placeholder="Tìm nhanh nước, cầu..."
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800 dark:text-white placeholder-slate-400 transition"
            />
          </div>

          <div className="space-y-2 overflow-y-auto pr-1 max-h-[calc(100vh-220px)]">
            {filteredProducts.length > 0 ? (
              filteredProducts.map((p) => (
                <button
                  key={p._id}
                  onClick={() => handleAddProduct(p)}
                  disabled={!currentInvoice}
                  className={`w-full p-2.5 border rounded-xl text-left flex justify-between items-center transition-all group shadow-xs ${
                    currentInvoice
                      ? "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:border-emerald-500/60 cursor-pointer"
                      : "border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/20 opacity-50 cursor-not-allowed"
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
                      <span className="text-[10px] text-slate-400">
                        Kho: {p.stock}
                      </span>
                    </div>
                  </div>
                  <div className="w-6 h-6 bg-emerald-600 group-hover:bg-emerald-700 text-white rounded-lg flex items-center justify-center text-xs font-bold shrink-0 transition-colors">
                    <Plus size={14} />
                  </div>
                </button>
              ))
            ) : (
              <div className="py-16 text-center text-slate-400 text-xs italic">
                Không tìm thấy sản phẩm.
              </div>
            )}
          </div>
        </div>

        {/* CỘT 3: CHI TIẾT HÓA ĐƠN & VOUCHER */}
        <div className="xl:col-span-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Receipt size={14} className="text-emerald-500" /> Chi tiết hóa
                đơn
              </h2>
            </div>

            {selectedBooking && currentInvoice ? (
              <>
                <div className="text-xs text-slate-600 dark:text-slate-300 mb-3 bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 flex justify-between items-center">
                  <div>
                    <p className="font-bold text-slate-800 dark:text-white text-sm">
                      {selectedBooking.allCourts &&
                      selectedBooking.allCourts.length > 1
                        ? selectedBooking.allCourts
                            .map((c) => c?.name || "Sân")
                            .join(", ")
                        : selectedBooking.court?.name || "Sân cầu lông"}
                      {currentInvoice?.courts &&
                        currentInvoice.courts.length > 1 && (
                          <span className="text-emerald-600 dark:text-emerald-400 ml-1.5 font-semibold">
                            (Gộp {currentInvoice.courts.length} sân)
                          </span>
                        )}
                    </p>
                    <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
                      Khách hàng:{" "}
                      <span className="text-slate-700 dark:text-slate-200 font-medium">
                        {selectedBooking.user?.name ||
                          selectedBooking.guestName}
                      </span>
                    </p>
                  </div>
                  <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700/50 px-2 py-0.5 rounded-full font-semibold">
                    Đang chơi
                  </span>
                </div>

                <button
                  onClick={handleOpenAddCourtModal}
                  className="w-full mb-3 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-600/50 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer text-xs shadow-sm"
                >
                  <Plus size={15} /> Lấy Thêm Sân Mới Cho Khách Này
                </button>

                <div className="space-y-3 mb-3">
                  {selectedBooking.allBookingIds &&
                  selectedBooking.allBookingIds.length > 0 ? (
                    selectedBooking.allBookingIds.map((bId, index) => {
                      const courtObj = selectedBooking.allCourts?.[index];
                      const courtName = courtObj?.name || `Sân ${index + 1}`;
                      const currentTimes = courtTimes[bId] || {
                        startTime: selectedBooking.startTime || "07:00",
                        endTime: selectedBooking.endTime || "10:00",
                      };

                      return (
                        <div
                          key={bId}
                          className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 p-3.5 rounded-xl text-xs space-y-2.5"
                        >
                          <div className="flex justify-between items-center pb-1 border-b border-slate-200 dark:border-slate-700/60">
                            <span className="font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                              {courtName}
                              {index === 0 ? (
                                <span className="text-[9px] bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 px-1.5 py-0.5 rounded font-semibold">
                                  Sân chính
                                </span>
                              ) : (
                                <span className="text-[9px] bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 px-1.5 py-0.5 rounded font-semibold">
                                  Sân phát sinh
                                </span>
                              )}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-slate-400 text-[10px]">
                                Tiền sân:{" "}
                                {calculateCourtFeeByHours(
                                  currentTimes.startTime,
                                  currentTimes.endTime,
                                ).toLocaleString("vi-VN")}{" "}
                                đ
                              </span>
                              {/* NÚT BẤM LƯU GIỜ TRỰC QUAN */}
                              <button
                                onClick={() =>
                                  handleUpdateCourtTimesInDB(courtTimes)
                                }
                                className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] rounded font-semibold transition cursor-pointer"
                              >
                                Lưu giờ
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            {/* Ô Bắt đầu */}
                            <div className="flex items-center justify-between bg-white dark:bg-slate-800 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
                              <span className="text-slate-400 text-[11px]">
                                Bắt đầu:
                              </span>
                              <div className="flex items-center gap-1">
                                <input
                                  type="text"
                                  value={currentTimes.startTime}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setCourtTimes((prev) => {
                                      const updated = {
                                        ...prev,
                                        [bId]: {
                                          ...currentTimes,
                                          startTime: val,
                                        },
                                      };
                                      return updated;
                                    });
                                  }}
                                  onBlur={() =>
                                    handleUpdateCourtTimesInDB(courtTimes)
                                  }
                                  className="w-14 text-right bg-transparent font-bold text-emerald-600 dark:text-emerald-400 outline-none font-mono text-xs"
                                  cursor-pointer
                                />
                                <button
                                  onClick={() =>
                                    handleSetCurrentTimeForCourt(bId, "start")
                                  }
                                  title="Lấy giờ hiện tại"
                                  className="text-slate-400 hover:text-emerald-500 p-0.5 cursor-pointer"
                                >
                                  <Clock size={12} />
                                </button>
                              </div>
                            </div>

                            {/* Ô Kết thúc */}
                            <div className="flex items-center justify-between bg-white dark:bg-slate-800 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
                              <span className="text-slate-400 text-[11px]">
                                Kết thúc:
                              </span>
                              <div className="flex items-center gap-1">
                                <input
                                  type="text"
                                  value={currentTimes.endTime}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setCourtTimes((prev) => {
                                      const updated = {
                                        ...prev,
                                        [bId]: {
                                          ...currentTimes,
                                          endTime: val,
                                        },
                                      };
                                      return updated;
                                    });
                                  }}
                                  onBlur={() =>
                                    handleUpdateCourtTimesInDB(courtTimes)
                                  }
                                  className="w-14 text-right bg-transparent font-bold text-emerald-600 dark:text-emerald-400 outline-none font-mono text-xs"
                                />
                                <button
                                  onClick={() =>
                                    handleSetCurrentTimeForCourt(bId, "end")
                                  }
                                  title="Lấy giờ hiện tại"
                                  className="text-slate-400 hover:text-emerald-500 p-0.5 cursor-pointer"
                                >
                                  <Clock size={12} />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-xs text-slate-400 p-2 text-center">
                      Đang tải danh sách sân...
                    </div>
                  )}
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 p-3 rounded-xl mb-3 text-xs flex justify-between items-center text-slate-600 dark:text-slate-300">
                  <span className="font-semibold text-slate-500 dark:text-slate-400">
                    Tổng tiền tất cả các sân:
                  </span>
                  <span className="font-bold text-slate-800 dark:text-white text-sm">
                    {totalCourtFee.toLocaleString("vi-VN")} đ
                  </span>
                </div>

                <div className="mt-2">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                      Dịch vụ phát sinh
                    </p>
                    <span className="text-[10px] text-slate-400 italic">
                      Bấm nút tick nếu khách trả tiền lẻ từng món
                    </span>
                  </div>
                  <div className="space-y-2">
                    {invoiceItems.length > 0 ? (
                      invoiceItems.map((item) => {
                        const pId = item.product?._id || item.product;
                        const isPaid = item.isPaid || false;
                        return (
                          <div
                            key={`${pId}-${isPaid}`}
                            className={`flex justify-between items-center border p-2.5 rounded-xl text-xs transition-all ${
                              isPaid
                                ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800/60"
                                : "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800"
                            }`}
                          >
                            <div className="w-2/5 truncate pr-2">
                              <p className="font-medium text-slate-700 dark:text-slate-200 truncate flex items-center gap-1.5">
                                {item.name}
                                {isPaid && (
                                  <span className="text-[9px] bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded font-bold shrink-0">
                                    Đã trả lẻ
                                  </span>
                                )}
                              </p>
                              <p className="text-[10px] text-slate-400">
                                {item.price.toLocaleString("vi-VN")} đ
                              </p>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleTogglePaidItem(pId)}
                                title={
                                  isPaid
                                    ? "Hủy đánh dấu trả lẻ"
                                    : "Xác nhận khách đã trả tiền món này ngay"
                                }
                                className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors cursor-pointer border ${
                                  isPaid
                                    ? "bg-emerald-600 border-emerald-600 text-white shadow-xs"
                                    : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 hover:text-emerald-600"
                                }`}
                              >
                                <Check size={14} />
                              </button>

                              <div className="flex items-center gap-1 bg-white dark:bg-slate-800 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                                <button
                                  onClick={() =>
                                    handleUpdateQuantity(pId, -1, isPaid)
                                  }
                                  className="w-5 h-5 text-slate-400 hover:text-slate-700 dark:hover:text-white flex items-center justify-center font-bold cursor-pointer"
                                >
                                  <Minus size={12} />
                                </button>
                                <span className="font-semibold px-2 text-slate-800 dark:text-white text-xs">
                                  {item.quantity}
                                </span>
                                <button
                                  onClick={() =>
                                    handleUpdateQuantity(pId, 1, isPaid)
                                  }
                                  className="w-5 h-5 text-slate-400 hover:text-slate-700 dark:hover:text-white flex items-center justify-center font-bold cursor-pointer"
                                >
                                  <Plus size={12} />
                                </button>
                              </div>
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
                      <p className="text-xs text-slate-400 italic py-4 text-center bg-slate-50 dark:bg-slate-800/20 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                        Chưa chọn món phát sinh nào.
                      </p>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="py-24 flex flex-col items-center justify-center text-slate-400">
                <Package
                  size={40}
                  className="stroke-1 mb-2 text-slate-300 dark:text-slate-700"
                />
                <p className="text-xs text-center">
                  Vui lòng chọn sân bên trái để lập hóa đơn
                </p>
              </div>
            )}
          </div>

          {selectedBooking && currentInvoice && (
            <div className="border-t border-slate-200 dark:border-slate-800 pt-3 mt-3 space-y-2 text-xs">
              <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 p-1.5 pl-3 rounded-xl border border-slate-200 dark:border-slate-700">
                <Tag size={15} className="text-emerald-600 shrink-0" />
                <input
                  type="text"
                  placeholder="Mã voucher (VD: KHUYENMAI)"
                  value={voucherCode}
                  onChange={(e) => setVoucherCode(e.target.value)}
                  className="w-full bg-transparent border-none outline-none text-xs text-slate-800 dark:text-white uppercase placeholder-slate-400 font-mono"
                />
                <button
                  onClick={handleApplyVoucher}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors cursor-pointer text-xs shrink-0 shadow-xs"
                >
                  Áp dụng
                </button>
              </div>

              <div className="flex justify-between text-slate-500 dark:text-slate-400 pt-1">
                <span>Tiền sân (Tổng):</span>
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
                <div className="flex justify-between text-amber-600 dark:text-amber-400 font-medium">
                  <span>Đã thanh toán lẻ các món:</span>
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
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                  -{depositPaid.toLocaleString("vi-VN")} đ
                </span>
              </div>
              <div className="flex justify-between font-bold text-sm text-slate-800 dark:text-white pt-2 border-t border-slate-200 dark:border-slate-800">
                <span>Cần thanh toán thêm:</span>
                <span className="text-emerald-600 dark:text-emerald-400 text-base">
                  {remainingAmount.toLocaleString("vi-VN")} đ
                </span>
              </div>

              <button
                onClick={() => setIsCheckoutModalOpen(true)}
                className="w-full mt-3 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer text-sm"
              >
                <CheckCircle2 size={16} /> Tiến Hành Thanh Toán
              </button>
            </div>
          )}
        </div>
      </div>

      {isAddCourtModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Plus size={18} className="text-emerald-500" /> Chọn Sân Phát
                Sinh Trống
              </h3>
              <button
                onClick={() => setIsAddCourtModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Khung giờ:{" "}
              <b className="text-slate-700 dark:text-slate-200">
                {selectedBooking?.startTime} - {selectedBooking?.endTime}
              </b>{" "}
              (Ngày: {selectedBooking?.date?.split("T")[0]})
            </p>

            <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1 mb-4">
              {availableCourts.length > 0 ? (
                availableCourts.map((court) => (
                  <div
                    key={court._id}
                    onClick={() => handleConfirmAddExtraCourt(court._id)}
                    className="p-3 bg-slate-50 dark:bg-slate-800/60 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 rounded-xl flex justify-between items-center cursor-pointer transition-all group"
                  >
                    <div>
                      <p className="font-bold text-slate-800 dark:text-white text-sm group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                        {court.name}
                      </p>
                      <p className="text-xs text-slate-400">{court.type}</p>
                    </div>
                    <span className="text-xs px-3 py-1.5 bg-emerald-600 group-hover:bg-emerald-700 text-white font-semibold rounded-lg transition-colors">
                      Chọn sân này
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-400 italic text-xs">
                  Không có sân nào còn trống trong khung giờ này.
                </div>
              )}
            </div>

            <button
              onClick={() => setIsAddCourtModalOpen(false)}
              className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-medium transition cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>
      )}

      <CheckoutModal
        isOpen={isCheckoutModalOpen}
        onClose={() => setIsCheckoutModalOpen(false)}
        onConfirm={handleCheckoutComplete}
        booking={selectedBooking}
        remainingAmount={remainingAmount}
        invoiceItems={invoiceItems}
        totalCourtFee={totalCourtFee}
        productsTotal={productsTotal}
        depositPaid={depositPaid}
        paidItemsAmount={paidItemsAmount}
        discountAmount={discountAmount}
        appliedVoucher={appliedVoucher}
        courtTimes={courtTimes}
      />
    </div>
  );
}
