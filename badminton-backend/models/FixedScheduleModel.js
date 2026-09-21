import mongoose from "mongoose";

const fixedScheduleSchema = new mongoose.Schema(
  {
    court: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Court",
      required: true,
    },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    guestName: { type: String, default: "" },
    guestPhone: { type: String, default: "" },
    daysOfWeek: { type: [Number], required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    startDate: { type: String, required: true },
    endDate: { type: String, required: true },
    totalPricePerSession: { type: Number, required: true },
    totalPackagePrice: { type: Number, required: true },
    depositAmount: { type: Number, default: 0 },
    status: { type: String, default: "active" },
  },
  { timestamps: true },
);

// [QUAN TRỌNG] Phải định nghĩa biến FixedSchedule trước khi export
const FixedSchedule = mongoose.model("FixedSchedule", fixedScheduleSchema);

export default FixedSchedule;
