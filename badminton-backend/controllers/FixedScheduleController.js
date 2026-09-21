// badminton-backend/controllers/FixedScheduleController.js
import FixedSchedule from "../models/FixedScheduleModel.js";
import BookingModel from "../models/BookingModel.js";
import UserModel from "../models/UserModel.js";
import bcrypt from "bcryptjs";

// Hàm hỗ trợ tìm tất cả các ngày trong tuần từ startDate đến endDate theo danh sách các thứ được chọn
const getDatesForDaysOfWeek = (startDateStr, endDateStr, daysOfWeek) => {
  const dates = [];
  let curr = new Date(startDateStr);
  const end = new Date(endDateStr);

  while (curr <= end) {
    const dayIndex = curr.getDay(); // 0: CN, 1: T2, ..., 6: T7
    if (daysOfWeek.includes(dayIndex)) {
      const year = curr.getFullYear();
      const month = String(curr.getMonth() + 1).padStart(2, "0");
      const day = String(curr.getDate()).padStart(2, "0");
      dates.push(`${year}-${month}-${day}`);
    }
    curr.setDate(curr.getDate() + 1); // Duyệt từng ngày qua lại
  }
  return dates;
};

// Hàm tính tiền mỗi buổi dựa trên khung giờ (giống logic BookingsManager)
const calculateSessionPrice = (startTime, endTime) => {
  const startH = parseInt(startTime.split(":")[0], 10);
  let endH = parseInt(endTime.split(":")[0], 10);

  if (endH <= startH) {
    endH += 24;
  }

  let total = 0;
  for (let h = startH; h < endH; h++) {
    const currentHour = h % 24;
    if (currentHour >= 0 && currentHour <= 5) {
      total += 60000; // 0h - 5h: 60k/h
    } else if (currentHour >= 6 && currentHour <= 16) {
      total += 30000; // 6h - 16h: 30k/h
    } else {
      total += 60000; // 17h - 23h: 60k/h
    }
  }
  return total;
};

export const createFixedSchedule = async (req, res) => {
  try {
    const {
      court,
      guestName,
      guestPhone,
      user: requestedUserId,
      daysOfWeek, // Mảng các thứ, ví dụ [1, 3, 5] (T2, T4, T6)
      startTime,
      endTime,
      startDate,
      endDate,
      depositAmount,
    } = req.body;

    let userId = requestedUserId || null;

    // Nếu là vãng lai (có sđt nhưng chưa có user ID), tự động kiểm tra/tạo tài khoản mới
    if (!userId && guestPhone && guestPhone.trim() !== "") {
      let existingUser = await UserModel.findOne({ phone: guestPhone });
      if (!existingUser) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(guestPhone, salt);
        existingUser = await UserModel.create({
          name: guestName || "Khách lịch cố định",
          phone: guestPhone,
          password: hashedPassword,
          role: "user",
        });
      }
      userId = existingUser._id;
    }

    if (!daysOfWeek || daysOfWeek.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng chọn ít nhất một ngày lặp lại trong tuần!",
      });
    }

    // 1. Lấy tất cả các ngày thỏa mãn trong khoảng thời gian cho các thứ đã chọn
    const targetDates = getDatesForDaysOfWeek(startDate, endDate, daysOfWeek);

    if (targetDates.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Không tìm thấy ngày nào phù hợp trong khoảng thời gian này!",
      });
    }

    // 2. Kiểm tra xem các khung giờ đó có bị trùng lịch nào không
    for (const d of targetDates) {
      const existing = await BookingModel.findOne({
        court,
        date: d,
        startTime,
        endTime,
        bookingStatus: { $ne: "cancelled" },
      });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: `Trùng lịch vào ngày ${d} lúc ${startTime} - ${endTime}. Vui lòng chọn khung giờ khác!`,
        });
      }
    }

    // 3. Tự động tính giá tiền mỗi buổi dựa theo đơn giá giờ
    const totalPricePerSession = calculateSessionPrice(startTime, endTime);
    const totalPackagePrice = totalPricePerSession * targetDates.length;

    // Lưu cấu hình lịch cố định trước để lấy _id
    const fixedSchedule = new FixedSchedule({
      court,
      user: userId,
      guestName: guestName || "",
      guestPhone: guestPhone || "",
      daysOfWeek: daysOfWeek,
      startTime,
      endTime,
      startDate,
      endDate,
      totalPricePerSession,
      totalPackagePrice,
      depositAmount: Number(depositAmount) || 0,
    });
    await fixedSchedule.save();

    // 4. Tự động sinh ra các booking lẻ có đính kèm fixedScheduleId
    const createdBookings = [];
    for (const d of targetDates) {
      const newBooking = new BookingModel({
        court,
        fixedScheduleId: fixedSchedule._id, // ⭐ Liên kết để phục vụ việc xóa sau này ⭐
        user: userId,
        guestName: guestName || "",
        guestPhone: guestPhone || "",
        date: d,
        startTime,
        endTime,
        totalPrice: totalPricePerSession,
        depositAmount: Math.round(
          (Number(depositAmount) || 0) / targetDates.length,
        ),
        paymentStatus: "pending",
        bookingStatus: "pending_deposit",
      });
      await newBooking.save();
      createdBookings.push(newBooking);
    }

    res.status(201).json({
      success: true,
      message: `Tạo lịch cố định thành công! Đã tự động sinh ra ${targetDates.length} buổi chơi trên sơ đồ.`,
      data: { fixedSchedule, bookingsCount: createdBookings.length },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllFixedSchedules = async (req, res) => {
  try {
    const schedules = await FixedSchedule.find()
      .populate("court", "name type")
      .populate("user", "name phone email")
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: schedules });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateFixedSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const { totalPricePerSession, depositAmount, status } = req.body;
    const schedule = await FixedSchedule.findById(id);
    if (!schedule)
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy!" });

    if (totalPricePerSession !== undefined)
      schedule.totalPricePerSession = totalPricePerSession;
    if (depositAmount !== undefined) schedule.depositAmount = depositAmount;
    if (status !== undefined) schedule.status = status;

    await schedule.save();
    res
      .status(200)
      .json({ success: true, message: "Cập nhật thành công!", data: schedule });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteFixedSchedule = async (req, res) => {
  try {
    const { id } = req.params;

    // ⭐ Xóa toàn bộ các buổi đặt sân lẻ (Booking) sinh ra từ lịch cố định này ⭐
    await BookingModel.deleteMany({ fixedScheduleId: id });

    // Sau đó tiến hành xóa lịch cố định chính
    const deletedSchedule = await FixedSchedule.findByIdAndDelete(id);
    if (!deletedSchedule) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy lịch cố định cần xóa!",
      });
    }

    res.status(200).json({
      success: true,
      message:
        "Đã xóa lịch cố định và toàn bộ các buổi đặt liên quan thành công!",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
