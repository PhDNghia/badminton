// badminton-backend/models/InvoiceModel.js
import mongoose from "mongoose";

const invoiceSchema = new mongoose.Schema(
  {
    bookings: [{ type: mongoose.Schema.Types.ObjectId, ref: "Booking" }],
    booking: { type: mongoose.Schema.Types.ObjectId, ref: "Booking" }, // Tương thích ngược

    courts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Court" }], // Giữ lại để tra cứu nhanh
    court: { type: mongoose.Schema.Types.ObjectId, ref: "Court" },

    

    // 🕒 THAY ĐỔI QUAN TRỌNG: Lưu chi tiết giờ chơi & tiền riêng cho từng sân trong hóa đơn gộp
    courtDetails: [
      {
        court: { type: mongoose.Schema.Types.ObjectId, ref: "Court" },
        actualStartTime: { type: String, default: "" }, // Giờ thực tế vào sân này (VD: "14:00")
        actualEndTime: { type: String, default: "" }, // Giờ thực tế kết thúc sân này (VD: "16:30")
        hoursPlayed: { type: Number, default: 0 }, // Số giờ chơi thực tế của sân này
        price: { type: Number, default: 0 }, // Tiền sân tương ứng của sân này
      },
    ],

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    customerName: { type: String, default: "Khách lẻ" },
    phone: { type: String, default: "" },
    cashierName: { type: String, default: "Thu ngân ca trực" },

    courtFee: { type: Number, default: 0 }, // Tổng tiền tất cả các sân
    depositPaid: { type: Number, default: 0 },

    items: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        name: { type: String },
        price: { type: Number, default: 0 },
        quantity: { type: Number, default: 1 },
        isPaid: { type: Boolean, default: false },
      },
    ],

    productsTotal: { type: Number, default: 0 },

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
