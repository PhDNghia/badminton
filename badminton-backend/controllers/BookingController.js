// badminton-backend/controllers/BookingController.js
import BookingModel from "../models/BookingModel.js";
import UserModel from "../models/UserModel.js"; // Import model User để quản lý tạo tài khoản tự động
import bcrypt from "bcryptjs"; // Thêm thư viện mã hóa mật khẩu nếu app bạn đang dùng

// 1. Khách hàng hoặc Admin/Staff tạo lịch đặt mới
export const createBooking = async (req, res) => {
  try {
    const {
      court,
      date,
      startTime,
      endTime,
      totalPrice,
      depositAmount,
      guestName,
      guestPhone,
      user: requestedUserId,
    } = req.body;

    let userId = null;
    let finalGuestName = "";
    let finalGuestPhone = "";

    // 1. Nếu Admin chọn sẵn một thành viên cụ thể từ danh sách dropdown
    if (requestedUserId) {
      userId = requestedUserId;
    }
    // 2. NẾU CÓ NHẬP SỐ ĐIỆN THOẠI VÃNG LAI: Ưu tiên xử lý vãng lai, BỎ QUA token của admin đang đăng nhập
    else if (guestPhone && guestPhone.trim() !== "") {
      let existingUser = await UserModel.findOne({ phone: guestPhone });

      if (!existingUser) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(guestPhone, salt);

        existingUser = await UserModel.create({
          name: guestName || "Khách vãng lai",
          phone: guestPhone,
          password: hashedPassword,
          role: "user",
        });
      }

      userId = existingUser._id;
      finalGuestName = guestName;
      finalGuestPhone = guestPhone;
    }
    // 3. Trường hợp khách hàng tự đặt lịch qua app (không phải admin thao tác)
    else if (req.user && req.user.role !== "admin") {
      userId = req.user.id;
    }

    // Nếu không có user và không có guestPhone thì báo lỗi
    if (!userId && (!guestName || !guestPhone)) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập họ tên và số điện thoại của khách vãng lai!",
      });
    }

    const newBooking = new BookingModel({
      court,
      user: userId,
      guestName: finalGuestName,
      guestPhone: finalGuestPhone,
      date,
      startTime,
      endTime,
      totalPrice,
      depositAmount,
      paymentStatus: "pending",
      bookingStatus: "pending_deposit",
    });

    await newBooking.save();

    const populatedBooking = await BookingModel.findById(newBooking._id)
      .populate("court", "name type")
      .populate("user", "name phone email");

    res.status(201).json({
      success: true,
      message: "Đặt lịch thành công và đã tự động lưu thông tin khách hàng!",
      data: populatedBooking,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Nhân viên bấm xác nhận đã nhận tiền cọc (Chuyển sang confirmed)
export const confirmDeposit = async (req, res) => {
  try {
    const { bookingId } = req.params;

    const booking = await BookingModel.findById(bookingId);
    if (!booking) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy lịch đặt!" });
    }

    booking.paymentStatus = "deposit_paid";
    booking.bookingStatus = "confirmed";
    await booking.save();

    res.status(200).json({
      success: true,
      message: "Đã xác nhận cọc thành công! Sân đã được giữ.",
      data: booking,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Nhân viên bấm Check-in khi khách tới sân
export const checkInBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;

    const booking = await BookingModel.findById(bookingId);
    if (!booking) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy lịch đặt!" });
    }

    booking.bookingStatus = "checked_in";
    await booking.save();

    res.status(200).json({
      success: true,
      message: "Check-in thành công! Khách đã vào sân.",
      data: booking,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Lấy toàn bộ danh sách lịch đặt cho Admin/Staff
export const getAllBookings = async (req, res) => {
  try {
    const bookings = await BookingModel.find()
      .populate("court", "name type")
      .populate("user", "name phone email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: bookings,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Hàm xóa lịch đặt
export const deleteBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    await BookingModel.findByIdAndDelete(bookingId);
    res.status(200).json({
      success: true,
      message: "Đã xóa lịch đặt thành công!",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
