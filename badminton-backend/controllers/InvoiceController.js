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

// Cập nhật hóa đơn (Thêm sản phẩm nước, cầu... hoặc thanh toán hoàn tất) - ĐÃ BỔ SUNG THU NGÂN
export const updateInvoicePOS = async (req, res) => {
  try {
    const { invoiceId } = req.params;
    const { items, paymentStatus, paymentMethod, cashierName } = req.body; // Thêm cashierName nhận từ client

    let invoice = await InvoiceModel.findById(invoiceId);
    if (!invoice)
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy hóa đơn!" });

    if (items) {
      invoice.items = items;
      // Tính lại tổng tiền sản phẩm
      invoice.productsTotal = items.reduce(
        (sum, i) => sum + i.price * i.quantity,
        0,
      );

      // Trừ kho sản phẩm nếu thanh toán hoàn tất
      if (paymentStatus === "paid_full") {
        for (const item of items) {
          if (item.product) {
            await ProductModel.findByIdAndUpdate(item.product, {
              $inc: { stock: -item.quantity },
            });
          }
        }
      }
    }

    if (paymentStatus) invoice.paymentStatus = paymentStatus;
    if (paymentMethod) invoice.paymentMethod = paymentMethod;

    // Cập nhật tên thu ngân thực hiện giao dịch (nếu có gửi lên)
    if (cashierName) {
      invoice.cashierName = cashierName;
    }

    // Tổng tiền cuối cùng = Tiền sân + Tiền hàng phát sinh
    invoice.totalAmount = invoice.courtFee + invoice.productsTotal;
    // Số tiền còn lại cần thanh toán = Tổng tiền - Cọc đã trả
    invoice.remainingAmount = Math.max(
      0,
      invoice.totalAmount - invoice.depositPaid,
    );

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

    // Kiểm tra role (đảm bảo middleware xác thực đã gán req.user)
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
