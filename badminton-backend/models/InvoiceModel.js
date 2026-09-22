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
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    customerName: { type: String, default: "Khách lẻ" },
    phone: { type: String, default: "" },
    cashierName: { type: String, default: "Thu ngân ca trực" },

    courtFee: { type: Number, default: 0 },
    depositPaid: { type: Number, default: 0 },

    items: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        name: { type: String },
        price: { type: Number, default: 0 },
        quantity: { type: Number, default: 1 },
        isPaid: { type: Boolean, default: false }, // TRUE nếu khách trả tiền luôn lúc gọi
      },
    ],

    productsTotal: { type: Number, default: 0 },

    // Bổ sung thêm thông tin mã giảm giá áp dụng vào hóa đơn
    discountCode: { type: String, default: "" },
    discountAmount: { type: Number, default: 0 },

    totalAmount: { type: Number, default: 0 },
    remainingAmount: { type: Number, default: 0 },

    paymentStatus: {
      type: String,
      enum: [
        "pending_deposit",
        "paid_deposit",
        "paid_full",
        "cancelled",
        "pending",
        "forfeited_deposit",
        "refunded",
      ],
      default: "pending",
    },
    paymentMethod: {
      type: String,
      default: "cash",
    },
  },
  { timestamps: true },
);

export default mongoose.model("Invoice", invoiceSchema);
