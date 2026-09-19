import CourtModel from "../models/CourtModel.js";
import BookingModel from "../models/BookingModel.js";
import InvoiceModel from "../models/InvoiceModel.js";

export const getDashboardStats = async (req, res) => {
  try {
    const { range = "day" } = req.query;

    let startDate = new Date();
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);

    const now = new Date();
    if (range === "week") {
      const dayOfWeek = now.getDay();
      const diffToMonday =
        now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
      startDate = new Date(now.setDate(diffToMonday));
      startDate.setHours(0, 0, 0, 0);
    } else if (range === "month") {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (range === "quarter") {
      const quarterMonth = Math.floor(now.getMonth() / 3) * 3;
      startDate = new Date(now.getFullYear(), quarterMonth, 1);
    } else if (range === "year") {
      startDate = new Date(now.getFullYear(), 0, 1);
    }

    const startDateStr = startDate.toISOString().split("T")[0];
    const endDateStr = endDate.toISOString().split("T")[0];

    // 1. Tổng số sân
    let totalCourts = 0;
    try {
      totalCourts = await CourtModel.countDocuments();
    } catch (e) {
      console.log("Lỗi count courts:", e.message);
    }

    // 2. Lượt đặt sân
    let totalBookings = 0;
    try {
      totalBookings = await BookingModel.countDocuments({
        $or: [
          { date: { $gte: startDateStr, $lte: endDateStr } },
          { createdAt: { $gte: startDate, $lte: endDate } },
        ],
      });
    } catch (e) {
      console.log("Lỗi count bookings:", e.message);
    }

    // 3. Lượt cọc sân
    let pendingBookings = 0;
    try {
      pendingBookings = await BookingModel.countDocuments({
        $or: [
          { date: { $gte: startDateStr, $lte: endDateStr } },
          { createdAt: { $gte: startDate, $lte: endDate } },
        ],
        status: {
          $in: [
            "pending",
            "deposit",
            "Đang chờ cọc",
            "Đã cọc",
            "pending_deposit",
          ],
        },
      });
    } catch (e) {
      console.log("Lỗi count pending:", e.message);
    }

    // 4. Lượt đã hoàn thành
    let completedBookings = 0;
    try {
      completedBookings = await BookingModel.countDocuments({
        $or: [
          { date: { $gte: startDateStr, $lte: endDateStr } },
          { createdAt: { $gte: startDate, $lte: endDate } },
        ],
        status: {
          $in: [
            "completed",
            "success",
            "confirmed",
            "checked_in",
            "Đã hoàn thành",
          ],
        },
      });
    } catch (e) {
      console.log("Lỗi count completed:", e.message);
    }

    // 5. Tổng doanh thu
    let totalRevenue = 0;
    try {
      const invoices = await InvoiceModel.find();
      totalRevenue = invoices.reduce(
        (acc, item) =>
          acc + (item.totalAmount || item.amount || item.total || 0),
        0,
      );
    } catch (e) {
      console.log("Lỗi tính doanh thu:", e.message);
    }

    // 6. Danh sách lịch
    let upcomingSchedules = [];
    try {
      upcomingSchedules = await BookingModel.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .populate("userId", "name phone")
        .populate("courtId", "name")
        .populate("court", "name");
    } catch (e) {
      console.log("Lỗi lấy danh sách lịch:", e.message);
    }

    return res.status(200).json({
      success: true,
      stats: {
        totalCourts,
        totalBookings,
        pendingBookings,
        completedBookings,
        totalRevenue,
      },
      upcomingSchedules: upcomingSchedules || [],
    });
  } catch (error) {
    console.error("LỖI NGHIÊM TRỌNG TRONG DASHBOARD CONTROLLER:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
