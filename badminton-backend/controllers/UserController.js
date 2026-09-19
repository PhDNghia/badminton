import UserModel from "../models/UserModel.js";
import bcrypt from "bcryptjs";

// Lấy danh sách tất cả user
export const getUsers = async (req, res) => {
  try {
    const users = await UserModel.find().select("-password");
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin tạo tài khoản thủ công (cho nhân viên hoặc user mới)
export const createUserByAdmin = async (req, res) => {
  try {
    const { name, phone, password, role } = req.body;

    const existingUser = await UserModel.findOne({ phone });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Số điện thoại này đã được đăng ký!",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new UserModel({
      name,
      phone,
      password: hashedPassword,
      role: role || "user",
    });

    await newUser.save();
    res.status(201).json({
      success: true,
      message: "Tạo tài khoản thành công!",
      data: newUser,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Cập nhật phân quyền user (admin, staff, user)
export const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    const updatedUser = await UserModel.findByIdAndUpdate(
      id,
      { role },
      { new: true },
    ).select("-password");

    res.status(200).json({
      success: true,
      message: "Cập nhật phân quyền thành công!",
      data: updatedUser,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Xóa tài khoản người dùng
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    await UserModel.findByIdAndDelete(id);
    res
      .status(200)
      .json({ success: true, message: "Đã xóa tài khoản thành công!" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Cập nhật thông tin cơ bản của user (tên, số điện thoại)
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone } = req.body;

    const updatedUser = await UserModel.findByIdAndUpdate(
      id,
      { name, phone },
      { new: true },
    ).select("-password");

    if (!updatedUser) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy người dùng!" });
    }

    res.status(200).json({
      success: true,
      message: "Cập nhật thông tin thành công!",
      data: updatedUser,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Reset mật khẩu về số điện thoại
export const resetPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await UserModel.findById(id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy người dùng!" });
    }

    const salt = await bcrypt.genSalt(10);
    // Mật khẩu mới sau khi reset chính là số điện thoại của user đó
    user.password = await bcrypt.hash(user.phone, salt);
    await user.save();

    res.status(200).json({
      success: true,
      message: `Đã reset mật khẩu về số điện thoại (${user.phone}) thành công!`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Người dùng tự đổi mật khẩu
export const changePassword = async (req, res) => {
  try {
    // Sửa lại dòng này để kiểm tra linh hoạt mọi nguồn chứa ID
    const userId =
      req.user?._id || req.user?.id || req.user?.userId || req.body.userId;
    const { oldPassword, newPassword } = req.body;

    if (!userId) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Không xác định được ID người dùng!",
        });
    }

    const user = await UserModel.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy người dùng!" });
    }

    // Kiểm tra mật khẩu cũ có đúng không
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res
        .status(400)
        .json({ success: false, message: "Mật khẩu cũ không chính xác!" });
    }

    // Mã hóa mật khẩu mới
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res
      .status(200)
      .json({ success: true, message: "Đổi mật khẩu thành công!" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
