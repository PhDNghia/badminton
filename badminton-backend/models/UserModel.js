// badminton-backend/models/UserModel.js
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["user", "staff", "admin"],
      default: "user",
    },
    strikeCount: { type: Number, default: 0 }, // Đếm số lần bùng sân
    isRequireDeposit: { type: Boolean, default: false }, // Cờ bật bắt buộc cọc 100%
  },
  { timestamps: true },
);

export default mongoose.model("User", userSchema);
