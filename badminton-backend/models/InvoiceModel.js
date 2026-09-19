// badminton-backend/models/InvoiceModel.js
import mongoose from "mongoose";

const invoiceSchema = new mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
    },
    court: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Court",
      required: true,
    },
    customerName: { type: String, required: true },
    phone: { type: String, required: true },

    // Tiền sân
    courtFee: { type: Number, required: true }, // Tính dựa trên giờ đặt/giờ chơi
    depositPaid: { type: Number, default: 0 }, // Tiền cọc đã trả trước (nếu có)

    // Danh sách sản phẩm mua thêm tại quầy (Nước, cầu,...)
    items: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        name: { type: String, required: true },
        price: { type: Number, required: true },
        quantity: { type: Number, required: true },
      },
    ],

    productsTotal: { type: Number, default: 0 }, // Tổng tiền nước, cầu...
    totalAmount: { type: Number, required: true }, // Tổng bill = courtFee + productsTotal
    remainingAmount: { type: Number, required: true }, // Số tiền còn lại phải thu = totalAmount - depositPaid

    paymentStatus: {
      type: String,
      enum: ["pending_deposit", "paid_deposit", "paid_full", "cancelled"],
      default: "pending_deposit",
    },
    paymentMethod: {
      type: String,
      enum: ["cash", "transfer"],
      default: "transfer",
    },
  },
  { timestamps: true },
);

export default mongoose.model("Invoice", invoiceSchema);
