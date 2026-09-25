// badminton-backend/controllers/InvoiceController.js
import InvoiceModel from "../models/InvoiceModel.js";
import BookingModel from "../models/BookingModel.js";
import ProductModel from "../models/ProductModel.js";

// Lấy tất cả hóa đơn
export const getAllInvoices = async (req, res) => {
  try {
    const invoices = await InvoiceModel.find()
      .populate("court", "name type")
      .populate({
        path: "booking",
        populate: { path: "user", select: "name phone email" },
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: invoices,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getOrCreateInvoice = async (req, res) => {
  try {
    const { bookingId } = req.params;

    // 1. Tìm booking hiện tại trước để xem nó có thuộc nhóm (groupBookingId) nào không
    const booking =
      await BookingModel.findById(bookingId).populate("court user");
    if (!booking) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy lịch đặt!" });
    }

    // 2. Tìm tất cả các booking có cùng groupBookingId (hoặc chính nó)
    let relatedBookingIds = [booking._id];
    if (booking.groupBookingId) {
      const groupBookings = await BookingModel.find({
        groupBookingId: booking.groupBookingId,
      });
      relatedBookingIds = groupBookings.map((b) => b._id);
    }

    // 3. Tìm hóa đơn nào đang chứa bất kỳ booking nào trong danh sách trên
    let invoice = await InvoiceModel.findOne({
      $or: [
        { booking: { $in: relatedBookingIds } },
        { bookings: { $in: relatedBookingIds } },
      ],
    }).populate("items.product");

    // 4. Nếu chưa có thì tạo mới hóa đơn gom toàn bộ các sân trong nhóm
    if (!invoice) {
      const allGroupBookings = await BookingModel.find({
        $or: [
          { _id: { $in: relatedBookingIds } },
          ...(booking.groupBookingId
            ? [{ groupBookingId: booking.groupBookingId }]
            : []),
        ],
      }).populate("court");

      let totalCourtFee = allGroupBookings.reduce(
        (sum, b) => sum + (b.totalPrice || 0),
        0,
      );
      let totalDeposit = allGroupBookings.reduce(
        (sum, b) => sum + (b.depositAmount || 0),
        0,
      );
      let courtIds = allGroupBookings.map((b) => b.court?._id || b.court);

      // 🕒 THÊM ĐOẠN MAP NÀY ĐỂ KHÔNG BỊ TRỐNG COURT DETAILS
      let courtDetailsMap = allGroupBookings.map((b) => {
        // Tính số giờ chơi từ startTime và endTime (VD: "19:00" đến "20:00" -> 1 giờ)
        const startH = parseInt(b.startTime?.split(":")[0] || 0, 10);
        const endH = parseInt(b.endTime?.split(":")[0] || 0, 10);
        const hours = Math.max(1, endH - startH);

        return {
          court: b.court?._id || b.court,
          actualStartTime: b.startTime || "",
          actualEndTime: b.endTime || "",
          hoursPlayed: hours,
          price: b.totalPrice || 0,
        };
      });

      invoice = new InvoiceModel({
        booking: booking._id,
        bookings: relatedBookingIds,
        court: courtIds[0],
        courts: courtIds,
        courtDetails: courtDetailsMap, // Gán mảng chi tiết vào đây
        user: booking.user?._id || null,
        customerName: booking.user?.name || booking.guestName || "Khách lẻ",
        phone: booking.user?.phone || booking.guestPhone || "N/A",
        courtFee: totalCourtFee,
        depositPaid: totalDeposit,
        items: [],
        productsTotal: 0,
        discountCode: "",
        discountAmount: 0,
        totalAmount: totalCourtFee,
        remainingAmount: totalCourtFee - totalDeposit,
        paymentStatus:
          booking.bookingStatus === "confirmed"
            ? "paid_deposit"
            : "pending_deposit",
      });
      await invoice.save();
    } else {
      // Nếu đã có invoice nhưng thiếu booking mới thêm, tự động cập nhật lại mảng courts và courtFee
      const allGroupBookings = await BookingModel.find({
        $or: [
          { groupBookingId: booking.groupBookingId },
          { _id: invoice.booking },
          { _id: { $in: invoice.bookings || [] } },
        ],
      });

      let totalCourtFee = allGroupBookings.reduce(
        (sum, b) => sum + (b.totalPrice || 0),
        0,
      );
      let courtIds = allGroupBookings.map((b) => b.court?._id || b.court);

      invoice.courtFee = totalCourtFee;
      invoice.courts = courtIds;
      invoice.totalAmount = invoice.courtFee + invoice.productsTotal;

      const paidItemsAmount = invoice.items
        .filter((i) => i.isPaid)
        .reduce((sum, i) => sum + i.price * i.quantity, 0);

      invoice.remainingAmount = Math.max(
        0,
        invoice.totalAmount -
          invoice.depositPaid -
          paidItemsAmount -
          (invoice.discountAmount || 0),
      );
      await invoice.save();
    }

    res.status(200).json({ success: true, data: invoice });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Cập nhật hóa đơn POS (Hỗ trợ nhiều sân với giờ chơi thực tế độc lập)
export const updateInvoicePOS = async (req, res) => {
  try {
    const { invoiceId } = req.params;
    const {
      items,
      paymentStatus,
      paymentMethod,
      cashierName,
      discountCode,
      discountAmount,
      courtDetails, // 🕒 Nhận mảng chi tiết giờ chơi của từng sân từ Modal
    } = req.body;

    let invoice = await InvoiceModel.findById(invoiceId);
    if (!invoice)
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy hóa đơn!" });

    // Nếu có gửi thông tin chi tiết từng sân lên
    if (courtDetails && Array.isArray(courtDetails)) {
      invoice.courtDetails = courtDetails;

      // Tự động cộng tổng tiền sân từ các sân trong mảng courtDetails
      invoice.courtFee = courtDetails.reduce(
        (sum, detail) => sum + (Number(detail.price) || 0),
        0,
      );
    }

    if (items) {
      invoice.items = items;
      invoice.productsTotal = items.reduce(
        (sum, i) => sum + (i.price || 0) * (i.quantity || 1),
        0,
      );
    }

    if (discountCode !== undefined) invoice.discountCode = discountCode;
    if (discountAmount !== undefined) invoice.discountAmount = discountAmount;

    if (paymentStatus) invoice.paymentStatus = paymentStatus;
    if (paymentMethod) invoice.paymentMethod = paymentMethod;
    if (cashierName) invoice.cashierName = cashierName;

    // Tính toán tổng tiền hóa đơn
    invoice.totalAmount = invoice.courtFee + invoice.productsTotal;

    const unpaidProductsTotal = invoice.items
      .filter((i) => !i.isPaid)
      .reduce((sum, i) => sum + (i.price || 0) * (i.quantity || 1), 0);

    const discountVal = invoice.discountAmount || 0;
    const rawRemaining =
      invoice.courtFee +
      unpaidProductsTotal -
      invoice.depositPaid -
      discountVal;
    invoice.remainingAmount = Math.max(0, rawRemaining);

    await invoice.save();

    // Cập nhật trạng thái booking liên quan
    if (paymentStatus) {
      let newBookingStatus =
        paymentStatus === "paid_full" ? "completed" : "confirmed";
      let bookingIdsToUpdate =
        invoice.bookings && invoice.bookings.length > 0
          ? invoice.bookings
          : [invoice.booking];

      await BookingModel.updateMany(
        { _id: { $in: bookingIdsToUpdate } },
        { bookingStatus: newBookingStatus },
      );
    }

    // Populate lại để trả về dữ liệu đầy đủ cho Frontend hiển thị ngay lập tức
    const updatedInvoice = await InvoiceModel.findById(invoiceId)
      .populate("courtDetails.court")
      .populate("items.product");

    res.status(200).json({
      success: true,
      message: "Cập nhật giờ chơi từng sân và hóa đơn thành công!",
      data: updatedInvoice,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Xóa hóa đơn (Chỉ Admin mới được phép)
export const deleteInvoice = async (req, res) => {
  try {
    const { invoiceId } = req.params;

    if (req.user?.role !== "admin") {
      return res.status(403).json({
        success: false,
        message:
          "Bạn không có quyền thực hiện hành động này! Chỉ Admin mới được xóa lịch sử.",
      });
    }

    const deletedInvoice = await InvoiceModel.findByIdAndDelete(invoiceId);
    if (!deletedInvoice) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy hóa đơn cần xóa!",
      });
    }

    res.status(200).json({
      success: true,
      message: "Xóa lịch sử thanh toán thành công!",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
