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

    // Tên thu ngân thực hiện ca thanh toán
    cashierName: { type: String, default: "Thu ngân ca trực" },

    // Tiền sân và chi phí
    courtFee: { type: Number, default: 0 },
    depositPaid: { type: Number, default: 0 },

    // Danh sách dịch vụ/sản phẩm mua thêm tại quầy
    items: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        name: { type: String },
        price: { type: Number, default: 0 },
        quantity: { type: Number, default: 1 },
      },
    ],

    productsTotal: { type: Number, default: 0 },
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
