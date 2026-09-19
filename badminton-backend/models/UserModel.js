// badminton-backend/models/UserModel.js
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true, unique: true }, // Dùng số điện thoại hoặc email làm tài khoản
    password: { type: String, required: true }, // Mật khẩu đã mã hóa bằng bcrypt
    role: {
      type: String,
      enum: ["user", "staff", "admin"],
      default: "user",
    }, // user: khách hàng, staff: nhân viên quầy, admin: chủ sân
  },
  { timestamps: true },
);

export default mongoose.model("User", userSchema);
