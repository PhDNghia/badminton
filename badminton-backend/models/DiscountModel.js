import mongoose from "mongoose";

const discountSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true }, // Mã giảm giá (VD: TET2026, VIP10)
    discountType: {
      type: String,
      enum: ["percentage", "fixed"],
      required: true,
    }, // Kiểu giảm: theo % hoặc số tiền cố định
    discountValue: { type: Number, required: true }, // Giá trị (VD: 10 nghĩa là 10% hoặc 50000 nghĩa là 50k)
    maxDiscountValue: { type: Number, default: 0 }, // Giới hạn số tiền giảm tối đa (Chỉ dùng cho kiểu percentage)
    minOrderValue: { type: Number, default: 0 }, // Giá trị đơn hàng tối thiểu để áp dụng
    startDate: { type: Date, required: true }, // Ngày bắt đầu có hiệu lực
    endDate: { type: Date, required: true }, // Ngày hết hạn
    isActive: { type: Boolean, default: true }, // Trạng thái bật/tắt
  },
  { timestamps: true },
);

export default mongoose.model("Discount", discountSchema);
