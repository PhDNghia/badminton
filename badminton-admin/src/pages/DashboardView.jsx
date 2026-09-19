// badminton-admin/src/pages/DashboardView.jsx
import { useState, useEffect } from "react";
import API from "../services/api";
import { toast } from "react-toastify";
import {
  Grid,
  Calendar,
  Clock,
  CheckCircle,
  DollarSign,
  ListOrdered,
} from "lucide-react";

export default function DashboardView() {
  const [timeRange, setTimeRange] = useState("day"); // day, week, month, quarter, year
  const [stats, setStats] = useState({
    totalCourts: 0,
    totalBookings: 0,
    pendingBookings: 0,
    completedBookings: 0,
    totalRevenue: 0,
  });
  const [upcomingSchedules, setUpcomingSchedules] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData(timeRange);
  }, [timeRange]);

  const fetchData = async (range) => {
    try {
      setLoading(true);
      const res = await API.get(`/stats?range=${range}`);
      if (res.data.success) {
        setStats(res.data.stats);
        setUpcomingSchedules(res.data.upcomingSchedules || []);
      }
    } catch (error) {
      console.error(error);
      toast.error("Không thể tải số liệu thống kê thực tế!");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      {/* Tiêu đề & Bộ lọc thời gian */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-white">
            📊 Thống Kê Số Liệu Thực Tế
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Báo cáo chi tiết hoạt động kinh doanh sân cầu lông từ hệ thống.
          </p>
        </div>

        {/* Bộ lọc Ngày / Tuần / Tháng / Quý / Năm */}
        <div className="flex flex-wrap items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-1 shadow-sm">
          {[
            { key: "day", label: "Hôm nay" },
            { key: "week", label: "Tuần" },
            { key: "month", label: "Tháng" },
            { key: "quarter", label: "Quý" },
            { key: "year", label: "Năm" },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => setTimeRange(item.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                timeRange === item.key
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Các Thẻ Thống Kê Cốt Lõi */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Tổng số sân */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">
              Tổng số sân
            </p>
            <h3 className="text-2xl font-extrabold text-blue-600 dark:text-blue-400 mt-2">
              {stats.totalCourts}{" "}
              <span className="text-sm font-normal text-slate-500">Sân</span>
            </h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Grid size={20} />
          </div>
        </div>

        {/* Lượt đặt sân */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">
              Lượt đặt sân
            </p>
            <h3 className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-2">
              {stats.totalBookings}{" "}
              <span className="text-sm font-normal text-slate-500">Đơn</span>
            </h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Calendar size={20} />
          </div>
        </div>

        {/* Lượt cọc sân */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">
              Lượt cọc sân
            </p>
            <h3 className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-2">
              {stats.pendingBookings}{" "}
              <span className="text-sm font-normal text-slate-500">Đơn</span>
            </h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Clock size={20} />
          </div>
        </div>

        {/* Lượt đã hoàn thành */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">
              Đã hoàn thành
            </p>
            <h3 className="text-2xl font-extrabold text-violet-600 dark:text-violet-400 mt-2">
              {stats.completedBookings}{" "}
              <span className="text-sm font-normal text-slate-500">Đơn</span>
            </h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 flex items-center justify-center">
            <CheckCircle size={20} />
          </div>
        </div>

        {/* Tổng doanh thu */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">
              Tổng doanh thu
            </p>
            <h3 className="text-xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-2 truncate max-w-[160px]">
              {formatCurrency(stats.totalRevenue)}
            </h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0">
            <DollarSign size={20} />
          </div>
        </div>
      </div>

      {/* Bảng danh sách Khung giờ / Sân sắp đánh */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-800">
        <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
          <ListOrdered size={20} className="text-blue-500" /> Danh sách khung
          giờ / Lịch đặt sân
        </h2>

        {upcomingSchedules.length === 0 ? (
          <p className="text-slate-400 dark:text-slate-500 italic text-sm py-4">
            Không có lịch đặt sân nào trong khoảng thời gian này.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold text-xs uppercase">
                  <th className="pb-3">Sân</th>
                  <th className="pb-3">Khách hàng</th>
                  <th className="pb-3">Số điện thoại</th>
                  <th className="pb-3">Thời gian tạo / Lịch</th>
                  <th className="pb-3">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {upcomingSchedules.map((item, index) => (
                  <tr
                    key={index}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition"
                  >
                    <td className="py-3.5 font-bold text-blue-600 dark:text-blue-400">
                      {item.courtId?.name || "Sân cầu lông"}
                    </td>
                    <td className="py-3.5 font-medium text-slate-800 dark:text-white">
                      {item.userId?.name || "Khách vãng lai"}
                    </td>
                    <td className="py-3.5 text-slate-500 dark:text-slate-400">
                      {item.userId?.phone || "N/A"}
                    </td>
                    <td className="py-3.5 text-slate-500 dark:text-slate-400">
                      {new Date(item.createdAt).toLocaleString("vi-VN")}
                    </td>
                    <td className="py-3.5">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                          item.status === "completed" ||
                          item.status === "success" ||
                          item.status === "confirmed"
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                            : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                        }`}
                      >
                        {item.status || "Đang xử lý"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
