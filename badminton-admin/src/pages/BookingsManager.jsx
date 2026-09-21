import { useState, useEffect } from "react";
import API from "../services/api";
import {
  Plus,
  Trash2,
  CheckCircle,
  CheckSquare,
  AlertTriangle,
  Calendar,
  Clock,
  User,
  MapPin,
} from "lucide-react";
import { toast } from "react-toastify";

export default function BookingsManager() {
  const [bookings, setBookings] = useState([]);
  const [courts, setCourts] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  // Lấy ngày hiện tại định dạng YYYY-MM-DD theo giờ địa phương
  const getTodayString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const [selectedDate, setSelectedDate] = useState(getTodayString());

  // Form tạo lịch đặt mới
  const [showAddForm, setShowAddForm] = useState(false);
  const [courtId, setCourtId] = useState("");
  const [isGuest, setIsGuest] = useState(true);
  const [userId, setUserId] = useState("");
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [totalPrice, setTotalPrice] = useState(0);
  const [depositAmount, setDepositAmount] = useState(0);

  // Trạng thái phục vụ kéo thả (drag-to-select) trên lưới
  const [isDragging, setIsDragging] = useState(false);
  const [dragCourtId, setDragCourtId] = useState(null);
  const [dragStartHour, setDragStartHour] = useState(null);
  const [dragEndHour, setDragEndHour] = useState(null);

  const currentUser = JSON.parse(localStorage.getItem("adminUser") || "{}");
  const isAdmin = currentUser.role === "admin";

  const hours = Array.from({ length: 24 }, (_, i) => i);

  // Modal xác nhận tùy chỉnh chung cho toàn trang
  const [confirmModal, setConfirmModal] = useState({
    show: false,
    title: "",
    message: "",
    isNoShowAction: false,
    bookingId: null,
    onConfirm: null,
  });

  const fetchData = async () => {
    try {
      const [resBookings, resCourts, resUsers] = await Promise.all([
        API.get("/bookings"),
        API.get("/courts"),
        API.get("/users"),
      ]);

      if (resBookings.data.success) setBookings(resBookings.data.data);
      if (resCourts.data.success) setCourts(resCourts.data.data);
      if (resUsers.data.success) setUsers(resUsers.data.data);
    } catch (error) {
      console.error("Lỗi tải dữ liệu:", error);
      toast.error("Không thể tải dữ liệu hệ thống!");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Tự động ép tiền cọc bằng tổng tiền nếu khách thuộc diện yêu cầu cọc bắt buộc
  useEffect(() => {
    if (userId) {
      const selectedUserObj = users.find((u) => u._id === userId);

      if (
        selectedUserObj &&
        (selectedUserObj.isRequireDeposit || selectedUserObj.strikeCount > 0)
      ) {
        if (totalPrice) {
          setDepositAmount(totalPrice);
        }
      }
    }
  }, [userId, users, totalPrice]);

  const calculateTotalPrice = (start, end) => {
    if (!start || !end) {
      setTotalPrice(0);
      return;
    }

    const startH = parseInt(start.split(":")[0], 10);
    let endH = parseInt(end.split(":")[0], 10);

    if (endH <= startH) {
      endH += 24;
    }

    let total = 0;
    for (let h = startH; h < endH; h++) {
      const currentHour = h % 24;
      if (currentHour >= 0 && currentHour <= 5) {
        total += 60000;
      } else if (currentHour >= 6 && currentHour <= 16) {
        total += 30000;
      } else {
        total += 60000;
      }
    }

    setTotalPrice(total);
  };

  const getSlotStatus = (cId, hour) => {
    const booking = bookings.find((b) => {
      if (b.bookingStatus === "cancelled" || b.bookingStatus === "ĐÃ HỦY")
        return false;

      const bCourtId = b.court?._id || b.court;
      if (bCourtId !== cId) return false;

      const bDate = new Date(b.date).toISOString().split("T")[0];
      if (bDate !== selectedDate) return false;

      const startTimeStr = b.startTime || "00:00";
      const endTimeStr = b.endTime || "00:00";

      const startHour =
        parseInt(startTimeStr.replace(/\D/g, "").slice(0, 2), 10) || 0;
      const endHour =
        parseInt(endTimeStr.replace(/\D/g, "").slice(0, 2), 10) || 0;

      return hour >= startHour && hour < endHour;
    });

    if (!booking) return { status: "empty" };
    return { status: booking.bookingStatus || "pending_deposit", booking };
  };

  const isInDragSelection = (cId, hour) => {
    if (!isDragging || dragCourtId !== cId) return false;
    const minH = Math.min(dragStartHour, dragEndHour);
    const maxH = Math.max(dragStartHour, dragEndHour);
    return hour >= minH && hour <= maxH;
  };

  const isFormSelectedSlot = (cId, hour) => {
    if (!showAddForm || courtId !== cId || date !== selectedDate) return false;
    if (!startTime || !endTime) return false;
    const startH = parseInt(startTime.split(":")[0], 10);
    const endH = parseInt(endTime.split(":")[0], 10);
    return hour >= startH && hour < endH;
  };

  const handleMouseDown = (cId, hour, status) => {
    if (status !== "empty") {
      const { booking } = getSlotStatus(cId, hour);
      const customerName = booking?.guestName || booking?.user?.name || "Khách";
      toast.info(`Khung giờ này đã được đặt bởi: ${customerName}`);
      return;
    }
    setIsDragging(true);
    setDragCourtId(cId);
    setDragStartHour(hour);
    setDragEndHour(hour);
  };

  const handleMouseEnter = (cId, hour, status) => {
    if (!isDragging || dragCourtId !== cId) return;
    if (status !== "empty") return;
    setDragEndHour(hour);
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    setIsDragging(false);

    const minH = Math.min(dragStartHour, dragEndHour);
    let maxH = Math.max(dragStartHour, dragEndHour) + 1;
    if (maxH > 24) maxH = 24;

    const formattedStart = minH < 10 ? `0${minH}:00` : `${minH}:00`;
    const formattedEnd = maxH < 10 ? `0${maxH}:00` : `${maxH}:00`;

    setCourtId(dragCourtId);
    setDate(selectedDate);
    setStartTime(formattedStart);
    setEndTime(formattedEnd);

    calculateTotalPrice(formattedStart, formattedEnd);
    setShowAddForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCreateBooking = async (e) => {
    e.preventDefault();
    if (!startTime || !endTime) {
      toast.error("Vui lòng chọn khung giờ trên lưới sân!");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        court: courtId,
        date,
        startTime,
        endTime,
        totalPrice: Number(totalPrice),
        depositAmount: Number(depositAmount),
      };

      if (isGuest) {
        payload.guestName = guestName;
        payload.guestPhone = guestPhone;
      } else {
        payload.user = userId;
      }

      const res = await API.post("/bookings", payload);
      if (res.data.success) {
        toast.success("Tạo lịch đặt sân thành công!");
        setShowAddForm(false);
        setCourtId("");
        setUserId("");
        setGuestName("");
        setGuestPhone("");
        setDate("");
        setStartTime("");
        setEndTime("");
        setTotalPrice(0);
        setDepositAmount(0);
        fetchData();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Lỗi khi đặt lịch sân!");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDeposit = async (bookingId) => {
    try {
      const res = await API.put(`/bookings/${bookingId}/confirm-deposit`);
      if (res.data.success) {
        toast.success("Đã xác nhận cọc thành công!");
        fetchData();
      }
    } catch (error) {
      toast.error("Lỗi khi xác nhận cọc!");
    }
  };

  const handleCheckIn = async (bookingId) => {
    try {
      const res = await API.put(`/bookings/${bookingId}/check-in`);
      if (res.data.success) {
        toast.success("Check-in thành công!");
        fetchData();
      }
    } catch (error) {
      toast.error("Lỗi khi check-in!");
    }
  };

  const handleNoShow = async (bookingId, actionType = "retained") => {
    try {
      const res = await API.put(`/bookings/${bookingId}/no-show`, {
        actionType,
      });
      if (res.data && res.data.success) {
        toast.success(res.data.message || "Đã xử lý bùng sân thành công!");
        fetchData();
      } else {
        toast.error(res.data?.message || "Lỗi xử lý từ server!");
      }
    } catch (error) {
      console.error("Lỗi chi tiết:", error);
      const errorMsg =
        error.response?.data?.message ||
        error.message ||
        "Lỗi khi xử lý bùng sân!";
      toast.error(errorMsg);
    }
  };

  const confirmActionModal = (title, message, apiEndpoint) => {
    setConfirmModal({
      show: true,
      title,
      message,
      isNoShowAction: false,
      bookingId: null,
      onConfirm: async () => {
        try {
          const res = await API.delete(apiEndpoint);
          if (res.data.success) {
            toast.success("Đã xóa lịch thành công!");
            fetchData();
          }
        } catch (error) {
          toast.error("Lỗi thực hiện thao tác!");
        }
        setConfirmModal({
          show: false,
          title: "",
          message: "",
          isNoShowAction: false,
          bookingId: null,
          onConfirm: null,
        });
      },
    });
  };

  const getSlotColor = (status) => {
    switch (status) {
      case "confirmed":
        return "bg-blue-500/20 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-300 dark:border-blue-700";
      case "pending_deposit":
        return "bg-amber-400/20 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-300 dark:border-amber-700";
      case "checked_in":
        return "bg-emerald-500/20 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700";
      case "completed":
      case "COMPLETED":
        return "bg-purple-500/20 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 border border-purple-300 dark:border-purple-700";
      case "cancelled":
        return "bg-rose-500/20 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300 border border-rose-300 dark:border-rose-700";
      default:
        return "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800";
    }
  };

  const renderStatusBadge = (status) => {
    switch (status) {
      case "confirmed":
        return (
          <span className="px-3 py-1 text-xs font-semibold rounded-full uppercase bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
            Đã xác nhận
          </span>
        );
      case "checked_in":
        return (
          <span className="px-3 py-1 text-xs font-semibold rounded-full uppercase bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
            Đang chơi
          </span>
        );
      case "completed":
      case "COMPLETED":
        return (
          <span className="px-3 py-1 text-xs font-semibold rounded-full uppercase bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
            Đã hoàn thành
          </span>
        );
      case "cancelled":
        return (
          <span className="px-3 py-1 text-xs font-semibold rounded-full uppercase bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300">
            Đã hủy
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 text-xs font-semibold rounded-full uppercase bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
            Chờ xác nhận
          </span>
        );
    }
  };

  const filteredBookings = bookings.filter((item) => {
    if (!item.date) return false;
    // Cắt chuỗi trực tiếp để tránh lệch múi giờ UTC so với chuỗi "YYYY-MM-DD" từ database
    const itemDate = String(item.date).split("T")[0];
    return itemDate === selectedDate;
  });
  return (
    <div className="pb-12" onMouseUp={handleMouseUp}>
      {/* MODAL XÁC NHẬN CHUNG */}
      {confirmModal.show && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3 mb-4 text-amber-500">
              <AlertTriangle size={28} />
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                {confirmModal.title}
              </h3>
            </div>
            <p className="text-slate-600 dark:text-slate-300 text-sm mb-6">
              {confirmModal.message}
            </p>

            {confirmModal.isNoShowAction ? (
              <div className="flex flex-col gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    handleNoShow(confirmModal.bookingId, "retained");
                    setConfirmModal({
                      show: false,
                      title: "",
                      message: "",
                      isNoShowAction: false,
                      bookingId: null,
                      onConfirm: null,
                    });
                  }}
                  className="w-full py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-medium shadow-md cursor-pointer flex items-center justify-center gap-2"
                >
                  🔒 Giữ lại tiền cọc (Đẩy vào hóa đơn & Phạt tài khoản)
                </button>

                <button
                  type="button"
                  onClick={() => {
                    handleNoShow(confirmModal.bookingId, "refund");
                    setConfirmModal({
                      show: false,
                      title: "",
                      message: "",
                      isNoShowAction: false,
                      bookingId: null,
                      onConfirm: null,
                    });
                  }}
                  className="w-full py-2.5 px-4 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-sm font-medium cursor-pointer"
                >
                  ↩️ Hoàn tiền cọc / Hủy đơn bình thường
                </button>
              </div>
            ) : (
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setConfirmModal({
                      show: false,
                      title: "",
                      message: "",
                      isNoShowAction: false,
                      bookingId: null,
                      onConfirm: null,
                    })
                  }
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-sm font-medium cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  onClick={confirmModal.onConfirm}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-medium shadow-md cursor-pointer"
                >
                  Xác nhận
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <span>Quản Lý Lịch Đặt Sân</span>
        </h1>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-4 py-2.5 rounded-xl transition flex items-center gap-2 cursor-pointer shadow-md"
        >
          <Plus size={20} />{" "}
          {showAddForm ? "Đóng Form Thêm Lịch" : "Thêm Lịch Thủ Công"}
        </button>
      </div>

      {showAddForm && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-800 mb-8 animate-in fade-in duration-200">
          <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-200">
              Form Tạo Lịch Đặt Sân (Chọn trực tiếp từ sơ đồ)
            </h2>
            <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 cursor-pointer font-medium">
              <input
                type="checkbox"
                checked={isGuest}
                onChange={(e) => {
                  setIsGuest(e.target.checked);
                  if (e.target.checked) {
                    setUserId("");
                  } else {
                    setGuestName("");
                    setGuestPhone("");
                  }
                }}
                className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
              />
              Khách vãng lai (Gọi điện đặt)
            </label>
          </div>

          <form
            onSubmit={handleCreateBooking}
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            <select
              value={courtId}
              onChange={(e) => setCourtId(e.target.value)}
              required
              className="p-3 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-sm outline-none text-slate-800 dark:text-white cursor-pointer"
              style={{ colorScheme: "dark" }}
            >
              <option
                value=""
                className="bg-white dark:bg-slate-800 text-slate-400"
              >
                -- Chọn sân --
              </option>
              {courts.map((court) => (
                <option
                  key={court._id}
                  value={court._id}
                  className="bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
                >
                  {court.name} ({court.type})
                </option>
              ))}
            </select>

            {isGuest ? (
              <>
                <input
                  type="text"
                  placeholder="Họ tên khách vãng lai"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  required
                  className="p-3 border border-slate-300 dark:border-slate-700 rounded-xl outline-none bg-white dark:bg-slate-800 text-slate-800 dark:text-white text-sm"
                />
                <input
                  type="text"
                  placeholder="Số điện thoại khách vãng lai"
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  required
                  className="p-3 border border-slate-300 dark:border-slate-700 rounded-xl outline-none bg-white dark:bg-slate-800 text-slate-800 dark:text-white text-sm"
                />
              </>
            ) : (
              <div className="md:col-span-2 flex flex-col gap-1.5">
                <select
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  required
                  className="p-3 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-sm outline-none text-slate-800 dark:text-white cursor-pointer"
                  style={{ colorScheme: "dark" }}
                >
                  <option
                    value=""
                    className="bg-white dark:bg-slate-800 text-slate-400"
                  >
                    -- Chọn thành viên --
                  </option>
                  {users.map((u) => (
                    <option
                      key={u._id}
                      value={u._id}
                      className="bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
                    >
                      {u.name} - {u.phone}{" "}
                      {u.strikeCount > 0 ? `(Bùng ${u.strikeCount} lần)` : ""}
                    </option>
                  ))}
                </select>

                {/* Dòng hiển thị cảnh báo tinh tế ngay dưới ô chọn nếu khách có lịch sử bùng sân */}
                {userId &&
                  (() => {
                    const selectedUserObj = users.find((u) => u._id === userId);
                    if (
                      selectedUserObj &&
                      (selectedUserObj.strikeCount > 0 ||
                        selectedUserObj.isRequireDeposit)
                    ) {
                      return (
                        <span className="text-xs text-amber-500 font-medium flex items-center gap-1 px-1">
                          ⚠️ Khách hàng này có lịch sử bùng sân (
                          {selectedUserObj.strikeCount || 0} lần). Hệ thống đã
                          tự động yêu cầu cọc 100%.
                        </span>
                      );
                    }
                    return null;
                  })()}
              </div>
            )}

            <input
              type="date"
              value={date}
              disabled
              required
              className="p-3 border border-slate-300 dark:border-slate-700 rounded-xl outline-none bg-slate-100 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-sm cursor-not-allowed"
            />

            <div className="flex items-center gap-2 md:col-span-2 bg-slate-100 dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 cursor-not-allowed">
              <div className="flex items-center gap-1.5 w-full">
                <span className="text-xs text-slate-400 font-medium">Từ:</span>
                <input
                  type="text"
                  value={startTime}
                  disabled
                  placeholder="Giờ bắt đầu"
                  className="w-full p-2 outline-none bg-transparent text-slate-500 dark:text-slate-400 text-sm font-medium cursor-not-allowed"
                />
              </div>

              <div className="flex items-center gap-1.5 w-full">
                <span className="text-xs text-slate-400 font-medium">Đến:</span>
                <input
                  type="text"
                  value={endTime}
                  disabled
                  placeholder="Giờ kết thúc"
                  className="w-full p-2 outline-none bg-transparent text-slate-500 dark:text-slate-400 text-sm font-medium cursor-not-allowed"
                />
              </div>
            </div>

            <input
              type="text"
              placeholder="Tổng tiền"
              value={totalPrice ? `${totalPrice.toLocaleString()} đ` : "0 đ"}
              disabled
              className="p-3 border border-slate-300 dark:border-slate-700 rounded-xl outline-none bg-slate-100 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-sm cursor-not-allowed font-medium"
            />

            <input
              type="text"
              placeholder="Tiền cọc (VNĐ)"
              value={
                depositAmount === 0 || depositAmount === ""
                  ? "0 đ"
                  : `${Number(depositAmount).toLocaleString()} đ`
              }
              onChange={(e) => {
                const rawValue = e.target.value.replace(/\D/g, "");
                setDepositAmount(rawValue === "" ? 0 : Number(rawValue));
              }}
              required
              className="p-3 border border-slate-300 dark:border-slate-700 rounded-xl outline-none bg-white dark:bg-slate-800 text-slate-800 dark:text-white text-sm font-medium"
            />

            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium p-3 rounded-xl transition cursor-pointer shadow-md flex items-center justify-center gap-2 md:col-span-3"
            >
              <Plus size={18} />{" "}
              {loading ? "Đang xử lý..." : "Xác Nhận Giữ Sân"}
            </button>
          </form>
        </div>
      )}

      {/* SƠ ĐỒ TRỰC QUAN */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden mb-8 select-none">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap justify-between items-center gap-4 bg-slate-50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Calendar size={20} className="text-emerald-600" /> Sơ Đồ Lịch Sân
              Trực Quan
            </h2>
            <div className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-3 py-1.5 rounded-xl">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent outline-none text-sm text-slate-800 dark:text-white cursor-pointer"
                style={{ colorScheme: "dark" }}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 dark:text-slate-300 font-medium">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-white border border-slate-300"></span>{" "}
              Trống
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-amber-400"></span> Chờ
              xác nhận
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-blue-500"></span> Đã xác
              nhận
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500"></span> Đang
              chơi
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-purple-500"></span> Đã
              hoàn thành
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 text-xs font-semibold">
                <th className="p-3 text-left border-r border-slate-200 dark:border-slate-700 w-28 sticky left-0 bg-slate-100 dark:bg-slate-800 z-10">
                  Sân \ Giờ
                </th>
                {hours.map((h) => (
                  <th
                    key={h}
                    className="p-2 border-r border-slate-200 dark:border-slate-700 text-center"
                  >
                    {h}:00
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {courts.map((court) => (
                <tr
                  key={court._id}
                  className="border-b border-slate-200 dark:border-slate-800"
                >
                  <td className="p-3 font-semibold text-sm text-slate-800 dark:text-white border-r border-slate-200 dark:border-slate-700 sticky left-0 bg-white dark:bg-slate-900 z-10 shadow-sm">
                    {court.name}
                    <div className="text-[10px] text-slate-400 font-normal">
                      {court.type}
                    </div>
                  </td>

                  {hours.map((h) => {
                    const { status, booking } = getSlotStatus(court._id, h);
                    const customerName =
                      booking?.guestName || booking?.user?.name || "Khách";

                    const startHour = booking
                      ? parseInt(booking.startTime?.split(":")[0] || 0)
                      : -1;
                    const endHour = booking
                      ? parseInt(booking.endTime?.split(":")[0] || 0)
                      : -1;

                    const durationHours =
                      endHour > startHour ? endHour - startHour : 1;
                    const isStartCell = h === startHour;
                    const isSelecting = isInDragSelection(court._id, h);
                    const isFormSelected = isFormSelectedSlot(court._id, h);

                    return (
                      <td
                        key={h}
                        onMouseDown={() =>
                          handleMouseDown(court._id, h, status)
                        }
                        onMouseEnter={() =>
                          handleMouseEnter(court._id, h, status)
                        }
                        className={`h-14 border-b border-slate-200 dark:border-slate-800 transition cursor-pointer text-[10px] text-center p-0 relative ${
                          isStartCell
                            ? "border-r border-slate-200 dark:border-slate-700"
                            : "border-r border-transparent"
                        } ${
                          isSelecting || isFormSelected
                            ? "bg-emerald-300/70 dark:bg-emerald-900/80 border-2 border-emerald-500 z-10"
                            : getSlotColor(status)
                        }`}
                      >
                        {status !== "empty" && isStartCell && (
                          <div
                            className="absolute inset-y-1.5 left-1.5 flex items-center px-2 font-semibold text-white drop-shadow-sm z-20 pointer-events-none overflow-hidden rounded-md"
                            style={{
                              width: `calc(${durationHours * 100}% + ${(durationHours - 1) * 12}px)`,
                            }}
                          >
                            <span className="truncate text-left w-full">
                              {customerName}
                            </span>
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* DANH SÁCH CHI TIẾT */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
        <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-4">
          Danh Sách Lịch Đặt Chi Tiết Ngày {selectedDate} (
          {filteredBookings.length})
        </h2>

        {filteredBookings.length === 0 ? (
          <p className="text-slate-400 italic py-4">
            Không có lịch đặt sân nào trong ngày này.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-sm">
                  <th className="p-3">Khách hàng</th>
                  <th className="p-3">Sân</th>
                  <th className="p-3">Ngày & Giờ</th>
                  <th className="p-3">Thanh toán & Cọc</th>
                  <th className="p-3 text-center">Trạng thái</th>
                  <th className="p-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300 text-sm">
                {filteredBookings.map((item) => {
                  const customerName = item.user
                    ? item.user.name
                    : item.guestName || "Khách vãng lai";
                  const customerPhone = item.user
                    ? item.user.phone
                    : item.guestPhone || "Không có SĐT";

                  return (
                    <tr
                      key={item._id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition"
                    >
                      <td className="p-3 font-semibold">
                        <div className="flex items-center gap-2">
                          <User
                            size={16}
                            className="text-emerald-500 shrink-0"
                          />
                          <span>{customerName}</span>
                        </div>
                        <div className="text-xs text-slate-400 font-normal pl-6">
                          {customerPhone}{" "}
                          {item.user ? "(Thành viên)" : "(Vãng lai)"}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-medium">
                          <MapPin size={16} />
                          {item.court?.name || "Sân"}
                        </div>
                        <div className="text-xs text-slate-400">
                          {item.court?.type}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1.5">
                          <Calendar size={15} className="text-slate-400" />
                          {item.date?.split("T")[0]}
                        </div>
                        <div className="flex items-center gap-1.5 font-mono text-xs text-slate-500 mt-0.5">
                          <Clock size={15} className="text-slate-400" />
                          {item.startTime} - {item.endTime}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="text-xs font-semibold">
                          Tổng:{" "}
                          <span className="text-slate-800 dark:text-white font-bold">
                            {item.totalPrice?.toLocaleString()} đ
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          Cọc:{" "}
                          <span className="text-amber-600 font-medium">
                            {item.depositAmount?.toLocaleString()} đ
                          </span>
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        {renderStatusBadge(item.bookingStatus)}
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {item.bookingStatus === "pending_deposit" && (
                            <>
                              <button
                                onClick={() => handleConfirmDeposit(item._id)}
                                className="px-2.5 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer text-xs font-medium flex items-center gap-1 shadow-sm"
                                title="Xác nhận cọc"
                              >
                                <CheckCircle size={14} /> Duyệt cọc
                              </button>

                              <button
                                onClick={() => {
                                  setConfirmModal({
                                    show: true,
                                    title: "Xác nhận khách bùng sân",
                                    message:
                                      "Bạn muốn xử lý khoản tiền cọc của lịch đặt này như thế nào?",
                                    isNoShowAction: true,
                                    bookingId: item._id,
                                    onConfirm: null,
                                  });
                                }}
                                className="px-2.5 py-1.5 bg-rose-600 text-white rounded-lg hover:bg-rose-700 cursor-pointer text-xs font-medium flex items-center gap-1 shadow-sm"
                                title="Khách bùng sân"
                              >
                                <AlertTriangle size={14} /> Bùng sân
                              </button>
                            </>
                          )}

                          {item.bookingStatus === "confirmed" && (
                            <>
                              <button
                                onClick={() => handleCheckIn(item._id)}
                                className="px-2.5 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 cursor-pointer text-xs font-medium flex items-center gap-1 shadow-sm"
                                title="Check-in cho khách"
                              >
                                <CheckSquare size={14} /> Nhận sân
                              </button>

                              <button
                                onClick={() => {
                                  setConfirmModal({
                                    show: true,
                                    title: "Xác nhận khách bùng sân",
                                    message:
                                      "Bạn muốn xử lý khoản tiền cọc của lịch đặt này như thế nào?",
                                    isNoShowAction: true,
                                    bookingId: item._id,
                                    onConfirm: null,
                                  });
                                }}
                                className="px-2.5 py-1.5 bg-rose-600 text-white rounded-lg hover:bg-rose-700 cursor-pointer text-xs font-medium flex items-center gap-1 shadow-sm"
                                title="Khách bùng sân"
                              >
                                <AlertTriangle size={14} /> Bùng sân
                              </button>
                            </>
                          )}

                          {isAdmin && (
                            <button
                              onClick={() =>
                                confirmActionModal(
                                  "Xóa lịch đặt",
                                  "Bạn có chắc chắn muốn xóa lịch này khỏi hệ thống không?",
                                  `/bookings/${item._id}`,
                                )
                              }
                              className="p-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 cursor-pointer"
                              title="Xóa lịch"
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
