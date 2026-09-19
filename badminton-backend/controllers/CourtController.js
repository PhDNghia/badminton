// badminton-backend/controllers/CourtController.js
import CourtModel from "../models/CourtModel.js";

// Lấy danh sách tất cả các sân
export const getCourts = async (req, res) => {
  try {
    const courts = await CourtModel.find();
    res.status(200).json({ success: true, data: courts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Thêm sân mới (Dành cho Admin)
export const createCourt = async (req, res) => {
  try {
    const { name, type } = req.body;
    const newCourt = new CourtModel({ name, type });
    await newCourt.save();
    res
      .status(201)
      .json({ success: true, message: "Thêm sân thành công!", data: newCourt });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Cập nhật thông tin sân
export const updateCourt = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, type, status } = req.body;
    const updatedCourt = await CourtModel.findByIdAndUpdate(
      id,
      { name, type, status },
      { new: true },
    );
    res.status(200).json({
      success: true,
      message: "Cập nhật thông tin sân thành công!",
      data: updatedCourt,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Xóa sân
export const deleteCourt = async (req, res) => {
  try {
    const { id } = req.params;
    await CourtModel.findByIdAndDelete(id);
    res.status(200).json({ success: true, message: "Đã xóa sân thành công!" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
