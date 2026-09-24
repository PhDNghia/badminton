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
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
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

  // State Phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    useState("Tiền mặt");
  const [isUpdatingPayment, setIsUpdatingPayment] = useState(false);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const calculateInvoiceAmounts = (item) => {
    if (!item)
      return {
        grossTotal: 0,
        discount: 0,
        finalRevenue: 0,
        deposit: 0,
        prepaidItems: 0,
        actualPayAtCounter: 0,
      };

    const courtPrice = item.courtFee || 0;
    const itemsTotal = (item.items || []).reduce(
      (sum, i) => sum + (i.price || 0) * (i.quantity || 1),
      0,
    );
    const prepaidItems = (item.items || []).reduce(
      (sum, i) => sum + (i.isPaid ? (i.price || 0) * (i.quantity || 1) : 0),
      0,
    );

    const grossTotal = item.totalAmount || courtPrice + itemsTotal;
    const discount = item.discountAmount || 0;
    const deposit = item.depositPaid || 0;

    const isForfeited =
      item.paymentStatus === "forfeited_deposit" ||
      item.paymentStatus === "deposit_retained";

    let finalRevenue = 0;
    let actualPayAtCounter = 0;

    if (isForfeited) {
      finalRevenue = deposit;
      actualPayAtCounter = deposit;
    } else {
      finalRevenue = Math.max(0, grossTotal - discount);
      actualPayAtCounter = Math.max(0, finalRevenue - deposit - prepaidItems);
    }

    return {
      grossTotal,
      discount,
      finalRevenue,
      deposit,
      prepaidItems,
      actualPayAtCounter,
    };
  };

  const renderPaymentStatus = (item) => {
    const status = item.paymentStatus;

    if (status === "forfeited_deposit" || status === "deposit_retained") {
      return (
        <span className="px-2.5 py-1 text-[10px] font-semibold rounded-full uppercase bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 flex items-center gap-1 w-fit mx-auto">
          <CheckCircle2 size={12} /> Thu cọc do hủy sân
        </span>
      );
    } else if (status === "refunded") {
      return (
        <span className="px-2.5 py-1 text-[10px] font-semibold rounded-full uppercase bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 flex items-center gap-1 w-fit mx-auto">
          <CheckCircle2 size={12} /> Đã hoàn cọc
        </span>
      );
    } else if (status === "paid_full" || status === "paid") {
      return (
        <span className="px-2.5 py-1 text-[10px] font-semibold rounded-full uppercase bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 flex items-center gap-1 w-fit mx-auto">
          <CheckCircle2 size={12} /> Đã thanh toán
        </span>
      );
    } else {
      return (
        <span className="px-2.5 py-1 text-[10px] font-semibold rounded-full uppercase bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 flex items-center gap-1 w-fit mx-auto">
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

  // Reset về trang 1 khi thay đổi bộ lọc hoặc tìm kiếm
  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchTerm,
    paymentMethodFilter,
    timeFilterType,
    selectedDate,
    selectedMonth,
    selectedYear,
    startDate,
    endDate,
  ]);

  // Tính toán dữ liệu phân trang
  const totalItems = filteredPayments.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const currentTableData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredPayments.slice(startIndex, startIndex + pageSize);
  }, [filteredPayments, currentPage, pageSize]);

  const totalRevenue = useMemo(() => {
    return filteredPayments.reduce((acc, curr) => {
      const { finalRevenue } = calculateInvoiceAmounts(curr);
      return acc + finalRevenue;
    }, 0);
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
    setSelectedPaymentMethod(formatPaymentMethod(invoice.paymentMethod));
    setIsModalOpen(true);
  };

  const handleUpdatePaymentMethod = async () => {
    if (!selectedInvoice) return;
    setIsUpdatingPayment(true);
    try {
      const res = await API.put(`/invoices/${selectedInvoice._id}`, {
        paymentMethod: selectedPaymentMethod,
        paymentStatus: "paid_full",
      });
      if (res.data.success) {
        toast.success("Cập nhật thanh toán thành công!");
        setPayments(
          payments.map((p) =>
            p._id === selectedInvoice._id
              ? {
                  ...p,
                  paymentMethod: selectedPaymentMethod,
                  paymentStatus: "paid_full",
                }
              : p,
          ),
        );
        setIsModalOpen(false);
      }
    } catch (error) {
      console.error("Lỗi cập nhật phương thức thanh toán:", error);
      toast.error(
        error.response?.data?.message ||
          "Không thể cập nhật phương thức thanh toán!",
      );
    } finally {
      setIsUpdatingPayment(false);
    }
  };

  const handleOpenDeleteModal = (e, invoice) => {
    e.stopPropagation();
    setInvoiceToDelete(invoice);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!invoiceToDelete) return;

    setIsDeleting(true);
    try {
      const res = await API.delete(`/invoices/${invoiceToDelete._id}`);
      if (res.data.success) {
        toast.success("Xóa hóa đơn thành công!");
        setPayments(
          payments.filter((item) => item._id !== invoiceToDelete._id),
        );
        setIsDeleteModalOpen(false);
        setInvoiceToDelete(null);
      }
    } catch (error) {
      console.error("Lỗi xóa hóa đơn:", error);
      const message = error.response?.data?.message || "Không thể xóa hóa đơn!";
      toast.error(message);
    } finally {
      setIsDeleting(false);
    }
  };

  // Component thanh phân trang dùng chung để tái sử dụng ở trên và dưới
  const renderPaginationBar = () => (
    <div className="flex flex-wrap items-center justify-between gap-4 py-3 px-4 text-xs text-slate-600 dark:text-slate-300 bg-slate-50/70 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 my-2">
      <div className="flex items-center gap-2">
        <span>Hiển thị:</span>
        <select
          value={pageSize}
          onChange={(e) => {
            setPageSize(Number(e.target.value));
            setCurrentPage(1);
          }}
          className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-1.5 rounded-lg outline-none text-slate-800 dark:text-white cursor-pointer font-medium"
        >
          <option value={5}>5</option>
          <option value={10}>10</option>
          <option value={20}>20</option>
          <option value={50}>50</option>
        </select>
        <span>
          bản ghi / trang (Tổng: <strong>{totalItems}</strong>)
        </span>
      </div>

      <div className="flex items-center gap-4">
        <span className="font-medium">
          Trang{" "}
          <strong className="text-emerald-600 dark:text-emerald-400">
            {currentPage}
          </strong>{" "}
          / {totalPages}
        </span>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
            className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer text-slate-700 dark:text-slate-200 shadow-2xs"
            title="Về trang đầu"
          >
            <ChevronsLeft size={15} />
          </button>

          <button
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer text-slate-700 dark:text-slate-200 shadow-2xs"
            title="Trang trước"
          >
            <ChevronLeft size={15} />
          </button>

          <button
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            disabled={currentPage >= totalPages}
            className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer text-slate-700 dark:text-slate-200 shadow-2xs"
            title="Trang sau"
          >
            <ChevronRight size={15} />
          </button>

          <button
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage >= totalPages}
            className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer text-slate-700 dark:text-slate-200 shadow-2xs"
            title="Về trang cuối"
          >
            <ChevronsRight size={15} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full min-h-screen p-6 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col relative transition-colors duration-200">
      {/* HEADER TỔNG QUAN */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-slate-800 dark:text-white">
            <CreditCard className="text-emerald-600" size={24} /> Lịch Sử Thanh
            Toán & Thống Kê
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Theo dõi danh sách hóa đơn, doanh thu và phương thức thanh toán
          </p>
        </div>
      </div>

      {/* KHU VỰC BỘ LỌC */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-xs border border-slate-200 dark:border-slate-800 mb-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2.5 rounded-xl">
            <Search size={16} className="text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Tìm theo tên khách, SĐT, tên sân..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent outline-none text-xs text-slate-800 dark:text-white w-full"
            />
          </div>

          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2.5 rounded-xl">
            <Wallet size={16} className="text-slate-400 shrink-0" />
            <select
              value={paymentMethodFilter}
              onChange={(e) => setPaymentMethodFilter(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 outline-none text-xs text-slate-800 dark:text-white w-full cursor-pointer"
            >
              <option value="all">Tất cả phương thức thanh toán</option>
              <option value="Tiền mặt">Tiền mặt</option>
              <option value="Chuyển khoản">Chuyển khoản</option>
            </select>
          </div>

          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2.5 rounded-xl">
            <Filter size={16} className="text-slate-400 shrink-0" />
            <select
              value={timeFilterType}
              onChange={(e) => setTimeFilterType(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 outline-none text-xs text-slate-800 dark:text-white w-full cursor-pointer"
            >
              <option value="all">Tất cả thời gian</option>
              <option value="day">Thống kê theo Ngày</option>
              <option value="week">Thống kê theo Tuần</option>
              <option value="month">Thống kê theo Tháng</option>
              <option value="quarter">Thống kê theo Quý</option>
              <option value="year">Thống kê theo Năm</option>
              <option value="custom">Tùy chọn Từ ngày - Đến ngày</option>
            </select>
          </div>
        </div>

        {/* CÁC Ô CHỌN THỜI GIAN ĐI KÈM THEO LOẠI BỘ LỌC */}
        {(timeFilterType === "day" ||
          timeFilterType === "week" ||
          timeFilterType === "quarter") && (
          <div className="flex items-center gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
            <label className="font-medium text-slate-500">Chọn ngày mốc:</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs px-3 py-1.5 rounded-xl text-slate-800 dark:text-white outline-none cursor-pointer"
              style={{ colorScheme: "dark" }}
            />
          </div>
        )}

        {timeFilterType === "month" && (
          <div className="flex items-center gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
            <label className="font-medium text-slate-500">Chọn tháng:</label>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs px-3 py-1.5 rounded-xl text-slate-800 dark:text-white outline-none cursor-pointer"
              style={{ colorScheme: "dark" }}
            />
          </div>
        )}

        {timeFilterType === "year" && (
          <div className="flex items-center gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
            <label className="font-medium text-slate-500">Chọn năm:</label>
            <input
              type="number"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs px-3 py-1.5 rounded-xl text-slate-800 dark:text-white outline-none w-28"
            />
          </div>
        )}

        {timeFilterType === "custom" && (
          <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
            <label className="font-medium text-slate-500">Từ ngày:</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs px-3 py-1.5 rounded-xl text-slate-800 dark:text-white outline-none cursor-pointer"
              style={{ colorScheme: "dark" }}
            />
            <label className="font-medium text-slate-500">Đến ngày:</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs px-3 py-1.5 rounded-xl text-slate-800 dark:text-white outline-none cursor-pointer"
              style={{ colorScheme: "dark" }}
            />
          </div>
        )}
      </div>

      {/* THẺ TỔNG QUAN DOANH THU */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 p-5 rounded-2xl flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
              Tổng doanh thu ({getTimeFilterLabel()})
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-700 dark:text-emerald-300 mt-1">
              {totalRevenue.toLocaleString()} đ
            </div>
          </div>
          <div className="bg-emerald-600 text-white p-3 rounded-xl shadow-xs">
            <DollarSign size={24} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl flex items-center justify-between shadow-xs">
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
              Tổng số lượng giao dịch
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-800 dark:text-white mt-1">
              {filteredPayments.length}{" "}
              <span className="text-xs font-normal text-slate-400">
                giao dịch
              </span>
            </div>
          </div>
          <div className="bg-emerald-600 text-white p-3 rounded-xl shadow-xs">
            <ReceiptText size={24} />
          </div>
        </div>
      </div>

      {/* BẢNG DANH SÁCH GIAO DỊCH */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xs border border-slate-200 dark:border-slate-800 p-5 flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Danh Sách Giao Dịch Chi Tiết ({filteredPayments.length})
          </h2>
        </div>

        {/* THANH PHÂN TRANG ĐẶT Ở TRÊN ĐẦU ĐỂ DỄ DÀNG THAY ĐỔI */}
        {!loading && filteredPayments.length > 0 && renderPaginationBar()}

        {loading ? (
          <p className="text-slate-400 italic py-8 text-center text-xs">
            Đang tải dữ liệu thanh toán...
          </p>
        ) : filteredPayments.length === 0 ? (
          <div className="text-center py-12">
            <ReceiptText
              className="mx-auto text-slate-300 dark:text-slate-700 mb-2"
              size={40}
            />
            <p className="text-slate-400 italic text-xs">
              Không tìm thấy lịch sử thanh toán nào phù hợp với bộ lọc thời gian
              này.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold uppercase text-[10px]">
                    <th className="p-3.5">Khách hàng</th>
                    <th className="p-3.5">Sân cầu lông</th>
                    <th className="p-3.5">Thời gian chơi</th>
                    <th className="p-3.5">Phương thức</th>
                    <th className="p-3.5">Tổng doanh thu hóa đơn</th>
                    <th className="p-3.5">Thu tại quầy</th>
                    <th className="p-3.5 text-center">Trạng thái</th>
                    <th className="p-3.5 text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {currentTableData.map((item) => {
                    const customerName = item.customerName || "Khách lẻ";
                    const customerPhone = item.phone || "Không có SĐT";
                    const bookingInfo = item.booking || {};

                    const { finalRevenue, actualPayAtCounter } =
                      calculateInvoiceAmounts(item);

                    return (
                      <tr
                        key={item._id}
                        className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition"
                      >
                        <td className="p-3.5 font-semibold">
                          <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
                            <User
                              size={15}
                              className="text-emerald-500 shrink-0"
                            />
                            <span className="font-bold">{customerName}</span>
                          </div>
                          <div className="text-[11px] text-slate-400 font-normal pl-5 mt-0.5 font-mono">
                            {customerPhone}
                          </div>
                        </td>
                        <td className="p-3.5">
                          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
                            <MapPin size={15} className="shrink-0" />
                            {item.court?.name || "Sân"}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {item.court?.type}
                          </div>
                        </td>
                        <td className="p-3.5">
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-700 dark:text-slate-300">
                            <Calendar size={13} className="text-slate-400" />
                            {bookingInfo.date
                              ? bookingInfo.date.split("T")[0]
                              : "N/A"}
                          </div>
                          <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            <Clock size={13} className="text-slate-400" />
                            {bookingInfo.startTime || "--:--"} -{" "}
                            {bookingInfo.endTime || "--:--"}
                          </div>
                        </td>
                        <td className="p-3.5">
                          <div className="space-y-1">
                            <div>
                              <span
                                className={`inline-block px-2 py-0.5 text-[10px] font-semibold rounded-lg ${
                                  formatPaymentMethod(item.paymentMethod) ===
                                  "Tiền mặt"
                                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
                                    : "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300"
                                }`}
                              >
                                {formatPaymentMethod(item.paymentMethod)}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-400 flex items-center gap-1">
                              <span>Thu ngân:</span>
                              <span className="text-slate-700 dark:text-slate-300 font-medium">
                                {item.cashierName &&
                                !item.cashierName.includes("currentCashierName")
                                  ? item.cashierName
                                  : "Thu ngân ca trực"}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="p-3.5 font-bold text-slate-800 dark:text-white">
                          {finalRevenue.toLocaleString()} đ
                        </td>

                        <td className="p-3.5 font-bold text-emerald-600 dark:text-emerald-400">
                          {actualPayAtCounter.toLocaleString()} đ
                          <div className="text-[10px] font-normal text-slate-400">
                            (Thu tại quầy)
                          </div>
                        </td>

                        <td className="p-3.5 text-center">
                          {renderPaymentStatus(item)}
                        </td>
                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenDetail(item)}
                              className="p-1.5 text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 bg-slate-100 dark:bg-slate-800 rounded-lg transition cursor-pointer"
                              title="Xem chi tiết"
                            >
                              <Eye size={15} />
                            </button>

                            {isAdmin && (
                              <button
                                onClick={(e) => handleOpenDeleteModal(e, item)}
                                className="p-1.5 text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 bg-slate-100 dark:bg-slate-800 rounded-lg transition cursor-pointer"
                                title="Xóa hóa đơn"
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

            {/* THANH PHÂN TRANG BÊN DƯỚI (DỰ PHÒNG) */}
            {/* {renderPaginationBar()} */}
          </>
        )}
      </div>

      {/* MODAL CHI TIẾT HÓA ĐƠN */}
      {isModalOpen && selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 text-xs">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <ReceiptText className="text-emerald-600" size={20} />
                <h3 className="text-sm font-bold text-slate-800 dark:text-white">
                  Chi Tiết Hóa Đơn Sân Cầu Lông
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
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
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
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

              {/* DANH SÁCH CHI TIẾT SÂN & SẢN PHẨM & VOUCHER */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1 uppercase tracking-wider text-[10px]">
                  <Info size={13} className="text-emerald-500" /> Chi tiết tiền
                  sân & sản phẩm phát sinh:
                </h4>
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
                  <div className="flex justify-between items-center p-3 bg-slate-50/50 dark:bg-slate-800/20">
                    <span className="text-slate-600 dark:text-slate-300">
                      Tiền sân ({selectedInvoice.court?.name || "Sân"})
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-white">
                      {(selectedInvoice.courtFee || 0).toLocaleString()} đ
                    </span>
                  </div>

                  {selectedInvoice.items && selectedInvoice.items.length > 0 ? (
                    selectedInvoice.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex justify-between items-center p-3 bg-slate-50/50 dark:bg-slate-800/20"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-slate-600 dark:text-slate-300">
                            {item.name}{" "}
                            <span className="text-slate-400 font-mono">
                              ({item.quantity}x)
                            </span>
                          </span>
                          {item.isPaid ? (
                            <span className="px-1.5 py-0.5 text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 rounded font-medium">
                              Đã trả lẻ
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 text-[10px] bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 rounded font-medium">
                              Chưa trả
                            </span>
                          )}
                        </div>
                        <span className="font-semibold text-slate-800 dark:text-white">
                          {(
                            (item.price || 0) * (item.quantity || 1)
                          ).toLocaleString()}{" "}
                          đ
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 text-slate-400 italic text-center">
                      Không có sản phẩm phát sinh đi kèm.
                    </div>
                  )}

                  {(selectedInvoice.discountAmount > 0 ||
                    selectedInvoice.discountCode) && (
                    <div className="flex justify-between items-center p-3 bg-emerald-50/30 dark:bg-emerald-950/20">
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                        Giảm giá Voucher:{" "}
                        <strong className="underline">
                          {selectedInvoice.discountCode || "Áp dụng"}
                        </strong>
                      </span>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                        -
                        {(selectedInvoice.discountAmount || 0).toLocaleString()}{" "}
                        đ
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* TỔNG KẾT THANH TOÁN TRONG MODAL */}
              {(() => {
                const {
                  finalRevenue,
                  discount,
                  deposit,
                  prepaidItems,
                  actualPayAtCounter,
                } = calculateInvoiceAmounts(selectedInvoice);

                const isPendingPayment =
                  selectedInvoice.paymentStatus !== "paid_full" &&
                  selectedInvoice.paymentStatus !== "paid" &&
                  selectedInvoice.paymentStatus !== "refunded";

                return (
                  <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 p-4 rounded-xl space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400 font-medium">
                        Tổng doanh thu hóa đơn:
                      </span>
                      <span className="font-bold text-slate-800 dark:text-white text-sm">
                        {finalRevenue.toLocaleString()} đ
                      </span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">
                          Voucher:
                        </span>
                        <span className="font-semibold text-amber-600">
                          -{discount.toLocaleString()} đ
                        </span>
                      </div>
                    )}
                    {prepaidItems > 0 && (
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">
                          Các món đã thanh toán lẻ trước:
                        </span>
                        <span className="font-semibold text-amber-600">
                          -{prepaidItems.toLocaleString()} đ
                        </span>
                      </div>
                    )}
                    {deposit > 0 && (
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">
                          Đã cọc trước:
                        </span>
                        <span className="font-semibold text-amber-600">
                          -{deposit.toLocaleString()} đ
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between border-t border-emerald-200 dark:border-emerald-900 pt-2">
                      <span className="text-emerald-800 dark:text-emerald-300 font-bold">
                        Tiền khách thanh toán cuối giờ
                      </span>
                      <span className="font-bold text-emerald-700 dark:text-emerald-300 text-sm">
                        {actualPayAtCounter.toLocaleString()} đ
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-emerald-200 dark:border-emerald-900">
                      <span className="text-slate-600 dark:text-slate-400 font-medium">
                        Hình thức thanh toán:
                      </span>
                      {isPendingPayment ? (
                        <select
                          value={selectedPaymentMethod}
                          onChange={(e) =>
                            setSelectedPaymentMethod(e.target.value)
                          }
                          className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-800 dark:text-white font-semibold outline-none cursor-pointer"
                        >
                          <option value="Tiền mặt">Tiền mặt</option>
                          <option value="Chuyển khoản">Chuyển khoản</option>
                        </select>
                      ) : (
                        <span className="font-semibold text-slate-800 dark:text-white">
                          {formatPaymentMethod(selectedInvoice.paymentMethod)}
                        </span>
                      )}
                    </div>

                    <div className="flex justify-between items-center pt-1">
                      <span className="text-slate-600 dark:text-slate-400 font-medium">
                        Trạng thái:
                      </span>
                      <div>{renderPaymentStatus(selectedInvoice)}</div>
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-white rounded-xl font-medium transition cursor-pointer"
              >
                Đóng
              </button>

              {selectedInvoice.paymentStatus !== "paid_full" &&
                selectedInvoice.paymentStatus !== "paid" &&
                selectedInvoice.paymentStatus !== "refunded" && (
                  <button
                    onClick={handleUpdatePaymentMethod}
                    disabled={isUpdatingPayment}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition cursor-pointer disabled:opacity-50"
                  >
                    {isUpdatingPayment ? "Đang lưu..." : "Lưu phương thức"}
                  </button>
                )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL XÁC NHẬN XÓA HÓA ĐƠN */}
      {isDeleteModalOpen && invoiceToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 text-center p-6">
            <div className="w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-950/50 text-rose-500 flex items-center justify-center mx-auto mb-4 border border-rose-100 dark:border-rose-900/40">
              <AlertTriangle size={24} />
            </div>
            <h3 className="text-base font-bold text-slate-800 dark:text-white mb-2">
              Xác Nhận Xóa Hóa Đơn
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
              Bạn có chắc chắn muốn xóa lịch sử thanh toán của khách hàng{" "}
              <strong className="text-slate-800 dark:text-white">
                {invoiceToDelete.customerName || "Khách lẻ"}
              </strong>{" "}
              (Sân:{" "}
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                {invoiceToDelete.court?.name || "N/A"}
              </span>
              ) không?
            </p>
            <div className="flex justify-center gap-3">
              <button
                type="button"
                onClick={() => !isDeleting && setIsDeleteModalOpen(false)}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl hover:bg-slate-300 dark:hover:bg-slate-700 font-medium text-xs transition cursor-pointer disabled:opacity-50"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 bg-rose-600 text-white rounded-xl hover:bg-rose-700 font-medium text-xs shadow-xs transition cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? "Đang xóa..." : "Xác nhận"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
