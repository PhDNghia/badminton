// badminton-backend/controllers/AuthController.js
import UserModel from "../models/UserModel.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// 1. Đăng ký tài khoản mới (Mặc định role là "user")
export const register = async (req, res) => {
  try {
    const { name, phone, password, role } = req.body;

    // Kiểm tra số điện thoại đã tồn tại chưa
    const existingUser = await UserModel.findOne({ phone });
    if (existingUser) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Số điện thoại này đã được đăng ký!",
        });
    }

    // Mã hóa mật khẩu (hashing)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new UserModel({
      name,
      phone,
      password: hashedPassword,
      role: role || "user", // Cho phép tạo staff/admin nếu cần
    });

    await newUser.save();
    res
      .status(201)
      .json({ success: true, message: "Đăng ký tài khoản thành công!" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Đăng nhập hệ thống (Trả về JWT Token)
export const login = async (req, res) => {
  try {
    const { phone, password } = req.body;

    // Tìm user theo số điện thoại
    const user = await UserModel.findOne({ phone });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "Tài khoản không tồn tại!" });
    }

    // So sánh mật khẩu
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(400)
        .json({ success: false, message: "Mật khẩu không chính xác!" });
    }

    // Tạo JWT Token (Hạn dùng VD: 1 ngày)
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || "badminton_secret_key",
      { expiresIn: "1d" },
    );

    res.status(200).json({
      success: true,
      message: "Đăng nhập thành công!",
      token,
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
