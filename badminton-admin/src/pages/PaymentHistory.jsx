import { useState, useEffect, useMemo } from "react";
import API from "../services/api";
import {
  CreditCard,
  Calendar,
  Clock,
  User,
  MapPin,
  CheckCircle2,
  Clock3,
  Search,
  ReceiptText,
  Filter,
  DollarSign,
  Wallet,
  X,
  Eye,
  Info,
  Trash2,
} from "lucide-react";
import { toast } from "react-toastify";

export default function PaymentHistory() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [timeFilterType, setTimeFilterType] = useState("all");
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7),
  );
  const [selectedYear, setSelectedYear] = useState(
    new Date().getFullYear().toString(),
  );
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("all");

  // State cho Modal xem chi tiết hóa đơn
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const currentUser = JSON.parse(localStorage.getItem("adminUser") || "{}");
  const isAdmin = currentUser.role === "admin";

  const fetchPaymentHistory = async () => {
    setLoading(true);
    try {
      const res = await API.get("/invoices");
      if (res.data.success) {
        setPayments(res.data.data);
      }
    } catch (error) {
      console.error("Lỗi tải lịch sử thanh toán:", error);
      toast.error("Không thể tải danh sách lịch sử thanh toán từ hệ thống!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentHistory();
  }, []);

  const formatPaymentMethod = (method) => {
    if (!method) return "Tiền mặt";
    const lower = method.toLowerCase();
    if (lower.includes("cash") || lower.includes("tiền mặt")) return "Tiền mặt";
    if (lower.includes("transfer") || lower.includes("chuyển khoản"))
      return "Chuyển khoản";
    return method;
  };

  const renderPaymentStatus = (item) => {
    const status = item.paymentStatus;
    if (status === "paid_full") {
      return (
        <span className="px-3 py-1 text-xs font-semibold rounded-full uppercase bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 flex items-center gap-1 w-fit mx-auto">
          <CheckCircle2 size={12} /> Đã thanh toán
        </span>
      );
    } else if (status === "paid_deposit") {
      return (
        <span className="px-3 py-1 text-xs font-semibold rounded-full uppercase bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 flex items-center gap-1 w-fit mx-auto">
          <CheckCircle2 size={12} /> Đã cọc
        </span>
      );
    } else {
      return (
        <span className="px-3 py-1 text-xs font-semibold rounded-full uppercase bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 flex items-center gap-1 w-fit mx-auto">
          <Clock3 size={12} /> Chờ thanh toán
        </span>
      );
    }
  };

  const filteredPayments = useMemo(() => {
    return payments.filter((item) => {
      const customerName = item.customerName || "Khách lẻ";
      const customerPhone = item.phone || "";
      const courtName = item.court?.name || "";

      const matchSearch =
        customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customerPhone.includes(searchTerm) ||
        courtName.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchSearch) return false;

      const method = formatPaymentMethod(item.paymentMethod);
      if (paymentMethodFilter !== "all" && method !== paymentMethodFilter) {
        return false;
      }

      if (timeFilterType === "all") return true;

      const bookingDate = item.booking?.date;
      const itemDateStr = bookingDate ? bookingDate.split("T")[0] : "";
      if (!itemDateStr) return false;

      const itemDate = new Date(itemDateStr);

      if (timeFilterType === "day") {
        return itemDateStr === selectedDate;
      }

      if (timeFilterType === "week") {
        const curr = new Date(selectedDate);
        const firstDayOfWeek = new Date(
          curr.setDate(curr.getDate() - curr.getDay() + 1),
        );
        const lastDayOfWeek = new Date(
          curr.setDate(curr.getDate() - curr.getDay() + 7),
        );
        return itemDate >= firstDayOfWeek && itemDate <= lastDayOfWeek;
      }

      if (timeFilterType === "month") {
        const [selYear, selMonth] = selectedMonth.split("-");
        const [itemYear, itemMonth] = itemDateStr.split("-");
        return selYear === itemYear && selMonth === itemMonth;
      }

      if (timeFilterType === "quarter") {
        const selD = new Date(selectedDate);
        const selQ = Math.floor(selD.getMonth() / 3) + 1;
        const itemQ = Math.floor(itemDate.getMonth() / 3) + 1;
        return selD.getFullYear() === itemDate.getFullYear() && selQ === itemQ;
      }

      if (timeFilterType === "year") {
        const itemYear = itemDateStr.split("-")[0];
        return selectedYear === itemYear;
      }

      if (timeFilterType === "custom") {
        if (!startDate || !endDate) return true;
        return itemDateStr >= startDate && itemDateStr <= endDate;
      }

      return true;
    });
  }, [
    payments,
    searchTerm,
    paymentMethodFilter,
    timeFilterType,
    selectedDate,
    selectedMonth,
    selectedYear,
    startDate,
    endDate,
  ]);

  const totalRevenue = useMemo(() => {
    return filteredPayments.reduce(
      (acc, curr) => acc + (curr.totalAmount || 0),
      0,
    );
  }, [filteredPayments]);

  const getTimeFilterLabel = () => {
    if (timeFilterType === "day") return `Ngày ${selectedDate}`;
    if (timeFilterType === "week") return `Tuần chứa ngày ${selectedDate}`;
    if (timeFilterType === "month") return `Tháng ${selectedMonth}`;
    if (timeFilterType === "quarter") return `Quý chứa ngày ${selectedDate}`;
    if (timeFilterType === "year") return `Năm ${selectedYear}`;
    if (timeFilterType === "custom")
      return `Từ ${startDate || "..."} đến ${endDate || "..."}`;
    return "Tất cả thời gian";
  };

  const handleOpenDetail = (invoice) => {
    setSelectedInvoice(invoice);
    setIsModalOpen(true);
  };

  const handleDeleteInvoice = async (e, invoiceId) => {
    e.stopPropagation();

    if (
      !window.confirm("Bạn có chắc chắn muốn xóa lịch sử thanh toán này không?")
    ) {
      return;
    }

    try {
      const res = await API.delete(`/invoices/${invoiceId}`);
      if (res.data.success) {
        toast.success("Xóa hóa đơn thành công!");
        setPayments(payments.filter((item) => item._id !== invoiceId));
      }
    } catch (error) {
      console.error("Lỗi xóa hóa đơn:", error);
      const message = error.response?.data?.message || "Không thể xóa hóa đơn!";
      toast.error(message);
    }
  };

  return (
    <div className="pb-12 relative">
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <CreditCard className="text-emerald-600" /> Lịch Sử Thanh Toán & Thống
          Kê
        </h1>
      </div>

      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 mb-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl">
            <Search size={18} className="text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Tìm theo tên khách, SĐT, tên sân..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent outline-none text-sm text-slate-800 dark:text-white w-full"
            />
          </div>

          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl">
            <Wallet size={18} className="text-slate-400 shrink-0" />
            <select
              value={paymentMethodFilter}
              onChange={(e) => setPaymentMethodFilter(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 outline-none text-sm text-slate-800 dark:text-white w-full cursor-pointer"
            >
              <option
                value="all"
                className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white"
              >
                Tất cả phương thức thanh toán
              </option>
              <option
                value="Tiền mặt"
                className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white"
              >
                Tiền mặt
              </option>
              <option
                value="Chuyển khoản"
                className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white"
              >
                Chuyển khoản
              </option>
            </select>
          </div>

          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl">
            <Filter size={18} className="text-slate-400 shrink-0" />
            <select
              value={timeFilterType}
              onChange={(e) => setTimeFilterType(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 outline-none text-sm text-slate-800 dark:text-white w-full cursor-pointer"
            >
              <option
                value="all"
                className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white"
              >
                Tất cả thời gian
              </option>
              <option
                value="day"
                className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white"
              >
                Thống kê theo Ngày
              </option>
              <option
                value="week"
                className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white"
              >
                Thống kê theo Tuần
              </option>
              <option
                value="month"
                className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white"
              >
                Thống kê theo Tháng
              </option>
              <option
                value="quarter"
                className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white"
              >
                Thống kê theo Quý
              </option>
              <option
                value="year"
                className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white"
              >
                Thống kê theo Năm
              </option>
              <option
                value="custom"
                className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white"
              >
                Tùy chọn Từ ngày - Đến ngày
              </option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
          {(timeFilterType === "day" ||
            timeFilterType === "week" ||
            timeFilterType === "quarter") && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium">
                Chọn ngày:
              </span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl text-sm text-slate-800 dark:text-white outline-none cursor-pointer"
                style={{ colorScheme: "dark" }}
              />
            </div>
          )}

          {timeFilterType === "month" && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium">
                Chọn tháng:
              </span>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl text-sm text-slate-800 dark:text-white outline-none cursor-pointer"
                style={{ colorScheme: "dark" }}
              />
            </div>
          )}

          {timeFilterType === "year" && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium">
                Chọn năm:
              </span>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl text-sm text-slate-800 dark:text-white outline-none cursor-pointer"
              >
                <option
                  value="2025"
                  className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white"
                >
                  2025
                </option>
                <option
                  value="2026"
                  className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white"
                >
                  2026
                </option>
                <option
                  value="2027"
                  className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white"
                >
                  2027
                </option>
              </select>
            </div>
          )}

          {timeFilterType === "custom" && (
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-medium">
                  Từ ngày:
                </span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl text-sm text-slate-800 dark:text-white outline-none cursor-pointer"
                  style={{ colorScheme: "dark" }}
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-medium">
                  Đến ngày:
                </span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl text-sm text-slate-800 dark:text-white outline-none cursor-pointer"
                  style={{ colorScheme: "dark" }}
                />
              </div>
            </div>
          )}

          <div className="text-xs text-slate-400 ml-auto">
            Hiển thị kết quả cho:{" "}
            <strong className="text-slate-700 dark:text-slate-300">
              {filteredPayments.length} giao dịch
            </strong>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 p-5 rounded-2xl flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
              Tổng doanh thu ({getTimeFilterLabel()})
            </div>
            <div className="text-3xl font-extrabold text-emerald-700 dark:text-emerald-300 mt-1">
              {totalRevenue.toLocaleString()} đ
            </div>
          </div>
          <div className="bg-emerald-500 text-white p-3 rounded-xl shadow-sm">
            <DollarSign size={28} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl flex items-center justify-between shadow-sm">
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
              Tổng số lượng giao dịch
            </div>
            <div className="text-3xl font-extrabold text-slate-800 dark:text-white mt-1">
              {filteredPayments.length}{" "}
              <span className="text-base font-normal text-slate-400">
                giao dịch
              </span>
            </div>
          </div>
          <div className="bg-blue-500 text-white p-3 rounded-xl shadow-sm">
            <ReceiptText size={28} />
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
        <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-4">
          Danh Sách Giao Dịch Chi Tiết ({filteredPayments.length})
        </h2>

        {loading ? (
          <p className="text-slate-400 italic py-4">
            Đang tải dữ liệu thanh toán...
          </p>
        ) : filteredPayments.length === 0 ? (
          <div className="text-center py-12">
            <ReceiptText
              className="mx-auto text-slate-300 dark:text-slate-700 mb-2"
              size={48}
            />
            <p className="text-slate-400 italic">
              Không tìm thấy lịch sử thanh toán nào phù hợp với bộ lọc thời gian
              này.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-sm">
                  <th className="p-3">Khách hàng</th>
                  <th className="p-3">Sân cầu lông</th>
                  <th className="p-3">Thời gian chơi</th>
                  <th className="p-3">Phương thức thanh toán</th>
                  <th className="p-3">Tổng tiền sân</th>
                  <th className="p-3">Tiền cọc</th>
                  <th className="p-3 text-center">Trạng thái</th>
                  <th className="p-3 text-center">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300 text-sm">
                {filteredPayments.map((item) => {
                  const customerName = item.customerName || "Khách lẻ";
                  const customerPhone = item.phone || "Không có SĐT";
                  const payMethodText = formatPaymentMethod(item.paymentMethod);
                  const bookingInfo = item.booking || {};

                  return (
                    <tr
                      key={item._id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition cursor-pointer"
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
                          SĐT: {customerPhone}
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
                        <div className="flex items-center gap-1.5 text-xs">
                          <Calendar size={14} className="text-slate-400" />
                          {bookingInfo.date
                            ? bookingInfo.date.split("T")[0]
                            : "N/A"}
                        </div>
                        <div className="flex items-center gap-1.5 font-mono text-xs text-slate-500 mt-0.5">
                          <Clock size={14} className="text-slate-400" />
                          {bookingInfo.startTime || "--:--"} -{" "}
                          {bookingInfo.endTime || "--:--"}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="space-y-1.5 py-1">
                          <div>
                            <span
                              className={`inline-block px-2.5 py-1 text-xs font-semibold rounded-lg shadow-sm ${
                                formatPaymentMethod(item.paymentMethod) ===
                                "Tiền mặt"
                                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                                  : "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                              }`}
                            >
                              {formatPaymentMethod(item.paymentMethod)}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                            <span>Thu ngân:</span>
                            <span className="text-slate-700 dark:text-slate-200 font-medium">
                              {item.cashierName &&
                              !item.cashierName.includes("currentCashierName")
                                ? item.cashierName
                                : "Thu ngân ca trực"}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 font-bold text-emerald-600 dark:text-emerald-400 text-base">
                        {(item.totalAmount || 0).toLocaleString()} đ
                      </td>
                      <td className="p-3 text-xs font-semibold text-amber-600">
                        {(item.depositPaid || 0).toLocaleString()} đ
                      </td>
                      <td className="p-3 text-center">
                        {renderPaymentStatus(item)}
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenDetail(item);
                            }}
                            className="p-2 hover:bg-emerald-50 dark:hover:bg-slate-800 text-emerald-600 dark:text-emerald-400 rounded-xl transition inline-flex items-center gap-1 text-xs font-medium cursor-pointer"
                            title="Xem chi tiết"
                          >
                            <Eye size={16} />
                          </button>

                          {isAdmin && (
                            <button
                              onClick={(e) => handleDeleteInvoice(e, item._id)}
                              className="p-2 hover:bg-rose-50 dark:hover:bg-slate-800 text-rose-600 dark:text-rose-400 rounded-xl transition inline-flex items-center gap-1 text-xs font-medium cursor-pointer"
                              title="Xóa hóa đơn"
                            >
                              <Trash2 size={16} />
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

      {/* MODAL CHI TIẾT HÓA ĐƠN */}
      {isModalOpen && selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Header Modal */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <ReceiptText className="text-emerald-600" size={24} />
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                  Chi Tiết Hóa Đơn Sân Cầu Lông
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl transition"
              >
                <X size={20} />
              </button>
            </div>

            {/* Body Modal */}
            <div className="p-6 space-y-5 text-sm max-h-[75vh] overflow-y-auto">
              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl space-y-2 border border-slate-100 dark:border-slate-800">
                <div className="flex justify-between">
                  <span className="text-slate-400">Khách hàng:</span>
                  <span className="font-semibold text-slate-800 dark:text-white">
                    {selectedInvoice.customerName || "Khách lẻ"} (
                    {selectedInvoice.phone || "Không có SĐT"})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Sân đặt:</span>
                  <span className="font-semibold text-blue-600 dark:text-blue-400">
                    {selectedInvoice.court?.name || "Sân"} -{" "}
                    {selectedInvoice.court?.type || "Sân chuẩn"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Ngày chơi:</span>
                  <span className="font-medium text-slate-800 dark:text-white">
                    {selectedInvoice.booking?.date
                      ? selectedInvoice.booking.date.split("T")[0]
                      : "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Khung giờ:</span>
                  <span className="font-mono font-medium text-slate-800 dark:text-white">
                    {selectedInvoice.booking?.startTime || "--:--"} đến{" "}
                    {selectedInvoice.booking?.endTime || "--:--"}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 text-xs uppercase tracking-wider">
                  <Info size={14} className="text-emerald-500" /> Chi tiết tiền
                  sân & sản phẩm phát sinh:
                </h4>
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
                  <div className="flex justify-between p-3 bg-slate-50/50 dark:bg-slate-800/20 text-xs">
                    <span className="text-slate-600 dark:text-slate-300">
                      Tiền sân ({selectedInvoice.court?.name || "Sân"})
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-white">
                      {(
                        selectedInvoice.courtFee ||
                        selectedInvoice.totalAmount ||
                        0
                      ).toLocaleString()}{" "}
                      đ
                    </span>
                  </div>

                  {selectedInvoice.items && selectedInvoice.items.length > 0 ? (
                    selectedInvoice.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex justify-between p-3 bg-slate-50/50 dark:bg-slate-800/20 text-xs"
                      >
                        <span className="text-slate-600 dark:text-slate-300">
                          {item.name}{" "}
                          <span className="text-slate-400">
                            ({item.quantity}x)
                          </span>
                        </span>
                        <span className="font-semibold text-slate-800 dark:text-white">
                          {(
                            (item.price || 0) * (item.quantity || 1)
                          ).toLocaleString()}{" "}
                          đ
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 text-xs text-slate-400 italic text-center">
                      Không có sản phẩm phát sinh đi kèm.
                    </div>
                  )}

                  {selectedInvoice.discount > 0 && (
                    <div className="flex justify-between p-3 bg-slate-50/50 dark:bg-slate-800/20 text-xs">
                      <span className="text-slate-600 dark:text-slate-300">
                        Giảm giá / Khuyến mãi
                      </span>
                      <span className="font-semibold text-rose-500">
                        -{(selectedInvoice.discount || 0).toLocaleString()} đ
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 p-4 rounded-xl space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-emerald-800 dark:text-emerald-300 font-medium">
                    Tổng tiền sân:
                  </span>
                  <span className="font-bold text-emerald-700 dark:text-emerald-300 text-base">
                    {(selectedInvoice.totalAmount || 0).toLocaleString()} đ
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400">
                    Đã cọc trước:
                  </span>
                  <span className="font-semibold text-amber-600">
                    {(selectedInvoice.depositPaid || 0).toLocaleString()} đ
                  </span>
                </div>
                <div className="flex justify-between text-sm border-t border-emerald-200 dark:border-emerald-900 pt-2">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">
                    Hình thức thanh toán:
                  </span>
                  <span className="font-semibold text-slate-800 dark:text-white">
                    {formatPaymentMethod(selectedInvoice.paymentMethod)}
                  </span>
                </div>
                <div className="flex justify-between text-sm items-center pt-1">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">
                    Trạng thái:
                  </span>
                  <div>{renderPaymentStatus(selectedInvoice)}</div>
                </div>
              </div>
            </div>

            {/* Footer Modal */}
            <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-white rounded-xl text-sm font-medium transition"
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
