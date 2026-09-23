import { useState, useEffect } from "react";
import API from "../services/api";
import {
  Plus,
  Trash2,
  Edit,
  User,
  MapPin,
  X,
  Repeat,
  AlertTriangle,
} from "lucide-react";
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

  const handleOpenEdit = (item) => {
    setEditingId(item._id);

    const cId = item.court?._id || item.court || "";
    setEditCourtId(cId);

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
            fetchData();
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
    <div className="w-full min-h-screen p-6 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col relative transition-colors duration-200">
      {/* HEADER TỔNG QUAN */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-slate-800 dark:text-white">
            <Repeat className="text-emerald-600" size={24} /> Quản Lý Lịch Đặt
            Cố Định (Dài Hạn)
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Thiết lập chuỗi lịch lặp lại hàng tuần và quản lý các gói đặt sân
            dài hạn
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-xs font-medium shadow-xs transition flex items-center gap-2 cursor-pointer self-start md:self-auto"
        >
          <Plus size={16} /> Tạo Gói Lịch Cố Định Mới
        </button>
      </div>

      {/* DANH SÁCH LỊCH CỐ ĐỊNH */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xs border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Danh Sách Các Gói Cố Định ({schedules.length})
          </h2>
        </div>

        {schedules.length === 0 ? (
          <div className="text-center py-10 text-slate-400 dark:text-slate-500 italic text-xs">
            Chưa có gói lịch cố định nào.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold uppercase text-[10px]">
                  <th className="p-3.5">Khách hàng</th>
                  <th className="p-3.5">Sân</th>
                  <th className="p-3.5">Lịch lặp hàng tuần</th>
                  <th className="p-3.5">Khoảng thời gian</th>
                  <th className="p-3.5">Giá / Buổi</th>
                  <th className="p-3.5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {schedules.map((item) => (
                  <tr
                    key={item._id}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition"
                  >
                    <td className="p-3.5 font-semibold">
                      <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
                        <User size={15} className="text-emerald-500 shrink-0" />
                        <span className="font-bold">
                          {item.user?.name || item.guestName || "Khách lẻ"}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 dark:text-slate-400 font-normal pl-5 mt-0.5 font-mono">
                        {item.user?.phone || item.guestPhone || "N/A"}
                      </div>
                    </td>
                    <td className="p-3.5">
                      <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
                        <MapPin size={15} className="shrink-0" />
                        {item.court?.name || "Sân"}
                      </div>
                    </td>
                    <td className="p-3.5 font-medium text-slate-700 dark:text-slate-300">
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                        {item.daysOfWeek &&
                        Array.isArray(item.daysOfWeek) &&
                        item.daysOfWeek.length > 0
                          ? item.daysOfWeek
                              .map((d) => (d === 0 ? "CN" : `Thứ ${d + 1}`))
                              .join(", ")
                          : item.dayOfWeek !== undefined
                            ? `Thứ ${item.dayOfWeek + 1}`
                            : "N/A"}
                      </span>{" "}
                      <span className="text-slate-400 font-mono text-[11px]">
                        ({item.startTime} - {item.endTime})
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-500 dark:text-slate-400 text-[11px]">
                      {item.startDate} ➔ {item.endDate}
                    </td>
                    <td className="p-3.5 font-bold text-amber-600 dark:text-amber-400">
                      {item.totalPricePerSession?.toLocaleString()} đ
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="p-1.5 text-slate-500 hover:text-amber-600 dark:text-slate-400 dark:hover:text-amber-400 bg-slate-100 dark:bg-slate-800 rounded-lg transition cursor-pointer"
                          title="Sửa gói"
                        >
                          <Edit size={15} />
                        </button>

                        {isAdmin && (
                          <button
                            onClick={() => handleDelete(item._id)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 bg-slate-100 dark:bg-slate-800 rounded-lg transition cursor-pointer"
                            title="Xóa gói"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL THÊM MỚI */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl max-w-xl w-full shadow-2xl max-h-[90vh] overflow-y-auto text-slate-800 dark:text-slate-100 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-800 dark:text-white">
                Tạo Chuỗi Lịch Cố Định Hàng Tuần
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={handleCreateFixed}
              className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs"
            >
              <div className="md:col-span-2">
                <label className="flex items-center gap-2 text-slate-700 dark:text-slate-300 cursor-pointer font-medium">
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
                    className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
                  />
                  Khách vãng lai
                </label>
              </div>

              <div className="md:col-span-2">
                <label className="block font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Chọn sân
                </label>
                <select
                  value={courtId}
                  onChange={(e) => setCourtId(e.target.value)}
                  required
                  className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl p-2.5 outline-none cursor-pointer focus:border-emerald-500 transition"
                >
                  <option value="">-- Chọn sân --</option>
                  {courts.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name} ({c.type})
                    </option>
                  ))}
                </select>
              </div>

              {isGuest ? (
                <>
                  <div>
                    <label className="block font-medium text-slate-600 dark:text-slate-300 mb-1">
                      Họ tên khách
                    </label>
                    <input
                      type="text"
                      placeholder="Nhập họ tên"
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      required
                      className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-600 dark:text-slate-300 mb-1">
                      Số điện thoại
                    </label>
                    <input
                      type="text"
                      placeholder="Nhập số điện thoại"
                      value={guestPhone}
                      onChange={(e) => setGuestPhone(e.target.value)}
                      required
                      className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                    />
                  </div>
                </>
              ) : (
                <div className="md:col-span-2">
                  <label className="block font-medium text-slate-600 dark:text-slate-300 mb-1">
                    Thành viên hệ thống
                  </label>
                  <select
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    required
                    className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl p-2.5 outline-none cursor-pointer focus:border-emerald-500 transition"
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
                <label className="text-xs text-slate-500 dark:text-slate-400 mb-1.5 block font-medium">
                  Chọn các ngày lặp lại trong tuần:
                </label>
                <div className="flex flex-wrap gap-1.5">
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
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer border ${
                          isChecked
                            ? "bg-emerald-600 text-white border-emerald-500 shadow-xs"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-emerald-500"
                        }`}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Giờ bắt đầu
                </label>
                <input
                  type="text"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                  className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl p-2.5 outline-none focus:border-emerald-500 transition font-mono"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Giờ kết thúc
                </label>
                <input
                  type="text"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                  className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl p-2.5 outline-none focus:border-emerald-500 transition font-mono"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Từ ngày
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                  className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl p-2.5 outline-none cursor-pointer focus:border-emerald-500 transition"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Đến ngày
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                  className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl p-2.5 outline-none cursor-pointer focus:border-emerald-500 transition"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Giá mỗi buổi
                </label>
                <input
                  type="text"
                  value={`${pricePerSession.toLocaleString()} đ`}
                  disabled
                  className="w-full border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-100 dark:bg-slate-800/50 text-emerald-600 dark:text-emerald-400 font-bold p-2.5 outline-none cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Tổng tiền ({totalSessions} buổi)
                </label>
                <input
                  type="text"
                  value={`${totalPackagePrice.toLocaleString()} đ`}
                  disabled
                  className="w-full border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-100 dark:bg-slate-800/50 text-amber-600 dark:text-amber-400 font-bold p-2.5 outline-none cursor-not-allowed"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Tiền cọc tổng gói (VNĐ)
                </label>
                <input
                  type="number"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  required
                  className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl p-2.5 outline-none font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                />
              </div>

              <div className="md:col-span-2 flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition font-medium"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium shadow-xs cursor-pointer transition"
                >
                  {loading ? "Đang xử lý..." : "Xác Nhận Tạo Lịch"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL SỬA LỊCH CỐ ĐỊNH */}
      {editModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl max-w-xl w-full shadow-2xl max-h-[90vh] overflow-y-auto text-slate-800 dark:text-slate-100 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-800 dark:text-white">
                  Chỉnh Sửa Lịch Cố Định
                </h3>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5 font-medium">
                  Khách hàng:{" "}
                  <span className="font-bold">{editCustomerInfo}</span>
                </p>
              </div>
              <button
                onClick={() => setEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={handleUpdateFixed}
              className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs"
            >
              <div className="md:col-span-2">
                <label className="block font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Chọn sân
                </label>
                <select
                  value={editCourtId}
                  onChange={(e) => setEditCourtId(e.target.value)}
                  required
                  className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl p-2.5 outline-none cursor-pointer focus:border-emerald-500 transition"
                >
                  <option value="">-- Chọn sân --</option>
                  {courts.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name} ({c.type})
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="text-xs text-slate-500 dark:text-slate-400 mb-1.5 block font-medium">
                  Chọn các ngày lặp lại trong tuần:
                </label>
                <div className="flex flex-wrap gap-1.5">
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
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer border ${
                          isChecked
                            ? "bg-emerald-600 text-white border-emerald-500 shadow-xs"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-emerald-500"
                        }`}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Giờ bắt đầu
                </label>
                <input
                  type="text"
                  value={editStartTime}
                  onChange={(e) => setEditStartTime(e.target.value)}
                  required
                  className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl p-2.5 outline-none focus:border-emerald-500 transition font-mono"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Giờ kết thúc
                </label>
                <input
                  type="text"
                  value={editEndTime}
                  onChange={(e) => setEditEndTime(e.target.value)}
                  required
                  className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl p-2.5 outline-none focus:border-emerald-500 transition font-mono"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Từ ngày
                </label>
                <input
                  type="date"
                  value={editStartDate}
                  onChange={(e) => setEditStartDate(e.target.value)}
                  required
                  className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl p-2.5 outline-none cursor-pointer focus:border-emerald-500 transition"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Đến ngày
                </label>
                <input
                  type="date"
                  value={editEndDate}
                  onChange={(e) => setEditEndDate(e.target.value)}
                  required
                  className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl p-2.5 outline-none cursor-pointer focus:border-emerald-500 transition"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Giá mỗi buổi
                </label>
                <input
                  type="text"
                  value={`${editPricePerSession.toLocaleString()} đ`}
                  disabled
                  className="w-full border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-100 dark:bg-slate-800/50 text-emerald-600 dark:text-emerald-400 font-bold p-2.5 outline-none cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Tổng tiền ({editTotalSessions} buổi)
                </label>
                <input
                  type="text"
                  value={`${editTotalPackagePrice.toLocaleString()} đ`}
                  disabled
                  className="w-full border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-100 dark:bg-slate-800/50 text-amber-600 dark:text-amber-400 font-bold p-2.5 outline-none cursor-not-allowed"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Tiền cọc tổng gói (VNĐ)
                </label>
                <input
                  type="number"
                  value={editDepositAmount}
                  onChange={(e) => setEditDepositAmount(e.target.value)}
                  required
                  className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl p-2.5 outline-none font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                />
              </div>

              <div className="md:col-span-2 flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition font-medium"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium shadow-xs cursor-pointer transition"
                >
                  {loading ? "Đang lưu..." : "Lưu Thay Đổi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL XÁC NHẬN XÓA */}
      {confirmModal.show && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm p-6 border border-slate-200 dark:border-slate-800 text-center animate-in fade-in zoom-in duration-200">
            <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-500 flex items-center justify-center mx-auto mb-4 border border-amber-100 dark:border-amber-900/40">
              <AlertTriangle size={24} />
            </div>
            <h3 className="text-base font-bold text-slate-800 dark:text-white mb-2">
              {confirmModal.title}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
              {confirmModal.message}
            </p>
            <div className="flex justify-center gap-3">
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
                className="flex-1 px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl hover:bg-slate-300 dark:hover:bg-slate-700 font-medium text-xs transition cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={confirmModal.onConfirm}
                className="flex-1 px-4 py-2 bg-rose-600 text-white rounded-xl hover:bg-rose-700 font-medium text-xs shadow-xs transition cursor-pointer"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
