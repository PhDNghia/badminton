import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { Calendar as CalendarIcon } from "lucide-react";
import API from "../services/api";

const VisualBookingGrid = ({ courts, onOpenBookingModal }) => {
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);

  const hours = Array.from({ length: 18 }, (_, i) => i + 6);

  const fetchBookingsByDate = async () => {
    try {
      setLoading(true);
      const res = await API.get(`/bookings?date=${selectedDate}`);
      setBookings(res.data.data || res.data);
    } catch (error) {
      console.error("Lỗi tải lịch đặt:", error);
      toast.error("Không thể tải lịch đặt sân theo ngày!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookingsByDate();
  }, [selectedDate]);

  const getSlotStatus = (courtId, hour) => {
    const booking = bookings.find((b) => {
      const bCourtId = b.courtId?._id || b.courtId;
      if (bCourtId !== courtId) return false;

      const bDate = new Date(b.date).toISOString().split("T")[0];
      if (bDate !== selectedDate) return false;

      const startHour = parseInt(b.startTime.split(":")[0]);
      const endHour = parseInt(b.endTime.split(":")[0]);

      return hour >= startHour && hour < endHour;
    });

    if (!booking) return { status: "empty" };
    return { status: booking.status, booking };
  };

  const getSlotColor = (status) => {
    switch (status) {
      case "pending":
      case "Pending":
      case "pending_deposit":
      case "Pending_Deposit":
        return "bg-amber-400 hover:bg-amber-500 text-white";
      case "confirmed":
      case "Confirmed":
        return "bg-blue-500 hover:bg-blue-600 text-white";
      case "checked_in":
      case "Checked_In":
        return "bg-emerald-500 hover:bg-emerald-600 text-white";
      case "completed":
      case "Completed":
        return "bg-slate-400 text-white";
      default:
        return "bg-white dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700";
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden mb-8">
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap justify-between items-center gap-4 bg-slate-50 dark:bg-slate-900/50">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <CalendarIcon size={20} className="text-emerald-600" /> Sơ Đồ Sân
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

        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 dark:text-slate-300 font-medium">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-white border border-slate-300"></span>{" "}
            Trống
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-amber-400"></span> Chờ xác
            nhận
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
            <span className="w-3 h-3 rounded-full bg-slate-400"></span> Đã xong
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse min-w-[900px]">
          <thead>
            <tr className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 text-xs font-semibold">
              <th className="p-3 text-left border-r border-slate-200 dark:border-slate-700 w-28 sticky left-0 bg-slate-100 dark:bg-slate-800 z-10">
                Sân / Giờ
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
                  return (
                    <td
                      key={h}
                      onClick={() => {
                        if (status === "empty") {
                          onOpenBookingModal({
                            courtId: court._id,
                            date: selectedDate,
                            hour: h,
                          });
                        } else {
                          toast.info(
                            `Sân này đã có lịch đặt bởi: ${booking?.userId?.name || booking?.guestName || "Khách"}`,
                          );
                        }
                      }}
                      className={`h-14 border-r border-b border-slate-200 dark:border-slate-800 transition cursor-pointer text-[10px] text-center p-1 relative group ${getSlotColor(status)}`}
                    >
                      {status !== "empty" && (
                        <div className="truncate font-semibold">
                          {booking?.userId?.name ||
                            booking?.guestName ||
                            "Đã đặt"}
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
  );
};

export default VisualBookingGrid;
