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

// Tạo hoặc lấy hóa đơn của 1 lịch đặt
export const getOrCreateInvoice = async (req, res) => {
  try {
    const { bookingId } = req.params;
    let invoice = await InvoiceModel.findOne({ booking: bookingId }).populate(
      "items.product",
    );

    if (!invoice) {
      const booking =
        await BookingModel.findById(bookingId).populate("court user");
      if (!booking)
        return res
          .status(404)
          .json({ success: false, message: "Không tìm thấy lịch đặt!" });

      const courtFee = booking.totalPrice || 100000;
      const deposit = booking.depositAmount || 0;

      invoice = new InvoiceModel({
        booking: booking._id,
        court: booking.court._id,
        customerName: booking.user?.name || "Khách lẻ",
        phone: booking.user?.phone || "N/A",
        courtFee,
        depositPaid: deposit,
        items: [],
        productsTotal: 0,
        discountCode: "",
        discountAmount: 0,
        totalAmount: courtFee,
        remainingAmount: courtFee - deposit,
        paymentStatus:
          booking.bookingStatus === "confirmed"
            ? "paid_deposit"
            : "pending_deposit",
      });
      await invoice.save();
    }

    res.status(200).json({ success: true, data: invoice });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Cập nhật hóa đơn POS (Hỗ trợ thanh toán từng món ngay lập tức, mã giảm giá & thu ngân)
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
    } = req.body;

    let invoice = await InvoiceModel.findById(invoiceId);
    if (!invoice)
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy hóa đơn!" });

    if (items) {
      invoice.items = items;
      // Tính lại tổng tiền tất cả sản phẩm phát sinh
      invoice.productsTotal = items.reduce(
        (sum, i) => sum + i.price * i.quantity,
        0,
      );

      // Trừ kho sản phẩm nếu có món thanh toán hoàn tất hoặc thanh toán ngay
      for (const item of items) {
        if (item.product && (paymentStatus === "paid_full" || item.isPaid)) {
          // Bạn có thể xử lý trừ kho nếu cần
        }
      }
    }

    // Cập nhật thông tin mã giảm giá nếu có gửi lên
    if (discountCode !== undefined) invoice.discountCode = discountCode;
    if (discountAmount !== undefined) invoice.discountAmount = discountAmount;

    if (paymentStatus) invoice.paymentStatus = paymentStatus;
    if (paymentMethod) invoice.paymentMethod = paymentMethod;
    if (cashierName) invoice.cashierName = cashierName;

    // 1. Tổng toàn bộ giá trị hóa đơn (Tiền sân + Tổng tiền tất cả sản phẩm)
    invoice.totalAmount = invoice.courtFee + invoice.productsTotal;

    // 2. Tính tiền các món CHƯA thanh toán ngay (chỉ tính những món có isPaid = false vào bill cuối giờ)
    const unpaidProductsTotal = invoice.items
      .filter((i) => !i.isPaid)
      .reduce((sum, i) => sum + i.price * i.quantity, 0);

    // 3. Số tiền còn lại thực thu cuối giờ = (Tiền sân + Tiền hàng chưa trả) - Tiền cọc - Giảm giá
    const discountVal = invoice.discountAmount || 0;
    const rawRemaining =
      invoice.courtFee +
      unpaidProductsTotal -
      invoice.depositPaid -
      discountVal;
    invoice.remainingAmount = Math.max(0, rawRemaining);

    await invoice.save();

    // Đồng thời cập nhật trạng thái của Booking tương ứng
    let newBookingStatus = "confirmed";
    if (paymentStatus === "paid_deposit") newBookingStatus = "confirmed";
    if (paymentStatus === "paid_full") newBookingStatus = "completed";

    await BookingModel.findByIdAndUpdate(invoice.booking, {
      bookingStatus: newBookingStatus,
    });

    res.status(200).json({
      success: true,
      message: "Cập nhật bill thành công!",
      data: invoice,
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
