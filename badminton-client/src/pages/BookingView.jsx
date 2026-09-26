import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import BookingConfirmModal from "../components/BookingConfirmModal";
import { toast } from "react-toastify";

export default function BookingView() {
  const navigate = useNavigate();
  const [courts, setCourts] = useState([]);
  const [existingBookings, setExistingBookings] = useState([]);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("theme") !== "light";
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  const getTodayString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const [selectedDate, setSelectedDate] = useState(getTodayString());
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showPriceModal, setShowPriceModal] = useState(false);

  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    phone: "",
    voucherCode: "",
  });

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const currentHour = new Date().getHours();
  const isToday = selectedDate === getTodayString();

  const getRateByHour = (hour) => {
    if (hour >= 0 && hour <= 5) return 60000;
    if (hour >= 6 && hour <= 16) return 30000;
    return 60000;
  };

  useEffect(() => {
    API.get("/courts")
      .then((res) => {
        if (res.data.success) setCourts(res.data.data);
      })
      .catch((err) => {
        console.error("Lỗi tải danh sách sân:", err);
        toast.error("Không thể tải danh sách sân!");
      });
  }, []);

  useEffect(() => {
    if (!selectedDate) return;
    API.get(`/bookings?date=${selectedDate}`)
      .then((res) => {
        if (res.data.success) {
          const bookingsData = res.data.data || [];
          const filtered = bookingsData.filter((b) => {
            if (!b.date) return false;
            return String(b.date).split("T")[0] === selectedDate;
          });
          setExistingBookings(filtered);
        }
      })
      .catch((err) => {
        console.error("Lỗi tải danh sách đặt lịch:", err);
        toast.error("Không thể tải lịch đặt sân!");
      });
  }, [selectedDate]);

  const getSlotStatus = (courtId, hour) => {
    const booking = existingBookings.find((b) => {
      if (b.bookingStatus === "cancelled" || b.bookingStatus === "ĐÃ HỦY")
        return false;
      const bCourtId = b.court?._id || b.court;
      if (bCourtId !== courtId) return false;
      const startH = parseInt((b.startTime || "00:00").split(":")[0], 10) || 0;
      const endH = parseInt((b.endTime || "00:00").split(":")[0], 10) || 24;
      return hour >= startH && hour < endH;
    });
    return booking
      ? { status: booking.bookingStatus || "pending_deposit", booking }
      : { status: "empty" };
  };

  const handleSlotClick = (courtId, hour, status) => {
    if (isToday && hour <= currentHour) {
      toast.warning("Không thể đặt khung giờ trong quá khứ!");
      return;
    }
    if (status !== "empty") {
      toast.warning("Khung giờ này đã có người đặt hoặc đang chờ duyệt!");
      return;
    }

    const exists = selectedSlots.find(
      (s) => s.courtId === courtId && s.hour === hour,
    );
    if (exists) {
      setSelectedSlots(
        selectedSlots.filter(
          (s) => !(s.courtId === courtId && s.hour === hour),
        ),
      );
    } else {
      const courtObj = courts.find((c) => c._id === courtId);
      setSelectedSlots([
        ...selectedSlots,
        {
          courtId,
          courtName: courtObj?.name || "Sân",
          hour,
          price: getRateByHour(hour),
        },
      ]);
    }
  };

  const totalPrice = selectedSlots.reduce((sum, item) => sum + item.price, 0);

  const getGroupedSummary = () => {
    const courtMap = {};
    selectedSlots.forEach((slot) => {
      if (!courtMap[slot.courtId]) {
        courtMap[slot.courtId] = { courtName: slot.courtName, hours: [] };
      }
      courtMap[slot.courtId].hours.push(slot.hour);
    });

    const result = [];
    Object.keys(courtMap).forEach((courtId) => {
      const item = courtMap[courtId];
      const sortedHours = item.hours.sort((a, b) => a - b);
      let ranges = [];
      let startH = sortedHours[0],
        prevH = sortedHours[0];

      for (let i = 1; i < sortedHours.length; i++) {
        if (sortedHours[i] === prevH + 1) {
          prevH = sortedHours[i];
        } else {
          ranges.push({ start: startH, end: prevH + 1 });
          startH = sortedHours[i];
          prevH = sortedHours[i];
        }
      }
      ranges.push({ start: startH, end: prevH + 1 });

      ranges.forEach((range) => {
        let rangePrice = 0;
        for (let h = range.start; h < range.end; h++)
          rangePrice += getRateByHour(h);
        result.push({
          courtName: item.courtName,
          start: range.start,
          end: range.end,
          price: rangePrice,
        });
      });
    });
    return result;
  };

  const handleModalSubmit = async (submittedCustomerInfo) => {
    setCustomerInfo(submittedCustomerInfo);

    const groupedSummary = getGroupedSummary();
    const courtMapByName = {};
    courts.forEach((c) => {
      courtMapByName[c.name] = c._id;
    });

    try {
      for (const group of groupedSummary) {
        const courtId = courtMapByName[group.courtName];
        if (!courtId) continue;

        // 📌 Tính toán phân bổ tiền cọc cho từng nhóm sân nếu khách đặt nhiều sân
        const totalGroupPrice = group.price;
        const ratio = totalPrice > 0 ? totalGroupPrice / totalPrice : 0;
        const groupDeposit = Math.round(
          (submittedCustomerInfo.depositAmount || 0) * ratio,
        );

        const payload = {
          court: courtId,
          courts: [courtId],
          date: selectedDate,
          startTime: `${String(group.start).padStart(2, "0")}:00`,
          endTime: `${String(group.end).padStart(2, "0")}:00`,
          totalPrice: totalGroupPrice,
          depositAmount: groupDeposit, // 📌 Truyền tiền cọc đã được tính toán chính xác vào đây
          guestName: submittedCustomerInfo.name,
          guestPhone: submittedCustomerInfo.phone,
          voucherCode: submittedCustomerInfo.voucherCode || "",
          discountAmount: submittedCustomerInfo.discountAmount || 0,
          bookingStatus: "pending_deposit",
        };

        await API.post("/bookings", payload);
      }

      toast.success("Đặt sân thành công! Vui lòng chờ Admin duyệt lịch.");
      setShowModal(false);
      setSelectedSlots([]);
      setTimeout(() => window.location.reload(), 1500);
    } catch (error) {
      console.error(error);
      toast.error(
        error.response?.data?.message || "Có lỗi xảy ra khi đặt sân!",
      );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-slate-100 pb-36 font-sans flex flex-col transition-colors duration-300">
      <header className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 p-4 px-8 flex justify-between items-center shadow-xl">
        <button
          onClick={() => navigate("/")}
          className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 transition flex items-center gap-1.5 bg-gray-100 dark:bg-slate-800 px-3.5 py-2 rounded-xl border border-gray-200 dark:border-slate-700 cursor-pointer"
        >
          ← Về Trang Chủ
        </button>
        <div className="flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <h1 className="text-base font-bold tracking-wide">
            HỆ THỐNG ĐẶT SÂN CẦU LÔNG TRỰC TUYẾN
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-xl bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-gray-200 text-xs font-bold transition shadow cursor-pointer"
          >
            {darkMode ? "☀️ Sáng" : "🌙 Tối"}
          </button>
          <div className="text-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 px-3.5 py-1.5 rounded-xl font-medium hidden sm:block">
            Trực quan & Nhanh chóng
          </div>
        </div>
      </header>

      <div className="p-4 px-6 bg-white/80 dark:bg-slate-900/60 backdrop-blur border-b border-gray-200 dark:border-slate-800 w-full shadow-lg flex flex-wrap justify-between items-center gap-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-gray-600 dark:text-slate-400 uppercase tracking-wider">
              Chọn ngày chơi:
            </span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-gray-100 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-xl px-4 py-2 text-sm text-gray-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500 transition shadow-inner cursor-pointer"
            />
          </div>
          <button
            onClick={() => setShowPriceModal(true)}
            className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:text-amber-500 bg-amber-500/10 border border-amber-500/30 px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5"
          >
            📋 Xem Bảng Giá Chi Tiết
          </button>
        </div>

        <div className="flex items-center flex-wrap gap-5 text-xs font-medium text-gray-600 dark:text-slate-300">
          <span className="flex items-center gap-2">
            <span className="w-3 h-3 bg-gray-100 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-md"></span>{" "}
            Trống
          </span>
          <span className="flex items-center gap-2">
            <span className="w-3 h-3 bg-amber-500 rounded-md"></span> Chờ duyệt
          </span>
          <span className="flex items-center gap-2">
            <span className="w-3 h-3 bg-red-600/80 rounded-md"></span> Đã đặt /
            Đã duyệt
          </span>
          <span className="flex items-center gap-2">
            <span className="w-3 h-3 bg-emerald-500 rounded-md shadow-lg shadow-emerald-500/50"></span>{" "}
            Đang chọn
          </span>
        </div>
      </div>

      <div className="p-4 w-full select-none flex flex-col">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-800 overflow-x-auto">
          <table className="w-full table-fixed border-collapse">
            <thead>
              <tr className="bg-gray-100 dark:bg-slate-800/80 text-gray-700 dark:text-slate-300 text-xs font-semibold border-b border-gray-200 dark:border-slate-800">
                <th className="p-3 text-left border-r border-gray-200 dark:border-slate-800 w-36 uppercase tracking-wider bg-gray-100 dark:bg-slate-800 sticky left-0 z-10">
                  Sân \ Giờ
                </th>
                {hours.map((h) => (
                  <th
                    key={h}
                    className="p-2 border-r border-gray-200 dark:border-slate-800/60 text-center font-mono text-gray-500 dark:text-slate-400 text-[11px]"
                  >
                    {h < 10 ? `0${h}:00` : `${h}:00`}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {courts.map((court) => (
                <tr
                  key={court._id}
                  className="border-b border-gray-200 dark:border-slate-800/60 hover:bg-gray-50 dark:hover:bg-slate-800/10 transition"
                >
                  <td className="p-3 font-semibold text-xs text-emerald-600 dark:text-emerald-400 border-r border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 sticky left-0 z-10 truncate">
                    {court.name}
                  </td>
                  {hours.map((h) => {
                    const isPassed = isToday && h <= currentHour;
                    const { status } = getSlotStatus(court._id, h);
                    const isPending = status === "pending_deposit";
                    const isConfirmedOrBooked =
                      status !== "empty" && !isPending;
                    const isSelected = selectedSlots.find(
                      (s) => s.courtId === court._id && s.hour === h,
                    );

                    let cellBgClass =
                      "bg-gray-50 dark:bg-slate-800/85 hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-400 dark:text-slate-500 border-gray-200 dark:border-slate-700/60 cursor-pointer";
                    if (isPassed)
                      cellBgClass =
                        "bg-gray-200 dark:bg-slate-950/60 text-gray-400 dark:text-slate-700 border-gray-300 dark:border-slate-900 cursor-not-allowed opacity-50";
                    else if (isConfirmedOrBooked)
                      cellBgClass =
                        "bg-red-600/70 border-red-500 text-red-200 cursor-not-allowed shadow-inner";
                    else if (isPending)
                      cellBgClass =
                        "bg-amber-500 border-amber-600 text-slate-950 font-bold cursor-not-allowed shadow-inner";
                    else if (isSelected)
                      cellBgClass =
                        "bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/40 ring-2 ring-emerald-400 cursor-pointer";

                    return (
                      <td
                        key={h}
                        onClick={() => handleSlotClick(court._id, h, status)}
                        className={`h-16 transition text-center p-1 border border-gray-200 dark:border-slate-800 ${cellBgClass}`}
                      >
                        <div className="w-full h-full flex items-center justify-center font-bold text-xs">
                          {isSelected ? "✓" : isPending ? "Chờ" : ""}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedSlots.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-gray-200 dark:border-slate-800 p-4 px-6 md:px-12 flex flex-col md:flex-row justify-between items-center gap-4 shadow-2xl z-40">
          <div className="flex flex-col gap-1.5 w-full md:w-auto">
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-600 dark:text-slate-400">
                Đã chọn:{" "}
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {selectedSlots.length} khung giờ
                </span>
              </span>
              <span className="text-sm font-extrabold text-amber-600 dark:text-amber-400 tracking-tight">
                Tổng tiền: {totalPrice.toLocaleString()} đ
              </span>
            </div>
            <div className="flex flex-wrap gap-2 max-h-16 overflow-y-auto pr-2">
              {getGroupedSummary().map((item, idx) => (
                <div
                  key={idx}
                  className="bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-xs px-3 py-1.5 rounded-xl flex items-center gap-2 text-gray-700 dark:text-slate-300 shadow-sm"
                >
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {item.courtName}
                  </span>
                  <span className="font-mono text-gray-700 dark:text-slate-200">
                    ({item.start < 10 ? `0${item.start}` : item.start}h -{" "}
                    {item.end < 10 ? `0${item.end}` : item.end}h)
                  </span>
                  <span className="text-amber-600 dark:text-amber-400 font-extrabold">
                    : {item.price.toLocaleString()}đ
                  </span>
                </div>
              ))}
            </div>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-extrabold px-8 py-3.5 rounded-xl text-sm shadow-xl transition transform hover:scale-105 cursor-pointer whitespace-nowrap"
          >
            TIẾP TỤC ĐẶT SÂN →
          </button>
        </div>
      )}

      {showModal && (
        <BookingConfirmModal
          selectedDate={selectedDate}
          selectedSlots={selectedSlots}
          initialTotalPrice={totalPrice}
          customerInfo={customerInfo}
          setCustomerInfo={setCustomerInfo}
          onClose={() => setShowModal(false)}
          onSubmit={handleModalSubmit}
        />
      )}

      {showPriceModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 text-gray-900 dark:text-slate-100 shadow-2xl space-y-5">
            <div className="flex justify-between items-center border-b border-gray-200 dark:border-slate-800 pb-3">
              <h2 className="text-base font-bold text-amber-600 dark:text-amber-400">
                📋 Bảng Giá Thuê Sân Theo Giờ
              </h2>
              <button
                onClick={() => setShowPriceModal(false)}
                className="text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white text-sm font-bold px-2 py-1 bg-gray-100 dark:bg-slate-800 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <div className="bg-gray-50 dark:bg-slate-950/60 p-3.5 rounded-xl border border-gray-200 dark:border-slate-800 flex justify-between items-center">
                <span className="font-bold text-gray-700 dark:text-slate-200">
                  Giờ Tiêu Chuẩn (06:00 - 16:00)
                </span>
                <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">
                  30.000 đ / giờ
                </span>
              </div>
              <div className="bg-gray-50 dark:bg-slate-950/60 p-3.5 rounded-xl border border-gray-200 dark:border-slate-800 flex justify-between items-center">
                <span className="font-bold text-gray-700 dark:text-slate-200">
                  Giờ Cao Điểm / Đêm (Khác)
                </span>
                <span className="font-extrabold text-amber-600 dark:text-amber-400 text-sm">
                  60.000 đ / giờ
                </span>
              </div>
            </div>
            <div className="flex justify-end pt-2 border-t border-gray-200 dark:border-slate-800">
              <button
                onClick={() => setShowPriceModal(false)}
                className="bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 px-5 py-2.5 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
