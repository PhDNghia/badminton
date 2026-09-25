// badminton-backend/controllers/BookingController.js
import BookingModel from "../models/BookingModel.js";
import UserModel from "../models/UserModel.js"; // Import model User để quản lý tạo tài khoản tự động
import InvoiceModel from "../models/InvoiceModel.js"; // Nhớ import InvoiceModel
import bcrypt from "bcryptjs"; // Thêm thư viện mã hóa mật khẩu nếu app bạn đang dùng

// 1. Tạo lịch đặt mới (Hỗ trợ đặt 1 hoặc nhiều sân cùng lúc)
export const createBooking = async (req, res) => {
  try {
    const {
      courts, // Mảng chứa ID các sân, ví dụ: ['court_id_1', 'court_id_2'] (Nếu đặt 1 sân thì vẫn có thể nhận court đơn hoặc mảng)
      court, // Hỗ trợ truyền 1 sân đơn
      date,
      startTime,
      endTime,
      totalPrice,
      depositAmount,
      guestName,
      guestPhone,
      user: requestedUserId,
    } = req.body;

    const listCourts = courts && courts.length > 0 ? courts : [court];
    if (!listCourts[0]) {
      return res
        .status(400)
        .json({ success: false, message: "Vui lòng chọn ít nhất một sân!" });
    }

    let userId = null;
    let finalGuestName = "";
    let finalGuestPhone = "";

    if (requestedUserId) {
      userId = requestedUserId;
    } else if (guestPhone && guestPhone.trim() !== "") {
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

    // Nếu đặt nhiều sân cùng lúc, tạo groupBookingId chung
    const groupBookingId = listCourts.length > 1 ? `GROUP_${Date.now()}` : null;
    let createdBookings = [];

    const pricePerCourt = totalPrice / listCourts.length;
    const depositPerCourt = depositAmount / listCourts.length;

    for (let cId of listCourts) {
      const newBooking = new BookingModel({
        court: cId,
        user: userId,
        guestName: finalGuestName,
        guestPhone: finalGuestPhone,
        date,
        startTime,
        endTime,
        totalPrice: pricePerCourt,
        depositAmount: depositPerCourt,
        paymentStatus: "pending",
        bookingStatus: "pending_deposit",
        groupBookingId: groupBookingId,
      });

      await newBooking.save();
      const populated = await BookingModel.findById(newBooking._id)
        .populate("court", "name type")
        .populate("user", "name phone email");
      createdBookings.push(populated);
    }

    res.status(201).json({
      success: true,
      message: `Đặt thành công ${listCourts.length} sân!`,
      data: listCourts.length === 1 ? createdBookings[0] : createdBookings,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const addExtraCourtToBooking = async (req, res) => {
  try {
    const { existingBookingId, newCourtId, startTime, endTime } = req.body;

    const originalBooking = await BookingModel.findById(existingBookingId);
    if (!originalBooking) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy lịch đặt gốc!" });
    }

    const groupBookingId =
      originalBooking.groupBookingId || `GROUP_${originalBooking._id}`;
    if (!originalBooking.groupBookingId) {
      originalBooking.groupBookingId = groupBookingId;
      await originalBooking.save();
    }

    const sTime = startTime || originalBooking.startTime;
    const eTime = endTime || originalBooking.endTime;

    // 1. Tính tiền sân phát sinh dựa trên khung giờ riêng của sân đó
    const startH = parseInt(sTime.split(":")[0], 10);
    const endH = parseInt(eTime.split(":")[0], 10);
    let extraCourtFee = 0;
    for (let h = startH; h < endH; h++) {
      const curH = h % 24;
      if (curH >= 0 && curH <= 5) extraCourtFee += 60000;
      else if (curH >= 6 && curH <= 16) extraCourtFee += 30000;
      else extraCourtFee += 60000;
    }

    // 2. Tạo booking phụ cho sân mới với giờ riêng
    const extraBooking = new BookingModel({
      court: newCourtId,
      user: originalBooking.user,
      guestName: originalBooking.guestName,
      guestPhone: originalBooking.guestPhone,
      date: originalBooking.date,
      startTime: sTime,
      endTime: eTime,
      totalPrice: extraCourtFee,
      depositAmount: 0,
      paymentStatus: "pending",
      bookingStatus: "checked_in",
      groupBookingId: groupBookingId,
    });

    await extraBooking.save();

    // 3. Cập nhật hóa đơn chung
    let invoice = await InvoiceModel.findOne({
      $or: [
        { booking: originalBooking._id },
        { bookings: originalBooking._id },
      ],
    });

    if (invoice) {
      if (!invoice.bookings) invoice.bookings = [invoice.booking];
      if (!invoice.bookings.includes(extraBooking._id)) {
        invoice.bookings.push(extraBooking._id);
      }

      if (!invoice.courts) {
        invoice.courts = invoice.court ? [invoice.court] : [];
      }
      if (!invoice.courts.includes(newCourtId)) {
        invoice.courts.push(newCourtId);
      }

      invoice.courtFee += extraCourtFee;
      invoice.totalAmount = invoice.courtFee + invoice.productsTotal;

      const paidItemsAmount = invoice.items
        .filter((i) => i.isPaid)
        .reduce((sum, i) => sum + i.price * i.quantity, 0);

      const discountVal = invoice.discountAmount || 0;
      invoice.remainingAmount = Math.max(
        0,
        invoice.totalAmount -
          invoice.depositPaid -
          paidItemsAmount -
          discountVal,
      );

      await invoice.save();
    }

    res.status(200).json({
      success: true,
      message: "Đã thêm sân phát sinh với khung giờ riêng thành công!",
      data: extraBooking,
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

// Xử lý khách bùng sân (No-show) có hỏi ý định tiền cọc
export const handleNoShowBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { actionType } = req.body; // Nhận từ Frontend: "retained" (giữ cọc) hoặc "refund" (hoàn cọc)

    const booking =
      await BookingModel.findById(bookingId).populate("court user");
    if (!booking) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy lịch đặt!" });
    }

    if (actionType === "refund") {
      // 1. Cập nhật trạng thái booking thành đã hủy / hoàn cọc
      booking.bookingStatus = "cancelled";
      booking.paymentStatus = "refunded";
      await booking.save();

      // 2. KHÔNG XÓA INVOICE NỮA, MÀ CẬP NHẬT TRẠNG THÁI LÀ "refunded" ĐỂ LƯU VÀO LỊCH SỬ
      let invoice = await InvoiceModel.findOne({ booking: bookingId });
      const depositVal = booking.depositAmount || 0;

      if (!invoice) {
        // Nếu chưa có invoice thì tạo mới một bản ghi lưu vết hoàn cọc
        invoice = new InvoiceModel({
          booking: booking._id,
          court: booking.court._id || booking.court,
          user: booking.user?._id || null,
          customerName:
            booking.user?.name || booking.guestName || "Khách vãng lai",
          phone: booking.user?.phone || booking.guestPhone || "N/A",
          courtFee: 0,
          depositPaid: depositVal,
          items: [],
          productsTotal: 0,
          totalAmount: depositVal, // Số tiền cọc hoàn lại/xử lý
          remainingAmount: 0,
          paymentStatus: "refunded", // Đánh dấu là đã hoàn cọc
          paymentMethod: "cash",
        });
      } else {
        // Nếu đã có thì cập nhật lại trạng thái thành refunded
        invoice.paymentStatus = "refunded";
        invoice.totalAmount = depositVal;
        invoice.remainingAmount = 0;
      }
      await invoice.save();

      // 2. Tăng số lần bùng sân (strikeCount) cho User nếu có tài khoản
      if (booking.user) {
        const user = await UserModel.findById(booking.user);
        if (user) {
          user.strikeCount = (user.strikeCount || 0) + 1;
          if (user.strikeCount >= 2) {
            user.isRequireDeposit = true; // Bắt buộc cọc 100% từ lần sau
          }
          await user.save();
        }
      }

      return res.status(200).json({
        success: true,
        message:
          "Đã hủy lịch và ghi nhận hoàn tiền cọc vào lịch sử thanh toán.",
        data: { booking, invoice },
      });
    }

    // TRƯỜNG HỢP 2: Giữ lại tiền cọc làm doanh thu (Mặc định khi bùng sân)
    booking.bookingStatus = "cancelled";
    booking.paymentStatus = "deposit_retained";
    await booking.save();

    // 1. Tự động sinh/cập nhật Invoice để lưu vào Lịch sử hóa đơn (Payment History)
    let invoice = await InvoiceModel.findOne({ booking: bookingId });
    const courtFee = booking.depositAmount; // Doanh thu ghi nhận đúng bằng tiền cọc bị giữ

    if (!invoice) {
      invoice = new InvoiceModel({
        booking: booking._id,
        court: booking.court._id || booking.court,
        user: booking.user?._id || null,
        customerName:
          booking.user?.name || booking.guestName || "Khách vãng lai",
        phone: booking.user?.phone || booking.guestPhone || "N/A",
        courtFee: courtFee,
        depositPaid: booking.depositAmount,
        items: [],
        productsTotal: 0,
        totalAmount: courtFee,
        remainingAmount: 0,
        paymentStatus: "forfeited_deposit", // Trạng thái tịch thu cọc
        paymentMethod: "cash",
      });
    } else {
      invoice.paymentStatus = "forfeited_deposit";
      invoice.totalAmount = invoice.depositPaid;
      invoice.remainingAmount = 0;
    }
    await invoice.save();

    // 2. Tăng số lần bùng sân (strikeCount) cho User nếu có tài khoản
    if (booking.user) {
      const user = await UserModel.findById(booking.user);
      if (user) {
        user.strikeCount = (user.strikeCount || 0) + 1;
        if (user.strikeCount >= 2) {
          user.isRequireDeposit = true; // Bắt buộc cọc 100% từ lần sau
        }
        await user.save();
      }
    }

    res.status(200).json({
      success: true,
      message:
        "Đã ghi nhận bùng sân, giữ lại tiền cọc và đẩy vào lịch sử hóa đơn thành công!",
      data: { booking, invoice },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
