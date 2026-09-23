import { useState, useEffect } from "react";
import API from "../services/api";
import { toast } from "react-toastify";
import {
  Grid,
  Calendar,
  Clock,
  CheckCircle2,
  Banknote,
  ListOrdered,
  BarChart3,
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
        <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen p-6 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col relative transition-colors duration-200">
      {/* HEADER TỔNG QUAN & BỘ LỌC THỜI GIAN */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-slate-800 dark:text-white">
            <BarChart3 className="text-emerald-600" size={24} /> Thống Kê Số
            Liệu Thực Tế
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Báo cáo chi tiết hoạt động kinh doanh sân cầu lông từ hệ thống
          </p>
        </div>

        {/* Bộ lọc Ngày / Tuần / Tháng / Quý / Năm */}
        <div className="flex flex-wrap items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-1 shadow-xs">
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
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                timeRange === item.key
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* CÁC THẺ THỐNG KÊ CỐT LÕI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {/* Tổng số sân */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-xs border border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">
              Tổng số sân
            </p>
            <h3 className="text-xl font-bold text-slate-800 dark:text-white mt-1">
              {stats.totalCourts}{" "}
              <span className="text-xs font-normal text-slate-500">Sân</span>
            </h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0">
            <Grid size={18} />
          </div>
        </div>

        {/* Lượt đặt sân */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-xs border border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">
              Lượt đặt sân
            </p>
            <h3 className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
              {stats.totalBookings}{" "}
              <span className="text-xs font-normal text-slate-500">Đơn</span>
            </h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-100 dark:border-emerald-900/40">
            <Calendar size={18} />
          </div>
        </div>

        {/* Lượt cọc sân */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-xs border border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">
              Lượt cọc sân
            </p>
            <h3 className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-1">
              {stats.pendingBookings}{" "}
              <span className="text-xs font-normal text-slate-500">Đơn</span>
            </h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-100 dark:border-amber-900/40">
            <Clock size={18} />
          </div>
        </div>

        {/* Lượt đã hoàn thành */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-xs border border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">
              Đã hoàn thành
            </p>
            <h3 className="text-xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">
              {stats.completedBookings}{" "}
              <span className="text-xs font-normal text-slate-500">Đơn</span>
            </h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-100 dark:border-indigo-900/40">
            <CheckCircle2 size={18} />
          </div>
        </div>

        {/* Tổng doanh thu */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-xs border border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="truncate pr-2">
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">
              Tổng doanh thu
            </p>
            <h3 className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-1 truncate">
              {formatCurrency(stats.totalRevenue)}
            </h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-100 dark:border-emerald-900/40">
            <Banknote size={18} />
          </div>
        </div>
      </div>

      {/* BẢNG DANH SÁCH KHUNG GIỜ / LỊCH ĐẶT SÂN */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-xs border border-slate-200 dark:border-slate-800">
        <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <ListOrdered size={14} className="text-emerald-500" /> Danh sách
            khung giờ / Lịch đặt sân
          </h2>
        </div>

        {upcomingSchedules.length === 0 ? (
          <p className="text-slate-400 dark:text-slate-500 italic text-xs py-8 text-center">
            Không có lịch đặt sân nào trong khoảng thời gian này.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold uppercase text-[10px]">
                  <th className="pb-3">Sân</th>
                  <th className="pb-3">Khách hàng</th>
                  <th className="pb-3">Số điện thoại</th>
                  <th className="pb-3">Thời gian tạo / Lịch</th>
                  <th className="pb-3 text-right">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {upcomingSchedules.map((item, index) => (
                  <tr
                    key={index}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition"
                  >
                    <td className="py-3 font-semibold text-slate-800 dark:text-white">
                      {item.courtId?.name || "Sân cầu lông"}
                    </td>
                    <td className="py-3 font-medium text-slate-700 dark:text-slate-200">
                      {item.userId?.name || "Khách vãng lai"}
                    </td>
                    <td className="py-3 text-slate-500 dark:text-slate-400 font-mono">
                      {item.userId?.phone || "N/A"}
                    </td>
                    <td className="py-3 text-slate-500 dark:text-slate-400">
                      {new Date(item.createdAt).toLocaleString("vi-VN")}
                    </td>
                    <td className="py-3 text-right">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          item.status === "completed" ||
                          item.status === "success" ||
                          item.status === "confirmed"
                            ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                            : "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800"
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
