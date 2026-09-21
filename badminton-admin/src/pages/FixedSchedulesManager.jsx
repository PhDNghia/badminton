// badminton-admin/src/pages/FixedSchedulesManager.jsx
import { useState, useEffect } from "react";
import API from "../services/api";
import { Plus, Trash2, Edit, User, MapPin, X } from "lucide-react";
import { toast } from "react-toastify";

export default function FixedSchedulesManager() {
  const [schedules, setSchedules] = useState([]);
  const [courts, setCourts] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  // Đọc đúng key "adminUser" hoặc "user" từ localStorage
  const localUserStr =
    localStorage.getItem("adminUser") || localStorage.getItem("user") || "{}";
  const currentUser = JSON.parse(localUserStr);
  const isAdmin = currentUser.role === "admin" || currentUser.isAdmin === true;

  const [showAddModal, setShowAddModal] = useState(false);
  const [courtId, setCourtId] = useState("");
  const [isGuest, setIsGuest] = useState(true);
  const [userId, setUserId] = useState("");
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");

  const [selectedDays, setSelectedDays] = useState([1, 3, 5]);
  const [startTime, setStartTime] = useState("18:00");
  const [endTime, setEndTime] = useState("20:00");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [pricePerSession, setPricePerSession] = useState(0);
  const [totalPackagePrice, setTotalPackagePrice] = useState(0);
  const [totalSessions, setTotalSessions] = useState(0);
  const [depositAmount, setDepositAmount] = useState(0);

  // State Modal Sửa
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editCourtId, setEditCourtId] = useState("");
  const [editSelectedDays, setEditSelectedDays] = useState([]);
  const [editStartTime, setEditStartTime] = useState("18:00");
  const [editEndTime, setEditEndTime] = useState("20:00");
  const [editStartDate, setEditStartDate] = useState("");
  const [editEndDate, setEditEndDate] = useState("");
  const [editDepositAmount, setEditDepositAmount] = useState(0);
  const [editCustomerInfo, setEditCustomerInfo] = useState("");

  // State tính tiền cho modal Sửa
  const [editPricePerSession, setEditPricePerSession] = useState(0);
  const [editTotalPackagePrice, setEditTotalPackagePrice] = useState(0);
  const [editTotalSessions, setEditTotalSessions] = useState(0);

  const [confirmModal, setConfirmModal] = useState({
    show: false,
    title: "",
    message: "",
    onConfirm: null,
  });

  const handleToggleDay = (dayIndex, isEdit = false) => {
    if (isEdit) {
      if (editSelectedDays.includes(dayIndex)) {
        if (editSelectedDays.length > 1) {
          setEditSelectedDays(editSelectedDays.filter((d) => d !== dayIndex));
        }
      } else {
        setEditSelectedDays([...editSelectedDays, dayIndex].sort());
      }
    } else {
      if (selectedDays.includes(dayIndex)) {
        if (selectedDays.length > 1) {
          setSelectedDays(selectedDays.filter((d) => d !== dayIndex));
        }
      } else {
        setSelectedDays([...selectedDays, dayIndex].sort());
      }
    }
  };

  const calculateSessionPrice = (start, end) => {
    if (!start || !end) return 0;
    const startH = parseInt(start.split(":")[0], 10);
    let endH = parseInt(end.split(":")[0], 10);
    if (endH <= startH) endH += 24;

    let total = 0;
    for (let h = startH; h < endH; h++) {
      const currentHour = h % 24;
      if (currentHour >= 0 && currentHour <= 5) total += 60000;
      else if (currentHour >= 6 && currentHour <= 16) total += 30000;
      else total += 60000;
    }
    return total;
  };

  // Tính tiền cho modal Thêm mới
  useEffect(() => {
    const sessionPrice = calculateSessionPrice(startTime, endTime);
    setPricePerSession(sessionPrice);

    if (startDate && endDate && selectedDays.length > 0) {
      let count = 0;
      let curr = new Date(startDate);
      const end = new Date(endDate);

      while (curr <= end) {
        if (selectedDays.includes(curr.getDay())) count++;
        curr.setDate(curr.getDate() + 1);
      }

      setTotalSessions(count);
      setTotalPackagePrice(count * sessionPrice);
    } else {
      setTotalSessions(0);
      setTotalPackagePrice(0);
    }
  }, [startTime, endTime, startDate, endDate, selectedDays]);

  // Tính tiền cho modal Sửa khi thay đổi thông tin bên trong modal
  useEffect(() => {
    const sessionPrice = calculateSessionPrice(editStartTime, editEndTime);
    setEditPricePerSession(sessionPrice);

    if (editStartDate && editEndDate && editSelectedDays.length > 0) {
      let count = 0;
      let curr = new Date(editStartDate);
      const end = new Date(editEndDate);

      while (curr <= end) {
        if (editSelectedDays.includes(curr.getDay())) count++;
        curr.setDate(curr.getDate() + 1);
      }

      setEditTotalSessions(count);
      setEditTotalPackagePrice(count * sessionPrice);
    } else {
      setEditTotalSessions(0);
      setEditTotalPackagePrice(0);
    }
  }, [
    editStartTime,
    editEndTime,
    editStartDate,
    editEndDate,
    editSelectedDays,
  ]);

  const fetchData = async () => {
    try {
      const [resSchedules, resCourts, resUsers] = await Promise.all([
        API.get("/fixed-schedules"),
        API.get("/courts"),
        API.get("/users"),
      ]);
      if (resSchedules.data.success) setSchedules(resSchedules.data.data);
      if (resCourts.data.success) setCourts(resCourts.data.data);
      if (resUsers.data.success) setUsers(resUsers.data.data);
    } catch (error) {
      toast.error("Không thể tải danh sách lịch cố định!");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateFixed = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        court: courtId,
        daysOfWeek: selectedDays,
        startTime,
        endTime,
        startDate,
        endDate,
        depositAmount: Number(depositAmount),
      };

      if (isGuest) {
        payload.guestName = guestName;
        payload.guestPhone = guestPhone;
      } else {
        payload.user = userId;
      }

      const res = await API.post("/fixed-schedules", payload);
      if (res.data.success) {
        toast.success(res.data.message);
        setShowAddModal(false);
        setCourtId("");
        setGuestName("");
        setGuestPhone("");
        setUserId("");
        setStartDate("");
        setEndDate("");
        setDepositAmount(0);
        fetchData();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Lỗi khi tạo lịch cố định!");
    } finally {
      setLoading(false);
    }
  };

  // Mở modal sửa và xử lý chuẩn hóa dữ liệu ngày + thứ lặp lại từ database
  const handleOpenEdit = (item) => {
    setEditingId(item._id);

    const cId = item.court?._id || item.court || "";
    setEditCourtId(cId);

    // Hỗ trợ đọc cả 2 dạng: mảng daysOfWeek hoặc dạng đơn dayOfWeek từ database cũ
    let days = [1];
    if (Array.isArray(item.daysOfWeek) && item.daysOfWeek.length > 0) {
      days = item.daysOfWeek.map((d) => Number(d));
    } else if (item.dayOfWeek !== undefined && item.dayOfWeek !== null) {
      days = [Number(item.dayOfWeek)];
    }
    setEditSelectedDays(days);

    const sTime = item.startTime || "18:00";
    const eTime = item.endTime || "20:00";
    setEditStartTime(sTime);
    setEditEndTime(eTime);

    const sDateStr = item.startDate ? item.startDate.split("T")[0] : "";
    const eDateStr = item.endDate ? item.endDate.split("T")[0] : "";
    setEditStartDate(sDateStr);
    setEditEndDate(eDateStr);

    setEditDepositAmount(item.depositAmount || 0);
    setEditCustomerInfo(item.user?.name || item.guestName || "Khách lẻ");

    // Tính trực tiếp số buổi và tổng tiền ngay khi mở modal
    const sessionPrice = calculateSessionPrice(sTime, eTime);
    setEditPricePerSession(sessionPrice);

    if (sDateStr && eDateStr && days.length > 0) {
      let count = 0;
      let curr = new Date(sDateStr);
      const end = new Date(eDateStr);

      while (curr <= end) {
        if (days.includes(curr.getDay())) count++;
        curr.setDate(curr.getDate() + 1);
      }

      setEditTotalSessions(count);
      setEditTotalPackagePrice(count * sessionPrice);
    } else {
      setEditTotalSessions(0);
      setEditTotalPackagePrice(0);
    }

    setEditModalOpen(true);
  };

  const handleUpdateFixed = async (e) => {
    e.preventDefault();
    if (!editingId) return;
    setLoading(true);
    try {
      const payload = {
        court: editCourtId,
        daysOfWeek: editSelectedDays,
        startTime: editStartTime,
        endTime: editEndTime,
        startDate: editStartDate,
        endDate: editEndDate,
        depositAmount: Number(editDepositAmount),
      };

      const res = await API.put(`/fixed-schedules/${editingId}`, payload);
      if (res.data.success) {
        toast.success("Cập nhật lịch cố định thành công!");
        setEditModalOpen(false);
        setEditingId(null);
        fetchData();
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Lỗi khi cập nhật lịch cố định!",
      );
    } finally {
      setLoading(false);
    }
  };

  const confirmActionModal = (title, message, apiEndpoint) => {
    setConfirmModal({
      show: true,
      title,
      message,
      onConfirm: async () => {
        try {
          const res = await API.delete(apiEndpoint);
          if (res.data.success) {
            toast.success("Đã xóa lịch cố định thành công!");
            fetchData(); // hoặc hàm load lại dữ liệu của anh
          }
        } catch (error) {
          toast.error("Lỗi thực hiện thao tác!");
        }
        setConfirmModal({
          show: false,
          title: "",
          message: "",
          onConfirm: null,
        });
      },
    });
  };

  const handleDelete = (id) => {
    confirmActionModal(
      "Xóa lịch đặt",
      "Bạn có chắc chắn muốn xóa lịch này khỏi hệ thống không?",
      `/fixed-schedules/${id}`,
    );
  };

  return (
    <div className="pb-12 text-slate-100">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <span>🔁 Quản Lý Lịch Đặt Cố Định (Dài Hạn)</span>
        </h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-4 py-2.5 rounded-xl transition flex items-center gap-2 cursor-pointer shadow-md"
        >
          <Plus size={20} /> Tạo Gói Lịch Cố Định Mới
        </button>
      </div>

      {/* MODAL THÊM MỚI */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 p-6 rounded-2xl max-w-xl w-full shadow-2xl border border-slate-800 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-800">
              <h3 className="text-lg font-bold">
                Tạo Chuỗi Lịch Cố Định Hàng Tuần
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={handleCreateFixed}
              className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm"
            >
              <div className="md:col-span-2">
                <label className="flex items-center gap-2 text-slate-300 cursor-pointer font-medium">
                  <input
                    type="checkbox"
                    checked={isGuest}
                    onChange={(e) => {
                      setIsGuest(e.target.checked);
                      if (e.target.checked) setUserId("");
                      else {
                        setGuestName("");
                        setGuestPhone("");
                      }
                    }}
                    className="w-4 h-4 text-emerald-600 rounded border-slate-700 cursor-pointer"
                  />
                  Khách vãng lai
                </label>
              </div>

              <select
                value={courtId}
                onChange={(e) => setCourtId(e.target.value)}
                required
                className="p-3 border border-slate-700 rounded-xl bg-slate-800 text-white outline-none md:col-span-2"
              >
                <option value="">-- Chọn sân --</option>
                {courts.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name} ({c.type})
                  </option>
                ))}
              </select>

              {isGuest ? (
                <>
                  <input
                    type="text"
                    placeholder="Họ tên khách"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    required
                    className="p-3 border border-slate-700 rounded-xl bg-slate-800 text-white outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Số điện thoại"
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    required
                    className="p-3 border border-slate-700 rounded-xl bg-slate-800 text-white outline-none"
                  />
                </>
              ) : (
                <div className="md:col-span-2">
                  <select
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    required
                    className="w-full p-3 border border-slate-700 rounded-xl bg-slate-800 text-white outline-none"
                  >
                    <option value="">-- Chọn thành viên có sẵn --</option>
                    {users.map((u) => (
                      <option key={u._id} value={u._id}>
                        {u.name} - {u.phone}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="md:col-span-2">
                <label className="text-xs text-slate-400 mb-1.5 block font-medium">
                  Chọn các ngày lặp lại trong tuần:
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: 1, label: "Thứ 2" },
                    { id: 2, label: "Thứ 3" },
                    { id: 3, label: "Thứ 4" },
                    { id: 4, label: "Thứ 5" },
                    { id: 5, label: "Thứ 6" },
                    { id: 6, label: "Thứ 7" },
                    { id: 0, label: "Chủ Nhật" },
                  ].map((item) => {
                    const isChecked = selectedDays.includes(item.id);
                    return (
                      <button
                        type="button"
                        key={item.id}
                        onClick={() => handleToggleDay(item.id, false)}
                        className={`px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer border ${
                          isChecked
                            ? "bg-emerald-600 text-white border-emerald-500 shadow-sm"
                            : "bg-slate-800 text-slate-300 border-slate-700 hover:border-emerald-500"
                        }`}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-1 block">
                  Giờ bắt đầu:
                </label>
                <input
                  type="text"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                  className="w-full p-3 border border-slate-700 rounded-xl bg-slate-800 text-white outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-1 block">
                  Giờ kết thúc:
                </label>
                <input
                  type="text"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                  className="w-full p-3 border border-slate-700 rounded-xl bg-slate-800 text-white outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-1 block">
                  Từ ngày:
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                  className="w-full p-3 border border-slate-700 rounded-xl bg-slate-800 text-white outline-none"
                  style={{ colorScheme: "dark" }}
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-1 block">
                  Đến ngày:
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                  className="w-full p-3 border border-slate-700 rounded-xl bg-slate-800 text-white outline-none"
                  style={{ colorScheme: "dark" }}
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-1 block">
                  Giá mỗi buổi:
                </label>
                <input
                  type="text"
                  value={`${pricePerSession.toLocaleString()} đ`}
                  disabled
                  className="w-full p-3 border border-slate-700 rounded-xl bg-slate-800/50 text-emerald-400 font-bold outline-none cursor-not-allowed"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-1 block">
                  Tổng tiền ({totalSessions} buổi):
                </label>
                <input
                  type="text"
                  value={`${totalPackagePrice.toLocaleString()} đ`}
                  disabled
                  className="w-full p-3 border border-slate-700 rounded-xl bg-slate-800/50 text-amber-400 font-bold outline-none cursor-not-allowed"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-xs text-slate-400 mb-1 block">
                  Tiền cọc tổng gói (VNĐ):
                </label>
                <input
                  type="number"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  required
                  className="w-full p-3 border border-slate-700 rounded-xl bg-slate-800 text-white outline-none font-medium"
                />
              </div>

              <div className="md:col-span-2 flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 bg-slate-800 text-slate-200 rounded-xl font-medium cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium shadow-md cursor-pointer"
                >
                  {loading ? "Đang xử lý..." : "Xác Nhận Tạo Lịch Cố Định"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL SỬA LỊCH CỐ ĐỊNH */}
      {editModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 p-6 rounded-2xl max-w-xl w-full shadow-2xl border border-slate-800 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-800">
              <div>
                <h3 className="text-lg font-bold">Chỉnh Sửa Lịch Cố Định</h3>
                <p className="text-xs text-emerald-400 mt-0.5">
                  Khách hàng: <b>{editCustomerInfo}</b> (Giữ nguyên)
                </p>
              </div>
              <button
                onClick={() => setEditModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={handleUpdateFixed}
              className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm"
            >
              <select
                value={editCourtId}
                onChange={(e) => setEditCourtId(e.target.value)}
                required
                className="p-3 border border-slate-700 rounded-xl bg-slate-800 text-white outline-none md:col-span-2"
              >
                <option value="">-- Chọn sân --</option>
                {courts.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name} ({c.type})
                  </option>
                ))}
              </select>

              <div className="md:col-span-2">
                <label className="text-xs text-slate-400 mb-1.5 block font-medium">
                  Chọn các ngày lặp lại trong tuần:
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: 1, label: "Thứ 2" },
                    { id: 2, label: "Thứ 3" },
                    { id: 3, label: "Thứ 4" },
                    { id: 4, label: "Thứ 5" },
                    { id: 5, label: "Thứ 6" },
                    { id: 6, label: "Thứ 7" },
                    { id: 0, label: "Chủ Nhật" },
                  ].map((item) => {
                    const isChecked = editSelectedDays.includes(item.id);
                    return (
                      <button
                        type="button"
                        key={item.id}
                        onClick={() => handleToggleDay(item.id, true)}
                        className={`px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer border ${
                          isChecked
                            ? "bg-blue-600 text-white border-blue-500 shadow-sm"
                            : "bg-slate-800 text-slate-300 border-slate-700 hover:border-blue-500"
                        }`}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-1 block">
                  Giờ bắt đầu:
                </label>
                <input
                  type="text"
                  value={editStartTime}
                  onChange={(e) => setEditStartTime(e.target.value)}
                  required
                  className="w-full p-3 border border-slate-700 rounded-xl bg-slate-800 text-white outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-1 block">
                  Giờ kết thúc:
                </label>
                <input
                  type="text"
                  value={editEndTime}
                  onChange={(e) => setEditEndTime(e.target.value)}
                  required
                  className="w-full p-3 border border-slate-700 rounded-xl bg-slate-800 text-white outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-1 block">
                  Từ ngày:
                </label>
                <input
                  type="date"
                  value={editStartDate}
                  onChange={(e) => setEditStartDate(e.target.value)}
                  required
                  className="w-full p-3 border border-slate-700 rounded-xl bg-slate-800 text-white outline-none"
                  style={{ colorScheme: "dark" }}
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-1 block">
                  Đến ngày:
                </label>
                <input
                  type="date"
                  value={editEndDate}
                  onChange={(e) => setEditEndDate(e.target.value)}
                  required
                  className="w-full p-3 border border-slate-700 rounded-xl bg-slate-800 text-white outline-none"
                  style={{ colorScheme: "dark" }}
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-1 block">
                  Giá mỗi buổi:
                </label>
                <input
                  type="text"
                  value={`${editPricePerSession.toLocaleString()} đ`}
                  disabled
                  className="w-full p-3 border border-slate-700 rounded-xl bg-slate-800/50 text-blue-400 font-bold outline-none cursor-not-allowed"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-1 block">
                  Tổng tiền ({editTotalSessions} buổi):
                </label>
                <input
                  type="text"
                  value={`${editTotalPackagePrice.toLocaleString()} đ`}
                  disabled
                  className="w-full p-3 border border-slate-700 rounded-xl bg-slate-800/50 text-amber-400 font-bold outline-none cursor-not-allowed"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-xs text-slate-400 mb-1 block">
                  Tiền cọc tổng gói (VNĐ):
                </label>
                <input
                  type="number"
                  value={editDepositAmount}
                  onChange={(e) => setEditDepositAmount(e.target.value)}
                  required
                  className="w-full p-3 border border-slate-700 rounded-xl bg-slate-800 text-white outline-none font-medium"
                />
              </div>

              <div className="md:col-span-2 flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-800 text-slate-200 rounded-xl font-medium cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium shadow-md cursor-pointer"
                >
                  {loading ? "Đang lưu..." : "Lưu Thay Đổi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DANH SÁCH LỊCH CỐ ĐỊNH */}
      <div className="bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-800">
        <h2 className="text-xl font-semibold mb-4">
          Danh Sách Các Gói Cố Định ({schedules.length})
        </h2>
        {schedules.length === 0 ? (
          <p className="text-slate-400 italic py-4">
            Chưa có gói lịch cố định nào.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-sm">
                  <th className="p-3">Khách hàng</th>
                  <th className="p-3">Sân</th>
                  <th className="p-3">Lịch lặp hàng tuần</th>
                  <th className="p-3">Khoảng thời gian</th>
                  <th className="p-3">Giá / Buổi</th>
                  <th className="p-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300 text-sm">
                {schedules.map((item) => (
                  <tr
                    key={item._id}
                    className="hover:bg-slate-800/50 transition"
                  >
                    <td className="p-3 font-semibold">
                      <div className="flex items-center gap-2">
                        <User size={16} className="text-emerald-500" />
                        <span>
                          {item.user?.name || item.guestName || "Khách lẻ"}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 font-normal pl-6">
                        {item.user?.phone || item.guestPhone || "N/A"}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1.5 text-blue-400 font-medium">
                        <MapPin size={16} />
                        {item.court?.name || "Sân"}
                      </div>
                    </td>
                    <td className="p-3 font-medium text-emerald-400">
                      {item.daysOfWeek &&
                      Array.isArray(item.daysOfWeek) &&
                      item.daysOfWeek.length > 0
                        ? item.daysOfWeek
                            .map((d) => (d === 0 ? "CN" : `Thứ ${d + 1}`))
                            .join(", ")
                        : item.dayOfWeek !== undefined
                          ? `Thứ ${item.dayOfWeek + 1}`
                          : "N/A"}{" "}
                      ({item.startTime} - {item.endTime})
                    </td>
                    <td className="p-3 text-xs">
                      Từ {item.startDate} <br /> đến {item.endDate}
                    </td>
                    <td className="p-3 font-bold text-white">
                      {item.totalPricePerSession?.toLocaleString()} đ
                    </td>
                    <td className="p-3 text-right flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer"
                        title="Sửa gói"
                      >
                        <Edit size={15} />
                      </button>

                      {isAdmin && (
                        <button
                          onClick={() => handleDelete(item._id)}
                          className="p-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 cursor-pointer"
                          title="Xóa gói"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {confirmModal.show && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <div className="bg-[#121829] border border-slate-800 p-6 rounded-2xl max-w-md w-full shadow-2xl text-slate-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shrink-0">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-white">
                  {confirmModal.title}
                </h3>
              </div>
              <p className="text-sm text-slate-300 mb-6 pl-13">
                {confirmModal.message}
              </p>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setConfirmModal({
                      show: false,
                      title: "",
                      message: "",
                      onConfirm: null,
                    })
                  }
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-medium cursor-pointer text-sm transition"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  onClick={confirmModal.onConfirm}
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold shadow-md cursor-pointer text-sm transition"
                >
                  Xác nhận
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
