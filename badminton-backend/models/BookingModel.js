// badminton-backend/models/BookingModel.js
import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    court: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Court",
      required: true,
    },

    // Thêm trường liên kết đến gói lịch cố định (nếu đây là lịch sinh ra từ lịch cố định)
    fixedScheduleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FixedSchedule",
      default: null,
    },

    // Dành cho khách có đăng nhập (có thể null nếu là khách vãng lai)
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },

    // Dành cho khách vãng lai (không cần đăng nhập)
    guestName: { type: String, default: "" },
    guestPhone: { type: String, default: "" },

    date: { type: String, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    checkInTime: { type: Date, default: null },
    totalPrice: { type: Number, required: true },
    depositAmount: { type: Number, required: true },

    paymentStatus: {
      type: String,
      enum: [
        "pending",
        "deposit_paid",
        "fully_paid",
        "deposit_retained",
        "refunded",
        "cancelled",
      ],
      default: "pending",
    },
    bookingStatus: {
      type: String,
      enum: [
        "pending_deposit",
        "confirmed",
        "checked_in",
        "completed",
        "cancelled",
      ],
      default: "pending_deposit",
    },
  },
  { timestamps: true },
);

export default mongoose.model("Booking", bookingSchema);
